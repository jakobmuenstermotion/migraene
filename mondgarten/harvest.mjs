import {fertilizerValue} from './outdoors.mjs';
import {expandedFieldCells} from './field-expansion.mjs';
import {materialHarvestRemaining} from './funding.mjs';
import {WORLD,getCrop,generateFieldCells,stackLayers,COLLECTIBLES} from './content.mjs';
import {BEDS,VILLAGE} from './village-content.mjs';
import {bedYield,bedRegrow,takeBag,productCargoCount} from './village.mjs';
import {capacity,reach,harvestBatch,yieldValue,earn} from './core.mjs';
import {harvestingAllowed} from './journey.mjs';

export function createField(gardenIndex=0){
  const crop=getCrop(gardenIndex);
  return generateFieldCells().map((p,i)=>({...p,id:i,readyAt:0,cutAt:-100,
    variation:.88+(Math.sin(i*127.1+13)*43758.5453%1+1)%1*.23,
    rare:((Math.sin(i*331.7+gardenIndex*17+7)*19427.13%1+1)%1)<crop.rareChance}));
}
export function createVillageField(s,previous=[]){const before=new Map(previous.map(p=>[p.key,p]));let id=0;return BEDS.flatMap((bed,index)=>{if(!s.village.beds[index])return[];return expandedFieldCells(bed,s.village.expansions[index]).map((p,i)=>{const key=bed.id+':'+i,old=before.get(key)??s.village.fieldCuts?.[key],crop=COLLECTIBLES[bed.crop];return{...p,field:index,bed:index,crop:bed.crop,key,id:id++,readyAt:old?.readyAt??0,cutAt:old?.cutAt??-100,variation:.9+((Math.sin(i*127.1+index)*43758.5453%1+1)%1)*.2,rare:((Math.sin(i*331.7+index*17+7)*19427.13%1+1)%1)<crop.rareChance};});});}

export function harvestAt(s,cells,x,z,time,eventMultiplier=1,{moving=false,dt=0}={}){
  for(const cell of cells){const bed=BEDS[cell.bed];if(bed?.pickSeconds&&(moving||Math.hypot(cell.x-x,cell.z-z)>1.15))cell.pickProgress=0;}
  if(s.outdoors?.harvestMode==='fertilizer')return [];
  const free=capacity(s)-s.bag-productCargoCount(s);if(free<=0||!harvestingAllowed(s))return [];
  const radius=reach(s)/38,crop=getCrop(s.biome),max=harvestBatch(s),picked=[];
  for(const cell of cells){
    if(picked.length>=max||s.bag+productCargoCount(s)>=capacity(s))break;
    if(materialHarvestRemaining(s,cell.crop??'moonbloom')<=0)continue;if(cell.readyAt>time||Math.hypot(cell.x-x,cell.z-z)>radius)continue;
    const bed=BEDS[cell.bed];if(bed?.mineHits){if(moving||Math.hypot(cell.x-x,cell.z-z)>1.15){cell.mineProgress=0;continue;}cell.mineProgress=(cell.mineProgress??0)+Math.max(0,dt);if(cell.mineProgress<bed.mineSeconds)continue;cell.mineProgress=0;cell.mineHits=(cell.mineHits??0)+1;if(cell.mineHits<bed.mineHits+(cell.rare?2:0)){picked.push({cell,units:0,value:0,mining:true,hit:cell.mineHits,rare:false});continue;}cell.mineHits=0;}if(bed?.pickSeconds){if(moving||Math.hypot(cell.x-x,cell.z-z)>1.15)continue;cell.pickProgress=(cell.pickProgress??0)+Math.max(0,dt);if(cell.pickProgress<bed.pickSeconds)continue;cell.pickProgress=0;}
    const units=Math.min(capacity(s)-s.bag-productCargoCount(s),bed?.pickUnits?(cell.rare?2:1)*bed.pickUnits:cell.rare?3:1,materialHarvestRemaining(s,cell.crop??'moonbloom')),value=(cell.crop?bedYield(s,cell.bed)*VILLAGE.manualBonus:yieldValue(s))*units*eventMultiplier*(cell.rare?2:1)*fertilizerValue(s,cell);
    cell.cutAt=time;cell.readyAt=time+(cell.crop?bedRegrow(s,cell.bed):crop.regrowSeconds);s.bag+=units;s.bagValue+=value;s.stats.harvested+=units;s.stats.runHarvested+=units;
    const id=cell.crop??'moonbloom';s.cargo??={};s.cargo[id]??={count:0,value:0};s.cargo[id].count+=units;s.cargo[id].value+=value;
    picked.push({cell,units,value,rare:cell.rare});
  }
  return picked;
}

/** Sell visibly, one bundle at a time. Never lose the fractional final value. */
export function unload(s,units){
  if(s.bag<=0||s.bagValue<=0)return {units:0,value:0};
  const batch=takeBag(s,Math.max(0,units));earn(s,batch.value);return{units:batch.count,value:batch.value};
}

export function cropGrowth(cell,time){
  if(cell.readyAt<=time)return 1;
  // Keep a readable cut swath for most of the regrowth period.
  const progress=(time-cell.cutAt)/(cell.readyAt-cell.cutAt);
  return progress<.7?.035:.035+.965*Math.pow((progress-.7)/.3,1.5);
}

export function clampWorld(position){const b=WORLD.halfSize-1;position.x=Math.max(-b,Math.min(b,position.x));position.z=Math.max(-b,Math.min(b,position.z));return position;}
export function inBank(x,z){return Math.hypot(x-WORLD.bank.x,z-WORLD.bank.z)<WORLD.bank.radius;}
export function visibleStack(amount,bagCapacity){return stackLayers(amount,bagCapacity);}


