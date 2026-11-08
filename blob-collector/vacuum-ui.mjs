import {handMode,handPickup} from './hand-pickup.mjs';
import {coinCost} from './game-balance.mjs';
import {batteryBank,toggleAutomatic} from './battery-bank.mjs';
import {goalButton} from './goals-ui.mjs';
import {groundUpgradeArtwork} from './ground-art.mjs';
import {factorySkillStatus as skillStatus,factoryNearby,ownsVacuum} from './factory.mjs';
import {UPGRADE_COSTS} from './factory-config.mjs';
import {materialIcon} from './sunny-ui.mjs';
import {PRODUCT_NAMES} from './material-press.mjs';
import {VACUUMS} from './vacuums.mjs';
import {SKILL_TREES,effectiveVacuum} from './vacuum-skills.mjs';
import {wheelRadius,wheelPosition,wheelChoice,createVacuumPress} from './vacuum-gesture.mjs';
import {layoutSkills,startingSkillNode} from './skill-layout.mjs';
import {findIcon,FIND_NAMES} from './find-icons.mjs';
import {vacuumArtwork} from './hud-art.mjs';

const paths={ground:'M10 27h24v8H10z M19 27V10h6v17 M8 35h28',focus:'M17 32l4-23h6l-1 23 M14 33h15v5H14 M29 13l6-4 M30 20h8',fan:'M19 33l-4-15 M25 33l4-15 M22 32V12 M10 20l-4-6 M34 20l4-6 M17 34h10v5H17 M13 9l-3-5 M31 9l3-5',power:'M13 16h18v19H13z M17 16V9h10v7 M10 23H6 M34 23h4 M22 21l-4 7h7l-3 6',vortex:'M32 11c-15-9-30 13-14 20 12 6 24-13 11-18-9-4-16 8-9 11 4 2 8-2 5-5 M14 34l-5 3 M29 34l4 4'};
export const toolIcon=id=>`<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[id]}"/></svg>`;
const nodePositions=[{x:16,y:64},{x:16,y:36},{x:50,y:64},{x:50,y:36},{x:84,y:64},{x:84,y:36},{x:50,y:9}];
const nodeLabels={ground:['+30 % Breite','+25 % Länge','+30 % Menge','+40 % Einzug','+35 % Graben','+25 % Suchfeld'],focus:['+15 % Weite','+15 % Weite','+35 % Einzug','+30 % Menge','+35 % Höhenzug','+30 % Blobzug'],fan:['+20° Fächer','+20 % Weite','+35 % Menge','+35 % Einzug','+40 % Laubzug','+20 % Menge'],power:['+20 % Weite','+12° Saugfeld','+40 % Einzug','+35 % Menge','+35 % Kraft','+35 % Kraft'],vortex:['+15 % Radius','+15 % Radius','+30 % Menge','+35 % Einzug','+25 % Blobzug','+30 % Blobzug']};
const skillIcon=kind=>`<svg viewBox="0 0 44 44" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${kind==='reach'?'M22 5v7 M22 32v7 M5 22h7 M32 22h7 M22 12a10 10 0 1 0 0 20 10 10 0 0 0 0-20 M22 19v6 M19 22h6':kind==='flow'?'M7 16h22c9 0 8-12 1-10-4 1-3 5-2 5 M5 23h29c9 0 8 13 1 11-4-1-3-5-2-5 M10 30h10c8 0 7 10 1 9':'M22 5l5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z'}"/></svg>`;
const groundIcon=groundUpgradeArtwork;
export function bindVacuumUI({getState,onChoose,onRefill,onOpen,onUpgrade,onResetTree,onGrant,onCloseTree,onModeChange}){
  const $=id=>document.getElementById(id),panel=$('vacuum-picker'),choose=$('vacuum-choose'),backdrop=$('workshop-backdrop'),wheel=$('vacuum-wheel'),shade=$('wheel-backdrop');
  const autoButton=document.createElement('button');autoButton.id='vacuum-auto-mode';autoButton.type='button';autoButton.className='area-secondary';wheel.append(autoButton);autoButton.onclick=()=>{toggleAutomatic(getState());onModeChange?.();update();};
  let selected=getState().vacuumId,selectedNode='reach1',previous='',previousHUD='',previousTheme='',gesture=null,radius=230,center={x:0,y:0};
  const buttons=VACUUMS.map(mode=>{const b=document.createElement('button');b.type='button';b.className='wheel-tool';b.style.setProperty('--tool-color',mode.color);b.setAttribute('aria-label',mode.name+' ausrüsten');b.innerHTML=`<span>${vacuumArtwork(mode.id,document.body.dataset.hud)}</span><strong>${mode.name}</strong>`;b.addEventListener('click',()=>{onChoose(mode.id);closeWheel();});$('wheel-options').append(b);return b;});
  function layout(){const rect=choose.getBoundingClientRect();center={x:rect.left+rect.width/2,y:rect.top+rect.height/2};radius=wheelRadius(innerWidth,innerHeight);wheel.style.left=center.x+'px';wheel.style.top=center.y+'px';wheel.style.setProperty('--wheel-radius',radius+'px');const side=document.body.classList.contains('hud-left')?-1:1;buttons.forEach((b,i)=>{const point=wheelPosition(i,radius);b.style.left=point.x*side+'px';b.style.top=point.y+'px';});}
  function preview(index){const id=VACUUMS[index??VACUUMS.findIndex(m=>m.id===getState().vacuumId)].id,mode=VACUUMS.find(m=>m.id===id);$('wheel-name').textContent=mode.name;$('wheel-role').textContent=SKILL_TREES[id].role;wheel.style.setProperty('--tool-color',mode.color);buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===(index??VACUUMS.findIndex(m=>m.id===getState().vacuumId)))));}
  function openWheel(){if(!panel.hidden)return;update();wheel.hidden=shade.hidden=false;choose.setAttribute('aria-expanded','true');choose.classList.add('open');layout();preview(null);}
  function releasePointer(){const current=gesture;gesture=null;if(current&&choose.hasPointerCapture(current.id))choose.releasePointerCapture(current.id);}
  function hideWheel(){releasePointer();wheel.hidden=shade.hidden=true;choose.setAttribute('aria-expanded','false');choose.classList.remove('open');for(const id of ['vacuum-tree','wheel-lab'])$(id).classList.remove('gesture-target');$('world').focus({preventScroll:true});}
  const press=createVacuumPress({open:openWheel,close:hideWheel,tap:()=>{const s=getState();if(handMode(s)){handPickup(s);return;}s.suctionEnabled=!s.suctionEnabled;update();},select:target=>{if(typeof target==='number')onChoose(VACUUMS[target].id);else $(target).click();}});
  function closeWheel(){press.cancel();hideWheel();}
  function targetAt(event){for(const id of ['vacuum-tree','wheel-lab','vacuum-auto-mode']){const r=$(id).getBoundingClientRect();if(event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom)return id;}return wheelChoice({x:document.body.classList.contains('hud-left')?2*center.x-event.clientX:event.clientX,y:event.clientY},center,radius);}
  choose.addEventListener('pointerdown',event=>{if(event.button!==0||gesture||!panel.hidden)return;event.preventDefault();gesture={id:event.pointerId};choose.setPointerCapture(event.pointerId);press.start();});
  choose.addEventListener('pointermove',event=>{if(event.pointerId!==gesture?.id||!press.held)return;event.preventDefault();const target=targetAt(event);preview(typeof target==='number'?target:null);for(const id of ['vacuum-tree','wheel-lab'])$(id).classList.toggle('gesture-target',target===id);});
  choose.addEventListener('pointerup',event=>{if(event.pointerId!==gesture?.id)return;event.preventDefault();press.release(press.held?targetAt(event):null);});
  for(const name of ['pointercancel','lostpointercapture'])choose.addEventListener(name,event=>{if(event.pointerId===gesture?.id)closeWheel();});
  choose.addEventListener('click',event=>{if(event.detail===0){const s=getState();if(handMode(s)){handPickup(s);return;}s.suctionEnabled=!s.suctionEnabled;update();}});
  choose.addEventListener('keydown',event=>{if(event.code==='ArrowUp'){event.preventDefault();openWheel();buttons[0].focus();}});
  choose.addEventListener('contextmenu',event=>event.preventDefault());
  shade.addEventListener('pointerdown',event=>{event.preventDefault();closeWheel();});
  function openUpgrades(id=getState().vacuumId){closeWheel();selected=typeof id==='string'?id:getState().vacuumId;selectedNode=startingSkillNode(SKILL_TREES[selected].nodes,getState().progression[selected].unlocked);previous='';panel.hidden=backdrop.hidden=false;onOpen();update();$('vacuum-close').focus({preventScroll:true});panel.scrollTop=0;const node=panel.querySelector(`[data-node="${selectedNode}"]`);panel.scrollTop=Math.max(0,node.getBoundingClientRect().top-panel.getBoundingClientRect().top-panel.clientHeight*.45);}
  function closeUpgrades(){const visible=!panel.hidden;panel.hidden=backdrop.hidden=true;if(visible)onCloseTree?.();$('world').focus({preventScroll:true});}
  $('vacuum-tree').addEventListener('click',openUpgrades);$('vacuum-close').addEventListener('click',closeUpgrades);backdrop.addEventListener('click',closeUpgrades);
  $('tree-reset').addEventListener('click',()=>{onResetTree(selected);previous='';update();});
  $('tree-grant').addEventListener('click',()=>{onGrant(selected);previous='';update();});
  $('vacuum-refill').addEventListener('click',()=>{onRefill();closeUpgrades();});
  $('reset').addEventListener('click',closeUpgrades);
  addEventListener('resize',()=>{if(gesture)closeWheel();else if(!wheel.hidden)layout();});
  addEventListener('blur',closeWheel);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)closeWheel();});
  addEventListener('keydown',event=>{
    if(document.querySelector('.lab-panel:not([hidden]):not(.world-floating)'))return;
    if(event.ctrlKey||event.metaKey||event.altKey||['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;
    if(event.code==='Escape'){if(!panel.hidden){event.preventDefault();closeUpgrades();}else if(!wheel.hidden){event.preventDefault();closeWheel();}return;}
    if(event.code==='Tab'&&panel.hidden&&wheel.hidden){event.preventDefault();openUpgrades();return;}
    if(event.code==='Tab'&&(!panel.hidden||!wheel.hidden)){const container=panel.hidden?wheel:panel,items=[...container.querySelectorAll('button:not(:disabled),summary')].filter(el=>el.getClientRects().length),first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}return;}
    const digit=/^Digit([1-5])$/.exec(event.code);if(digit&&!event.repeat&&panel.hidden){event.preventDefault();onChoose(VACUUMS[Number(digit[1])-1].id);closeWheel();}
  });
  function detail(){
    const state=getState(),tree=SKILL_TREES[selected],p=state.progression[selected],mode=effectiveVacuum(state,selected),ground=selected==='ground',network=layoutSkills(tree.nodes),positions=tree.nodes.map(n=>network.positions.get(n.id)),rootY=network.root.y;
    panel.style.setProperty('--tool-color',mode.color);$('workshop-title').textContent=mode.name;
    $('tree-points').textContent=state.inventory.coins+' ◉';$('tree-points').setAttribute('aria-label','Münzen');$('tree-reset').hidden=$('tree-grant').hidden=true;
    const links=tree.nodes.flatMap((n,i)=>(network.parents.get(n.id).length?network.parents.get(n.id):['base']).map(parent=>{const a=parent==='base'?network.root:network.positions.get(parent),b=positions[i],bend=(a.y-b.y)*.5,status=skillStatus(state,selected,n.id);return `<path class="skill-link ${status}${n.id===selectedNode?' inspected':''}" d="M${a.x} ${a.y} C${a.x} ${a.y-bend} ${b.x} ${b.y+bend} ${b.x} ${b.y}"/>`;})).join('');
    const info=tree.nodes.find(n=>n.id===selectedNode),infoStatus=skillStatus(state,selected,selectedNode);
    $('tool-detail').innerHTML=`<div class="skill-network ground-network ordered-network" style="height:${network.height}px" aria-label="Verzweigter Skilltree"><svg class="skill-connections" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${links}</svg><div class="skill-base" style="left:50%;top:${rootY}%">${toolIcon(selected)}</div>
      ${tree.nodes.map((n,i)=>{const pos=positions[i],status=skillStatus(state,selected,n.id),master=n.id==='super'||n.id==='detector',glyph=['width','shoe','battery','depth','gem','radar'].includes(n.glyph)?groundIcon(n.glyph):n.glyph==='reach'?skillIcon('reach'):n.glyph==='flow'?skillIcon('flow'):toolIcon(selected);return `<button type="button" class="skill-node ${status}${master?' master-node':''}${selectedNode===n.id?' selected':''}" style="left:${pos.x}%;top:${pos.y}%" data-node="${n.id}" aria-pressed="${selectedNode===n.id}" aria-label="${n.name}. ${n.description} ${status==='owned'?'Gelernt.':status==='locked'?'Voraussetzung fehlt.':UPGRADE_COSTS[selected][n.id].coins+' Münzen, zusätzlich Materialien.'}"><span class="node-glyph">${glyph}</span><span class="node-cost">${status==='owned'?'✓':'◇'}</span><span class="node-name">${n.label}</span></button>`;}).join('')}</div>
      <div class="skill-inspector"><div class="node-detail" aria-live="polite"><span class="node-detail-icon">${['width','shoe','battery','depth','gem','radar'].includes(info.glyph)?groundIcon(info.glyph):toolIcon(selected)}</span><div><strong>${info.name}</strong><p>${info.description}</p>${infoStatus==='locked'?`<small>Benötigt: ${!ownsVacuum(state,selected)?mode.name+' zuerst bauen':info.requires.filter(id=>!p.unlocked.includes(id)).map(id=>tree.nodes.find(n=>n.id===id).name).join(' · ')}</small>`:''}</div></div><div class="factory-costs">${coinCost(UPGRADE_COSTS[selected][info.id].coins,state.inventory.coins)}${Object.entries(UPGRADE_COSTS[selected][info.id].materials).map(([k,n])=>`<span data-tree="${k}" data-tree-n="${n}" class="factory-cost ${(state.inventory.bag[k]??0)>=n?'has':''}" title="${PRODUCT_NAMES[k]??k}" aria-label="${PRODUCT_NAMES[k]??k}: ${state.inventory.bag[k]??0} von ${n}">${materialIcon(k)}<b>${n}</b><small>${state.inventory.bag[k]??0}</small><em>${PRODUCT_NAMES[k]??k}</em></span>`).join('')}</div>${infoStatus!=='owned'?goalButton(info.name,UPGRADE_COSTS[selected][info.id].materials,UPGRADE_COSTS[selected][info.id].coins):''}<button type="button" id="skill-buy" ${!factoryNearby(state)||infoStatus!=='available'?'disabled':''}>${infoStatus==='owned'?'Bereits freigeschaltet':infoStatus==='locked'?'Noch gesperrt':!ownsVacuum(state,selected)?'Sauger zuerst bauen':!factoryNearby(state)?'An der Saugerwerkstatt kaufen':infoStatus==='expensive'?'Materialien / Münzen fehlen · '+UPGRADE_COSTS[selected][info.id].coins+' ◉':'Freischalten · '+UPGRADE_COSTS[selected][info.id].coins+' ◉'}</button></div>${ground?`<div class="buried-inventory" aria-label="Ausgegrabene Funde">${Object.entries(state.buriedInventory).map(([kind,count])=>`<span title="${FIND_NAMES[kind]}"><i>${findIcon(kind)}</i>${count.normal}${count.rare?` <b>✦${count.rare}</b>`:''}</span>`).join('')}</div>`:''}`;
    for(const b of panel.querySelectorAll('[data-node]'))b.addEventListener('click',()=>{const scroll=panel.scrollTop;selectedNode=b.dataset.node;previous='';update();panel.scrollTop=scroll;panel.querySelector(`[data-node="${selectedNode}"]`).focus({preventScroll:true});});
    $('skill-buy').addEventListener('click',()=>{if(skillStatus(getState(),selected,selectedNode)!=='available')return;const scroll=panel.scrollTop;onUpgrade(selected,selectedNode);previous='';update();panel.scrollTop=scroll;panel.querySelector(`[data-node="${selectedNode}"]`).focus({preventScroll:true});});
  }
  function update(){
    const bank=batteryBank(getState());autoButton.hidden=!bank.unlocked.includes('automatic');{const label='Automatik '+(bank.automatic?'an':'aus');if(autoButton.textContent!==label)autoButton.textContent=label;}autoButton.setAttribute('aria-pressed',String(bank.automatic));
    const state=getState(),mode=effectiveVacuum(state),theme=document.body.dataset.hud,hud=mode.profileKey+':'+theme+':'+state.suctionEnabled+':'+Boolean(state.charging)+':'+bank.automatic;
    buttons.forEach((b,i)=>{const owned=ownsVacuum(state,VACUUMS[i].id);b.classList.toggle('unbuilt',!owned);b.setAttribute('aria-disabled',String(!owned));});
    if(theme!==previousTheme){previousTheme=theme;buttons.forEach((b,i)=>b.firstElementChild.innerHTML=vacuumArtwork(VACUUMS[i].id,theme));}
    if(hud!==previousHUD){previousHUD=hud;$('vacuum-name').textContent=mode.name;$('vacuum-current-icon').innerHTML=handMode(state)?HAND_ART:vacuumArtwork(mode.id,theme);choose.classList.toggle('hand-mode',handMode(state));choose.style.setProperty('--tool-color',mode.color);choose.setAttribute('aria-pressed',String(state.suctionEnabled&&!state.charging));choose.setAttribute('aria-label',handMode(state)?'Hand: Tippen hebt eine Sache in deiner Nähe auf.':mode.name+(bank.automatic?' · Automatik':'')+(state.suctionEnabled?': Saugen an. Tippen zum Ausschalten.':': Saugen aus. Tippen zum Einschalten.')+' Halten und ziehen zum Wechseln.');if(!wheel.hidden&&!gesture)preview(null);}
    if(!panel.hidden){const key=JSON.stringify([selected,state.skillRevision,state.inventory.bag,state.inventory.coins,state.factory?.owned,factoryNearby(state)]);if(previous!==key){previous=key;detail();}}
  }
  return {update,openTree:openUpgrades,close:()=>{closeUpgrades();closeWheel();},isOpen:()=>!panel.hidden||!wheel.hidden};
}

// Handknopf, solange der Sauger an der Ladestation liegt (Jakob 3.11.).
const HAND_ART='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 56c-7-8-10-16-9-22 1-3 5-3 7 0l3 5V16c0-5 7-5 7 0v13-17c0-5 7-5 7 0v17-14c0-5 7-5 7 0v16-10c0-5 7-5 7 0v22c0 9-4 14-8 19z" fill="#f6d3b4" stroke="#a9744f" stroke-width="3" stroke-linejoin="round"/><path d="M27 30v-6M34 29v-7M41 30v-5" stroke="#d9a983" stroke-width="2" stroke-linecap="round"/></svg>';
