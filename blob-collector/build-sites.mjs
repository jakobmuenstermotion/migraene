import {RELIC_FOR} from './relics.mjs';
﻿import * as T from './vendor/three.module.js';
import {SITE_FLAGS,sunnyHeight} from './sunny-area.mjs';
import {gorgeBanks} from './gorge-shape.mjs';
import {payConstruction} from './construction-stock.mjs';
import {canBuildWithStock} from './construction-stock.mjs';
import {itemArtwork} from './item-art.mjs';
import {PRODUCT_NAMES} from './material-press.mjs';
import {VOLCANO_FLAGS} from './volcano-area.mjs';
import {CORE_STATIONS,stationWorld,CORE_CENTER} from './core-view.mjs';
import {toggleCore} from './endgame.mjs';

import {HOME_ROOM} from './home-space.mjs';
// Jakob 5.11.: Bauplätze: Brücke über die Schlucht (von der Steinbach-Seite) und Treppe zum Pilzhain (von oben). Sie ersetzen
// das Hinüberziehen mit dem Anker: Hat man es einmal geschafft, baut man den festen Weg. Die Anker bleiben für das erste Mal.
// Jakob 7.11.: an der Ankerstelle zwischen Steinbach und Wald (vorher Engstelle x=-12), relativ günstig.
export const GORGE_BRIDGE_X=1.7;
const bridgeZ=()=>{const b=gorgeBanks(GORGE_BRIDGE_X);return {far:b.far,near:b.near,mid:(b.far+b.near)/2};};
export const SITES=[
 {id:'gorgeBridge',name:'Brücke über die Schlucht',flag:'gorge',cost:{board:6,rope:2,beam:2},at:()=>({x:GORGE_BRIDGE_X+1.2,z:bridgeZ().far-1.3}),reach:2.6,side:s=>s.player.z<bridgeZ().far-.2},
 {id:'pilzStairs',name:'Treppe zum Pilzhain',flag:'pilz',cost:{stoneslab:8,stonesocket:4,beam:4},at:()=>({x:-41.5,z:1}),reach:3.4,/* Jakob 7.11.: nur von oben (Pilzhain) */side:s=>s.player.x< -41.7},
 // Neuer Spielstart (Jakob 6.11.): am Hauscomputer Bodensauger und Ladestation für 50 Blätter kaufen.
 // Endgame (Jakob 6.11., Testwerte): Eisloch bohren, Lavafluss erstarren, vier Systeme im Vulkankern reparieren, aktivieren.
 {id:'iceDrill',name:'Eisloch bohren',flag:'ice',cost:{icedrill:1},at:()=>({x:43.5,z:-64.4}),reach:3.4,when:s=>((s.inventory?.bag?.icedrill??0)+(s.inventory?.normalBag?.icedrill??0))>0},
 {id:'lavaPetrify',name:'Lavafluss mit Eiswasser löschen',flag:'petrified',cost:{icewater:12,icequader:4},at:s=>({x:-24.4,z:Math.max(66,Math.min(86,s?.player.z??76))}),reach:2.4,side:s=>s.player.x< -23},
 // Je System: Stufe 1 und 2 (Material aus mehreren Biomen: Wald, Küste, Eis/Berg, Vulkan, dazu Werkstattprodukte), dann die eigene Startsequenz.
 ...[['coreEnergy','Energieversorgung',{copperbar:4,wire:4,energycore:2,beam:6},{coolingmodule:3,desertcrystal:6,frostglass:3,icewater:6},'Turbinen anwerfen'],['corePipes','Hauptleitung',{ironbar:6,pump:2,ironfitting:4,driftboard:6},{frostloop:1,wire:6,frostbeam:3,clay:10,icewater:4},'Leitungen unter Druck setzen'],['coreFilter','Filtersystem',{filtermodule:2,coralfilter:2,prismlens:1,essence:6,icewater:4},{obsidianlens:1,desertfabric:4,springsteel:2,icecrystal:6},'Filter starten'],['corePressure','Druck und Ansaugung',{vortexchamber:1,clockwork:2,springsteel:2,shelllime:6},{findercrystal:1,sunshard:3,energycore:1,iceplate:4},'Probelauf starten']].flatMap(([id,name,a,b,run])=>[{id:id+'1',name:name+' reparieren (1/2)',flag:'_',room:'core',cost:a,at:()=>CORE_AT[id],reach:3.4},{id:id+'2',name:name+' reparieren (2/2)',flag:'_',room:'core',cost:b,at:()=>CORE_AT[id],reach:3.4,needs:id+'1'},{id:id+'3',name:run,flag:'_',room:'core',cost:RELIC_FOR[id]??{},at:()=>CORE_AT[id],reach:3.4,needs:id+'2',sequence:true}]),
 {id:'coreActivate',name:'Vulkansauger aktivieren',flag:'_',room:'core',cost:{icewater:6,energycore:1},at:()=>CORE_AT.switch,reach:3.2,all:['coreEnergy3','corePipes3','coreFilter3','corePressure3']}
];
const STAND={coreEnergy:2.8,corePipes:2.8,coreFilter:2.8,corePressure:2.8};
const CORE_AT=Object.fromEntries([...Object.keys(CORE_STATIONS).map(k=>{const p=stationWorld(k);const dx=p.x-CORE_CENTER.x,dz=p.z-CORE_CENTER.z,d=Math.hypot(dx,dz)||1;return [k,{x:p.x+dx/d*STAND[k],z:p.z+dz/d*STAND[k]}];}),['switch',(p=>({x:p.x-1.3,z:p.z}))(stationWorld('switch'))]]);
export const siteBuilt=(s,id)=>Boolean(s.builtSites?.[id]);
export function syncSites(s){for(const site of SITES)if(site.flag in SITE_FLAGS)SITE_FLAGS[site.flag]=siteBuilt(s,site.id);VOLCANO_FLAGS.petrified=siteBuilt(s,'lavaPetrify');}
export function siteNearby(s){if(s.area!=='sunny'||s.nursery?.interior||s.testWorld?.enabled)return null;if(s.cave?.interior)return null;const home=Boolean(s.home?.interior);for(const site of SITES){if(siteBuilt(s,site.id)||Boolean(site.home)!==home)continue;if(site.when&&!site.when(s))continue;if(site.needs&&!siteBuilt(s,site.needs))continue;if(site.all&&!site.all.every(k=>siteBuilt(s,k)))continue;const p=site.at(s);if(site.side&&!site.side(s))continue;if(Math.hypot(s.player.x-p.x,s.player.z-p.z)<site.reach)return site;}return null;}
export function switchNearby(s){if(s.cave?.interior||!s.builtSites?.coreActivate)return false;const p=CORE_AT.switch;return Math.hypot(s.player.x-p.x,s.player.z-p.z)<3.2;}
export function buildSite(s,id){const site=SITES.find(x=>x.id===id);if(!site||siteBuilt(s,id)||siteNearby(s)?.id!==id||!canBuildWithStock(s,site.cost,0)||!payConstruction(s,site.cost,0))return false;(s.builtSites??={})[id]=true;if(id==='iceDrill'||id==='coreActivate'){const e=s.endgame??={water:0,active:false,tick:0,cursor:0,leafCursor:0,progress:0};if(id==='coreActivate')e.active=true;}if(site.sequence){const e=s.endgame??={water:0,active:false,tick:0,cursor:0,leafCursor:0,progress:0};e.seq={id:id.slice(0,-1),at:s.time};}syncSites(s);s.layoutRevision=(s.layoutRevision??0)+1;s.events?.push('obstacle');return true;}
// introVacuum = Ladestation gekauft (charger-building.mjs); kein Bauplatz mehr, muss aber mitgespeichert werden.
const KEEP=['introVacuum'];
export const sitesSnapshot=s=>Object.keys(s.builtSites??{}).filter(k=>KEEP.includes(k)||SITES.some(x=>x.id===k));
export function restoreSites(s,list){s.builtSites={};for(const k of Array.isArray(list)?list:[])if(KEEP.includes(k)||SITES.some(x=>x.id===k))s.builtSites[k]=true;syncSites(s);}

// Darstellung: Holzbrücke mit Geländer, Steintreppe mit Seitenwangen; erscheinen erst nach dem Bau.
export class BuildSiteView{
 constructor(scene){this.root=new T.Group();scene.add(this.root);const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.9});
  const bz=bridgeZ(),len=bz.near-bz.far+1.4,g=new T.Group();g.position.set(GORGE_BRIDGE_X,sunnyHeight(GORGE_BRIDGE_X,bz.mid)+.05,bz.mid);
  for(let i=0;i<Math.ceil(len/.28);i++){const p=new T.Mesh(new T.BoxGeometry(2.1,.09,.25),mat(i%2?'#b48759':'#a67a4e'));p.position.z=-len/2+.14+i*.28;g.add(p);}
  for(const x of [-1.08,1.08]){const rail=new T.Mesh(new T.BoxGeometry(.08,.08,len),mat('#6e4f33'));rail.position.set(x,.75,0);g.add(rail);for(let k=0;k<=4;k++){const post=new T.Mesh(new T.BoxGeometry(.1,.8,.1),mat('#6e4f33'));post.position.set(x,.38,-len/2+k*len/4);g.add(post);}}
  this.bridge=g;g.visible=false;this.root.add(g);
  const st=new T.Group();st.position.set(-39.5,0,1);for(let i=0;i<8;i++){const step=new T.Mesh(new T.BoxGeometry(.7,.16,3.2),mat(i%2?'#9aa39b':'#8c968f'));step.position.set(-i*.62,sunnyHeight(-39.5-i*.62,1)+.04,0);st.add(step);}for(const z of [-1.65,1.65]){const wall=new T.Mesh(new T.BoxGeometry(5.2,.5,.18),mat('#7d867f'));wall.position.set(-2.6,sunnyHeight(-42,1)+.35,z);st.add(wall);}
  this.stairs=st;st.visible=false;this.root.add(st);
  // Eisloch: dunkles Loch mit hellem Eisrand und Rissen am Eissee.
  const hole=new T.Group(),hy=sunnyHeight(43.5,-66)+.03;hole.position.set(43.5,hy,-66);const pit=new T.Mesh(new T.CircleGeometry(.62,24),new T.MeshBasicMaterial({color:'#0e2a3a'}));pit.rotation.x=-Math.PI/2;hole.add(pit);const rim=new T.Mesh(new T.RingGeometry(.62,.86,24),new T.MeshStandardMaterial({color:'#d9f4ff',roughness:.3,emissive:'#7fd0ee',emissiveIntensity:.25,side:T.DoubleSide}));rim.rotation.x=-Math.PI/2;rim.position.y=.01;hole.add(rim);for(let i=0;i<6;i++){const crack=new T.Mesh(new T.BoxGeometry(.05,.01,.7+.3*(i%3)),new T.MeshBasicMaterial({color:'#b4e6f7'}));const a=i*1.05;crack.position.set(Math.sin(a)*1.1,.01,Math.cos(a)*1.1);crack.rotation.y=a;hole.add(crack);}this.hole=hole;hole.visible=false;this.root.add(hole);
  // Abdeckplane über der Ladestation, bis Sauger und Station gekauft sind (neuer Spielstart).
}
 update(s){this.root.visible=!s.testWorld?.enabled&&s.area==='sunny'&&!s.cave?.interior;this.bridge.visible=siteBuilt(s,'gorgeBridge');this.stairs.visible=siteBuilt(s,'pilzStairs');this.hole.visible=siteBuilt(s,'iceDrill');}
}
// Bauknopf mit Kosten, erscheint am Bauplatz
export function bindSiteUI({getState,onSave}){const root=document.getElementById('game'),box=document.createElement('aside');box.id='site-build';box.hidden=true;root.append(box);let key='';
 box.addEventListener('click',e=>{if(e.target.closest('[data-toggle]')){if(toggleCore(getState())){onSave?.();key='';}return;}const b=e.target.closest('[data-site]');if(b&&buildSite(getState(),b.dataset.site)){onSave?.();key='';}});
 return {update(){const s=getState(),site=siteNearby(s);if(!site){if(switchNearby(s)){const on=Boolean(s.endgame?.active),k='sw'+on;if(k!==key){key=k;box.innerHTML=`<strong>Vulkansauger</strong><div class="site-cost"><small>${on?'Saugt gerade alles auf, was am Boden liegt, und lagert es ein.':'Aus. Einschalten saugt alles Herumliegende ins Lager.'}</small></div><button data-toggle>${on?'Ausschalten':'Einschalten'}</button>`;}box.hidden=false;return;}box.hidden=true;return;}const bag=s.inventory.bag,st=s.inventory.storage,have=k=>(bag[k]??0)+(st[k]??0),ok=canBuildWithStock(s,site.cost,0),k=site.id+JSON.stringify(Object.keys(site.cost).map(c=>have(c)));if(k!==key){key=k;box.innerHTML=`<strong>${site.name}</strong><div class="site-cost">${Object.entries(site.cost).map(([c,n])=>`<span class="${have(c)>=n?'ok':''}"><i>${itemArtwork(c)}</i><b>${Math.min(have(c),n)}/${n}</b><small>${PRODUCT_NAMES[c]??c}</small></span>`).join('')}</div><button data-site="${site.id}" ${ok?'':'disabled'}>${site.label??(site.sequence?'Starten':'Bauen')}</button>`;}box.hidden=false;}};}
