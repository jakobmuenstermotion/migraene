import {completeGoal} from './goal-state.mjs';
import {roundCoins} from './game-balance.mjs';
import {wardrobeNearby} from './home-space.mjs';
import {removeMaterial} from './inventory.mjs';
import {chargerNearby} from './charging.mjs';
import {CLOTHING,EQUIPMENT_UPGRADES} from './living-config.mjs';
export const GEAR_SLOTS=['shoes','jacket','head','accessory'];
export function createEquipment(){return {battery:0,backpack:0,normalBag:0,headlamp:false,owned:[],slots:{shoes:null,jacket:null,head:null,accessory:null}};}
export function gearEffects(s){const e=s.equipment??createEquipment(),out={speed:1,bag:1,battery:1,fish:1,explorer:false};for(const slot of GEAR_SLOTS){const b=CLOTHING[e.slots[slot]]?.bonus??{};out.speed*=b.speed??1;out.bag*=b.bag??1;out.battery*=b.battery??1;out.fish=Math.min(out.fish,b.fish??1);out.explorer||=Boolean(b.explorer);}out.bag*=EQUIPMENT_UPGRADES.backpack[e.backpack-1]?.factor??1;return out;}
export function applyBatteryCapacity(s){s.battery.baseMax??=s.battery.max;const max=s.battery.baseMax*gearEffects(s).battery;s.battery.max=max;s.battery.charge=Math.max(0,Math.min(max,s.battery.charge));if(s.batteryBank){s.batteryBank.cells=s.batteryBank.cells.map(v=>Math.max(0,Math.min(max,v)));s.batteryBank.cells[s.batteryBank.active]=s.battery.charge;}return max;}
export function equipmentBusy(s){return Boolean(s.anchorPull||s.flight.active||s.charging||s.forestBlobs?.fusionScene&&s.time-s.forestBlobs.fusionScene.at<2.4||s.pullingLeaves?.length||s.resources?.some(r=>r.status==='pulling')||s.fishing?.encounters.some(e=>e.status==='jumping'&&e.progress>0));}
export function equipClothing(s,id,slot=CLOTHING[id]?.slot){const e=s.equipment;/* Jakob 9.11.: Umziehen auch, während der Sauger an der Ladestation steht (das ist zu Hause fast immer so). */if(!e||!wardrobeNearby(s)||!GEAR_SLOTS.includes(slot)||equipmentBusy({...s,charging:null})||id!==null&&(!e.owned.includes(id)||CLOTHING[id]?.slot!==slot))return false;e.slots[slot]=id;applyBatteryCapacity(s);s.skillRevision++;return true;}
export function affordEquipment(s,spec){return spec&&s.inventory.coins>=spec.coins&&Object.entries(spec.cost).every(([k,n])=>(s.inventory.bag[k]??0)>=n);}
export function spendEquipment(s,spec){if(!affordEquipment(s,spec))return false;for(const [k,n]of Object.entries(spec.cost)){removeMaterial(s,k,n);}s.inventory.coins=roundCoins(s.inventory.coins-spec.coins);completeGoal(s,spec.cost,spec.coins);return true;}
// Capacity stages are retired; battery-bank.mjs owns the new station upgrades.
export function buyEquipmentUpgrade(){return false;}
export function restoreEquipment(s,data){const e=s.equipment=createEquipment();for(const kind of ['battery','backpack'])e[kind]=Math.max(0,Math.min(5,Math.floor(Number(data?.[kind])||0)));e.battery=0;e.normalBag=Math.max(0,Math.min(2,Math.floor(Number(data?.normalBag)||0)));e.headlamp=Boolean(data?.headlamp);e.owned=[...new Set((Array.isArray(data?.owned)?data.owned:[]).filter(k=>CLOTHING[k]))];for(const slot of GEAR_SLOTS){const id=data?.slots?.[slot];if(e.owned.includes(id)&&CLOTHING[id].slot===slot)e.slots[slot]=id;}applyBatteryCapacity(s);}
// Jakob 3.11.: Kleidung nach Nutzen und reinem Aussehen getrennt, nicht alles gleich sichtbar.
// Nützliches erscheint als Kette je Platz und Wirkung (das nächste erst, wenn das vorige genäht wurde),
// Schickes zeigt je Platz zwei Stücke und eins mehr für jedes schon genähte.
export const isCosmetic=id=>Boolean(CLOTHING[id])&&!Object.keys(CLOTHING[id].bonus??{}).length;
export function clothingVisible(s,id){const c=CLOTHING[id];if(!c)return true;const owned=s.equipment?.owned??[];if(owned.includes(id))return true;
 if(isCosmetic(id)){const same=Object.keys(CLOTHING).filter(k=>isCosmetic(k)&&CLOTHING[k].slot===c.slot);return same.indexOf(id)<2+same.filter(k=>owned.includes(k)).length;}
 const key=k=>CLOTHING[k].slot+':'+Object.keys(CLOTHING[k].bonus)[0],chain=Object.keys(CLOTHING).filter(k=>!isCosmetic(k)&&key(k)===key(id)).sort((a,b)=>CLOTHING[a].coins-CLOTHING[b].coins),i=chain.indexOf(id);return i<=0||owned.includes(chain[i-1]);}
