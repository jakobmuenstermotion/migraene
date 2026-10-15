// Nach Änderungen an garden-config/ledger oder companion-garden.mjs ausführen:
// node build-garden.mjs
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const chunks=['garden-config.mjs','garden-ledger.mjs','companion-garden.mjs'].map(f=>read(f).replace(/^import[^\n]+\r?\n/gm,'').replace(/^export /gm,''));
chunks[2]='const C=GARDEN;\n'+chunks[2];
fs.writeFileSync(path.join(root,'companion-garden.js'),"(function(){'use strict';\n"+chunks.join('\n')+'\n})();\n');
const files=['./begleiter.html','./icon-180.png','./companion-garden.js','./companion-garden.css'];
function walk(d){for(const e of fs.readdirSync(path.join(root,d),{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else files.push('./'+p.replaceAll('\\','/'));}}
for(const d of ['garden-modules','garden-assets-webp','mondgarten'])walk(d);
files.sort();const hash=crypto.createHash('sha256');for(const f of files){hash.update(f);hash.update(fs.readFileSync(path.join(root,f)));}
const version=hash.digest('hex').slice(0,12);
let sw=read('sw.js').replace(/var CACHE = '[^']+';/,"var CACHE = 'mt-begleiter-mondgarten-"+version+"';").replace(/var FILES = [^\n]+;/,'var FILES = '+JSON.stringify(files)+';');
fs.writeFileSync(path.join(root,'sw.js'),sw);console.log('Garten gebaut; '+files.length+' lokale Dateien, Cache '+version);
