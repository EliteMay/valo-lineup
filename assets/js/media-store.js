(function(){
  'use strict';

  const DB_NAME = 'lineupLab.images.v1';
  const STORE = 'images';
  const MEDIA_PREFIX = '_lineup-media/';
  const IMAGE_KEYS = ['standing','aim','result'];
  const pending = new Set();
  let enabled = false;
  let rawGet = null;
  let rawSave = null;
  let rawClear = null;

  const clone = value => {
    try { return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value)); }
    catch { return value; }
  };
  const safeId = value => encodeURIComponent(String(value || 'lineup'));
  const imagePath = (id,key) => `${MEDIA_PREFIX}${safeId(id)}/${key}.webp`;
  const isDataImage = value => typeof value === 'string' && /^data:image\//i.test(value);
  const isLocalMediaPath = value => typeof value === 'string' && value.replace(/^\.\//,'').startsWith(MEDIA_PREFIX);
  const refKey = value => {
    if(!isLocalMediaPath(value)) return null;
    const clean = value.replace(/^\.\//,'').slice(MEDIA_PREFIX.length);
    const parts = clean.split('/');
    if(parts.length < 2) return null;
    const id = decodeURIComponent(parts[0]);
    const key = (parts[1] || '').replace(/\.webp$/i,'');
    return IMAGE_KEYS.includes(key) ? `${id}:${key}` : null;
  };

  function track(promise){
    const p = Promise.resolve(promise).catch(error => console.warn('image media operation failed', error)).finally(() => pending.delete(p));
    pending.add(p);
    return p;
  }

  function openDb(){
    return new Promise((resolve,reject) => {
      const request = indexedDB.open(DB_NAME,1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'key'});
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('IndexedDB open failed'));
    });
  }

  function dataUrlToBlob(dataUrl){
    const match = /^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl || '');
    if(!match) throw new Error('Invalid data URL');
    const type = match[1] || 'image/webp';
    const binary = match[2] ? atob(match[3]) : decodeURIComponent(match[3]);
    const bytes = new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes],{type});
  }

  async function putImage(id,key,source){
    const blob = source instanceof Blob ? source : dataUrlToBlob(source);
    const db = await openDb();
    await new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).put({key:`${id}:${key}`,lineupId:String(id),slot:key,blob,size:blob.size,type:blob.type || 'image/webp',updatedAt:new Date().toISOString()});
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('IndexedDB write failed'));
    });
    db.close();
    return imagePath(id,key);
  }

  async function getImageByRef(ref){
    const key = refKey(ref);
    if(!key) return null;
    const db = await openDb();
    const result = await new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,'readonly');
      const request = tx.objectStore(STORE).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error('IndexedDB read failed'));
    });
    db.close();
    return result;
  }

  async function deleteRecord(key){
    if(!key) return;
    const db = await openDb();
    await new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('IndexedDB delete failed'));
    });
    db.close();
  }

  async function clearImages(){
    const db = await openDb();
    await new Promise((resolve,reject) => {
      const tx = db.transaction(STORE,'readwrite');
      tx.objectStore(STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('IndexedDB clear failed'));
    });
    db.close();
  }

  function mediaRefs(items){
    const refs = new Set();
    (items || []).forEach(item => IMAGE_KEYS.forEach(key => {
      const ref = item?.images?.[key];
      const parsed = refKey(ref);
      if(parsed) refs.add(parsed);
    }));
    return refs;
  }

  function cleanupRemovedMedia(before, after){
    if(!enabled) return;
    const keepRefs = mediaRefs(after);
    const beforeRefs = mediaRefs(before);
    beforeRefs.forEach(key => { if(!keepRefs.has(key)) track(deleteRecord(key)); });

    const keepVideos = new Set((after || []).map(item => item?.videoUrl).filter(value => typeof value === 'string' && /\.mp4(?:$|[?#])/i.test(value)));
    const beforeVideos = new Set((before || []).map(item => item?.videoUrl).filter(value => typeof value === 'string' && /\.mp4(?:$|[?#])/i.test(value)));
    beforeVideos.forEach(url => {
      if(!keepVideos.has(url)) track(window.LineupStorage?.deleteLocalVideo?.(url));
    });
  }

  function serializeItems(items){
    return (items || []).map(item => {
      const next = clone(item) || {};
      const images = {...(next.images || {})};
      IMAGE_KEYS.forEach(key => {
        const value = images[key];
        if(isDataImage(value) && next.id){
          const ref = imagePath(next.id,key);
          images[key] = ref;
          if(enabled) track(putImage(next.id,key,value));
        }
      });
      next.images = images;
      delete next._imageRefs;
      return next;
    });
  }

  function installStorageWrapper(){
    const api = window.LineupStorage;
    if(!api || api.__mediaStoreInstalled) return false;
    rawGet = api.getUserLineups.bind(api);
    rawSave = api.saveUserLineups.bind(api);
    rawClear = api.clearUserLineups.bind(api);

    api.getPersistedUserLineups = () => rawGet();
    api.saveUserLineups = function(items){
      const before = rawGet();
      if(!enabled) return rawSave(items);
      const persisted = serializeItems(items);
      const ok = rawSave(persisted);
      if(ok) cleanupRemovedMedia(before,persisted);
      return ok;
    };
    api.clearUserLineups = function(){
      const before = rawGet();
      rawClear();
      cleanupRemovedMedia(before,[]);
      if(enabled) track(clearImages());
    };
    api.__foundationGuarded = true;
    api.__mediaStoreInstalled = true;
    return true;
  }

  async function registerServiceWorker(){
    if(!('serviceWorker' in navigator) || !('indexedDB' in window)) return false;
    if(location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return false;
    try{
      const url = new URL('sw.js?v=1.1.0',document.baseURI);
      const registration = await navigator.serviceWorker.register(url,{scope:new URL('./',document.baseURI).pathname});
      await navigator.serviceWorker.ready;
      enabled = true;
      return !!registration;
    }catch(error){
      console.warn('Lineup Lab image service worker unavailable',error);
      enabled = false;
      return false;
    }
  }

  async function migrateExisting(){
    if(!enabled || !rawGet || !rawSave) return;
    const before = rawGet();
    let changed = false;
    const migrated = before.map(item => {
      const next = clone(item) || {};
      const images = {...(next.images || {})};
      IMAGE_KEYS.forEach(key => {
        const value = images[key];
        if(isDataImage(value) && next.id){
          track(putImage(next.id,key,value));
          images[key] = imagePath(next.id,key);
          changed = true;
        }
      });
      next.images = images;
      return next;
    });
    if(changed) rawSave(migrated);
  }

  function sharedAssetPath(id,key){ return `assets/lineups/${encodeURIComponent(String(id))}/${key}.webp`; }

  async function blobForImageValue(value){
    if(isDataImage(value)) return dataUrlToBlob(value);
    if(isLocalMediaPath(value)) return (await getImageByRef(value))?.blob || null;
    return null;
  }

  function crcTable(){
    const table = new Uint32Array(256);
    for(let n=0;n<256;n++){
      let c=n;
      for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
      table[n]=c>>>0;
    }
    return table;
  }
  const CRC_TABLE = crcTable();
  function crc32(bytes){
    let crc=0xffffffff;
    for(const b of bytes) crc=CRC_TABLE[(crc^b)&0xff]^(crc>>>8);
    return (crc^0xffffffff)>>>0;
  }
  function u16(n){ return [n&255,(n>>>8)&255]; }
  function u32(n){ return [n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]; }
  async function bytesOf(content){
    if(content instanceof Uint8Array) return content;
    if(content instanceof Blob) return new Uint8Array(await content.arrayBuffer());
    return new TextEncoder().encode(String(content));
  }
  async function makeZip(files){
    const chunks=[];
    const central=[];
    let offset=0;
    for(const file of files){
      const nameBytes=new TextEncoder().encode(file.name.replace(/\\/g,'/'));
      const data=await bytesOf(file.content);
      const crc=crc32(data);
      const local=new Uint8Array([
        ...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),...u16(0),...nameBytes
      ]);
      chunks.push(local,data);
      const cd=new Uint8Array([
        ...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(nameBytes.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...nameBytes
      ]);
      central.push(cd);
      offset += local.length + data.length;
    }
    const centralSize=central.reduce((sum,x)=>sum+x.length,0);
    const end=new Uint8Array([
      ...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(centralSize),...u32(offset),...u16(0)
    ]);
    return new Blob([...chunks,...central,end],{type:'application/zip'});
  }

  async function readShared(){
    try{
      const response=await fetch(`data/lineups.json?v=${Date.now()}`,{cache:'no-store'});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed=await response.json();
      return Array.isArray(parsed)?parsed:Array.isArray(parsed?.lineups)?parsed.lineups:[];
    }catch(error){
      console.warn('shared lineup read failed',error);
      return [];
    }
  }

  async function buildSharePackage(){
    const shared=await readShared();
    const local=(window.LineupStorage?.getPersistedUserLineups?.() || window.LineupStorage?.getUserLineups?.() || []);
    const sharedMap=new Map(shared.filter(Boolean).map(item=>[String(item.id || `shared-${Math.random()}`),clone(item)]));
    const sharedBefore=new Set(sharedMap.keys());
    let published=0, unpublished=0;

    local.forEach(item => {
      const id=String(item.id || '');
      const wasShared=sharedBefore.has(id);
      const shouldShare=item.publish===true || (item.publish==null && wasShared);
      if(item.publish===false && wasShared){ sharedMap.delete(id); unpublished++; return; }
      if(!shouldShare) return;
      const next=clone(item);
      next.source='shared';
      delete next.publish;
      sharedMap.set(id,next);
      published++;
    });

    const output=[...sharedMap.values()];
    const files=[];
    let imageCount=0;
    const warnings=[];
    for(const item of output){
      if(!item?.images) continue;
      const images={...item.images};
      for(const key of IMAGE_KEYS){
        const value=images[key];
        const blob=await blobForImageValue(value);
        if(blob){
          const path=sharedAssetPath(item.id,key);
          files.push({name:path,content:blob});
          images[key]=path;
          imageCount++;
        } else if(isLocalMediaPath(value)) {
          images[key]='';
          warnings.push(`${item.title || item.id}: ${key} のローカル画像を取得できませんでした`);
        }
      }
      item.images=images;
    }

    files.unshift({name:'lineups.json',content:JSON.stringify(output,null,2)});
    const instructions=[
      'Lineup Lab shared package',
      '',
      '1. lineups.json -> GitHub data/lineups.json に置き換え',
      '2. assets/lineups/ 以下 -> GitHub assets/lineups/ に同じ構成でアップロード',
      '3. MP4は従来どおり assets/videos/ にアップロード',
      '',
      `共有定点: ${output.length}件`,
      `今回まとめた画像: ${imageCount}枚`,
      ...(warnings.length?['','WARNINGS:',...warnings]:[])
    ].join('\n');
    files.push({name:'README.txt',content:instructions});

    const skipped=Math.max(0,local.length-published-unpublished);
    const ok=confirm(`共有パッケージを作成します。\n\n共有JSON: ${output.length}件\n共有するマイ定点: ${published}件\n共有しないマイ定点: ${skipped}件\n共有解除: ${unpublished}件\n画像: ${imageCount}枚\n\nZIPを保存しますか？`);
    if(!ok) return;
    const zip=await makeZip(files);
    const url=URL.createObjectURL(zip);
    const a=document.createElement('a');
    a.href=url;
    a.download=`lineup_share_${new Date().toISOString().slice(0,10).replaceAll('-','')}.zip`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
  }

  function installExportOverride(){
    document.addEventListener('click',event => {
      const button=event.target.closest?.('#exportDataBtn');
      if(!button) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      button.disabled=true;
      buildSharePackage().catch(error=>{console.error(error);alert('共有パッケージを作成できませんでした。');}).finally(()=>{button.disabled=false;});
    },true);
  }

  function updateUi(){
    const button=document.getElementById('exportDataBtn');
    button?.querySelector('strong')?.replaceChildren('共有パッケージを書き出す');
    button?.querySelector('small')?.replaceChildren('lineups.json と共有画像をZIPにまとめる');
    const note=document.querySelector('.foundation-storage-note');
    if(note) note.textContent=enabled?'画像はIndexedDBへ保存します。localStorageには軽い参照だけを保存します。':'この環境では画像IndexedDB移行を使えないため、従来のlocalStorage互換方式です。';
    const modalNote=document.querySelector('#dataModal .modal-note');
    if(modalNote) modalNote.textContent='画像はIndexedDBへ保存し、共有ZIPでは assets/lineups/ 用WebPとしてまとめます。MP4はIndexedDB / assets/videos/ を使用します。';
  }

  installStorageWrapper();
  installExportOverride();
  const registrationPromise=registerServiceWorker();
  document.addEventListener('DOMContentLoaded',async()=>{
    await registrationPromise;
    await migrateExisting();
    updateUi();
  },{once:true});

  window.LineupMediaStore={
    version:'1.1.0',
    isEnabled:()=>enabled,
    imagePath,
    isLocalMediaPath,
    getImageByRef,
    putImage,
    serializeItems,
    pending:()=>Promise.allSettled([...pending]),
    buildSharePackage
  };
})();