// Generate GitHub Pages output from the same assets bundled in Android.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assets = path.resolve(__dirname, '../app/src/main/assets');
const out = path.resolve(__dirname, '../docs');
fs.mkdirSync(out, {recursive:true});
for (const file of ['style.css','engine.js','teams.js','app.js']) fs.copyFileSync(path.join(assets,file),path.join(out,file));
let html = fs.readFileSync(path.join(assets,'index.html'),'utf8');
html = html.replace("connect-src 'none'", "connect-src 'self'; worker-src 'self'");
html = html.replace('</head>', '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon.svg" type="image/svg+xml"><script defer src="web.js"></script></head>');
html = html.replace('<span class="offline"><i></i> OFFLINE</span>', '<span class="offline" id="web-status" role="status"><i></i> WEB APP</span>');
fs.writeFileSync(path.join(out,'index.html'),html);
fs.writeFileSync(path.join(out,'.nojekyll'),'');
fs.writeFileSync(path.join(out,'icon.svg'),'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" rx="40" fill="#f5f3ee"/><rect x="34" y="34" width="124" height="124" rx="14" fill="#254f3b"/><g stroke="#f5f3ee" stroke-width="6" fill="none"><path d="M55 55h82v82H55zM96 55v82"/><circle cx="96" cy="96" r="15"/></g></svg>');
fs.writeFileSync(path.join(out,'manifest.webmanifest'),JSON.stringify({name:'Kickoff Draw',short_name:'Kickoff Draw',id:'./',start_url:'./',scope:'./',display:'standalone',background_color:'#f5f3ee',theme_color:'#f5f3ee',description:'Random football teams for couch Kick Off.',icons:[{src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'}]},null,2));
fs.writeFileSync(path.join(out,'web.js'),`'use strict';
(function () {
  const status = document.getElementById('web-status');
  function show(ready) { if(status) status.innerHTML = '<i></i> ' + (ready ? (navigator.onLine ? 'OFFLINE READY' : 'OFFLINE') : 'WEB APP'); }
  let ready=false;
  addEventListener('online',()=>show(ready)); addEventListener('offline',()=>show(ready));
  if('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{ready=true;show(true);}).catch(()=>show(false));
  }
})();
`);
const files=['index.html','style.css','engine.js','teams.js','app.js','web.js','icon.svg','manifest.webmanifest'];
const hash=crypto.createHash('sha256');for(const file of files)hash.update(fs.readFileSync(path.join(out,file)));
const version=hash.digest('hex').slice(0,12);
fs.writeFileSync(path.join(out,'sw.js'),`'use strict';
const CACHE = 'kickoff-draw-${version}';
const FILES = ${JSON.stringify(files.map(f=>'./'+f))};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kickoff-draw-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET')return;
  if(request.destination==='image'&&url.origin==='https://images.fifaindex.com'){event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok||response.type==='opaque')await cache.put(request,response.clone());return response;}));return;}
  if(url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).catch(()=>caches.match(new URL('./index.html',self.registration.scope).href)));
    return;
  }
  event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
});
`);
console.log('GitHub Pages output: docs/ ('+version+')');
