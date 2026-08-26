const CORE_URL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.js';
const T = {
  LOAD:'LOAD', EXEC:'EXEC', FFPROBE:'FFPROBE', WRITE_FILE:'WRITE_FILE', READ_FILE:'READ_FILE',
  DELETE_FILE:'DELETE_FILE', RENAME:'RENAME', CREATE_DIR:'CREATE_DIR', LIST_DIR:'LIST_DIR',
  DELETE_DIR:'DELETE_DIR', ERROR:'ERROR', PROGRESS:'PROGRESS', LOG:'LOG', MOUNT:'MOUNT', UNMOUNT:'UNMOUNT'
};
let ffmpeg = null;

async function loadCore({coreURL:_coreURL, wasmURL:_wasmURL, workerURL:_workerURL}={}){
  const first = !ffmpeg;
  if(!_coreURL) _coreURL = CORE_URL.replace('/umd/','/esm/');
  try{
    self.createFFmpegCore = (await import(_coreURL)).default;
  }catch(err){
    throw new Error(`failed to import ffmpeg-core.js: ${err?.message || err}`);
  }
  if(!self.createFFmpegCore) throw new Error('failed to import ffmpeg-core.js');
  const coreURL = _coreURL;
  const wasmURL = _wasmURL || _coreURL.replace(/\.js$/g,'.wasm');
  const workerURL = _workerURL || _coreURL.replace(/\.js$/g,'.worker.js');
  ffmpeg = await self.createFFmpegCore({
    mainScriptUrlOrBlob: `${coreURL}#${btoa(JSON.stringify({wasmURL,workerURL}))}`
  });
  ffmpeg.setLogger(data => self.postMessage({type:T.LOG,data}));
  ffmpeg.setProgress(data => self.postMessage({type:T.PROGRESS,data}));
  return first;
}
function ensureLoaded(){ if(!ffmpeg) throw new Error('ffmpeg is not loaded'); }
function exec({args,timeout=-1}){ ensureLoaded(); ffmpeg.setTimeout(timeout); ffmpeg.exec(...args); const ret=ffmpeg.ret; ffmpeg.reset(); return ret; }
function ffprobe({args,timeout=-1}){ ensureLoaded(); ffmpeg.setTimeout(timeout); ffmpeg.ffprobe(...args); const ret=ffmpeg.ret; ffmpeg.reset(); return ret; }
function writeFile({path,data}){ ensureLoaded(); ffmpeg.FS.writeFile(path,data); return true; }
function readFile({path,encoding}){ ensureLoaded(); return ffmpeg.FS.readFile(path,{encoding}); }
function deleteFile({path}){ ensureLoaded(); ffmpeg.FS.unlink(path); return true; }
function rename({oldPath,newPath}){ ensureLoaded(); ffmpeg.FS.rename(oldPath,newPath); return true; }
function createDir({path}){ ensureLoaded(); ffmpeg.FS.mkdir(path); return true; }
function listDir({path}){ ensureLoaded(); return ffmpeg.FS.readdir(path).map(name=>{ const stat=ffmpeg.FS.stat(`${path}/${name}`); return {name,isDir:ffmpeg.FS.isDir(stat.mode)}; }); }
function deleteDir({path}){ ensureLoaded(); ffmpeg.FS.rmdir(path); return true; }
function mount({fsType,options,mountPoint}){ ensureLoaded(); const fs=ffmpeg.FS.filesystems[fsType]; if(!fs)return false; ffmpeg.FS.mount(fs,options,mountPoint); return true; }
function unmount({mountPoint}){ ensureLoaded(); ffmpeg.FS.unmount(mountPoint); return true; }

self.onmessage = async ({data:{id,type,data:_data}}) => {
  const trans=[];
  let data;
  try{
    switch(type){
      case T.LOAD: data=await loadCore(_data); break;
      case T.EXEC: data=exec(_data); break;
      case T.FFPROBE: data=ffprobe(_data); break;
      case T.WRITE_FILE: data=writeFile(_data); break;
      case T.READ_FILE: data=readFile(_data); break;
      case T.DELETE_FILE: data=deleteFile(_data); break;
      case T.RENAME: data=rename(_data); break;
      case T.CREATE_DIR: data=createDir(_data); break;
      case T.LIST_DIR: data=listDir(_data); break;
      case T.DELETE_DIR: data=deleteDir(_data); break;
      case T.MOUNT: data=mount(_data); break;
      case T.UNMOUNT: data=unmount(_data); break;
      default: throw new Error(`unknown message type: ${type}`);
    }
  }catch(err){
    self.postMessage({id,type:T.ERROR,data:String(err)});
    return;
  }
  if(data instanceof Uint8Array) trans.push(data.buffer);
  self.postMessage({id,type,data},trans);
};
