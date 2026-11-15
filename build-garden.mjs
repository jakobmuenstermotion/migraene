// Nach Änderungen an garden-config/ledger oder companion-garden.mjs ausführen:
// node build-garden.mjs
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const chunks=['garden-config.mjs','garden-ledger.mjs','companion-garden.mjs'].map(f=>read(f).replace(/^import[^\n]+\r?\n/gm,'').replace(/^export /gm,''));
chunks[2]='const C=GARDEN;\n'+chunks[2];
fs.writeFileSync(path.join(root,'companion-garden.js'),"(function(){'use strict';\n"+chunks.join('\n')+'\n})();\n');
const files=['./app-update.js','./begleiter.html','./icon-180.png','./companion-garden.js','./companion-garden.css'];
function walk(d){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else files.push('./'+p.replaceAll('\\','/'));}}
for(const d of ['garden-modules','garden-assets-webp','mondgarten','blob-collector'])walk(d);
// Jakob 15.11.: Versionsnummer. Steigt automatisch um 1, sobald sich der Inhalt der App ändert (ohne die Versionsdateien selbst), und bleibt gleich, wenn nichts geändert wurde.
// Sichtbar in den Spiel-Einstellungen (version.mjs) und auf der Begleitseite (version.json).
const VFILES=['./blob-collector/version.json','./blob-collector/version.mjs'];
{const contentHash=crypto.createHash('sha256');for(const f of [...files].sort()){if(VFILES.includes(f))continue;contentHash.update(f);contentHash.update(fs.readFileSync(path.join(root,f)));}
 const contentId=contentHash.digest('hex');let info={number:29,date:'',hash:''};try{info=JSON.parse(read('blob-collector/version.json'));}catch{}
 if(info.hash!==contentId)info={number:(Number(info.number)||29)+1,date:new Date().toISOString().slice(0,10),hash:contentId};
 fs.writeFileSync(path.join(root,'blob-collector/version.json'),JSON.stringify(info,null,1)+'\n');
 fs.writeFileSync(path.join(root,'blob-collector/version.mjs'),'// Wird von build-garden.mjs erzeugt – nicht von Hand ändern.\nexport const VERSION='+JSON.stringify({number:info.number,date:info.date})+';\n');
 for(const f of VFILES)if(!files.includes(f))files.push(f);}
files.sort();const hash=crypto.createHash('sha256');for(const f of files){hash.update(f);hash.update(fs.readFileSync(path.join(root,f)));}
const version=hash.digest('hex').slice(0,12);
let sw=read('sw.js').replace(/var CACHE = '[^']+';/,"var CACHE = 'mt-begleiter-mondgarten-"+version+"';").replace(/var FILES = [^\n]+;/,'var FILES = '+JSON.stringify(files)+';');
fs.writeFileSync(path.join(root,'sw.js'),sw);console.log('Garten gebaut; '+files.length+' lokale Dateien, Cache '+version);
