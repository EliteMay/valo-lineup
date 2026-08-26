(function(){
  const USER_KEY = 'lineupLab.userLineups.v1';
  const FAV_KEY = 'lineupLab.favorites.v1';
  const PREF_KEY = 'lineupLab.preferences.v1';
  const VIDEO_DB = 'lineupLab.videos.v1';
  const VIDEO_STORE = 'videos';
  const localVideoUrls = new Set();

  function read(key, fallback){
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { console.warn('storage read failed', key, e); return fallback; }
  }
  function write(key, value){
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('storage write failed', key, e); return false; }
  }
  function clone(value){
    try { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
    catch { return value; }
  }

  async function readSharedLineups(){
    try {
      const response = await fetch(`data/lineups.json?v=${Date.now()}`, { cache: 'no-store' });
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = await response.json();
      const items = Array.isArray(parsed) ? parsed : parsed?.lineups;
      return Array.isArray(items) ? items : [];
    } catch (e) {
      console.warn('shared lineups read failed', e);
      return [];
    }
  }
  function normalizeShared(item){
    const next = clone(item) || {};
    next.source = next.source === 'demo' ? 'demo' : 'shared';
    return next;
  }
  function mergeSharedAndLocal(sharedItems, localItems){
    const merged = new Map();
    sharedItems.filter(Boolean).forEach(item => {
      const key = item.id || `shared-${merged.size}`;
      merged.set(key, normalizeShared(item));
    });
    localItems.filter(Boolean).forEach(item => {
      const key = item.id || `local-${Date.now()}-${merged.size}`;
      merged.set(key, normalizeShared(item));
    });
    return Array.from(merged.values());
  }
  function downloadJson(items){
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lineups.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function openVideoDb(){
    return new Promise((resolve, reject) => {
      if(!('indexedDB' in window)) return reject(new Error('IndexedDB unavailable'));
      const request = indexedDB.open(VIDEO_DB, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if(!db.objectStoreNames.contains(VIDEO_STORE)) db.createObjectStore(VIDEO_STORE, { keyPath: 'url' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });
  }
  async function saveLocalVideo(url, file, fileName){
    const db = await openVideoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE, 'readwrite');
      tx.objectStore(VIDEO_STORE).put({url,fileName,blob:file,size:file.size,type:file.type || 'video/mp4',updatedAt:new Date().toISOString()});
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { const err=tx.error; db.close(); reject(err); };
    });
  }
  async function getLocalVideo(url){
    try{
      const db = await openVideoDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(VIDEO_STORE, 'readonly');
        const request = tx.objectStore(VIDEO_STORE).get(url);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      });
    }catch(e){ console.warn('local video read failed', e); return null; }
  }
  async function deleteLocalVideo(url){
    try{
      const db = await openVideoDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(VIDEO_STORE, 'readwrite');
        tx.objectStore(VIDEO_STORE).delete(url);
        tx.oncomplete = () => { db.close(); resolve(true); };
        tx.onerror = () => { const err=tx.error; db.close(); reject(err); };
      });
    }catch(e){ console.warn('local video delete failed', e); return false; }
  }
  function sanitizeFileName(name){
    const stripped = String(name || 'video.mp4').replace(/\.mp4$/i,'');
    const base = stripped.normalize('NFKC').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60) || 'video';
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    return `${stamp}-${base}.mp4`;
  }
  function isMp4Url(raw){
    if(!raw) return false;
    try { return /\.mp4$/i.test(new URL(raw, location.href).pathname); }
    catch { return false; }
  }
  function publicVideoUrl(fileName){ return new URL(`assets/videos/${encodeURIComponent(fileName)}`, document.baseURI).href; }
  function formatBytes(bytes){
    if(!Number.isFinite(bytes)) return '';
    if(bytes < 1024*1024) return `${Math.max(1,Math.round(bytes/1024))} KB`;
    return `${(bytes/(1024*1024)).toFixed(bytes > 10*1024*1024 ? 1 : 2)} MB`;
  }
  function addMp4Styles(){
    if(document.getElementById('lineupMp4Styles')) return;
    const style = document.createElement('style');
    style.id = 'lineupMp4Styles';
    style.textContent = `.mp4-box{margin-top:10px;border:1px solid #283b46;background:#0b151d;border-radius:10px;padding:11px;display:grid;gap:9px}.mp4-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.mp4-head strong{font-size:11px}.mp4-head small{font-size:9px;color:#6e828c}.mp4-actions{display:flex;gap:7px;flex-wrap:wrap}.mp4-pick{position:relative;overflow:hidden}.mp4-pick input{position:absolute;inset:0;opacity:0;cursor:pointer}.mp4-meta{font-size:10px;color:#8fa2ad;line-height:1.5;word-break:break-all}.mp4-meta b{color:#dfe8eb}.mp4-warn{color:#e8ba66}.mp4-preview{display:none;border:1px solid #243843;border-radius:9px;overflow:hidden;background:#05090c}.mp4-preview.show{display:block}.mp4-preview video{display:block;width:100%;max-height:290px;background:#000}.mp4-share-note{font-size:9px;color:#718691;line-height:1.55}.mp4-share-note code{color:#cbd6da;background:#111b23;padding:2px 4px;border-radius:4px}.detail-mp4{margin-top:10px;border:1px solid #243843;border-radius:10px;overflow:hidden;background:#05090c}.detail-mp4 video{display:block;width:100%;max-height:340px;background:#000}.detail-mp4-info{display:flex;justify-content:space-between;gap:8px;padding:7px 9px;font-size:9px;color:#758a94;background:#0c151c}.detail-mp4-info a{color:#dbe7ea;text-decoration:none}.detail-mp4-info a:hover{text-decoration:underline}`;
    document.head.appendChild(style);
  }

  window.LineupStorage = {
    getUserLineups(){ return read(USER_KEY, []); },
    saveUserLineups(items){ return write(USER_KEY, items); },
    getFavorites(){ return new Set(read(FAV_KEY, [])); },
    saveFavorites(set){ return write(FAV_KEY, Array.from(set)); },
    getPreferences(){ return read(PREF_KEY, {}); },
    savePreferences(prefs){ return write(PREF_KEY, prefs); },
    clearUserLineups(){ localStorage.removeItem(USER_KEY); },
    getLocalVideo, saveLocalVideo, deleteLocalVideo,
    keys:{USER_KEY,FAV_KEY,PREF_KEY}
  };

  function setupSharedExport(){
    const button = document.getElementById('exportDataBtn');
    if(!button || button.dataset.sharedExportReady === '1') return;
    button.dataset.sharedExportReady = '1';
    const title = button.querySelector('strong');
    const description = button.querySelector('small');
    if(title) title.textContent = '共有用JSONを書き出す';
    if(description) description.textContent = 'GitHubの data/lineups.json にそのまま置き換え';
    const note = document.querySelector('#dataModal .modal-note');
    if(note) note.textContent = '共有用JSONには、現在GitHubにある定点とこのブラウザのマイ定点をまとめます。MP4本体はJSONに入らないため、動画を共有する場合は assets/videos/ にMP4も置いてください。';
    button.addEventListener('click', async (event) => {
      event.preventDefault(); event.stopImmediatePropagation();
      const previousDisabled = button.disabled; button.disabled = true;
      const previousTitle = title?.textContent || ''; if(title) title.textContent = '共有データを作成中…';
      const sharedItems = await readSharedLineups();
      const localItems = window.LineupStorage.getUserLineups();
      const merged = mergeSharedAndLocal(sharedItems, localItems);
      downloadJson(merged);
      if(title) title.textContent = `${merged.length}件の lineups.json を保存しました`;
      setTimeout(() => { if(title) title.textContent = previousTitle; button.disabled = previousDisabled; }, 1800);
    }, true);
  }

  function setupMp4Support(){
    addMp4Styles();
    const creatorVideo = document.getElementById('creatorVideo');
    const creatorForm = document.getElementById('creatorForm');
    if(!creatorVideo || !creatorForm || document.getElementById('creatorMp4Box')) return;
    const fieldLabel = creatorVideo.closest('.field-label');
    if(fieldLabel?.firstChild?.nodeType === Node.TEXT_NODE) fieldLabel.firstChild.textContent = 'YouTube / 動画URL / MP4共有URL';
    const box = document.createElement('div');
    box.className = 'mp4-box'; box.id = 'creatorMp4Box';
    box.innerHTML = `<div class="mp4-head"><div><strong>MP4ファイル</strong><small> PC内の動画を直接登録</small></div><small id="mp4LocalState">未選択</small></div><div class="mp4-actions"><label class="btn ghost small mp4-pick">MP4を選択<input id="creatorMp4Input" type="file" accept="video/mp4,.mp4"></label><button type="button" class="btn ghost small" id="downloadSharedMp4" disabled>共有用MP4を保存</button><button type="button" class="btn ghost small" id="clearCreatorMp4" disabled>MP4解除</button></div><div class="mp4-meta" id="creatorMp4Meta">選択したMP4はこのPCではIndexedDBに保存されます。</div><div class="mp4-preview" id="creatorMp4Preview"><video controls preload="metadata"></video></div><div class="mp4-share-note">友達にも動画を見せる場合は「共有用MP4を保存」で出したファイルを、GitHubの <code>assets/videos/</code> にアップロードしてください。定点JSONには動画本体ではなくURLだけ保存します。</div>`;
    fieldLabel.parentNode.insertBefore(box, fieldLabel.nextSibling);
    const input = box.querySelector('#creatorMp4Input');
    const stateText = box.querySelector('#mp4LocalState');
    const meta = box.querySelector('#creatorMp4Meta');
    const preview = box.querySelector('#creatorMp4Preview');
    const previewVideo = preview.querySelector('video');
    const downloadBtn = box.querySelector('#downloadSharedMp4');
    const clearBtn = box.querySelector('#clearCreatorMp4');
    let currentObjectUrl = '', currentRecord = null;
    function clearObjectUrl(){ if(currentObjectUrl){ URL.revokeObjectURL(currentObjectUrl); localVideoUrls.delete(currentObjectUrl); currentObjectUrl=''; } }
    function showRecord(record, url){
      clearObjectUrl(); currentRecord = record || null;
      if(record?.blob){ currentObjectUrl = URL.createObjectURL(record.blob); localVideoUrls.add(currentObjectUrl); previewVideo.src = currentObjectUrl; preview.classList.add('show'); }
      else if(isMp4Url(url)){ previewVideo.src = url; preview.classList.add('show'); }
      else { previewVideo.removeAttribute('src'); preview.classList.remove('show'); }
      const size = record?.size ? ` · ${formatBytes(record.size)}` : '';
      stateText.textContent = record ? 'ローカル保存済み' : (isMp4Url(url) ? '共有MP4 URL' : '未選択');
      meta.innerHTML = isMp4Url(url) ? `<b>${record?.fileName || decodeURIComponent(new URL(url).pathname.split('/').pop())}</b>${size}<br>${url}${record?.size > 25*1024*1024 ? '<br><span class="mp4-warn">25MB超：GitHub画面からのアップロードには大きすぎる場合があります。</span>' : ''}` : '選択したMP4はこのPCではIndexedDBに保存されます。';
      downloadBtn.disabled = !record?.blob; clearBtn.disabled = !isMp4Url(url) && !record;
    }
    async function refreshFromUrl(){ const url = creatorVideo.value.trim(); if(!isMp4Url(url)) return showRecord(null,url); showRecord(await getLocalVideo(url),url); }
    input.addEventListener('change', async () => {
      const file = input.files?.[0]; input.value=''; if(!file) return;
      if(!/\.mp4$/i.test(file.name) && file.type !== 'video/mp4'){ alert('MP4ファイルを選択してください。'); return; }
      const fileName = sanitizeFileName(file.name); const url = publicVideoUrl(fileName);
      try{ await saveLocalVideo(url,file,fileName); creatorVideo.value=url; creatorVideo.dispatchEvent(new Event('input',{bubbles:true})); showRecord({url,fileName,blob:file,size:file.size,type:file.type},url); }
      catch(e){ console.error(e); alert('MP4をブラウザへ保存できませんでした。ブラウザの保存容量・設定を確認してください。'); }
    });
    creatorVideo.addEventListener('change', refreshFromUrl); creatorVideo.addEventListener('blur', refreshFromUrl);
    downloadBtn.addEventListener('click', () => { if(!currentRecord?.blob) return; const a=document.createElement('a'); const url=URL.createObjectURL(currentRecord.blob); a.href=url; a.download=currentRecord.fileName||'lineup-video.mp4'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),0); });
    clearBtn.addEventListener('click', async () => { const oldUrl=creatorVideo.value.trim(); if(isMp4Url(oldUrl)) await deleteLocalVideo(oldUrl); creatorVideo.value=''; showRecord(null,''); });
    creatorForm.addEventListener('reset', () => setTimeout(()=>showRecord(null,''),0));
    const heading=document.getElementById('creatorHeading'); if(heading&&'MutationObserver' in window) new MutationObserver(()=>setTimeout(refreshFromUrl,0)).observe(heading,{childList:true,subtree:true,characterData:true});
    setupDetailMp4Enhancer();
  }

  function setupDetailMp4Enhancer(){
    const detail=document.getElementById('detailContent'); if(!detail||detail.dataset.mp4ObserverReady==='1') return; detail.dataset.mp4ObserverReady='1';
    async function enhance(){
      const link=detail.querySelector('a.video-link:not([data-mp4-checked])'); if(!link) return; link.dataset.mp4Checked='1'; const href=link.href; if(!isMp4Url(href)) return;
      const shell=document.createElement('div'); shell.className='detail-mp4'; shell.innerHTML=`<video controls preload="metadata" playsinline></video><div class="detail-mp4-info"><span>MP4 VIDEO</span><a target="_blank" rel="noopener">元動画を開く</a></div>`;
      const video=shell.querySelector('video'); const original=shell.querySelector('a'); original.href=href; link.replaceWith(shell);
      const record=await getLocalVideo(href); if(!shell.isConnected) return;
      if(record?.blob){ const localUrl=URL.createObjectURL(record.blob); localVideoUrls.add(localUrl); video.src=localUrl; shell.querySelector('.detail-mp4-info span').textContent=`MP4 · LOCAL · ${formatBytes(record.size)}`; }
      else { video.src=href; shell.querySelector('.detail-mp4-info span').textContent='MP4 · SHARED'; }
    }
    new MutationObserver(enhance).observe(detail,{childList:true,subtree:true}); enhance();
  }

  function setup(){ setupSharedExport(); setupMp4Support(); }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup); else setup();
  window.addEventListener('beforeunload', () => { localVideoUrls.forEach(url=>URL.revokeObjectURL(url)); localVideoUrls.clear(); });
})();
