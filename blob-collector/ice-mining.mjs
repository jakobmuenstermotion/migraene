import {suctionCount,capacityFor} from './inventory.mjs';
import {vacuumContains} from './vacuums.mjs';
import {iceHeight} from './ice-area.mjs';
import {volcanoHeight} from './volcano-area.mjs';
// Neugestaltung Eistal: große Vorkommen (Eis, Eiskristalle, Eisenerz) baut nur der Kraftsauger ab.
// Gleiche Regeln wie das Testlabor-Vorkommen: Abbauleistung, Überhitzung, Rucksackgrenze; jede Einheit
// fliegt als normaler Fund zum Sauger. Unbearbeitete Vorkommen wachsen langsam nach.
export const VOLCANO_HEAT=1.5;
const groundOf=d=>d.scenery?d.y:d.volcano?volcanoHeight(d.x,d.z):iceHeight(d.x,d.z);
export function mineIceDeposits(s,mode,active,dt){
 const list=s.iceDeposits;s.miningDeposit=null;if(!list?.length||s.area!=='sunny')return false;
 const p=s.player,heat=s.heat,pending=s.resources.filter(r=>r.status==='pulling'&&r.reward?.route==='bag').reduce((a,r)=>a+r.reward.quantity,0)+s.pullingLeaves.reduce((a,r)=>a+(r.reward?.route==='bag'?r.reward.quantity:0),0),full=suctionCount(s)+pending>=capacityFor(mode);
 let target=null;
 if(mode.id==='power'&&active&&!heat.locked&&!full){let best=Infinity;for(const d of list){if(d.units<1)continue;const y=groundOf(d)+.2,dist=Math.hypot(d.x-p.x,d.z-p.z);if(dist<best&&vacuumContains(p,{x:d.x,z:d.z,y},mode)){best=dist;target=d;}}}
 for(const d of list)if(d!==target&&d.units<d.max)d.units=Math.min(d.max,d.units+dt/d.regen);
 if(!target)return false;
 s.mining=s.toolWorking=true;s.miningDeposit=target.id;/* Vulkan (Jakob 30.10.): dort überhitzt der Kraftsauger schneller, ein Kühlmodul im Rucksack gleicht das aus */heat.value=Math.min(1,heat.value+dt/mode.heatSeconds*(target.volcano&&!(s.inventory.bag.coolingmodule>0)?VOLCANO_HEAT:1));target.budget=(target.budget??0)+dt*mode.mining;
 let room=capacityFor(mode)-suctionCount(s)-pending;const y=groundOf(target)+.7;
 while(target.budget>=1-1e-9&&target.units>=1&&room-->0){target.budget=Math.max(0,target.budget-1);target.units--;const a=s.time*7.3+target.units;const x=target.x+Math.sin(a)*target.r*.5,z=target.z+Math.cos(a)*target.r*.5;
  s.resources.push({id:target.id+'_'+Math.round(s.time*1000)+'_'+target.units,kind:target.kind,x,y,z,homeX:x,homeZ:z,homeY:y,status:'pulling',progress:0,startX:x,startZ:z,startY:y,reward:{kind:target.kind,quantity:1,route:'bag',capacity:capacityFor(mode)},ephemeral:true});}
 if(heat.value>=1-1e-9){heat.value=1;heat.locked=true;}
 return true;
}
export function iceDepositSnapshot(s){return (s.iceDeposits??[]).filter(d=>d.units<d.max).map(d=>[d.id,Math.round(d.units*100)/100]);}
export function restoreIceDeposits(s,data){if(!Array.isArray(data)||!s.iceDeposits)return;for(const [id,units]of data){const d=s.iceDeposits.find(d=>d.id===id);if(d&&Number.isFinite(units))d.units=Math.max(0,Math.min(d.max,units));}}
