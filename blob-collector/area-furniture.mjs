import {FURNITURE,placeableType} from './crafting-config.mjs';
import {wildGroupAt} from './wild-blob-behaviors.mjs';
import {homeRegion} from './home-space.mjs';
// Jakob 7.11.: Gebietsmöbel locken wilde Blobs an. Jedes passende Möbelstück, das draußen im eigenen Gebiet steht, erhöht dort die
// Erscheinungschance um 0,5 Prozentpunkte, höchstens +5 (ab 10 Stück). Testwerte.
export const AREA_BONUS={per:.005,max:.05};
export const AREA_LABEL={wald:'Wald',kueste:'Strand',berg:'Eis',vulkan:'Vulkan'};
export const AREA_THEME={
 wald:['woodlantern','campfire','woodstool','woodbench','forestswing','fencewood','snailsculpture'],
 kueste:['coastlantern','corallamp','coralvase','beachchair','beachbench','beachpavilion','shelltable','snailcoast'],
 berg:['icelamp','icebench','fencefrost','snowman','snailice','frostcabinet'],
 vulkan:['lavalamp','firebowl','basaltbench','fencebasalt','snaillava']};
export const furnitureArea=type=>Object.keys(AREA_THEME).find(g=>AREA_THEME[g].includes(type))??null;
let cache={rev:-1,placements:null,counts:{}};
export function areaFurnitureCounts(s){if(cache.rev===s.layoutRevision&&cache.placements===s.placements)return cache.counts;const counts={wald:0,kueste:0,berg:0,vulkan:0};
 for(const [id,p] of Object.entries(s.placements??{})){const g=furnitureArea(placeableType(id));if(!g||!FURNITURE[placeableType(id)]||homeRegion(p.x,p.z,2))continue;if(wildGroupAt(p.x,p.z)===g)counts[g]++;}
 cache={rev:s.layoutRevision,placements:s.placements,counts};return counts;}
export const areaFurnitureBonus=(s,group)=>Math.min(AREA_BONUS.max,(areaFurnitureCounts(s)[group]??0)*AREA_BONUS.per);
// Startpunkt beim Aufstellen draußen: im passenden Gebiet, falls schon besucht (sonst vor dem Haus).
const ANCHORS={kueste:{x:60,z:0},berg:{x:33,z:-52},vulkan:{x:-64,z:37}};
export function furnitureAnchor(s,id){const g=furnitureArea(placeableType(id));if(!g||!ANCHORS[g]||!s.forestBlobs?.wildSeen?.includes(g))return null;return ANCHORS[g];}
