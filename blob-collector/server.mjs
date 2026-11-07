import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('.', import.meta.url));
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8'};
const server = http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    const relative = path.relative(root,target);
    if(relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(p=>p.startsWith('.'))) { res.writeHead(403).end(); return; }
    const content = await readFile(target);
    res.writeHead(200,{'Content-Type':types[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-store'}).end(content);
  } catch { res.writeHead(404).end('Nicht gefunden'); }
});
const lan=process.argv.includes('--lan'),portFlag=process.argv.indexOf('--port'),port=Number(portFlag>=0?process.argv[portFlag+1]:process.env.PORT??5173);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Ungültiger Port');
server.listen(port,lan?'0.0.0.0':'127.0.0.1',()=>console.log(`Blob Collector: http://localhost:${server.address().port}/Blob-Collector.html?hud=cozy${lan?' · WLAN-Zugriff aktiv':''}`));
