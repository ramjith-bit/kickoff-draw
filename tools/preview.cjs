// Development preview only. The Android app loads bundled assets directly.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../app/src/main/assets');
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8' };
http.createServer((req,res)=>{
  const url = new URL(req.url, 'http://localhost');
  const file = path.join(root, url.pathname === '/' ? 'index.html' : url.pathname);
  if (!file.startsWith(root + path.sep)) { res.writeHead(403);res.end();return; }
  fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404);res.end('Not found');return;}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(bytes);});
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173'));
