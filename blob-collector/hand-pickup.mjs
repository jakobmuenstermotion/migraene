import {addNormalMaterial,normalCount,normalCapacity} from './inventory.mjs';
import {resourceAvailable} from './resource-world.mjs';
import {RESOURCE_RULES} from './living-config.mjs';
import {recordPickup} from './pickup-feedback.mjs';
import {harvestLeafForWorker} from './simulation.mjs';
// Jakob 3.11.: Liegt der Sauger an der Ladestation, wird der Saugerknopf zum Handknopf. Jedes Antippen hebt die nächste
// Sache im direkten Umkreis auf (Rucksack, nicht Saugtank). Vergrabenes, Vorkommen, Fische und Blobs gehen nicht von Hand.
export const HAND={reach:1.5};
// Jakob 6.11.: auch solange im neuen Spiel noch kein Sauger gekauft ist.
export const handMode=s=>Boolean(s.charging)||Boolean(s.intro&&!s.builtSites?.introVacuum);
function nearest(s){const p=s.player;let best=null,bd=HAND.reach;
 for(const r of s.resources??[]){if(r.status!=='ground'||r.focusOnly||r.sandCell||!resourceAvailable(s,r))continue;const d=Math.hypot(r.x-p.x,r.z-p.z);if(d<bd){bd=d;best={r,kind:r.reward?.kind??r.kind};}}
 const cells=s.leafIndex?.cells,cell=2.5;if(cells)for(let x=Math.floor((p.x-HAND.reach)/cell);x<=Math.floor((p.x+HAND.reach)/cell);x++)for(let z=Math.floor((p.z-HAND.reach)/cell);z<=Math.floor((p.z+HAND.reach)/cell);z++)for(const l of cells.get(x+','+z)??[]){if(l.status!=='ground'||l.gold)continue;const d=Math.hypot(l.x-p.x,l.z-p.z);if(d<bd){bd=d;best={leaf:l,kind:l.reward?.kind??'leaf'};}}
 return best;}
export function canHandPick(s){return handMode(s)&&normalCount(s)<normalCapacity(s)&&Boolean(nearest(s));}
export function handPickup(s){if(!handMode(s)||normalCount(s)>=normalCapacity(s))return false;const hit=nearest(s);if(!hit)return false;
 if(hit.leaf){if(!harvestLeafForWorker(s,hit.leaf))return false;(s.handLeaves??=[]).push(hit.leaf);if(s.intro)s.intro.hand=(s.intro.hand??0)+1;recordPickup(s,hit.kind,1,hit.leaf);}
 else{const r=hit.r,regen=RESOURCE_RULES[r.kind]?.regen??[35,50];r.status='gone';r.progress=0;r.respawnAt=s.time+regen[0]+Math.random()*(regen[1]-regen[0]);recordPickup(s,hit.kind,1,r);}
 addNormalMaterial(s,hit.kind,1);s.events?.push('leaf');return true;}
