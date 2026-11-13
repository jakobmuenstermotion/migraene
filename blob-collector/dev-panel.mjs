import {PRODUCT_NAMES} from './material-press.mjs';
import {giveMaterial,setRoute,allFurniture,unlockVacuum,lockVacuum,unlockUpgrade} from './test-progress.mjs';
import {VACUUMS} from './vacuums.mjs';
import {SKILL_TREES} from './vacuum-skills.mjs';
import {factoryState} from './factory.mjs';
import {fillBatteryBank} from './battery-bank.mjs';
import {addOwnedBlob} from './forest-blobs.mjs';
import {BLOB_SPECIES} from './forest-blob-config.mjs';
import {FURNITURE,BLUEPRINTS,CRAFT_RECIPES} from './crafting-config.mjs';
import {craftState} from './crafting.mjs';
import {COLLECTION_AREAS} from './blob-workers.mjs';
import {sunnyHeight} from './sunny-area.mjs';
import {roundCoins} from './game-balance.mjs';
// Entwicklerseite (Jakob 4.11.): kleines Werkzeug-Symbol in den Einstellungen, PIN 7450, dann Münzen, Lager, Sperren, Blobs,
// Akku, Figur setzen und Möbel. Ersetzt das große Testlabor im Alltag (das Testlabor bleibt im Code, ist aber versteckt).
export const DEV_PIN='7450';
const PLACES=[['Zuhause (vor der Haustür)',-10,-6],['Lichtung',0,6],['Marktstand',-3,6],['Blobstation',12,-14],['Waldsee',22,16],['Pinnwand',-14.2,-6.8],['Steinbach',-4,-54],['Mooswald',46,36],['Pilzhain',-55,1],['Sonnenküste',60,0],['Eistal · Frostwald',33,-52],['Vulkan · Aschehang',-64,37],['Vulkan · Kraterrand',-36,74],['Vulkan · Lavafluss',-44,80.2],['Eistal · Eissee Ufer',43.5,-62.5]];
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const names=()=>Object.entries(PRODUCT_NAMES).filter(([k])=>k&&!k.startsWith('rare')||k.startsWith('rare')&&PRODUCT_NAMES[k]).sort((a,b)=>String(a[1]).localeCompare(String(b[1]),'de'));
export function bindDevPanel({getState,onSave}){
 const root=document.getElementById('game'),panel=document.createElement('section');panel.id='dev-panel';panel.className='lab-panel';panel.hidden=true;root.append(panel);
 let msg='',tab='coins',resetAsk=false,vac='ground';
 const s=()=>getState(),say=t=>{msg=t;render();};
 const TABS=[['coins','Münzen'],['vac','Sauger'],['store','Lager'],['routes','Sperren'],['blobs','Blobs'],['battery','Akku'],['place','Ort'],['furn','Möbel'],['set','Einstellungen']];
 function body(){const st=s();
  if(tab==='coins')return `<p>Münzen: <b>${roundCoins(st.inventory.coins)}</b></p><label>Betrag<input id="dev-n" type="number" min="1" value="1000"></label><div class="dev-row"><button data-do="coins+">+ hinzufügen</button><button data-do="coins-">− entfernen</button><button data-do="coins0">auf 0</button></div>`;
  if(tab==='store'){const inv=Object.entries(st.inventory.storage??{}).filter(([,n])=>n>0);return `<label>Material<select id="dev-k">${names().map(([k,v])=>`<option value="${k}">${esc(v)}</option>`).join('')}</select></label><label>Menge<input id="dev-n" type="number" min="1" value="100"></label><div class="dev-row"><button data-do="store+">ins Lager</button><button data-do="store-">aus dem Lager</button></div><h4>Im Lager</h4><div class="dev-list">${inv.map(([k,n])=>`<button data-pick="${k}">${esc(PRODUCT_NAMES[k]??k)} · ${n}</button>`).join('')||'<small>leer</small>'}</div>`;}
  if(tab==='routes'){const list=st.obstacles.filter(o=>o.route);return `<div class="dev-row"><button data-do="open-all">Alle öffnen</button><button data-do="close-all">Alle schließen</button></div><div class="dev-list">${list.map(o=>`<button data-route="${o.id}" class="${o.cleared?'on':''}">${o.cleared?'✓ offen':'✕ zu'} · ${esc(o.id)}</button>`).join('')}</div>`;}
  if(tab==='blobs')return `<label>Art<select id="dev-sp">${Object.entries(BLOB_SPECIES).map(([k,a])=>`<option value="${k}">${esc(a.name)}</option>`).join('')}</select></label><label>Größe<select id="dev-st"><option value="1">Klein</option><option value="2">Mittel</option><option value="3">Groß</option><option value="4">Riesig</option></select></label><label>Anzahl<input id="dev-n" type="number" min="1" max="10" value="1"></label><div class="dev-row"><button data-do="blob">in die Station setzen</button></div><small>Jetzt ${st.forestBlobs?.roster?.length??0} Blobs in der Station.</small>`;
  // Jakob 7.11.: Sauger und ihre Upgrades einzeln oder alle auf einmal freischalten.
  if(tab==='vac'){const owned=factoryState(st).owned,un=st.progression?.[vac]?.unlocked??[];return `<div class="dev-row"><button data-do="vac-all">Alle Sauger + alle Upgrades</button><button data-do="vac-allsauger">Alle Sauger</button></div><div class="dev-list">${VACUUMS.map(v=>`<button data-vac="${v.id}" class="${owned.includes(v.id)?'on':''}" aria-pressed="${vac===v.id}">${owned.includes(v.id)?'✓':'✕'} ${esc(v.name)}</button>`).join('')}</div><h4>${esc(VACUUMS.find(v=>v.id===vac)?.name??vac)}</h4><div class="dev-row"><button data-do="vac-own">${owned.includes(vac)?'Sauger wegnehmen':'Sauger geben'}</button><button data-do="vac-up">Alle Upgrades</button><button data-do="vac-none">Keine Upgrades</button></div><div class="dev-list">${(SKILL_TREES[vac]?.nodes??[]).map(n=>`<button data-node="${n.id}" class="${un.includes(n.id)?'on':''}">${un.includes(n.id)?'✓':'✕'} ${esc(n.name)}</button>`).join('')}</div><small>Ein Upgrade freischalten schaltet auch alles davor frei.</small>`;}
  if(tab==='battery')return `<p>Akku: <b>${Math.round(st.battery.charge/st.battery.max*100)} %</b></p><div class="dev-row"><button data-do="charge">Alle Akkus aufladen</button><button data-do="empty">Akku leeren</button></div>`;
  if(tab==='set')return `<h4>Spielstand</h4><div class="dev-row">${resetAsk?'<button data-do="reset-yes" class="on">Ja, wirklich alles löschen</button><button data-do="reset-no">Abbrechen</button>':'<button data-do="reset">Spielstand zurücksetzen</button>'}</div><small>Startet ein neues Spiel mit Einführung. Nicht rückgängig zu machen.</small><label>Wilde-Blob-Häufigkeit: <b id="dev-wild-v">${(st.preferences?.wildMult??1).toFixed(1)}×</b><input id="dev-wild" type="range" min="0.2" max="10" step="0.2" value="${st.preferences?.wildMult??1}"></label><small>1× ist der Standard: alle 20 s je besuchtem Gebiet 5 % Chance (plus Möbelbonus), höchstens 2 wilde Blobs pro Gebiet; nicht gefangene Blobs verschwinden nach 10 Minuten. Hohe Werte sind zum Testen gedacht.</small>`;
  if(tab==='place')return `<div class="dev-list">${PLACES.map(([n],i)=>`<button data-place="${i}">${esc(n)}</button>`).join('')}${Object.entries(COLLECTION_AREAS).map(([k,a])=>`<button data-area="${k}">${esc(a.name)} (Mitte)</button>`).join('')}</div>`;
  const ids=Object.keys(FURNITURE).filter(id=>!FURNITURE[id].station||id==='sewingmachine'||id==='stove');return `<label>Möbel<select id="dev-k">${ids.map(id=>`<option value="${id}">${esc(FURNITURE[id].name)}</option>`).join('')}</select></label><label>Menge<input id="dev-n" type="number" min="1" value="1"></label><div class="dev-row"><button data-do="furn+">in den Vorrat</button><button data-do="furn-">aus dem Vorrat</button></div><div class="dev-row"><button data-do="plans">Alle Baupläne freischalten</button><button data-do="allfurn">Von jedem eins</button></div>`;}
 function render(){const keep=panel.querySelector('#dev-n')?.value;panel.innerHTML=`<div class="lab-heading"><h2>Entwickler</h2><button id="dev-close" aria-label="Schließen">×</button></div><nav class="dev-tabs">${TABS.map(([id,l])=>`<button data-tab="${id}" aria-pressed="${tab===id}">${l}</button>`).join('')}</nav><div class="dev-body">${body()}</div><small class="dev-msg" role="status">${esc(msg)}</small>`;if(keep&&panel.querySelector('#dev-n'))panel.querySelector('#dev-n').value=keep;}
 const num=()=>Math.max(1,Math.floor(Number(panel.querySelector('#dev-n')?.value)||1)),val=id=>panel.querySelector('#'+id)?.value;
 function act(a){const st=s(),n=panel.querySelector('#dev-n')?num():1;
  if(a==='reset'){resetAsk=true;return 'Sicher? Das löscht den ganzen Spielstand.';}
  if(a==='reset-no'){resetAsk=false;return 'Abgebrochen';}
  if(a==='reset-yes'){resetAsk=false;document.dispatchEvent(new Event('dev-reset'));return 'Spielstand wird zurückgesetzt …';}
  if(a==='coins+'){st.inventory.coins=roundCoins(st.inventory.coins+n);return `+${n} Münzen`;}
  if(a==='coins-'){st.inventory.coins=Math.max(0,roundCoins(st.inventory.coins-n));return `−${n} Münzen`;}
  if(a==='coins0'){st.inventory.coins=0;return 'Münzen auf 0';}
  if(a==='store+'){giveMaterial(st,val('dev-k'),n,'storage');return `${n} ${PRODUCT_NAMES[val('dev-k')]} ins Lager`;}
  if(a==='store-'){const k=val('dev-k'),have=st.inventory.storage[k]??0,take=Math.min(n,have);st.inventory.storage[k]=have-take;st.stored=Math.max(0,(st.stored??0)-take);return `${take} ${PRODUCT_NAMES[k]} entfernt`;}
  if(a==='open-all'||a==='close-all'){for(const o of st.obstacles.filter(o=>o.route))setRoute(st,o.id,a==='open-all');return a==='open-all'?'Alle Sperren offen':'Alle Sperren zu';}
  if(a==='blob'){let k=0;for(let i=0;i<Math.min(10,n);i++)if(addOwnedBlob(st,val('dev-sp'),Number(val('dev-st'))))k++;return `${k} Blob(s) in der Station`;}
  if(a.startsWith('vac-')){const grant=id=>{unlockVacuum(st,id);(st.builtSites??={}).introVacuum=true;},all=id=>{grant(id);for(const n of SKILL_TREES[id]?.nodes??[])unlockUpgrade(st,id,n.id);};
   if(a==='vac-all'){for(const v of VACUUMS)all(v.id);return 'Alle Sauger mit allen Upgrades';}if(a==='vac-allsauger'){for(const v of VACUUMS)grant(v.id);return 'Alle Sauger frei';}
   if(a==='vac-own'){if(factoryState(st).owned.includes(vac)){lockVacuum(st,vac);return vac==='ground'?'Den Bodensauger behält man':'Sauger weggenommen';}grant(vac);return 'Sauger gegeben';}
   if(a==='vac-up'){all(vac);return 'Alle Upgrades frei';}if(a==='vac-none'){if(st.progression?.[vac])st.progression[vac].unlocked=[];st.skillRevision=(st.skillRevision??0)+1;return 'Upgrades zurückgesetzt';}}
  if(a==='charge'){st.battery.charge=st.battery.max;fillBatteryBank(st);return 'Akkus voll';}
  if(a==='empty'){st.battery.charge=0;return 'Akku leer';}
  if(a==='furn+'||a==='furn-'){const c=craftState(st),id=val('dev-k');if(a==='furn+'){c.blueprints[id]=true;c.loose[id]=(c.loose[id]??0)+n;return `${n}× ${FURNITURE[id].name} im Vorrat`;}c.loose[id]=Math.max(0,(c.loose[id]??0)-n);return `${FURNITURE[id].name} entfernt`;}
  if(a==='plans'){const c=craftState(st);for(const p of BLUEPRINTS)c.blueprints[p.id]=true;for(const id of Object.keys(FURNITURE))c.blueprints[id]=true;return 'Alle Baupläne frei';}
  if(a==='allfurn'){allFurniture(st,1);return 'Von jedem Möbel eins im Vorrat';}
  return '';}
 function put(x,z){const st=s();st.home.interior=false;if(st.nursery)st.nursery.interior=false;st.area='sunny';Object.assign(st.player,{x,z,y:sunnyHeight(x,z)});if(st.flight)st.flight.safe={...st.player,y:st.player.y};}
 panel.addEventListener('input',e=>{if(e.target.id==='dev-wild'){const p=s().preferences??={};p.wildMult=Number(e.target.value);panel.querySelector('#dev-wild-v').textContent=p.wildMult.toFixed(1)+'×';onSave?.();}});
 panel.addEventListener('click',e=>{const t=e.target.closest('button');if(!t)return;
  if(t.id==='dev-close'){panel.hidden=true;return;}
  if(t.dataset.tab){tab=t.dataset.tab;msg='';render();return;}
  if(t.dataset.do){say(act(t.dataset.do));st_save();return;}
  if(t.dataset.vac){vac=t.dataset.vac;msg='';render();return;}
  if(t.dataset.node){const st=s(),p=st.progression?.[vac];if(p?.unlocked.includes(t.dataset.node)){p.unlocked=p.unlocked.filter(x=>x!==t.dataset.node);st.skillRevision=(st.skillRevision??0)+1;say('Upgrade entfernt');}else{if(!factoryState(st).owned.includes(vac)){unlockVacuum(st,vac);(st.builtSites??={}).introVacuum=true;}unlockUpgrade(st,vac,t.dataset.node);say('Upgrade frei');}st_save();return;}
  if(t.dataset.pick){const sel=panel.querySelector('#dev-k');if(sel)sel.value=t.dataset.pick;return;}
  if(t.dataset.route){const o=s().obstacles.find(o=>o.id===t.dataset.route);if(o){setRoute(s(),o.id,!o.cleared);say(`${o.id}: ${o.cleared?'offen':'zu'}`);st_save();}return;}
  if(t.dataset.place!==undefined){const [n,x,z]=PLACES[Number(t.dataset.place)];put(x,z);say('Figur bei: '+n);panel.hidden=true;return;}
  if(t.dataset.area){const a=COLLECTION_AREAS[t.dataset.area];put(a.x,a.z);say('Figur bei: '+a.name);panel.hidden=true;}});
 const st_save=()=>onSave?.();
 document.addEventListener('open-dev',()=>{msg='';render();panel.hidden=false;});
 return {close:()=>{panel.hidden=true;},isOpen:()=>!panel.hidden};
}
