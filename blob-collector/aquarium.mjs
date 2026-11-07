import {FURNITURE,placeableType} from './crafting-config.mjs';
import {FISH} from './fishing.mjs';
import {BUTTERFLIES} from './butterflies.mjs';
import {removeMaterial,addNormalMaterial} from './inventory.mjs';
import {inHome,homeRegion} from './home-space.mjs';
// Neugestaltung (Jakob 29.10.): gefangene Fische können in Aquarien leben (klein 2, groß 8). Im Aquarium werden sie
// nicht verkauft; herausnehmen legt sie in den normalen Rucksack zurück, beim Einpacken gehen sie ins Lager.
export function tankCapacity(id){return FURNITURE[placeableType(id)]?.fishTank??0;}
export function aquariumNearby(s,range=2.6){let best=null,d=Infinity;for(const [id,p]of Object.entries(s.placements??{})){const cap=tankCapacity(id);if(!cap||homeRegion(p.x,p.z)!==inHome(s))continue;const f=FURNITURE[placeableType(id)],r=Math.hypot(p.x-s.player.x,p.z-s.player.z),edge=r-(f.outdoor?f.w/2-range+1.5:0);if(edge<range&&edge<d){d=edge;best=id;}}return best;}
export function tankFish(s,id){return (s.aquariums??={})[id]??=[];}
// Jakob 6.11.: Die Schmetterlingsvitrine funktioniert wie ein Aquarium (10 Plätze), nimmt aber nur Schmetterlinge (bf_…) aus dem Rucksack; man wählt selbst, welche hineinkommen.
export const isCase=id=>placeableType(id)==='butterflycase';
export const isBfItem=k=>typeof k==='string'&&k.startsWith('bf_')&&Boolean(BUTTERFLIES[k.slice(3)]);
export const tankAccepts=(id,k)=>isCase(id)?isBfItem(k):Boolean(FISH[k]);
export function addFishToTank(s,id,kind){if(!tankAccepts(id,kind)||!s.placements?.[id])return false;const list=tankFish(s,id);if(list.length>=tankCapacity(id)||(s.inventory.bag[kind]??0)<1||!removeMaterial(s,kind,1))return false;list.push(kind);return true;}
export function takeFishFromTank(s,id,index){const list=tankFish(s,id),kind=list[index];if(!kind||addNormalMaterial(s,kind,1)!==1)return false;list.splice(index,1);return true;}
export function emptyTankToStorage(s,id){const list=s.aquariums?.[id];if(!list?.length)return 0;for(const kind of list)s.inventory.storage[kind]=(s.inventory.storage[kind]??0)+1;const n=list.length;delete s.aquariums[id];s.stored=Object.values(s.inventory.storage).reduce((a,b)=>a+b,0);return n;}
export function aquariumSnapshot(s){return Object.fromEntries(Object.entries(s.aquariums??{}).filter(([,l])=>l.length));}
export function restoreAquariums(s,data){s.aquariums={};for(const [id,list] of Object.entries(data??{}))if(/^(aquarium|bigaquarium|pond|butterflycase)_[1-9][0-9]{0,5}$/.test(id)&&Array.isArray(list))s.aquariums[id]=list.filter(k=>tankAccepts(id,k)).slice(0,tankCapacity(id));}
