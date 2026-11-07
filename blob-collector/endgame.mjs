import {PRODUCT_NAMES} from './material-press.mjs';
import {CRAFT_RECIPES,WORKSHOPS} from './crafting-config.mjs';
import {FISH} from './fishing.mjs';
import {iceRegion} from './ice-area.mjs';
import {addMaterial,capacityFor,suctionCount} from './inventory.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import {resourceAvailable} from './resource-world.mjs';
import {RESOURCE_RULES} from './living-config.mjs';
import {harvestLeafForWorker} from './simulation.mjs';
// Eis- und Vulkan-Endgame (Jakob 6.11., alle Zahlen Testwerte):
// Eisbohrer (Steinwerkstatt, spät) → einmalig am Eissee einsetzen → dauerhaftes Eisloch mit besonderen Eisfischen.
// Eiswasser mit dem Wirbelsauger am Eissee (begrenzt) → erstarrt den Lavafluss und wird für Reparaturen gebraucht.
// Nach der Aktivierung saugt der Vulkansauger dauerhaft alles ein, was auf dem Boden liegt (direkt ins Lager), solange er an ist.
// Jakob 6.11.: Eiswasser ist unbegrenzt (max Infinity); gebraucht für den Lavafluss, Teile der Systeme und die Aktivierung.
export const ICE_WATER={max:Infinity,seconds:2.2,range:13,lake:{x:42.5,z:-66.5}};
export const CORE_SUCK={interval:.5,perTick:6,scan:260};
PRODUCT_NAMES.icedrill='Eisbohrer';PRODUCT_NAMES.coralfilter='Korallenfilter';PRODUCT_NAMES.headlamp='Kopflampe';PRODUCT_NAMES.icewater='Eiswasser';
CRAFT_RECIPES.icedrill={workshop:'stoneshop',name:'Eisbohrer',inputs:{ironbar:4,springsteel:2,icecrystal:3,clay:6,coolingmodule:1},output:'icedrill',quantity:1,seconds:20};
if(!WORKSHOPS.stoneshop.recipes.includes('icedrill'))WORKSHOPS.stoneshop.recipes.push('icedrill');
// Zwei neue Fische nur am Eisloch (eigene Namen, seltener).
Object.assign(FISH,{
 eisstoer:{name:'Eisstör',water:'ice',color:'#8fb2c9',accent:'#eaf6ff',pattern:'wide',difficulty:4,value:360,weight:5,seconds:2.5,body:'pike',cm:110,jump:1.3},
 nordlichtfisch:{name:'Nordlichtfisch',water:'ice',color:'#6fe0c2',accent:'#c9a8ff',pattern:'double',difficulty:5,value:700,weight:2,seconds:2.4,body:'angel',cm:35}
});
export const endgame=s=>s.endgame??={water:0,active:false,tick:0,cursor:0,leafCursor:0,progress:0};
export const endgameSnapshot=s=>({water:endgame(s).water,active:Boolean(endgame(s).active)});
export function restoreEndgame(s,d){s.endgame={water:Math.max(0,Math.floor(Number(d?.water)||0)),active:Boolean(d?.active),tick:0,cursor:0,leafCursor:0,progress:0};}
export const waterLeft=s=>Math.max(0,ICE_WATER.max-endgame(s).water);
export function toggleCore(s){if(!s.builtSites?.coreActivate)return false;const e=endgame(s);e.active=!e.active;s.events?.push(e.active?'caught':'eat');return true;}
// Eiswasser: Wirbelsauger saugt am Eissee; begrenzte Gesamtmenge.
function gatherWater(s,dt){const e=endgame(s),p=s.player;if(s.area!=='sunny'||s.home?.interior||s.nursery?.interior||s.cave?.interior||s.testWorld?.enabled||!s.suctionActive||s.vacuumId!=='vortex'||waterLeft(s)<=0||!iceRegion(p.x,p.z)||Math.hypot(p.x-ICE_WATER.lake.x,p.z-ICE_WATER.lake.z)>ICE_WATER.range){e.progress=Math.max(0,(e.progress??0)-dt);return;}
 const cap=capacityFor(effectiveVacuum(s));if(suctionCount(s)>=cap)return;e.progress=(e.progress??0)+dt;if(e.progress>=ICE_WATER.seconds){e.progress=0;addMaterial(s,'icewater',1,'bag',cap);e.water++;s.events?.push('leaf');}}
// Vulkansauger: nimmt reihum Liegendes (Blätter, Ressourcen) auf und lagert es direkt ein.
function store(s,kind){s.inventory.storage[kind]=(s.inventory.storage[kind]??0)+1;s.stored=(s.stored??0)+1;}
function coreSuck(s,dt){const e=endgame(s);if(!e.active||!s.builtSites?.coreActivate||s.testWorld?.enabled)return;e.tick+=dt;if(e.tick<CORE_SUCK.interval)return;e.tick=0;let n=0;
 const res=s.resources??[];for(let k=0;k<CORE_SUCK.scan&&n<CORE_SUCK.perTick&&res.length;k++){const r=res[e.cursor=(e.cursor+1)%res.length];if(!r||r.status!=='ground'||r.focusOnly||r.sandCell||r.buried||r.deposit||!resourceAvailable(s,r))continue;const kind=r.reward?.kind??r.kind,regen=RESOURCE_RULES[r.kind]?.regen??[35,50];r.status='gone';r.progress=0;r.respawnAt=s.time+regen[0]+Math.random()*(regen[1]-regen[0]);store(s,kind);n++;}
 const leaves=s.leaves??[];for(let k=0;k<CORE_SUCK.scan&&n<CORE_SUCK.perTick&&leaves.length;k++){const l=leaves[e.leafCursor=(e.leafCursor+1)%leaves.length];if(!l||l.status!=='ground'||l.gold||l.snow)continue;if(!harvestLeafForWorker(s,l))continue;(s.handLeaves??=[]).push(l);store(s,l.reward?.kind??'leaf');n++;}}
export function updateEndgame(s,dt){gatherWater(s,dt);coreSuck(s,dt);}
