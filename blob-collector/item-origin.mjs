import {resourceArea} from './blob-workers.mjs';
import {hasRecipe} from './production-tree.mjs';
import {FISH} from './fishing.mjs';
// Jakob 3.11.: Lager nach Herkunft sortieren. Liest die echten Fundorte aus der Welt, Produkte zählen als Produktion.
// Jakob 7.11.: Fische, Würmer und Schmetterlinge bekommen eine eigene Gruppe „Tiere“.
export const ORIGIN_GROUPS=[['forest','Wald'],['coast','Küste'],['mountain','Berg'],['volcano','Vulkan'],['animals','Tiere'],['product','Produktion']];
const AREA_GROUP={sunny:'forest',steinbach:'forest',mooswald:'forest',pilzhain:'forest',coast:'coast',ice:'mountain',volcano:'volcano'};
const WATER_GROUP={river:'forest',lake:'forest',sea:'coast',ice:'mountain',lava:'volcano'};
const FIXED={leaf:'forest',sand:'coast',snow:'mountain'};
const cache=new Map();
export function itemOrigin(s,kind){if(cache.has(kind))return cache.get(kind);let g=FIXED[kind]??(FISH[kind]||kind==='worm'||kind==='rareworm'||String(kind).startsWith('bf_')?'animals':null);
 if(!g&&hasRecipe(kind))g='product';
 if(!g){const spot=(s.resources??[]).find(r=>r.kind===kind)??(s.obstacles??[]).find(o=>o.kind===kind&&!o.route)??(s.iceDeposits??[]).find(d=>d.kind===kind);g=spot?AREA_GROUP[resourceArea(spot.x,spot.z)]??'forest':'forest';}
 cache.set(kind,g);return g;}
// Ab dieser Zahl verschiedener Sachen bekommt das Lager Überschriften.
export const GROUP_FROM=12;
export function groupByOrigin(s,kinds){const by=new Map(ORIGIN_GROUPS.map(([id])=>[id,[]]));for(const k of kinds)by.get(itemOrigin(s,k)).push(k);return ORIGIN_GROUPS.map(([id,name])=>[id,name,by.get(id)]).filter(([,,list])=>list.length);}
