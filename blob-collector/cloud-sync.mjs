// Jakob 15.11.: Cloud-Sync des Spielstands zwischen mehreren Geräten (iPhone & iPad) über Supabase.
//
// Prinzip: Jedes Gerät merkt sich den Cloud-Stand, auf dem es aufbaut (lastSyncedAt). Hochladen klappt nur, wenn die Cloud noch genau
// diesen Stand hat (Schutz auf dem Server, siehe supabase-setup.sql). Hat inzwischen ein anderes Gerät weitergespielt, fragt das Spiel nach,
// statt etwas zu überschreiben. Vor jedem Einspielen eines Cloud-Stands wird der aktuelle Stand automatisch gesichert.
import {CLOUD} from './cloud-config.mjs';
import {readSave,applyRawSave} from './progress-save.mjs';

const CFG_KEY='blob-collector-sync',ALPHABET='ABCDEFGHJKMNPQRSTVWXYZ23456789';
const fmt=t=>{try{return new Date(t).toLocaleString('de-DE',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return '';}};

/** Neuer zufälliger Sync-Code, 20 Zeichen (ca. 98 Bit), in Fünfergruppen. */
export function newCode(random=globalThis.crypto){
 const a=new Uint8Array(20);random.getRandomValues(a);let s='';for(const b of a)s+=ALPHABET[b%ALPHABET.length];
 return s.match(/.{5}/g).join('-');
}
/** Eingabe säubern: Großbuchstaben, ohne Striche/Leerzeichen. Gibt null zurück, wenn die Form nicht stimmt. */
export function cleanCode(input){const c=String(input??'').toUpperCase().replace(/[^A-Z0-9]/g,'');return c.length===20&&[...c].every(ch=>ALPHABET.includes(ch))?c:null;}
const pretty=c=>c.match(/.{1,5}/g).join('-');
const deviceName=()=>{try{const ua=navigator.userAgent||'',touch=navigator.maxTouchPoints>1;if(/iPad/.test(ua)||(/Macintosh/.test(ua)&&touch))return 'iPad';if(/iPhone/.test(ua))return 'iPhone';if(/Android/.test(ua))return 'Android';return 'Computer';}catch{return 'Gerät';}};

export function bindCloudSync({getState,storage,safety,config=CLOUD,fetchFn=(...a)=>fetch(...a)}){
 const backendReady=()=>Boolean(config?.url&&config?.key);
 const loadCfg=()=>{try{const c=JSON.parse(storage.getItem(CFG_KEY)||'null');return c&&typeof c.code==='string'?c:null;}catch{return null;}};
 const storeCfg=()=>{try{if(cfg)storage.setItem(CFG_KEY,JSON.stringify(cfg));else storage.removeItem(CFG_KEY);}catch{}};
 let cfg=loadCfg(),busy=false,lastTry=0,conflictShown=false;

 async function rpc(fn,body){
  const ctl=typeof AbortController==='function'?new AbortController():null,timer=ctl?setTimeout(()=>ctl.abort(),15000):null;
  try{
   const headers={'Content-Type':'application/json',apikey:config.key};
   if(String(config.key).startsWith('eyJ'))headers.Authorization='Bearer '+config.key;/* alter „anon“-Schlüssel ist ein JWT; neue „publishable“-Schlüssel brauchen nur apikey */
   const r=await fetchFn(config.url.replace(/\/$/,'')+'/rest/v1/rpc/'+fn,{method:'POST',headers,body:JSON.stringify(body),signal:ctl?.signal});
   if(!r.ok)throw new Error('HTTP '+r.status);
   return await r.json();
  }finally{if(timer)clearTimeout(timer);}
 }
 const info=()=>rpc('save_get',{p_code:cfg.code,p_with_payload:false});
 const fetchRemote=()=>rpc('save_get',{p_code:cfg.code,p_with_payload:true});

 async function upload({force=false}={}){
  const local=readSave(storage);if(!local)return {ok:false,reason:'Es gibt noch keinen lokalen Spielstand.'};
  const res=await rpc('save_put',{p_code:cfg.code,p_payload:local.raw,p_saved_at:local.savedAt,p_device:cfg.device,p_base:cfg.lastSyncedAt??null,p_force:force});
  if(res?.ok){cfg.lastSyncedAt=local.savedAt;cfg.lastUpload=Date.now();storeCfg();return {ok:true};}
  return {ok:false,conflict:true,remoteSavedAt:res?.remote_saved_at};
 }
 async function applyRemote(remote){
  if(!remote?.payload||!applyRawSave(storage,remote.payload))return false;
  cfg.lastSyncedAt=remote.saved_at;cfg.lastCheck=Date.now();storeCfg();
  setTimeout(()=>location.reload(),50);return true;
 }

 const ok=(title,lines,extra=[])=>safety.card(title,lines,[...extra,['OK','',safety.close]]);
 const failure=e=>ok('Cloud-Sync nicht möglich',['Es ging nicht: '+String(e?.message??e)+'. Prüfe die Internetverbindung und versuche es später noch einmal. Der Spielstand auf diesem Gerät ist unverändert.']);

 /** Cloud und lokaler Stand weichen ab → fragen. */
 function askRemoteNewer(remote,localChanged){
  const where=remote.device?`Gerät „${remote.device}“, `:'';
  const text=localChanged?
   [`In der Cloud liegt ein anderer Stand (${where}${fmt(remote.saved_at)}). Du hast hier aber auch weitergespielt. Einer der beiden Stände geht verloren – welchen willst du behalten?`]:
   [`In der Cloud liegt ein neuerer Stand (${where}${fmt(remote.saved_at)}). Hier wurde seitdem nicht weitergespielt.`];
  safety.card(localChanged?'Zwei verschiedene Spielstände':'Neuerer Spielstand in der Cloud',[...text,'Hinweis: Der Stand auf diesem Gerät wird vor dem Laden automatisch gesichert.'],[
   ['Cloud-Stand laden','primary',async()=>{try{const r=await fetchRemote();if(!r||!await applyRemote(r))throw new Error('Laden fehlgeschlagen');}catch(e){failure(e);}}],
   ...(localChanged?[['Meinen Stand hochladen (Cloud wird überschrieben)','danger',async()=>{if(!confirm('Wirklich? Der Stand in der Cloud wird durch den von diesem Gerät ersetzt.'))return;try{const u=await upload({force:true});if(!u.ok)throw new Error(u.reason??'Hochladen fehlgeschlagen');safety.close();}catch(e){failure(e);}}]]:[]),
   ['Später entscheiden','',safety.close]]);
 }

 /** Beim Start: Cloud mit dem lokalen Stand vergleichen. `captured` = Stand direkt nach dem Laden, bevor das Spiel wieder speichert. */
 async function check(captured){
  if(!cfg||!backendReady())return;
  let remote;try{remote=await info();}catch{return;}/* offline: still ignorieren */
  const localAt=captured?.savedAt??0,last=cfg.lastSyncedAt??null;
  if(!remote){if(captured)try{await upload({force:true});}catch{}return;}/* Cloud-Kopie fehlt (z. B. gelöscht) → neu hochladen */
  if(last!==null&&remote.saved_at===last){if(localAt>last)try{const u=await upload();if(!u.ok&&u.conflict)askRemoteNewer({...remote,saved_at:u.remoteSavedAt??remote.saved_at},true);}catch{}return;}
  const localChanged=last===null?localAt>0:localAt>last;
  if(!safety.isOpen())askRemoteNewer(remote,localChanged);
 }

 /** Hochladen, wenn sich lokal etwas geändert hat (Schlafen, Verlassen der App, alle 5 Minuten). */
 async function uploadIfChanged(reason){
  if(!cfg||!backendReady()||busy||getState().saveBlocked)return;
  const local=readSave(storage);if(!local||local.savedAt<=(cfg.lastSyncedAt??0))return;
  if(Date.now()-lastTry<30000&&reason!=='schlafen')return;
  busy=true;lastTry=Date.now();
  try{
   const u=await upload();
   if(!u.ok&&u.conflict&&!conflictShown&&!safety.isOpen()&&document.visibilityState==='visible'){conflictShown=true;askRemoteNewer({saved_at:u.remoteSavedAt,device:''},true);}
  }catch{}finally{busy=false;}
 }

 /** Einstellungs-Dialog. */
 function openSettings(){
  if(!backendReady()){ok('Cloud-Sync noch nicht eingerichtet',['Der Online-Speicher wurde noch nicht freigeschaltet (Schlüssel fehlt). Sobald der Entwickler das erledigt hat, geht es hier weiter.']);return;}
  if(!cfg){
   safety.card('Cloud-Sync: iPhone & iPad',['Der Spielstand wird online abgelegt, damit du auf mehreren Geräten denselben Stand hast. Dafür braucht jedes Gerät denselben geheimen Code.'],[
    ['Neuen Sync-Code erstellen (erstes Gerät)','primary',createNew],
    ['Mit vorhandenem Code verbinden (weiteres Gerät)','',connectExisting],
    ['Schließen','',safety.close]]);
   return;
  }
  const last=cfg.lastUpload?`letztes Hochladen: ${fmt(cfg.lastUpload)}`:'noch nicht hochgeladen';
  safety.card('Cloud-Sync ist an',[`Dieses Gerät: ${cfg.device}. ${last}.`,'Der Stand wird beim Schlafengehen, beim Verlassen der App und alle paar Minuten hochgeladen. Beim Start prüft das Spiel, ob ein neuerer Stand in der Cloud liegt.'],[
   ['Jetzt hochladen','primary',async()=>{try{const u=await upload();if(u.ok)ok('Hochgeladen',['Der Spielstand liegt jetzt in der Cloud.']);else if(u.conflict)askRemoteNewer({saved_at:u.remoteSavedAt,device:''},true);else ok('Nicht hochgeladen',[u.reason??'']);}catch(e){failure(e);}}],
   ['Jetzt aus der Cloud laden','',async()=>{try{const r=await fetchRemote();if(!r)return ok('Nichts gefunden',['Unter diesem Code liegt noch kein Stand.']);safety.card('Cloud-Stand laden?',[`Stand von ${fmt(r.saved_at)}${r.device?' ('+r.device+')':''}. Der Stand auf diesem Gerät wird vorher automatisch gesichert.`],[['Laden','primary',async()=>{if(!await applyRemote(r))failure(new Error('Laden fehlgeschlagen'));}],['Abbrechen','',safety.close]]);}catch(e){failure(e);}}],
   ['Sync-Code anzeigen','',()=>showCode(false)],
   ['Sync ausschalten','danger',()=>{cfg=null;storeCfg();ok('Sync ist aus',['Der Spielstand bleibt auf diesem Gerät. In der Cloud liegt die letzte Kopie weiter (unter deinem Code).']);}],
   ['Schließen','',safety.close]]);
 }
 function showCode(fresh){
  const c=pretty(cfg.code);
  safety.card(fresh?'Dein Sync-Code':'Sync-Code',[c,fresh?'Notiere dir diesen Code (z. B. in den Notizen). Auf dem anderen Gerät: Einstellungen → Cloud-Sync → „Mit vorhandenem Code verbinden“. Wer den Code kennt, kann den Spielstand lesen und überschreiben – gib ihn nicht weiter.':'Hinweis: Wer den Code kennt, kann den Spielstand lesen und überschreiben.'],[['OK','primary',safety.close]],{mono:c});
 }
 async function createNew(){
  try{
   cfg={code:cleanCode(newCode()),lastSyncedAt:null,device:deviceName()};
   const u=await upload();
   if(!u.ok){cfg=null;throw new Error(u.reason??'Hochladen fehlgeschlagen');}
   showCode(true);
  }catch(e){cfg=null;storeCfg();failure(e);}
 }
 function connectExisting(){
  safety.card('Mit Code verbinden',['Gib den Sync-Code vom ersten Gerät ein.'],[
   ['Verbinden','primary',async value=>{
    const code=cleanCode(value);if(!code)return ok('Code stimmt nicht',['Der Code hat 20 Zeichen aus Buchstaben und Zahlen, z. B. K7M2P-9XQ4T-HB6WZ-3N8RD.']);
    try{
     cfg={code,lastSyncedAt:null,device:deviceName()};const r=await fetchRemote();
     if(!r){cfg=null;return ok('Code nicht gefunden',['Unter diesem Code liegt kein Spielstand. Prüfe die Eingabe, oder erstelle auf dem ersten Gerät zuerst den Code.']);}
     storeCfg();
     const mine=readSave(storage),hasProgress=(mine?.savedAt??0)>0;
     safety.card('Cloud-Stand laden?',[`In der Cloud liegt ein Stand von ${fmt(r.saved_at)}${r.device?' ('+r.device+')':''}.`,hasProgress?'Der Stand auf diesem Gerät wird dadurch ersetzt. Er wird vorher automatisch gesichert.':'Dieses Gerät hat noch keinen Spielstand.'],[
      ['Cloud-Stand laden','primary',async()=>{if(!await applyRemote(r))failure(new Error('Laden fehlgeschlagen'));}],
      ['Abbrechen (nicht verbinden)','',()=>{cfg=null;storeCfg();safety.close();}]]);
    }catch(e){cfg=null;storeCfg();failure(e);}
   }],
   ['Abbrechen','',safety.close]],{input:{placeholder:'XXXXX-XXXXX-XXXXX-XXXXX'}});
 }

 // Hinweis im Einstellungsfenster: das Spiel schickt dieses Ereignis, wenn dort „Cloud-Sync“ angetippt wird.
 try{document.addEventListener('blob:open-cloud-sync',openSettings);}catch{}
 try{document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')setTimeout(()=>uploadIfChanged('verlassen'),800);else conflictShown=false;});}catch{}
 if(typeof setInterval==='function')setInterval(()=>uploadIfChanged('regelmäßig'),5*60*1000);

 return {
  openSettings,
  /** Beim Start aufrufen: liest den Stand sofort (vor dem ersten Speichern) und vergleicht ihn mit der Cloud. */
  start(){const captured=readSave(storage);if(cfg&&!getState().saveBlocked)check(captured);},
  /** Nach dem Schlafen. */
  uploadAfterSleep(){uploadIfChanged('schlafen');},
  get connected(){return Boolean(cfg);},
 };
}
