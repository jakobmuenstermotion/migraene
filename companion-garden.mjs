import {GARDEN as C} from './garden-config.mjs';
import {emptyJournal,acceptEntries,acceptGiftCounter,emptyPlants,receiveRewards,usePlantReward} from './garden-ledger.mjs';
const events=window.CompanionGardenEvents,plants=window.GardenPrototype.plants,renderer=window.GardenPrototype.PlantRenderer.create({plants});
const read=(key,fallback)=>{const raw=localStorage.getItem(key);if(!raw)return fallback();const s=JSON.parse(raw);if(!s||s.version!==1)throw Error('UNKNOWN_GARDEN_VERSION');if(key===C.journalKey&&(!Array.isArray(s.actions)||!Array.isArray(s.handled)||!s.gifts||!Number.isFinite(s.installedAt)||!Number.isFinite(s.lastRewardAt)))throw Error('INVALID_JOURNAL');if(key===C.plantKey&&(!Array.isArray(s.tokens)||!Array.isArray(s.receipts)||!s.beds))throw Error('INVALID_PLANTS');return s;};
let journal,ledger,issue='',mode=null,selection=null,notice='',busy=false,toolbar,footer,status,playDialog,frame,signature='',seedSerial=0;
try{journal=read(C.journalKey,()=>emptyJournal(events.startedAt));ledger=read(C.plantKey,emptyPlants);localStorage.setItem(C.journalKey,JSON.stringify(journal));}catch{issue='Der gespeicherte Garten konnte nicht geladen werden. Er bleibt erhalten.';}
function write(key,s){try{localStorage.setItem(key,JSON.stringify(s));issue='';return true;}catch{issue='Der Garten konnte nicht gespeichert werden. Bitte schaffe Speicherplatz.';return false;}}
function gameState(){try{return JSON.parse(localStorage.getItem(C.gameKey)||'null');}catch{return null;}}
function collectRewards(){if(issue)return;try{const j=gameState()?.journey;const next=receiveRewards(read(C.plantKey,emptyPlants),[...(j?.rewards??[]),...(j?.seedCatchups??[])]);if(write(C.plantKey,next))ledger=next;}catch{issue='Der Gartenstand konnte nicht gelesen werden.';}}
function receive(kind,data){if(issue)return;try{const current=read(C.journalKey,()=>emptyJournal(events.startedAt)),next=kind==='entries'?acceptEntries(current,data,Date.now(),C.cooldownMs):acceptGiftCounter(current,data);if(write(C.journalKey,next))journal=next;}catch{issue='Die Gartenaktion konnte nicht gespeichert werden.';}mount();}
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(text,fn){const b=node('button','garden-control',text);b.type='button';b.onclick=fn;return b;}
function eligible(id){const p=ledger?.beds[id],type=plants.find(x=>x.id===p?.id);return mode==='seed'?!p:mode==='water'?!!type&&p.stage<type.stages.length:false;}
function mount(){
 const app=document.getElementById('app'),first=app?.querySelector('.big[data-act]');if(!first)return;collectRewards();
 if(!toolbar?.isConnected){toolbar=node('section','garden-inline');toolbar.setAttribute('aria-label','Samen und Gießkanne');const entryButtons=[...app.querySelectorAll('.big[data-act]')];const last=entryButtons.at(-1);(last.closest('.grid')||last).after(toolbar);signature='';}
 if(!footer?.isConnected){footer=node('section','garden-footer');footer.setAttribute('aria-label','Gartentage');const row=node('div','garden-controls');row.append(button('Gartentag starten',()=>openGame(true)),button('☾ Nachtbesuch',()=>openGame(false)));status=node('p','garden-status');status.setAttribute('role','status');footer.append(row,status);app.append(footer);}
 if(!journal||!ledger){status.textContent=issue;return;}
 if(mode&&!ledger.tokens.some(t=>t.kind===mode)){mode=null;selection=null;}
 const next=JSON.stringify([mode,selection,notice,ledger.tokens,ledger.beds]);if(next!==signature){signature=next;renderToolbar();}
 const game=gameState(),active=!!game?.journey?.round&&!game.journey.closed,pending=Math.max(0,journal.actions.length-(game?.journey?.round??0));
 const [start,night]=footer.querySelectorAll('button');start.textContent=active?'☀ Gartentag fortsetzen':'☀ Nächsten Gartentag starten'+(pending>1?' · '+pending:'');start.disabled=!!issue||!active&&!pending;night.disabled=!!issue||!game?.journey?.round||!game.journey.closed;
 const wait=Math.max(0,journal.lastRewardAt+C.cooldownMs-Date.now());status.textContent=issue||((pending?pending+' Gartentag'+(pending===1?'':'e')+' bereit. ':'')+(wait?'Neue Eintragsbelohnung in '+Math.ceil(wait/60000)+' Min. Eintragen geht weiterhin.':'Ein auf diesem Gerät gespeicherter Eintrag schenkt sofort einen Gartentag.'));
 for(const [id]of C.buttons){const b=app.querySelector('.big[data-act="'+id+'"]');if(!b)continue;let place=b.querySelector('.garden-plants');if(!place){place=node('span','garden-plants');place.setAttribute('aria-hidden','true');b.append(place);}mountPlant(place,ledger.beds[id]);b.classList.toggle('with-garden-plant',!!ledger.beds[id]);b.classList.toggle('garden-eligible',!!mode&&eligible(id));b.classList.toggle('garden-target-muted',!!mode&&!eligible(id));}
}
function renderToolbar(){
 toolbar.replaceChildren();toolbar.hidden=!ledger.tokens.length&&!notice;if(toolbar.hidden)return;
 const seeds=ledger.tokens.filter(t=>t.kind==='seed').length,water=ledger.tokens.filter(t=>t.kind==='water').length;
 const hint=node('p','garden-inline-hint',mode==='water'?'Gießkanne bereit. Tippe auf eine Pflanze – dabei wird nur gegossen.':mode==='seed'?'Tippe auf einen freien Eintragsknopf, um den Samen einzupflanzen.':notice||(seeds?'Welcher Samen darf wachsen? Wähle eine Sorte.':'Deine Gießkanne wartet.'));hint.setAttribute('role','status');
 const actions=node('div','garden-controls');if(water){const b=button('♧ Gießkanne · '+water,()=>{mode='water';selection=null;notice='';mount();});b.setAttribute('aria-pressed',String(mode==='water'));actions.append(b);}if(mode)actions.append(button('Später · normal eintragen',()=>{mode=null;selection=null;notice='';mount();}));toolbar.append(actions);
 if(seeds){const list=node('div','garden-seed-strip');list.setAttribute('aria-label','Samen auswählen');for(const p of plants){const b=button(p.name,()=>{mode='seed';selection=p.id;notice='';mount();});b.dataset.seed=p.id;b.setAttribute('aria-pressed',String(selection===p.id&&mode==='seed'));b.prepend(renderer.preview(p.id));list.append(b);}toolbar.append(list);}
 toolbar.append(hint);
}
// Only explicitly selected garden actions intercept a click, before the medical handler.
document.addEventListener('click',e=>{
 const b=e.target.closest?.('.big[data-act]');if((!mode&&!busy)||!b||!C.buttons.some(([id])=>id===b.dataset.act))return;
 e.preventDefault();e.stopImmediatePropagation();if(busy)return;
 const id=b.dataset.act;if(!eligible(id)){notice=mode==='seed'?'Hier wächst schon eine Pflanze. Wähle einen freien Knopf.':'Wähle eine noch nicht ausgewachsene Pflanze.';toolbar.querySelector('.garden-inline-hint').textContent=notice;return;}
 if(mode==='seed'&&!selection)return;
 const requested=mode;let next;try{next=usePlantReward(read(C.plantKey,emptyPlants),{kind:mode,bed:id,plant:selection},plants,C.buttons);}catch{issue='Die Pflanzenaktion konnte nicht geladen werden.';mount();return;}
 if(!next||!write(C.plantKey,next)){mount();return;}
 const used=requested;ledger=next;mode=null;selection=null;notice=used==='water'?'Deine Pflanze wächst. Du kannst wieder normal eintragen.':'Der Samen steckt jetzt in der Erde. Du kannst wieder normal eintragen.';busy=true;
 if(used==='water'){for(let i=0;i<4;i++){const d=node('span','garden-drop');d.style.animationDelay=i*.1+'s';d.style.right=9+i*3+'%';b.append(d);setTimeout(()=>d.remove(),1200);}setTimeout(()=>{mount();b.querySelector('.plant-art')?.classList.add('garden-grown');busy=false;},450);}else{mount();b.querySelector('.garden-plants')?.classList.add('garden-planted');busy=false;}
},true);
function mountPlant(place,p){
 if(p?.stage===0){if(place.querySelector('[data-seed]'))return;const id='soil-cut-'+(++seedSerial);place.innerHTML='<svg data-seed="true" viewBox="0 0 100 70" aria-hidden="true"><defs><clipPath id="'+id+'"><rect width="100" height="57"/></clipPath></defs><ellipse cx="68" cy="58" rx="25" ry="5" fill="#6f513c" opacity=".22"/><ellipse cx="68" cy="55" rx="7" ry="12" transform="rotate(20 68 55)" fill="#a57d50" clip-path="url(#'+id+')"/><path d="M47 58 Q66 54 88 58" fill="none" stroke="#76573f" stroke-width="3" stroke-linecap="round"/></svg>';return;}
 if(place.querySelector('[data-seed]'))place.replaceChildren();renderer.mount(place,p);
}
function closeGame(){const closing=frame;closing?.contentWindow?.postMessage({type:'mondgarten:save'},location.origin);if(playDialog?.open)playDialog.close();collectRewards();mount();setTimeout(()=>{if(frame===closing&&!playDialog?.open){closing?.remove();frame=null;}},250);}
function openGame(start){window.dispatchEvent(new Event('app:check-update'));
 if(!playDialog){playDialog=node('dialog','garden-play-dialog');const head=node('header','garden-play-header');head.append(button('← Zur Begleitseite',closeGame),node('span','','Mondgarten'));playDialog.append(head);document.body.append(playDialog);playDialog.addEventListener('cancel',e=>{e.preventDefault();closeGame();});}
 frame?.remove();frame=node('iframe','garden-game-frame');frame.title='Euer Mondgarten';frame.dataset.mondgarten='1';frame.src=C.gameURL;frame.onload=()=>{if(start)frame?.contentWindow?.postMessage({type:'mondgarten:start'},location.origin);};playDialog.append(frame);playDialog.showModal();
}
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==frame?.contentWindow||e.data?.type!=='mondgarten:day-ended')return;
 const game=gameState();if(!game?.journey?.closed||game.journey.round!==e.data.round)return;
 collectRewards();mode=ledger?.tokens.some(t=>t.kind===e.data.kind)&&e.data.kind==='water'?'water':null;selection=null;notice=e.data.kind==='water'?'Tippe auf die Pflanze, die du gießen möchtest.':e.data.kind==='seed'?'Dein neuer Samen ist da. Wähle eine Sorte und einen freien Knopf.':'Ein schöner Gartentag geht zu Ende.';closeGame();toolbar?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
});
events.mount=()=>{try{mount();}catch{issue='Die Gartenansicht konnte nicht geladen werden. Eintragen bleibt möglich.';}};
window.addEventListener('storage',e=>{if([C.gameKey,C.plantKey,C.journalKey].includes(e.key)){try{journal=read(C.journalKey,()=>emptyJournal(events.startedAt));ledger=read(C.plantKey,emptyPlants);}catch{}events.mount();}});
events.attach(receive);if(events.snapshot)events.entries(events.snapshot());events.mount();setInterval(()=>{if(!document.hidden)events.mount();},15000);
