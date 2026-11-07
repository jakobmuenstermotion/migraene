import {recordPickup} from './pickup-feedback.mjs';
import {addMaterial,capacityFor,reservedBagSlots} from './inventory.mjs';
import {buriedReward} from './ground-skills.mjs';
// Jakob 2.11.: alle 20 s eine Welle bis 20 m. Sie markiert einen Kreis, in dem etwas liegt, nie die genaue Stelle (Testwerte).
export const RADAR={period:20,duration:2,radius:20,zoneRadius:4,zones:3,offset:2.6};
export function createGroundSystems(){return {lootSeed:1741,buriedInventory:{},groundRadar:{active:false,cycle:0,startedAt:0,scanning:false,radius:0,targetId:null}};}
function roll(state){state.lootSeed=(Math.imul(state.lootSeed,1664525)+1013904223)>>>0;return state.lootSeed/4294967296;}
export function collectBuried(state,object,mode){const reward={kind:object.kind,...buriedReward(mode,roll(state),roll(state))};object.reward=reward;const kind=reward.rare?(reward.kind==='stone'?'rarepebble':'rare'+reward.kind):reward.kind;addMaterial(state,kind,reward.quantity,'bag',capacityFor(mode)-reservedBagSlots(state));recordPickup(state,kind,reward.quantity,object);const inventory=state.buriedInventory[reward.kind]??={normal:0,rare:0};inventory[reward.rare?'rare':'normal']+=reward.quantity;return reward;}
export function updateGroundRadar(state,mode){
  const radar=state.groundRadar;radar.zones??=[];
  if(mode.id!=='ground'||!mode.detector){radar.active=false;radar.scanning=false;radar.zones=[];return;}
  if(!radar.active){radar.active=true;radar.startedAt=state.time;radar.cycle++;radar.marked=false;}
  const elapsed=state.time-radar.startedAt;
  if(elapsed>=RADAR.period){const cycles=Math.floor(elapsed/RADAR.period);radar.startedAt+=cycles*RADAR.period;radar.cycle+=cycles;radar.marked=false;}
  const phase=state.time-radar.startedAt;radar.scanning=phase<=RADAR.duration;radar.radius=RADAR.radius*Math.min(1,phase/RADAR.duration);
  radar.zones=radar.zones.filter(z=>!state.obstacles.find(o=>o.id===z.id)?.cleared);
  if(!radar.marked&&phase>=RADAR.duration){radar.marked=true;const p=state.player;radar.zones=state.obstacles.filter(o=>o.tool==='ground'&&!o.route&&!o.cleared&&(o.depth??0)<=mode.digDepth&&Math.hypot(o.x-p.x,o.z-p.z)<=RADAR.radius).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z)).slice(0,RADAR.zones).map(o=>{const a=roll(state)*Math.PI*2,r=RADAR.offset*Math.sqrt(roll(state));return {id:o.id,x:o.x+Math.sin(a)*r,z:o.z+Math.cos(a)*r,r:RADAR.zoneRadius};});}
}
