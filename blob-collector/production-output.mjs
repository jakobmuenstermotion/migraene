import {PLANNED_ACCESSORIES} from './accessory-plan.mjs';
import {workshopSpec} from './crafting-config.mjs';
import {homeRegion} from './home-space.mjs';
import {addNormalMaterial,normalCount,normalCapacity} from './inventory.mjs';
import {CLOTHING} from './living-config.mjs';
import {pickupZone,workshopPose,sunnyHeight} from './sunny-area.mjs';
import {FURNITURE} from './crafting-config.mjs';
import {capacityFor,addMaterial,reservedBagSlots} from './inventory.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import {recordPickup} from './pickup-feedback.mjs';
export function productionExit(s,id='press'){const p=pickupZone(s,id);return {...p,y:sunnyHeight(p.x,p.z)+.6};}
export function outputNearby(s,id){if(s.area!=='sunny'||s.testWorld.enabled||s.nursery?.interior||Boolean(s.home?.interior)!==Boolean(workshopSpec(id)?.indoor&&homeRegion(s.placements?.[id]?.x??0,s.placements?.[id]?.z??0)))return false;const p=productionExit(s,id);return Math.hypot(s.player.x-p.x,s.player.z-p.z)<=p.radius&&Math.abs((s.player.y??0)-p.y)<1.8;}
export function readyOutputs(owner){return Object.entries(owner?.outputs??{}).filter(([,n])=>n>0);}
export function storeOutput(owner,kind,quantity){owner.outputs??={};owner.outputs[kind]=(owner.outputs[kind]??0)+quantity;}
export function collectOutputs(s,owner,id,now){if(!outputNearby(s,id))return false;let changed=false;for(const [kind,n]of readyOutputs(owner)){const backpack=/^backpack[1-5]$/.test(kind)?Number(kind.slice(8)):0,normalBag=/^normalbag[12]$/.test(kind)?Number(kind.slice(9)):0,headlamp=kind==='headlamp',clothing=Boolean(CLOTHING[kind]),blobAccessory=kind==='blobflowerwreath'||PLANNED_ACCESSORIES[kind]?.[1]==='blob',furniture=Boolean(FURNITURE[kind]),room=Math.max(0,normalCapacity(s)-normalCount(s)),take=headlamp||backpack||normalBag||clothing||blobAccessory||furniture?n:Math.min(n,room);if(!take)continue;if(headlamp){s.equipment.headlamp=true;}else if(normalBag){s.equipment.normalBag=Math.max(s.equipment.normalBag??0,normalBag);}else if(backpack){s.equipment.backpack=Math.max(s.equipment.backpack,backpack);s.skillRevision++;}else if(clothing){if(!s.equipment.owned.includes(kind))s.equipment.owned.push(kind);}else if(blobAccessory){s.forestBlobs.accessoryInventory[kind]=(s.forestBlobs.accessoryInventory[kind]??0)+take;}else if(furniture)s.crafting.loose[kind]=(s.crafting.loose[kind]??0)+take;else addNormalMaterial(s,kind,take);owner.outputs[kind]-=take;const out={kind,recipe:kind,quantity:take,workshop:id,at:now,id:owner.outputSerial=(owner.outputSerial??0)+1};owner.lastOutput=out;if(id!=='press')s.crafting.lastOutput=out;recordPickup(s,kind,take,productionExit(s,id));changed=true;}return changed;}
export function restoreOutputs(value){const out={};for(const [k,n]of Object.entries(value??{}))if(/^[a-z][a-z0-9]{0,30}$/.test(k)&&k!=='constructor'&&Number.isSafeInteger(n)&&n>0)out[k]=Math.min(n,1e9);return out;}
