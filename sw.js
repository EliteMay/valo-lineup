'use strict';
const DB_NAME='lineupLab.images.v1';
const STORE='images';
const MARKER='/_lineup-media/';

self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

function openDb(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,1);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE,{keyPath:'key'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error||new Error('IndexedDB open failed'));
  });
}
async function readImage(key){
  const db=await openDb();
  const value=await new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,'readonly');
    const req=tx.objectStore(STORE).get(key);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error||new Error('IndexedDB read failed'));
  });
  db.close();
  return value;
}
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  const index=url.pathname.indexOf(MARKER);
  if(index<0) return;
  event.respondWith((async()=>{
    try{
      const tail=url.pathname.slice(index+MARKER.length);
      const parts=tail.split('/');
      if(parts.length<2) return new Response('Not found',{status:404});
      const id=decodeURIComponent(parts[0]);
      const slot=decodeURIComponent(parts[1]).replace(/\.webp$/i,'');
      const record=await readImage(`${id}:${slot}`);
      if(!record?.blob) return new Response('Not found',{status:404});
      return new Response(record.blob,{status:200,headers:{'Content-Type':record.type||record.blob.type||'image/webp','Cache-Control':'no-store'}});
    }catch(error){
      return new Response('Image unavailable',{status:500});
    }
  })());
});