import {restoreFactory} from './factory.mjs';
import {SKILL_TREES} from './vacuum-skills.mjs';
import {sunnySnapshot,restoreSunny} from './sunny-save.mjs';
const KEY='blob-collector-saugersystem-v29',BANK_PREVIOUS_KEY='blob-collector-saugersystem-v28',CLARITY_PREVIOUS_KEY='blob-collector-saugersystem-v27',WIND_PREVIOUS_KEY='blob-collector-saugersystem-v26',LAYER_PREVIOUS_KEY='blob-collector-saugersystem-v25',MATERIAL_PREVIOUS_KEY='blob-collector-saugersystem-v24',BEACH_PREVIOUS_KEY='blob-collector-saugersystem-v23',SAND_MASK_PREVIOUS_KEY='blob-collector-saugersystem-v22',SURFACE_PREVIOUS_KEY='blob-collector-saugersystem-v21',COAST_POLISH_PREVIOUS_KEY='blob-collector-saugersystem-v20',GROUP_PREVIOUS_KEY='blob-collector-saugersystem-v19',ESSENCE_PREVIOUS_KEY='blob-collector-saugersystem-v18',FLOWER_PREVIOUS_KEY='blob-collector-saugersystem-v17',MEADOW_PREVIOUS_KEY='blob-collector-saugersystem-v16',VISUAL_PREVIOUS_KEY='blob-collector-saugersystem-v15',FEEDBACK_PREVIOUS_KEY='blob-collector-saugersystem-v14',GOAL_PREVIOUS_KEY='blob-collector-saugersystem-v13',DAY_PREVIOUS_KEY='blob-collector-saugersystem-v12',MODE_PREVIOUS_KEY='blob-collector-saugersystem-v11',LIVING_PREVIOUS_KEY='blob-collector-saugersystem-v10',ROUND_PREVIOUS_KEY='blob-collector-saugersystem-v9',OVERHAUL_PREVIOUS_KEY='blob-collector-saugersystem-v8',TRAIL_PREVIOUS_KEY='blob-collector-saugersystem-v7',FACTORY_PREVIOUS_KEY='blob-collector-saugersystem-v6',PREVIOUS_KEY='blob-collector-saugersystem-v5',COAST_KEY='blob-collector-saugersystem-v4',OLDER_KEY='blob-collector-saugersystem-v3',LEGACY_KEY='blob-collector-saugersystem-v2';
export function saveProgress(s,storage,now=Date.now()){if(s.saveBlocked)return false;/* Jakob 15.11.: Solange ein vorhandener Spielstand nicht geladen werden konnte, wird nichts überschrieben. */try{const epoch=storage.getItem('blob-collector-reset-epoch')??'';s.saveEpoch??=epoch;if(s.saveEpoch!==epoch)return false;storage.setItem(KEY,JSON.stringify({version:30,suctionEnabled:s.suctionEnabled,...sunnySnapshot(s,now),progression:s.progression,filters:s.filters,transportMode:s.transportMode,battery:s.battery.charge}));return true;}catch{return false;}}
function loadProgressInner(s,storage,now=Date.now()){try{s.saveEpoch=storage.getItem('blob-collector-reset-epoch')??'';const data=JSON.parse(storage.getItem(KEY)??storage.getItem(BANK_PREVIOUS_KEY)??storage.getItem(CLARITY_PREVIOUS_KEY)??storage.getItem(WIND_PREVIOUS_KEY)??storage.getItem(LAYER_PREVIOUS_KEY)??storage.getItem(MATERIAL_PREVIOUS_KEY)??storage.getItem(BEACH_PREVIOUS_KEY)??storage.getItem(SAND_MASK_PREVIOUS_KEY)??storage.getItem(SURFACE_PREVIOUS_KEY)??storage.getItem(COAST_POLISH_PREVIOUS_KEY)??storage.getItem(GROUP_PREVIOUS_KEY)??storage.getItem(ESSENCE_PREVIOUS_KEY)??storage.getItem(FLOWER_PREVIOUS_KEY)??storage.getItem(MEADOW_PREVIOUS_KEY)??storage.getItem(VISUAL_PREVIOUS_KEY)??storage.getItem(FEEDBACK_PREVIOUS_KEY)??storage.getItem(GOAL_PREVIOUS_KEY)??storage.getItem(DAY_PREVIOUS_KEY)??storage.getItem(MODE_PREVIOUS_KEY)??storage.getItem(LIVING_PREVIOUS_KEY)??storage.getItem(ROUND_PREVIOUS_KEY)??storage.getItem(OVERHAUL_PREVIOUS_KEY)??storage.getItem(TRAIL_PREVIOUS_KEY)??storage.getItem(FACTORY_PREVIOUS_KEY)??storage.getItem(PREVIOUS_KEY)??storage.getItem(COAST_KEY)??storage.getItem(OLDER_KEY)??storage.getItem(LEGACY_KEY));if(![2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30].includes(data?.version))return false;for(const [id,tree]of Object.entries(SKILL_TREES)){const p=data.progression?.[id];if(!p)continue;const moved={focus:{beam3:'tank1'},power:{push1:'tank1',push2:'tank2',push3:'size2'}}[id]??{},owned=new Set((Array.isArray(p.unlocked)?p.unlocked:[]).map(k=>moved[k]??k)),valid=new Set();if(data.version===2){const grantParents=key=>{const node=tree.nodes.find(n=>n.id===key);if(!node)return;for(const parent of node.requires)if(!owned.has(parent)){owned.add(parent);grantParents(parent);}};for(const key of [...owned])grantParents(key);}let changed=true;while(changed){changed=false;for(const n of tree.nodes)if(owned.has(n.id)&&!valid.has(n.id)&&n.requires.every(r=>valid.has(r))){valid.add(n.id);changed=true;}}Object.assign(s.progression[id],{unlocked:[...valid],bonus:Math.max(s.progression[id].bonus,Number(p.bonus)||0),earned:Math.max(0,Number(p.earned)||0),xp:Math.max(0,Number(p.xp)||0)});}if(data.filters)for(const k of Object.keys(s.filters))s.filters[k]=data.filters[k]!==false;s.transportMode=data.transportMode==='sale'?'sale':'storage';s.suctionEnabled=data.suctionEnabled!==false;s.battery.charge=Math.max(0,Math.min(1000,Number(data.battery)||0));s.skillRevision++;if(data.version>=4)restoreSunny(s,data,now,SKILL_TREES);else restoreFactory(s,null,true);return true;}catch{return false;}}

export function resetSavedGame(s,storage,now=Date.now()){
 if(!saveProgress(s,storage,now))return false;
 s.saveEpoch=now+'-'+Math.random().toString(36).slice(2);storage.setItem('blob-collector-reset-epoch',s.saveEpoch);
 for(const key of [BANK_PREVIOUS_KEY,CLARITY_PREVIOUS_KEY,WIND_PREVIOUS_KEY,LAYER_PREVIOUS_KEY,MATERIAL_PREVIOUS_KEY,BEACH_PREVIOUS_KEY,SAND_MASK_PREVIOUS_KEY,SURFACE_PREVIOUS_KEY,COAST_POLISH_PREVIOUS_KEY,GROUP_PREVIOUS_KEY,ESSENCE_PREVIOUS_KEY,FLOWER_PREVIOUS_KEY,MEADOW_PREVIOUS_KEY,VISUAL_PREVIOUS_KEY,FEEDBACK_PREVIOUS_KEY,GOAL_PREVIOUS_KEY,DAY_PREVIOUS_KEY,MODE_PREVIOUS_KEY,LIVING_PREVIOUS_KEY,ROUND_PREVIOUS_KEY,OVERHAUL_PREVIOUS_KEY,TRAIL_PREVIOUS_KEY,FACTORY_PREVIOUS_KEY,PREVIOUS_KEY,COAST_KEY,OLDER_KEY,LEGACY_KEY])storage.removeItem(key);
 return true;
}

// Jakob 1.11.: Spielstand als Datei sichern und wieder laden. Das neue Epoch verhindert, dass der laufende Stand die Sicherung beim Neuladen überschreibt.
export function exportSaveText(s,storage,now=Date.now()){saveProgress(s,storage,now);const raw=storage.getItem(KEY);if(!raw)return null;return JSON.stringify({game:'blob-collector',exportedAt:now,save:JSON.parse(raw)});}
export function importSaveText(storage,text,now=Date.now()){try{const file=JSON.parse(text),save=file?.save;if(file?.game!=='blob-collector'||!Number.isInteger(save?.version)||save.version<2||save.version>30||typeof save.inventory!=='object'||!save.inventory)return false;storage.setItem(KEY,JSON.stringify(save));storage.setItem('blob-collector-reset-epoch',now+'-'+Math.random().toString(36).slice(2));return true;}catch{return false;}}
const ALL_SAVE_KEYS=[KEY,BANK_PREVIOUS_KEY,CLARITY_PREVIOUS_KEY,WIND_PREVIOUS_KEY,LAYER_PREVIOUS_KEY,MATERIAL_PREVIOUS_KEY,BEACH_PREVIOUS_KEY,SAND_MASK_PREVIOUS_KEY,SURFACE_PREVIOUS_KEY,COAST_POLISH_PREVIOUS_KEY,GROUP_PREVIOUS_KEY,ESSENCE_PREVIOUS_KEY,FLOWER_PREVIOUS_KEY,MEADOW_PREVIOUS_KEY,VISUAL_PREVIOUS_KEY,FEEDBACK_PREVIOUS_KEY,GOAL_PREVIOUS_KEY,DAY_PREVIOUS_KEY,MODE_PREVIOUS_KEY,LIVING_PREVIOUS_KEY,ROUND_PREVIOUS_KEY,OVERHAUL_PREVIOUS_KEY,TRAIL_PREVIOUS_KEY,FACTORY_PREVIOUS_KEY,PREVIOUS_KEY,COAST_KEY,OLDER_KEY,LEGACY_KEY],BACKUP_KEYS=['blob-collector-backup-1','blob-collector-backup-2','blob-collector-backup-3'],RESCUE_KEY='blob-collector-rescue';

// Jakob 15.11.: Schutz vor Spielstand-Verlust.
// 1) loadProgress: Wenn ein Spielstand vorhanden ist, aber nicht geladen werden kann (Fehler/unbekannte Version), wird er als „Rettungskopie“ abgelegt
//    und das Speichern blockiert (s.saveBlocked), damit ein neues Spiel ihn nicht überschreibt.
// 2) backupProgress: drei rotierende automatische Sicherungen (z. B. beim Schlafengehen).
// 3) Ist gar kein Spielstand da, aber eine Sicherung, bietet das Spiel an, sie zurückzuholen (s.saveBlocked, s.backupOffer).
const readKey=(storage,k)=>{try{return storage.getItem(k);}catch{return null;}};
export function loadProgress(s,storage,now=Date.now()){
 let ok=false,problem=null;
 try{ok=loadProgressInner(s,storage,now);}catch(e){problem=String(e?.message??e);}
 if(ok)return true;
 const present=ALL_SAVE_KEYS.map(k=>[k,readKey(storage,k)]).find(([,v])=>v!==null&&v!=='');
 if(present){
  s.saveBlocked=true;s.loadFailure={key:present[0],reason:problem??'Spielstand nicht lesbar oder unbekannte Version',size:present[1].length};
  try{storage.setItem(RESCUE_KEY,JSON.stringify({at:now,key:present[0],reason:s.loadFailure.reason,raw:present[1]}));}catch{}
 }else if(listBackups(storage).length){
  s.saveBlocked=true;s.backupOffer=true;
 }
 return false;
}
export function backupProgress(storage,reason='schlafen',now=Date.now()){
 try{
  const raw=storage.getItem(KEY);if(!raw)return false;
  const entry=JSON.stringify({at:now,reason,raw}),old=BACKUP_KEYS.map(k=>readKey(storage,k));
  const put=(k,v)=>{try{if(v===null||v===undefined)storage.removeItem(k);else storage.setItem(k,v);return true;}catch{return false;}};
  put(BACKUP_KEYS[2],old[1]);put(BACKUP_KEYS[1],old[0]);
  if(put(BACKUP_KEYS[0],entry))return true;
  put(BACKUP_KEYS[2],null);put(BACKUP_KEYS[1],null);/* Speicher knapp: ältere Sicherungen opfern */return put(BACKUP_KEYS[0],entry);
 }catch{return false;}
}
export function listBackups(storage){
 const out=[];for(const k of BACKUP_KEYS){const v=readKey(storage,k);if(!v)continue;try{const e=JSON.parse(v);if(typeof e?.raw==='string')out.push({key:k,at:e.at,reason:e.reason,size:e.raw.length});}catch{}}
 return out.sort((a,b)=>b.at-a.at);
}
export function restoreBackup(storage,key,now=Date.now()){
 try{
  if(!BACKUP_KEYS.includes(key))return false;const e=JSON.parse(storage.getItem(key));if(typeof e?.raw!=='string')return false;JSON.parse(e.raw);
  const current=storage.getItem(KEY);if(current){try{storage.setItem(RESCUE_KEY,JSON.stringify({at:now,key:KEY,reason:'vor Wiederherstellung',raw:current}));}catch{}}
  storage.setItem(KEY,e.raw);storage.setItem('blob-collector-reset-epoch',now+'-'+Math.random().toString(36).slice(2));return true;
 }catch{return false;}
}
export function rescueText(storage){
 try{const r=JSON.parse(storage.getItem(RESCUE_KEY));if(typeof r?.raw!=='string')return null;let save;try{save=JSON.parse(r.raw);}catch{return r.raw;}return JSON.stringify({game:'blob-collector',exportedAt:r.at,rescued:true,save});}catch{return null;}
}
// Jakob 15.11.: Für den Cloud-Sync: aktuellen Spielstand lesen (Rohtext + Zeitstempel) und einen fremden Stand einspielen (vorher wird gesichert).
export function readSave(storage){
 const raw=readKey(storage,KEY);if(!raw)return null;
 try{const d=JSON.parse(raw);return {raw,savedAt:Number(d.savedAt)||0,version:d.version};}catch{return null;}
}
export function applyRawSave(storage,raw,now=Date.now()){
 try{
  const d=JSON.parse(raw);
  if(!Number.isInteger(d?.version)||d.version<2||d.version>30||typeof d.inventory!=='object'||!d.inventory)return false;
  backupProgress(storage,'vor Cloud-Laden',now);
  storage.setItem(KEY,raw);storage.setItem('blob-collector-reset-epoch',now+'-'+Math.random().toString(36).slice(2));/* neue Epoche: der laufende Stand kann den eingespielten nicht mehr überschreiben */
  return true;
 }catch{return false;}
}
