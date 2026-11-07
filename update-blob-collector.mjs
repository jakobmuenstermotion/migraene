// Spielt eine neue Fassung von Blob Collector ein.
// Aufruf (im Ordner migraene):  node update-blob-collector.mjs [Pfad zu BlobGame/redesign]
// 1. baut die Handy-Fassung im Spielordner (redesign/tools/build-deploy.mjs -> BlobGame/handy-version)
// 2. kopiert sie nach ./blob-collector (ohne eigenen Service Worker und App-Manifest, das übernimmt die Begleitapp)
// 3. aktualisiert sw.js der Begleitapp (build-garden.mjs), damit alles offline verfügbar ist
// Danach: git add -A && git commit && git push
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const redesign=path.resolve(process.argv[2]??path.join(root,'..','BlobGame','redesign'));
const built=path.resolve(redesign,'..','handy-version'),target=path.join(root,'blob-collector');
if(!fs.existsSync(path.join(redesign,'embed-bridge.mjs')))throw Error('Spielordner ohne embed-bridge.mjs: '+redesign);
execFileSync(process.execPath,[path.join(redesign,'tools','build-deploy.mjs')],{stdio:'inherit',cwd:redesign});
fs.rmSync(target,{recursive:true,force:true});fs.cpSync(built,target,{recursive:true});
for(const f of ['sw.js','manifest.webmanifest','app-icon-180.png','app-icon-192.png','app-icon-512.png'])fs.rmSync(path.join(target,f),{force:true});
const page=path.join(target,'index.html');let html=fs.readFileSync(page,'utf8');
html=html.replace(/<link rel="manifest"[^\n]*\n<script>if\(!new URLSearchParams[^\n]*<\/script>/,'');
if(html.includes('serviceWorker'))throw Error('Service-Worker-Zeile im Spiel-Index nicht gefunden/entfernt – build-deploy.mjs geändert?');
fs.writeFileSync(page,html);
execFileSync(process.execPath,[path.join(root,'build-garden.mjs')],{stdio:'inherit',cwd:root});
console.log('Blob Collector eingespielt nach',target);
