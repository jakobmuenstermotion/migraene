import {WORLD} from './content.mjs';
import {BEDS,WORKSHOPS,VILLAGE} from './village-content.mjs';
import {HIVES} from './honey-content.mjs';
import {LAKE,COMPOST_WORKSHOP} from './outdoors.mjs';
import {BOUTIQUES} from './boutiques.mjs';
import {FARM_PLACES} from './snail-appearance.mjs';
import {expandedFieldCells,FIELD_EXPANSION_STEPS} from './field-expansion.mjs';
export const PATHS=[{id:'north-south',x:-7.5,z:6,width:3,depth:51},{id:'east-west',x:0,z:16,width:65,depth:3}];
export function rectOverlaps(a,b,margin=0){return Math.abs(a.x-b.x)<(a.width+b.width)/2+margin&&Math.abs(a.z-b.z)<(a.depth+b.depth)/2+margin;}
export function fieldBounds(bed,level=FIELD_EXPANSION_STEPS){
 const cells=expandedFieldCells(bed,level),xs=cells.map(c=>c.x),zs=cells.map(c=>c.z);
 return{id:bed.id,x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2,width:Math.max(...xs)-Math.min(...xs)+bed.spacing+.45,depth:Math.max(...zs)-Math.min(...zs)+bed.spacing+.4};
}
export const FULL_FIELDS=BEDS.map(b=>fieldBounds(b));
export const COSMETIC_PLACES={bench:{x:3,z:-12.8},arch:{x:-7.5,z:16},lanterns:[{x:-11,z:-23},{x:14,z:-25}]};
export const BUILDING_FOOTPRINTS=[
 {id:'bench',...COSMETIC_PLACES.bench,width:2.7,depth:.85},
 {id:'arch',...COSMETIC_PLACES.arch,width:3.6,depth:.4},
 ...COSMETIC_PLACES.lanterns.map((p,i)=>({id:'lantern:'+i,...p,width:.8,depth:.8})),
 ...WORKSHOPS.map(w=>({id:w.id,x:w.x,z:w.z,width:4,depth:3.3})),
 ...BOUTIQUES.map(w=>({id:w.id,x:w.x,z:w.z,width:3.9,depth:3})),
 ...HIVES.map(h=>({id:'hive:'+h.id,x:h.x+.3,z:h.z,width:2,depth:1.2})),
 {id:'bank-stall',x:WORLD.bank.x,z:WORLD.bank.z-2.3,width:4.5,depth:2.6},
 {id:'warehouse',x:VILLAGE.warehouse.x,z:VILLAGE.warehouse.z-1.5,width:2.8,depth:1.92},
 {id:'house',x:VILLAGE.partner.x,z:VILLAGE.partner.z,width:4.4,depth:4.4},
 {id:'nursery',x:VILLAGE.farm.x,z:VILLAGE.farm.z,width:8,depth:5.4},
 {id:'cottage',x:VILLAGE.farm.x-2.45,z:VILLAGE.farm.z-2.65,width:3.1,depth:2.24},
 {id:'kitchen',x:VILLAGE.farm.x+FARM_PLACES.kitchen[0],z:VILLAGE.farm.z+FARM_PLACES.kitchen[1],width:2.85,depth:2.4},
 {id:'sprinkler',x:VILLAGE.sprinkler.x,z:VILLAGE.sprinkler.z,width:1.5,depth:1.5},
 {id:'composter',x:COMPOST_WORKSHOP.x,z:COMPOST_WORKSHOP.z,width:3,depth:2.6},
 {id:'bus-stop',x:VILLAGE.bus.x+.375,z:VILLAGE.bus.z,width:6.25,depth:3.7},
 {id:'lake',x:LAKE.x,z:LAKE.z,width:LAKE.width,depth:LAKE.depth},
 {id:'fishing-pier',...LAKE.dock},
];
// Decorative objects reserve space for the final field size, even before upgrades.
export function sceneryClear(rect,pads=[]){return ![...FULL_FIELDS,...BUILDING_FOOTPRINTS,...PATHS,...pads.map(p=>({x:p.x,z:p.z,width:2.5,depth:2.2}))].some(r=>rectOverlaps(rect,r,.3));}
