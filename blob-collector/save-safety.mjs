// Jakob 15.11.: Schutz vor Spielstand-Verlust (Oberfläche).
// - bittet iOS/Browser einmal um dauerhaften Speicher (navigator.storage.persist)
// - legt beim Schlafengehen (neuer Spieltag) automatisch eine von drei rotierenden Sicherungen an
// - erinnert alle paar Tage daran, den Spielstand als Datei zu sichern (iCloud Drive, Nachricht …)
// - findet das Spiel einen Spielstand, den es nicht laden kann, oder gar keinen, aber eine Sicherung, fragt es nach,
//   statt stillschweigend ein neues Spiel zu beginnen und den alten Stand zu überschreiben.
import {backupProgress,listBackups,restoreBackup,rescueText,exportSaveText} from './progress-save.mjs';
import {shareOrDownload} from './preferences.mjs';

const EXPORT_KEY='blob-collector-last-export',SNOOZE_KEY='blob-collector-export-snooze',REMIND_DAYS=3;
const DAY=864e5;
const fmt=t=>{try{return new Date(t).toLocaleString('de-DE',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'});}catch{return '';}};
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0;};

export function bindSaveSafety({getState,storage,root=document.getElementById('game')??document.body}){
 let lastDay=null,layer=null;
 const style=document.createElement('style');style.textContent=`
#save-safety{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;padding:18px;background:#2f3a2a99;font-family:inherit}
#save-safety[hidden]{display:none}
#save-safety .ss-card{max-width:360px;width:100%;box-sizing:border-box;padding:18px 16px;border-radius:22px;border:3px solid #b9a47c;background:linear-gradient(150deg,#fff7dc,#eadfbd);color:#4b3f2a;box-shadow:0 10px 30px #0006}
#save-safety h2{margin:0 0 8px;font-size:18px;line-height:1.25}
#save-safety p{margin:0 0 10px;font-size:14px;line-height:1.4}
#save-safety button{display:block;width:100%;min-height:46px;margin:7px 0 0;padding:8px 12px;border-radius:14px;border:2px solid #b9a47c;background:#fff8e6;color:#4b3f2a;font:inherit;font-weight:700;font-size:15px;cursor:pointer}
#save-safety button.primary{background:#8fb06a;border-color:#6f8f4d;color:#fff}
#save-safety button.danger{background:#fff0e6;border-color:#c98a6a}
#save-safety .ss-note{font-size:12px;opacity:.8}
#save-banner{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:1900;width:min(360px,calc(100% - 24px));box-sizing:border-box;padding:10px 12px;border-radius:18px;border:2px solid #b9a47c;background:#fff7dc;color:#4b3f2a;box-shadow:0 6px 20px #0004;font-size:14px;line-height:1.35}
#save-banner[hidden]{display:none}
#save-banner div{display:flex;gap:8px;margin-top:8px}
#save-banner button{flex:1;min-height:42px;border-radius:12px;border:2px solid #b9a47c;background:#fff8e6;color:#4b3f2a;font:inherit;font-weight:700;cursor:pointer}
#save-banner button.primary{background:#8fb06a;border-color:#6f8f4d;color:#fff}`;
 document.head.append(style);

 const modal=document.createElement('section');modal.id='save-safety';modal.hidden=true;modal.setAttribute('role','alertdialog');modal.setAttribute('aria-modal','true');root.append(modal);
 const banner=document.createElement('aside');banner.id='save-banner';banner.hidden=true;banner.setAttribute('role','status');root.append(banner);

 const card=(title,paragraphs,buttons)=>{
  modal.replaceChildren();const c=document.createElement('div');c.className='ss-card';const h=document.createElement('h2');h.textContent=title;c.append(h);
  for(const t of paragraphs){const p=document.createElement('p');p.textContent=t;if(t.startsWith('Hinweis'))p.className='ss-note';c.append(p);}
  for(const [label,kind,fn] of buttons){const b=document.createElement('button');b.type='button';b.textContent=label;if(kind)b.className=kind;b.addEventListener('click',fn);c.append(b);}
  modal.append(c);modal.hidden=false;
 };
 const close=()=>{modal.hidden=true;modal.replaceChildren();};

 const backupButtons=()=>listBackups(storage).map(b=>[`Sicherung vom ${fmt(b.at)} laden`,'',()=>{if(restoreBackup(storage,b.key))location.reload();else card('Wiederherstellen fehlgeschlagen',['Diese Sicherung ließ sich nicht laden. Probiere eine andere oder sichere die Rettungskopie als Datei.'],[['Schließen','',close]]);}]);

 const saveRescueFile=async()=>{const text=rescueText(storage);if(!text){card('Keine Rettungskopie',['Es liegt keine Kopie des alten Spielstands vor.'],[['Schließen','',close]]);return;}await shareOrDownload(text);};

 function showProblem(){
  const s=getState(),backups=backupButtons();
  if(s.backupOffer){
   card('Kein Spielstand gefunden',['Auf diesem Gerät fehlt der Spielstand, aber es gibt automatische Sicherungen. Wähle eine, um weiterzuspielen. Nichts wird überschrieben, bevor du dich entscheidest.'],
    [...backups,['Neu anfangen (Sicherungen bleiben erhalten)','danger',()=>{s.saveBlocked=false;s.backupOffer=false;close();}]]);
  }else{
   card('Dein Spielstand konnte nicht geladen werden',['Er ist NICHT gelöscht. Das Spiel hat eine Rettungskopie angelegt und speichert vorerst nichts, damit nichts überschrieben wird.',
     'Sichere die Kopie als Datei und schick sie dem Entwickler – dann lässt sich der Spielstand meist reparieren.'],
    [['Rettungskopie als Datei sichern','primary',saveRescueFile],...backups,['Weiterspielen, ohne zu speichern','',close],['Neu anfangen (alten Stand verwerfen)','danger',()=>{if(confirm('Wirklich neu anfangen? Die Rettungskopie bleibt trotzdem erhalten.')){s.saveBlocked=false;close();}}]]);
  }
 }

 const lastExport=()=>num(storage.getItem(EXPORT_KEY)),snoozeUntil=()=>num(storage.getItem(SNOOZE_KEY));
 function offerExport(){
  if(Date.now()-lastExport()<REMIND_DAYS*DAY||Date.now()<snoozeUntil())return;
  banner.replaceChildren();const t=document.createElement('div');t.style.display='block';t.style.margin='0';t.textContent='Gute Nacht! Soll der Spielstand als Datei gesichert werden? (z. B. in iCloud Drive)';
  const row=document.createElement('div');
  const yes=document.createElement('button');yes.type='button';yes.className='primary';yes.textContent='Sichern';
  const no=document.createElement('button');no.type='button';no.textContent='Später';
  yes.addEventListener('click',async()=>{const text=exportSaveText(getState(),storage);if(text&&await shareOrDownload(text)!==false){try{storage.setItem(EXPORT_KEY,String(Date.now()));}catch{}}banner.hidden=true;});
  no.addEventListener('click',()=>{try{storage.setItem(SNOOZE_KEY,String(Date.now()+DAY));}catch{}banner.hidden=true;});
  row.append(yes,no);banner.append(t,row);banner.hidden=false;
 }

 return {
  /** Beim Start aufrufen, nachdem der Spielstand geladen wurde (oder nicht). */
  start(loaded){
   try{navigator.storage?.persist?.().catch?.(()=>{});}catch{}/* dauerhaften Speicher anfragen; iOS entscheidet selbst */
   const s=getState();lastDay=s.round?.day??1;
   if(s.saveBlocked)showProblem();
   else if(loaded&&!listBackups(storage).length)backupProgress(storage,'start');
  },
  /** Nach jedem erfolgreichen Speichern aufrufen: neuer Spieltag = geschlafen → Sicherung + Erinnerung. */
  afterSave(){
   const s=getState(),day=s.round?.day??1;
   if(lastDay!==null&&day>lastDay){backupProgress(storage,'schlafen');offerExport();}
   lastDay=day;
  },
 };
}
