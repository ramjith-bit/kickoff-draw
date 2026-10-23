'use strict';
const CACHE = 'kickoff-draw-414d0e01701e';
const FILES = ["./index.html","./style.css","./engine.js","./teams.js","./app.js","./web.js","./icon.svg","./manifest.webmanifest"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kickoff-draw-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match(new URL('./index.html',self.registration.scope).href)));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});
