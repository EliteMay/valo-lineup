const TARGET_LIMIT = 24 * 1024 * 1024;
const TARGET_WORK = 22.5 * 1024 * 1024;
const MAX_INPUT = 300 * 1024 * 1024;
const AUDIO_KBPS = 96;
const FFMPEG_MODULE = 'https://cdnjs.cloudflare.com/ajax/libs/ffmpeg/0.12.15/esm/index.js';
const CORE_BASE = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
let ffmpegInstance = null;
let coreBlobUrls = [];
let currentProgressHandler = null;

function formatBytes(bytes){
  if(!Number.isFinite(bytes)) return '—';
  if(bytes < 1024*1024) return `${Math.max(1,Math.round(bytes/1024))} KB`;
  return `${(bytes/(1024*1024)).toFixed(bytes >= 10*1024*1024 ? 1 : 2)} MB`;
}
function clamp(n,min,max){ return Math.max(min,Math.min(max,n)); }
function escapeHtml(v=''){ return String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
async function toBlobURL(url,mime){
  const response = await fetch(url,{cache:'force-cache'});
  if(!response.ok) throw new Error(`圧縮エンジン取得失敗: HTTP ${response.status}`);
  const blob = await response.blob();
  const out = URL.createObjectURL(new Blob([blob],{type:mime}));
  coreBlobUrls.push(out);
  return out;
}
async function loadFFmpeg(setStatus){
  if(ffmpegInstance?.loaded) return ffmpegInstance;
  setStatus('圧縮エンジンを読み込み中… 初回は約31MB読み込みます',0.02);
  const {FFmpeg} = await import(FFMPEG_MODULE);
  const ffmpeg = new FFmpeg();
  ffmpeg.on('log',({message})=>{ if(/error|failed|invalid/i.test(message)) console.debug('[ffmpeg]',message); });
  ffmpeg.on('progress',({progress})=>{
    if(currentProgressHandler && Number.isFinite(progress)) currentProgressHandler(clamp(progress,0,1));
  });
  const [coreURL,wasmURL] = await Promise.all([
    toBlobURL(`${CORE_BASE}/ffmpeg-core.js`,'text/javascript'),
    toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`,'application/wasm')
  ]);
  const classWorkerURL = new URL('assets/js/ffmpeg-worker.js',document.baseURI).href;
  await ffmpeg.load({coreURL,wasmURL,classWorkerURL});
  ffmpegInstance = ffmpeg;
  return ffmpeg;
}
function readVideoMeta(blob){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(blob); const video=document.createElement('video');
    video.preload='metadata'; video.muted=true;
    const done=()=>{ URL.revokeObjectURL(url); video.removeAttribute('src'); video.load(); };
    const timer=setTimeout(()=>{done();reject(new Error('動画情報を読み取れませんでした'));},12000);
    video.onloadedmetadata=()=>{
      clearTimeout(timer);
      const meta={duration:video.duration,width:video.videoWidth,height:video.videoHeight};
      done();
      if(!Number.isFinite(meta.duration)||meta.duration<=0) reject(new Error('動画の長さを取得できませんでした'));
      else resolve(meta);
    };
    video.onerror=()=>{clearTimeout(timer);done();reject(new Error('MP4をブラウザで読み込めませんでした'));};
    video.src=url;
  });
}
function makePlan(size,meta){
  const totalKbps=(TARGET_WORK*8/meta.duration)/1000;
  const videoKbps=Math.floor(clamp(totalKbps-AUDIO_KBPS-48,350,8000));
  const maxWidth=videoKbps>=4000?1920:videoKbps>=1800?1280:videoKbps>=900?960:854;
  return {videoKbps,maxWidth,sourceSize:size,duration:meta.duration,width:meta.width,height:meta.height};
}
function planLabel(plan){
  const h=plan.maxWidth>=1900?'最大1080p':plan.maxWidth>=1200?'最大720p':plan.maxWidth>=900?'最大540p':'最大480p';
  return `${h} / 最大60fps / H.264 ${plan.videoKbps}kbps / AAC ${AUDIO_KBPS}kbps`;
}
async function transcode(ffmpeg,inputBlob,plan,setStatus,attempt=1){
  const inputName='lineuplab-input.mp4'; const outputName=`lineuplab-output-${attempt}.mp4`;
  if(attempt===1) await ffmpeg.writeFile(inputName,new Uint8Array(await inputBlob.arrayBuffer()));
  currentProgressHandler=(p)=>setStatus(attempt===1?`圧縮中… ${Math.round(p*100)}%`:`24MB以下へ再調整中… ${Math.round(p*100)}%`,0.12+p*0.78);
  const scale=`scale=w='min(iw,${plan.maxWidth})':h=-2`;
  const code=await ffmpeg.exec([
    '-i',inputName,
    '-map','0:v:0','-map','0:a?',
    '-c:v','libx264','-preset','veryfast','-b:v',`${plan.videoKbps}k`,
    '-maxrate',`${Math.round(plan.videoKbps*1.12)}k`,'-bufsize',`${Math.round(plan.videoKbps*2)}k`,
    '-vf',scale,'-fpsmax','60','-pix_fmt','yuv420p',
    '-c:a','aac','-b:a',`${AUDIO_KBPS}k`,
    '-movflags','+faststart',outputName
  ]);
  currentProgressHandler=null;
  if(code!==0) throw new Error(`FFmpeg終了コード ${code}`);
  const data=await ffmpeg.readFile(outputName);
  const blob=new Blob([data.buffer],{type:'video/mp4'});
  try{await ffmpeg.deleteFile(outputName);}catch{}
  return blob;
}
async function cleanupInput(ffmpeg){ try{await ffmpeg.deleteFile('lineuplab-input.mp4');}catch{} }
function addStyles(){
  if(document.getElementById('lineupCompressStyles')) return;
  const style=document.createElement('style'); style.id='lineupCompressStyles';
  style.textContent=`.compress-card{border-top:1px solid #22343f;padding-top:10px;display:grid;gap:8px}.compress-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.compress-title{display:flex;align-items:center;gap:7px}.compress-badge{font-size:8px;font-weight:900;letter-spacing:.08em;color:#fff;background:#ff4655;padding:4px 6px;border-radius:5px}.compress-head strong{font-size:11px}.compress-head small{font-size:9px;color:#718691}.compress-controls{display:flex;gap:7px;align-items:center;flex-wrap:wrap}.compress-btn{background:#ff4655!important;border-color:#ff4655!important}.compress-btn:disabled{opacity:.45;cursor:not-allowed}.compress-progress{height:6px;border-radius:99px;background:#14222c;overflow:hidden;border:1px solid #21333e}.compress-progress i{display:block;width:0;height:100%;background:linear-gradient(90deg,#ff4655,#ff7a84);transition:width .2s}.compress-status{font-size:9px;color:#82969f;line-height:1.55}.compress-result{display:none;padding:8px 9px;border:1px solid #29423b;background:#0e211b;border-radius:8px;font-size:9px;color:#9bcdb7;line-height:1.55}.compress-result.show{display:block}.compress-result.warn{border-color:#5c4b29;background:#201a0e;color:#e8c279}.compress-result b{color:#fff}`;
  document.head.appendChild(style);
}
function setupUI(){
  const box=document.getElementById('creatorMp4Box'); const creatorVideo=document.getElementById('creatorVideo');
  if(!box||!creatorVideo||box.querySelector('.compress-card')) return false;
  addStyles();
  const card=document.createElement('div'); card.className='compress-card';
  card.innerHTML=`<div class="compress-head"><div class="compress-title"><span class="compress-badge">AUTO</span><strong>GitHub向け自動圧縮</strong></div><small>目標 24MB以下</small></div><div class="compress-controls"><button type="button" class="btn small compress-btn" id="autoCompressMp4" disabled>24MB以下へ自動圧縮</button><span class="compress-status" id="compressStatus">MP4を選択すると使えます</span></div><div class="compress-progress"><i id="compressProgress"></i></div><div class="compress-result" id="compressResult"></div><div class="mp4-share-note">圧縮はこのブラウザ内だけで処理します。通常閲覧時は圧縮エンジンを読み込みません。初回圧縮時のみ約31MBのffmpeg.wasm coreを読み込みます。</div>`;
  box.appendChild(card);
  const btn=card.querySelector('#autoCompressMp4'); const status=card.querySelector('#compressStatus'); const bar=card.querySelector('#compressProgress'); const result=card.querySelector('#compressResult');
  let busy=false;
  function setStatus(text,p=null){ status.textContent=text; if(p!==null)bar.style.width=`${Math.round(clamp(p,0,1)*100)}%`; }
  function showResult(html,warn=false){ result.innerHTML=html; result.classList.add('show'); result.classList.toggle('warn',warn); }
  async function refresh(){
    if(busy)return; const url=creatorVideo.value.trim(); const record=url&&window.LineupStorage?.getLocalVideo?await LineupStorage.getLocalVideo(url):null;
    btn.disabled=!record?.blob; setStatus(record?.blob?`準備OK · ${formatBytes(record.size)}`:'MP4を選択すると使えます',0); result.classList.remove('show','warn');
  }
  btn.addEventListener('click',async()=>{
    if(busy)return; const url=creatorVideo.value.trim(); const record=await LineupStorage.getLocalVideo(url); if(!record?.blob)return refresh();
    if(record.size>MAX_INPUT){ showResult(`入力動画が <b>${formatBytes(record.size)}</b> あります。ブラウザ圧縮の安定性を優先して300MB超は処理しません。`,true); return; }
    if(record.size<=TARGET_LIMIT){ showResult(`すでに <b>${formatBytes(record.size)}</b> なのでGitHub画面からアップロードできる目安内です。圧縮は不要です。`); return; }
    busy=true; btn.disabled=true; result.classList.remove('show','warn');
    try{
      setStatus('動画情報を確認中…',0.01); const meta=await readVideoMeta(record.blob); let plan=makePlan(record.size,meta);
      setStatus(`設定: ${planLabel(plan)}`,0.04);
      const ffmpeg=await loadFFmpeg(setStatus);
      setStatus(`圧縮開始 · ${planLabel(plan)}`,0.1);
      let output=await transcode(ffmpeg,record.blob,plan,setStatus,1);
      if(output.size>TARGET_LIMIT&&plan.videoKbps>380){
        const ratio=(TARGET_WORK/output.size)*0.92; plan={...plan,videoKbps:Math.floor(clamp(plan.videoKbps*ratio,350,8000))};
        setStatus(`24MB超のため再調整 · ${plan.videoKbps}kbps`,0.12);
        output=await transcode(ffmpeg,record.blob,plan,setStatus,2);
      }
      await cleanupInput(ffmpeg);
      if(output.size>=record.size){
        setStatus('完了',1); showResult(`圧縮後が元動画より小さくならなかったため、元の <b>${formatBytes(record.size)}</b> を残しました。`,true);
      }else{
        await LineupStorage.saveLocalVideo(url,output,record.fileName);
        creatorVideo.dispatchEvent(new Event('change',{bubbles:true}));
        setStatus('圧縮完了',1);
        const ok=output.size<=TARGET_LIMIT;
        showResult(`<b>${formatBytes(record.size)} → ${formatBytes(output.size)}</b><br>${planLabel(plan)}${ok?'<br>GitHubのassets/videos/へアップロードできる目安内です。':'<br>24MBを少し超えています。GitHub Desktop / Gitでのアップロードを使うか、動画を短くしてください。'}`,!ok);
      }
    }catch(err){
      console.error('MP4 compression failed',err); setStatus('圧縮に失敗しました',0); showResult(`圧縮できませんでした。元動画は変更していません。<br>${escapeHtml(err?.message||String(err))}`,true);
      try{if(ffmpegInstance)await cleanupInput(ffmpegInstance);}catch{}
    }finally{ busy=false; await refresh(); }
  });
  creatorVideo.addEventListener('change',()=>setTimeout(refresh,80)); creatorVideo.addEventListener('input',()=>setTimeout(refresh,80));
  const observer=new MutationObserver(()=>refresh()); observer.observe(box,{subtree:true,childList:true,characterData:true});
  refresh(); return true;
}
function boot(){ if(setupUI())return; const observer=new MutationObserver(()=>{if(setupUI())observer.disconnect();}); observer.observe(document.documentElement,{childList:true,subtree:true}); }
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.addEventListener('beforeunload',()=>{coreBlobUrls.forEach(URL.revokeObjectURL);coreBlobUrls=[];});
