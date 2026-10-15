(function(){'use strict';
const GARDEN={journalKey:'mt-garden-actions-v1',plantKey:'mt-garden-plants-v1',gameKey:'mondgarten.companion.save.v1',cooldownMs:10*60*1000,gameURL:'mondgarten/index.html?embedded=1',buttons:[['pain','Kopfschmerz beginnt'],['meal','Gegessen'],['drink','Getrunken'],['move','Sport'],['med','Medikament'],['stomach','Bauch'],['nausea','Übelkeit']]};

const copy=x=>structuredClone(x),valid=id=>typeof id==='string'&&/^[A-Za-z0-9:_-]{1,120}$/.test(id);
function emptyJournal(now){return{version:1,installedAt:now,lastRewardAt:0,handled:[],actions:[],gifts:{}};}
function acceptEntries(previous,entries,now,cooldownMs){const s=copy(previous);for(const e of [...entries].sort((a,b)=>a.ts-b.ts)){if(!valid(e.id)||!Number.isFinite(e.ts)||s.handled.includes(e.id))continue;s.handled.push(e.id);if(e.deleted||e.ts<s.installedAt||e.ts>now+120000||now<s.lastRewardAt+cooldownMs||e.ts<s.lastRewardAt+cooldownMs)continue;s.actions.push('entry:'+e.id);s.lastRewardAt=now;}return s;}
function acceptGiftCounter(previous,gift){const s=copy(previous);if(!gift||!Number.isSafeInteger(gift.epoch)||gift.epoch<=0||!Number.isSafeInteger(gift.count)||gift.count<0||gift.count>10000)return s;const key=String(gift.epoch),before=s.gifts[key]??0;for(let n=before+1;n<=gift.count;n++)s.actions.push('gift:'+key+':'+n);s.gifts[key]=Math.max(before,gift.count);return s;}
function emptyPlants(){return{version:1,beds:{},tokens:[],receipts:[]};}
function receiveRewards(previous,rewards){const s=copy(previous);for(const r of rewards??[]){if(!r||!/^garden-day:\d+$/.test(r.id)||!['seed','water'].includes(r.kind)||s.receipts.includes(r.id))continue;s.receipts.push(r.id);s.tokens.push({id:r.id,kind:r.kind});}return s;}
function usePlantReward(previous,{kind,bed,plant},catalog,buttons){if(!buttons.some(b=>b[0]===bed))return null;const s=copy(previous),i=s.tokens.findIndex(t=>t.kind===kind);if(i<0)return null;if(kind==='seed'){if(s.beds[bed]||!catalog.some(p=>p.id===plant))return null;s.beds[bed]={id:plant,stage:0};}else{const existing=s.beds[bed],p=catalog.find(p=>p.id===existing?.id);if(!p||existing.stage>=p.stages.length)return null;existing.stage++;}s.tokens.splice(i,1);return s;}

const C=GARDEN;
const events=window.CompanionGardenEvents,plants=window.GardenPrototype.plants,renderer=window.GardenPrototype.PlantRenderer.create({plants});
const read=(key,fallback)=>{
 const raw=localStorage.getItem(key);if(!raw)return fallback();const state=JSON.parse(raw);
 if(!state||state.version!==1)throw Error('UNKNOWN_GARDEN_VERSION');
 if(key===C.journalKey&&(!Array.isArray(state.actions)||!Array.isArray(state.handled)||!state.gifts||!Number.isFinite(state.installedAt)||!Number.isFinite(state.lastRewardAt)))throw Error('INVALID_GARDEN_JOURNAL');
 if(key===C.plantKey&&(!Array.isArray(state.tokens)||!Array.isArray(state.receipts)||!state.beds))throw Error('INVALID_GARDEN_PLANTS');
 return state;
};
let journal,ledger,issue='',mode='seed',selection=plants[0].id;
try{journal=read(C.journalKey,()=>emptyJournal(events.startedAt));ledger=read(C.plantKey,emptyPlants);localStorage.setItem(C.journalKey,JSON.stringify(journal));}catch{issue='Der gespeicherte Garten konnte nicht geladen werden. Er bleibt erhalten.';}
function write(key,state){try{localStorage.setItem(key,JSON.stringify(state));issue='';return true;}catch{issue='Der Garten konnte nicht gespeichert werden. Bitte schaffe Speicherplatz.';return false;}}
function collectRewards(){if(issue)return;try{const raw=JSON.parse(localStorage.getItem(C.gameKey)||'null'),next=receiveRewards(read(C.plantKey,emptyPlants),raw?.journey?.rewards);if(write(C.plantKey,next))ledger=next;}catch{issue='Der Gartenstand konnte nicht gelesen werden.';}}
function receive(kind,data){if(issue)return;try{const current=read(C.journalKey,()=>emptyJournal(events.startedAt)),next=kind==='ack'?acceptEntries(current,data,Date.now(),C.cooldownMs):acceptGiftCounter(current,data);if(write(C.journalKey,next))journal=next;}catch{issue='Die Gartenaktion konnte nicht gespeichert werden.';}mount();}

function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function button(text,fn){const b=node('button','garden-control',text);b.type='button';b.onclick=fn;return b;}
let bar,playDialog,frame,claimDialog,status;
function mount(){const app=document.getElementById('app');if(!app?.querySelector('.big[data-act]'))return;if(!bar||!bar.isConnected){bar=node('section','companion-garden-bar');const row=node('div','garden-controls');row.append(button('☽ Mondgarten',openGame),button('Pflanzenaktionen',openClaims));status=node('p','garden-status');status.setAttribute('role','status');bar.append(row,status);app.querySelector('.top')?.after(bar);}collectRewards();if(!journal||!ledger){status.textContent=issue;return;}
 const seeds=ledger.tokens.filter(t=>t.kind==='seed').length,water=ledger.tokens.filter(t=>t.kind==='water').length;bar.querySelectorAll('button')[1].textContent=seeds+water?'Pflanzenaktionen · '+(seeds+water):'Meine Pflanzen';
 let game=null;try{game=JSON.parse(localStorage.getItem(C.gameKey)||'null');}catch{}const pending=Math.max(0,journal.actions.length-(game?.journey?.round??0));bar.querySelector('button').disabled=!pending&&!game?.journey?.round;
 const wait=Math.max(0,journal.lastRewardAt+C.cooldownMs-Date.now());status.textContent=issue||((pending?pending+' Gartentag'+(pending===1?'':'e')+' bereit. ':'')+(wait?'Neue Eintragsbelohnung in '+Math.ceil(wait/60000)+' Min. Eintragen geht weiterhin.':'Ein bestätigter Eintrag schenkt einen Gartentag.'));
 for(const [id]of C.buttons){const b=app.querySelector('.big[data-act="'+id+'"]');if(!b)continue;let place=b.querySelector('.garden-plants');if(!place){place=node('span','garden-plants');place.setAttribute('aria-hidden','true');b.append(place);}mountPlant(place,ledger.beds[id]);b.classList.toggle('with-garden-plant',!!ledger.beds[id]);}
}
function openGame(){if(!playDialog){playDialog=node('dialog','garden-play-dialog');const head=node('header','garden-play-header');head.append(button('← Zur Begleitseite',()=>{frame.contentWindow?.postMessage({type:'mondgarten:save'},location.origin);playDialog.close();collectRewards();mount();}),node('span','','Mondgarten'));frame=node('iframe','garden-game-frame');frame.title='Euer Mondgarten';frame.dataset.mondgarten='1';frame.src=C.gameURL;head.setAttribute('aria-label','Gartenansicht');playDialog.append(head,frame);document.body.append(playDialog);}playDialog.showModal();}
function openClaims(){collectRewards();if(!ledger)return;if(!claimDialog){claimDialog=node('dialog','garden-claim-dialog');document.body.append(claimDialog);}renderClaims();claimDialog.showModal();}
function renderClaims(){if(!ledger.tokens.some(t=>t.kind===mode))mode=ledger.tokens[0]?.kind??'seed';claimDialog.replaceChildren();const top=node('div','garden-claim-top');top.append(node('h2','','Deine Pflanzen'),button('Schließen',()=>claimDialog.close()));claimDialog.append(top);const choice=node('div','garden-controls');for(const [kind,label]of [['seed','Samen pflanzen'],['water','Pflanze gießen']]){const count=ledger.tokens.filter(t=>t.kind===kind).length,b=button(label+' · '+count,()=>{mode=kind;renderClaims();});b.disabled=!count;b.setAttribute('aria-pressed',String(mode===kind));choice.append(b);}claimDialog.append(choice);
 if(!ledger.tokens.some(t=>t.kind===mode))mode=ledger.tokens[0]?.kind??'seed';claimDialog.append(node('p','garden-claim-hint',ledger.tokens.length?(mode==='seed'?'Wähle einen Samen und anschließend einen freien Schalter.':'Wähle die Pflanze, die weiterwachsen darf.'):'Im Mondgarten kannst du Samen und Gießaktionen erspielen. Deine Einträge funktionieren wie gewohnt.'));
 if(mode==='seed'&&ledger.tokens.some(t=>t.kind==='seed')){const catalog=node('div','garden-seed-list');for(const p of plants){const b=button(p.name,()=>{selection=p.id;renderClaims();});b.setAttribute('aria-pressed',String(selection===p.id));b.prepend(renderer.preview(p.id));catalog.append(b);}claimDialog.append(catalog);}
 const beds=node('div','garden-bed-list');for(const [id,label]of C.buttons){const existing=ledger.beds[id],p=plants.find(p=>p.id===existing?.id),b=button(label,()=>{const next=usePlantReward(read(C.plantKey,emptyPlants),{kind:mode,bed:id,plant:selection},plants,C.buttons);if(next&&write(C.plantKey,next)){ledger=next;renderClaims();mount();}});b.disabled=!ledger.tokens.some(t=>t.kind===mode)||(mode==='seed'?!!existing:!p||existing.stage>=p.stages.length);if(existing){const art=node('span','garden-bed-art');mountPlant(art,existing);b.prepend(art);}beds.append(b);}claimDialog.append(beds);}
events.mount=mount;window.addEventListener('storage',e=>{if([C.gameKey,C.plantKey,C.journalKey].includes(e.key)){try{journal=read(C.journalKey,()=>emptyJournal(events.startedAt));ledger=read(C.plantKey,emptyPlants);}catch{}mount();}});
events.attach(receive);if(events.snapshot)events.ack(events.snapshot());mount();setInterval(()=>{if(!document.hidden)mount();},15000);

function mountPlant(place,p){if(p?.stage===0){place.innerHTML='<svg viewBox="0 0 100 70" aria-hidden="true"><ellipse cx="67" cy="63" rx="25" ry="4" fill="#98785c" opacity=".25"/><ellipse cx="67" cy="56" rx="8" ry="11" fill="#a7845d" transform="rotate(25 67 56)"/></svg>';}else renderer.mount(place,p);}

})();
