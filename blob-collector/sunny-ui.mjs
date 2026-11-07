import {collectionHTML} from './collection-ui.mjs';
import {MEALS,eatMeal,mealLeft} from './cooking.mjs';
import {lureWildBlob} from './forest-blobs.mjs';
import {removeMaterial} from './inventory.mjs';
import {FISH_WATERS,FISH_REWARDS,waterProgress} from './fishing.mjs';
import {machineHTML,bindMachineUI,updateMachineProgress} from './machine-ui.mjs';
import {depositPress,withdrawPress,selectPressRecipe,pressCapacity,pressOccupied,pressRecipeOpen} from './material-press.mjs';
import {wardrobeNearby} from './home-space.mjs';
import {normalCount,suctionCount,suctionAmount,normalCapacity} from './inventory.mjs';
import {CLOTHING} from './living-config.mjs';
import {clothingArtwork} from './gear-ui.mjs';
import {gearHTML,bindGear,upgradeHTML,bindUpgrade} from './gear-ui.mjs';
import {nearbyFishSpot,throwBait,baitCount,aimAhead} from './fishing.mjs';
import {salePrice} from './market.mjs';
import {formatCoins} from './game-balance.mjs';
import {itemArtwork} from './item-art.mjs';
import {FISH} from './fishing.mjs';
import {fishArtwork} from './fishing-view.mjs';
import {pressTreeHTML} from './press-tree.mjs';
import {facilityNearby,SUNNY,sunnyHeight,storageTarget} from './sunny-area.mjs';
import {PRESS,PRODUCT_NAMES,pressRecipe,startPress,pressProgress,setPressUpgrade,buyPressUpgrade,resetProduction,advancePress,recountStorage} from './material-press.mjs';
import {addMaterial,emptyBag,capacityFor} from './inventory.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
export function materialIcon(kind){return CLOTHING[kind]?clothingArtwork(kind):FISH[kind]?fishArtwork(kind):FURNITURE_KINDS[kind]?craftArtworkFor(kind):itemArtwork(kind);}
export function bindSunnyUI({getState,onOpen,onSave,isOtherOpen,onBuild,onReturnPress}){
 const $=id=>document.getElementById(id),panel=$('area-panel'),body=$('area-content'),backdrop=$('area-backdrop'),interact=$('world-interact'),debug=new URLSearchParams(location.search).get('debug')==='1';
 let cancelMachine=()=>{};let page=null,near=null,lastNear=null,suppressed=false,signature='',selected='paper',quantity=1,saveOK=true,selectedPressNode='speed1';
 function close(){cancelMachine();panel.classList.remove('press-skill-panel');panel.hidden=backdrop.hidden=true;page=null;signature='';suppressed=true;$('world').focus({preventScroll:true});}
 function save(){saveOK=onSave()!==false;return saveOK;}
 function open(id){onOpen();panel.classList.remove('world-floating');panel.classList.toggle('press-skill-panel',id==='upgrades');panel.style.removeProperty('left');panel.style.removeProperty('top');panel.setAttribute('aria-modal','true');panel.setAttribute('role','dialog');page=id;panel.hidden=backdrop.hidden=false;signature='';if(id==='equipment'&&!wardrobeNearby(getState())){close();return;}if(id==='home'){getState().home.visits++;save();}render();$('area-close').focus({preventScroll:true});}
 function stockCards(s){return ['leaf','wood','paper','essence'].map(kind=>`<div class="stock-card ${kind}"><i>${materialIcon(kind)}</i><span>${PRODUCT_NAMES[kind]}</span><strong data-stock="${kind}">${s.inventory.storage[kind]??0}</strong></div>`).join('');}
 function bagRowsData(s,origin){const bag=origin==='normal'?s.inventory.normalBag??{}:Object.fromEntries(Object.keys(s.inventory.bag).map(k=>[k,suctionAmount(s,k)]));return Object.entries(bag).filter(([,n])=>n>0);}
 function bagRows(s,origin=null){const bag=origin==='normal'?s.inventory.normalBag??{}:origin==='suction'?Object.fromEntries(Object.keys(s.inventory.bag).map(k=>[k,suctionAmount(s,k)])):s.inventory.bag;return Object.entries(bag).filter(([,n])=>n>0).map(([k,n])=>`<div class="bag-row"><i>${FISH[k]?fishArtwork(k):materialIcon(k)}</i><span>${FISH[k]?.name??PRODUCT_NAMES[k]??k}</span><strong>${n}</strong></div>`).join('')||'<p class="area-muted">Dein Rucksack ist leer.</p>';}
 let selectedGear=null;function render(){cancelMachine();
  const s=getState(),job=s.press.job;let html='';$('area-title').textContent={home:'Dein Zuhause',storage:'Materiallager',press:'Materialpresse',upgrades:'Presse verbessern',bag:'Tank und Rucksack',fishbook:'Fischbuch',collection:'Sammlung',equipment:'Kleiderschrank',backpack:'Rucksack verbessern'}[page];
  if(page==='home')html=`<div class="home-emblem">${materialIcon('home')}</div><p class="area-intro">Zuhause auf der Sonnenlichtung</p><button class="area-primary" id="home-save">Fortschritt speichern</button><p class="area-save" id="home-save-status">${saveOK?'Fortschritt gespeichert':'Speichern im Browser nicht verfügbar'}</p><div class="future-home">Platz für deine nächsten Ausbauten</div>`;
  if(page==='fishbook')html=`<div class="fishbook-tabs">${FISH_WATERS.map(([water,label])=>{const p=waterProgress(s.fishing,water),r=FISH_REWARDS[water];return `<section><h3>${label} <small>${p.done} / ${p.total}</small></h3><p class="fish-reward ${s.fishing?.rewards?.[water]?'got':''}">${s.fishing?.rewards?.[water]?'✓ Belohnung erhalten':`Alle gefangen: ${r.coins} ◉ und ${PRODUCT_NAMES[r.accessory]}`}</p><div class="fishbook-grid ${water}">${Object.entries(FISH).filter(([,f])=>f.water===water).map(([id,f])=>{const b=s.fishing?.book[id],n=(s.inventory.bag[id]??0)+(s.inventory.storage[id]??0),known=b?.caught>0;return `<article class="fish-card ${known?'discovered':''}"><i>${known?fishArtwork(id):'<b class="sticker-q">?</b>'}</i><strong>${known?f.name:'???'}</strong><span>${'◆'.repeat(f.difficulty)}${'◇'.repeat(Math.max(0,4-f.difficulty))}${f.nightOnly?' ☾':''}</span><small>${b?.caught??0} gefangen${b?.best?` · Rekord ${b.best} cm`:''}</small><small>${n} im Bestand · ${formatCoins(salePrice(id))} ◉</small></article>`;}).join('')}</div></section>`;}).join('')}</div>`;
  if(page==='bag'){const cap=capacityFor(effectiveVacuum(s)),tank=suctionCount(s),hand=normalCount(s),tiles=(origin,empty)=>{const list=bagRowsData(s,origin);return list.length?`<div class="bag-tiles">${list.map(([k,n])=>`<span data-item="${k}"><i>${FISH[k]?fishArtwork(k):materialIcon(k)}</i><small>${FISH[k]?.name??PRODUCT_NAMES[k]??k}</small><b>${n}</b></span>`).join('')}</div>`:`<p class="area-muted">${empty}</p>`;},card=(cls,title,hint,n,c,body)=>`<section class="bag-card ${cls}"><header><strong>${title}</strong><em>${n} / ${c}</em></header><div class="bag-meter"><i style="width:${Math.min(100,n/c*100)}%"></i></div>${body}</section>`;html=`${card('tank','Saugtank','Alles, was du einsaugst. Gibst du am Lager ab.',tank,cap,tiles('suction','Der Saugtank ist leer.'))}${card('hand','Rucksack','Alles, was du abholst: aus dem Lager, aus Werkstätten und Presse.',hand,normalCapacity(s),tiles('normal','Der Rucksack ist leer.'))}${(baitCount(s)>0)&&nearbyFishSpot(s)?`<button class="area-primary" id="bag-use-worm">${materialIcon('worm')} Köder werfen</button>`:''}${foodHTML(s)}<button class="area-secondary" id="open-collection">🦋 Sammlung ansehen</button>`;}
  if(page==='collection')html=collectionHTML(s);
  if(page==='equipment')html=wardrobeNearby(s)?gearHTML(s,selectedGear):'<p>Nur am Kleiderschrank.</p>';if(page==='backpack')html='<div class="gear-upgrade"><h3>Saugtank vergrößern</h3><strong>Stufe '+s.equipment.backpack+' / 5</strong></div>';
  if(page==='storage')html=`<div class="area-stock">${stockCards(s)}</div><h3>Dabei (Saugtank und Rucksack)</h3>${bagRows(s)}<button class="area-primary" id="store-deposit" ${s.carried?'':'disabled'}>Alles einlagern</button>`;
  if(page==='press')html=machineHTML({owner:s.press,recipes:Object.keys(PRESS.recipes).filter(id=>pressRecipeOpen(s,id)).map(id=>{const r=pressRecipe(s,id);return {...r,output:id,inputs:r.inputs??{[r.input]:r.cost}};}),kinds:Object.values(PRESS.recipes).flatMap(r=>r.kinds??(r.inputs?Object.keys(r.inputs):[r.input])),bag:s.inventory.bag,capacity:pressCapacity(s),occupied:pressOccupied(s),icon:materialIcon,name:k=>PRODUCT_NAMES[k]??k});
  if(page==='upgrades')html=`${pressTreeHTML(s,selectedPressNode,materialIcon,debug)}<button class="area-secondary" id="press-back">Zur Produktion</button>${debug?`<details id="press-debug"><summary>Debug · Sonnenlichtung</summary><div class="sunny-debug">${[['leaves100','Rucksack +100 Blätter'],['leaves1000','Rucksack +1.000 Blätter'],['wood20','Rucksack +20 Holz'],['wood200','Rucksack +200 Holz'],['bag-empty','Rucksack leeren'],['store-empty','Lager leeren'],['finish','Produktion abschließen'],['reset','Produktion zurücksetzen · Rohstoffe zurück']].map(([id,label])=>`<button data-debug="${id}">${label}</button>`).join('')}</div></details>`:''}`;
  const focus=document.activeElement?.id,scroll=panel.scrollTop,debugOpen=$('press-debug')?.open;body.innerHTML=html;if(debugOpen&&$('press-debug'))$('press-debug').open=true;panel.scrollTop=scroll;if(focus&&$(focus)){if($(focus).disabled)$('area-close').focus({preventScroll:true});else $(focus).focus({preventScroll:true});}
  if(page==='press')cancelMachine=bindMachineUI(body,{deposit:(k,n)=>depositPress(s,k,n),withdraw:(k,n)=>withdrawPress(s,k,n),select:id=>selectPressRecipe(s,id),changed:()=>{save();signature='';render();}});
  for(const [id,target]of [['open-equipment','equipment'],['open-backpack','backpack']])$(id)?.addEventListener('click',()=>{page=target;signature='';render();});if(page==='equipment')bindGear(body,s,id=>selectedGear=id,save,render);if(page==='backpack')bindUpgrade(body,s,save,render);
  for(const b of body.querySelectorAll('[data-eat]'))b.addEventListener('click',()=>{if(eatMeal(s,b.dataset.eat)){save();signature='';render();}});$('bag-lure')?.addEventListener('click',()=>{if((s.inventory.bag.blobbait??0)>0&&lureWildBlob(s)){removeMaterial(s,'blobbait',1);save();close();}});
  $('bag-use-worm')?.addEventListener('click',()=>{const spot=nearbyFishSpot(s);if(spot&&throwBait(s,spot.id,null,aimAhead(s))){save();close();}});$('open-collection')?.addEventListener('click',()=>{page='collection';signature='';render();});$('open-fishbook')?.addEventListener('click',()=>{page='fishbook';signature='';render();});$('open-build')?.addEventListener('click',()=>{close();onBuild?.();});
  $('home-save')?.addEventListener('click',()=>{save();$('home-save-status').textContent=saveOK?'Fortschritt gespeichert':'Speichern im Browser nicht verfügbar';});
  $('store-deposit')?.addEventListener('click',()=>{const target=storageTarget(s);s.player.angle=Math.atan2(target.x-s.player.x,target.z-s.player.z);close();});
  for(const b of body.querySelectorAll('[data-recipe]'))b.addEventListener('click',()=>{selected=b.dataset.recipe;quantity=1;signature='';render();});
  $('press-quantity')?.addEventListener('change',e=>{quantity=Number(e.target.value);signature='';render();});
  $('press-upgrades')?.addEventListener('click',()=>{page='upgrades';signature='';render();});$('press-back')?.addEventListener('click',()=>{if(onReturnPress){onReturnPress();return;}page='press';signature='';render();});
  for(const node of body.querySelectorAll('[data-press-node]'))node.addEventListener('click',()=>{selectedPressNode=node.dataset.pressNode;render();});
  $('press-buy-upgrade')?.addEventListener('click',e=>{if(buyPressUpgrade(s,e.currentTarget.dataset.kind,Number(e.currentTarget.dataset.rank))){save();signature='';render();}});
  if(debug){for(const select of body.querySelectorAll('[data-press-upgrade]'))select.addEventListener('change',()=>{setPressUpgrade(s,select.dataset.pressUpgrade,Number(select.value));save();signature='';render();});for(const b of body.querySelectorAll('[data-debug]'))b.addEventListener('click',()=>{const id=b.dataset.debug;if(id.startsWith('leaves'))addMaterial(s,'leaf',Number(id.slice(6)),'bag',capacityFor(effectiveVacuum(s)));if(id.startsWith('wood'))addMaterial(s,'wood',Number(id.slice(4)),'bag',capacityFor(effectiveVacuum(s)));if(id==='bag-empty')emptyBag(s);if(id==='store-empty'){for(const k of Object.keys(s.inventory.storage))s.inventory.storage[k]=0;recountStorage(s);}if(id==='finish'&&s.press.job){s.press.job.endsAt=Date.now();advancePress(s);}if(id==='reset')resetProduction(s);save();signature='';render();});}
 }
 $('area-close').addEventListener('click',close);backdrop.addEventListener('click',close);
 {const pack=document.querySelector('.pack-counter');pack?.addEventListener('click',()=>open('bag'));}const bag=document.querySelector('.leaf-counter');bag.tabIndex=0;bag.setAttribute('role','button');bag.setAttribute('aria-label','Rucksackinhalt ansehen');bag.addEventListener('click',()=>open('bag'));bag.addEventListener('keydown',e=>{if(['Enter','Space'].includes(e.code)){e.preventDefault();open('bag');}});
 addEventListener('keydown',e=>{if(!page)return;if(e.code==='Escape'){e.preventDefault();close();}if(e.code==='Tab'){const controls=[...panel.querySelectorAll('button:not(:disabled),select,summary')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 return {open,close,isOpen:()=>!panel.hidden&&['bag','upgrades','fishbook','collection','equipment','backpack'].includes(page),get nearby(){return near;},update(now=Date.now()){
  const s=getState();near=facilityNearby(s);if(near!==lastNear){suppressed=false;lastNear=near;interact.innerHTML=near?materialIcon(near):'';interact.setAttribute('aria-label',({home:'Zuhause öffnen',storage:'Materiallager öffnen',press:'Materialpresse öffnen'})[near]??'Gebäude öffnen');}
  interact.hidden=!near||!panel.hidden||isOtherOpen();
  
  if(!panel.hidden){if(page==='press')updateMachineProgress(body,s.press,now);const key=JSON.stringify([page,s.inventory.bag,s.inventory.storage,s.press.upgrades,s.press.job?.id,s.press.job2?.id,s.press.job3?.id,s.press.preferred,s.press.second,s.press.third,selected,quantity]);if(key!==signature){signature=key;render();}const job=s.press.job;if(job&&$('production-fill')){const p=Math.floor(pressProgress(s,now)*100);$('production-fill').style.width=p+'%';$('production-fill').parentElement.setAttribute('aria-valuenow',p);$('production-time').textContent=Math.max(0,(job.endsAt-now)/1000).toFixed(1)+' s';}}
 }};
}



// Jakob 3.11.: Mahlzeiten essen und Blob-Köder auslegen direkt aus dem Rucksack.
function foodHTML(s){const meals=Object.keys(MEALS).filter(k=>(s.inventory.bag[k]??0)>0),left=mealLeft(s),bait=(s.inventory.bag.blobbait??0)>0;if(!meals.length&&!left&&!bait)return '';
 return `<section class="bag-card food"><header><strong>Essen</strong>${left?`<em>${MEALS[s.mealBoost.id].name}: +${Math.round(s.mealBoost.speed*100)} % Tempo · noch ${Math.ceil(left/60)} min</em>`:''}</header><div class="food-row">${meals.map(k=>`<button data-eat="${k}" data-item="${k}"><i>${materialIcon(k)}</i><small>${MEALS[k].name}</small><b>+${Math.round(MEALS[k].speed*100)} % · ${MEALS[k].seconds/60} min</b></button>`).join('')}${bait?`<button id="bag-lure"><i>${materialIcon('blobbait')}</i><small>Blob-Köder auslegen</small><b>lockt einen wilden Blob</b></button>`:''}</div></section>`;}
// Jakob 4.11.: Möbel zeigen überall ihr gemaltes Möbelbild (vorher Ersatzbild mit eckigem Rahmen).
import {FURNITURE as FURNITURE_KINDS} from './crafting-config.mjs';
import {craftArtwork as craftArtworkFor} from './crafting-view.mjs';
