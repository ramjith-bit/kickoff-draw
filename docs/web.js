'use strict';
(function () {
  const status = document.getElementById('web-status');
  function show(ready) { if(status) status.innerHTML = '<i></i> ' + (ready ? (navigator.onLine ? 'OFFLINE READY' : 'OFFLINE') : 'WEB APP'); }
  let ready=false;
  addEventListener('online',()=>show(ready)); addEventListener('offline',()=>show(ready));
  if('serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.register('./sw.js').then(()=>navigator.serviceWorker.ready).then(()=>{ready=true;show(true);}).catch(()=>show(false));
  }
})();
