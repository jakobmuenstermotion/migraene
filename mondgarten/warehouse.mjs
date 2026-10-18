import {capacity} from './core.mjs';
import {ensureCargo,stockCount,storageCapacity,productCargoCount} from './village.mjs';
import {warehouseCatalog} from './warehouse-stock.mjs';
import {FARM} from './snail-farm.mjs';
const total=o=>Object.values(o??{}).reduce((n,x)=>n+(typeof x==='number'?x:x?.count??0),0);
const active=s=>s.journey.round>0&&!s.journey.asleep;
// References retain the original numeric values. Warehouse products are distinct
// from uncollected workshop outputs; storing a box must not create another pickup.
function carried(s,item){const v=s.village,f=v.farm,o=s.outdoors,id=item.id;
 if(item.kind==='raw'){ensureCargo(s);return{count:()=>s.cargo[id]?.count??0,value:()=>s.cargo[id]?.value??0,change:(n,value)=>{s.cargo[id]??={count:0,value:0};s.cargo[id].count+=n;s.cargo[id].value+=value;s.bag+=n;s.bagValue+=value;if(s.cargo[id].count<1e-8)delete s.cargo[id];if(s.bag<1e-8){s.bag=0;s.bagValue=0;s.cargo={};}}};}
 let counts,values,key=id,object,numberKey,valueKey;
 if(['food','honeyFood'].includes(id)){object=f;numberKey=id;valueKey=id+'Value';}
 else if(id.startsWith('snack:')){key=id.slice(6);f.snacks[key]??={count:0,value:0};object=f.snacks[key];numberKey='count';valueKey='value';}
 else if(id.startsWith('fish:')){key=id.slice(5);counts=o.fish;values=o.fishValues;}
 else if(id.startsWith('shell:')){key=id.slice(6);counts=f.shells;}
 else if(id==='fertilizer'||id==='scrap'){object=o;numberKey=id;}
 else if(id==='treasure'){object=o;numberKey='treasures';valueKey='treasureValue';}
 else{counts=s.productCargo.items;values=s.productCargo.values;}
 if(object)return{count:()=>object[numberKey]??0,value:()=>valueKey?object[valueKey]??0:0,change:(n,value)=>{object[numberKey]=(object[numberKey]??0)+n;if(valueKey)object[valueKey]=(object[valueKey]??0)+value;}};
 return{count:()=>counts[key]??0,value:()=>values?.[key]??0,change:(n,value)=>{counts[key]=(counts[key]??0)+n;if(values)values[key]=(values[key]??0)+value;}};
}
function storageRefs(s,item){const v=s.village,f=v.farm,id=item.id;
 if(item.kind==='raw')return[{count:()=>v.raw[id]??0,value:()=>v.rawValues[id]??0,change:(n,value)=>{v.raw[id]=(v.raw[id]??0)+n;v.rawValues[id]=(v.rawValues[id]??0)+value;}}];
 if(id==='food'||id==='honeyFood'){const key=id==='food'?'storedFood':'storedHoneyFood';return[{count:()=>f[key]??0,value:()=>f[key+'Value']??0,change:(n,value)=>{f[key]=(f[key]??0)+n;f[key+'Value']=(f[key+'Value']??0)+value;}}];}
 if(id.startsWith('snack:')){const key=id.slice(6);return[{count:()=>f.storedSnacks[key]?.count??0,value:()=>f.storedSnacks[key]?.value??0,change:(n,value)=>{f.storedSnacks[key]??={count:0,value:0};f.storedSnacks[key].count+=n;f.storedSnacks[key].value+=value;}}];}
 v.storedGoods??={};const refs=[{count:()=>v.storedGoods[id]?.count??0,value:()=>v.storedGoods[id]?.value??0,change:(n,value)=>{const e=v.storedGoods[id]??={count:0,value:0};e.count+=n;e.value+=value;if(e.count<1e-8)delete v.storedGoods[id];}}];
 // Earlier saves stored honey in finished stock, with the same warehouse source.
 if(item.kind==='honey')refs.push({count:()=>v.finished[id]??0,value:()=>v.finishedValues[id]??0,change:(n,value)=>{v.finished[id]=(v.finished[id]??0)+n;v.finishedValues[id]=(v.finishedValues[id]??0)+value;}});
 return refs;
}
export function warehouseEntries(s){return warehouseCatalog().map(item=>{const refs=storageRefs(s,item);return{...item,count:refs.reduce((n,r)=>n+r.count(),0),value:refs.reduce((n,r)=>n+r.value(),0)};}).filter(e=>e.count>1e-8);}
export function carriedWarehouseCount(s){const f=s.village.farm,o=s.outdoors;return s.bag+productCargoCount(s)+f.food+f.honeyFood+total(f.snacks)+total(f.shells)+total(o.fish)+o.fertilizer+o.scrap+o.treasures;}
export function depositWarehouse(s,limit=Infinity){const result={count:0,value:0,items:[]};if(!active(s)||limit!==Infinity&&(!Number.isFinite(limit)||limit<=0))return result;let room=Math.min(limit,Math.max(0,storageCapacity(s)-stockCount(s.village)));
 for(const item of warehouseCatalog()){if(room<1e-8)break;const from=carried(s,item),before=from.count(),n=item.kind==='raw'?Math.min(before,room):Math.floor(Math.min(before,room)+1e-8);if(n<1e-8)continue;const value=from.value()*n/before;from.change(-n,-value);storageRefs(s,item)[0].change(n,value);room-=n;result.count+=n;result.value+=value;result.items.push({...item,count:n,value});}
 if(s.outdoors.fertilizer===0&&s.outdoors.harvestMode==='fertilizer')s.outdoors.harvestMode='scythe';
 return result;
}
export function warehouseCarryRoom(s,id){const item=warehouseCatalog().find(e=>e.id===id);if(!item)return 0;
 if(item.kind==='raw')return Math.max(0,capacity(s)-s.bag-productCargoCount(s));
 if(['honey','bouquet','gift','tea','product'].includes(item.kind))return Math.max(0,Math.floor(capacity(s)-s.bag-productCargoCount(s)+1e-8));
 if(item.kind==='fish')return Math.max(0,100-total(s.outdoors.fish));
 if(item.kind==='shell')return Math.max(0,FARM.maxShells-total(s.village.farm.shells));
 if(item.kind==='bag'&&id!=='fertilizer')return Math.max(0,FARM.foodMax-s.village.farm.food-s.village.farm.honeyFood-total(s.village.farm.snacks));
 return Math.max(0,(id==='fertilizer'?99:1000)-carried(s,item).count());
}
export function withdrawWarehouse(s,id,requested){const result={count:0,value:0};if(!active(s)||!Number.isFinite(requested)||requested<=0)return result;const item=warehouseCatalog().find(e=>e.id===id);if(!item)return result;const refs=storageRefs(s,item);const stock=refs.reduce((n,r)=>n+r.count(),0);let left=Math.min(item.kind==='raw'?requested:Math.floor(requested),warehouseCarryRoom(s,id),item.kind==='raw'?stock:Math.floor(stock+1e-8));
 const to=carried(s,item);for(const from of refs){const before=from.count(),n=Math.min(left,before);if(!n)continue;const value=from.value()*n/before;from.change(-n,-value);to.change(n,value);left-=n;result.count+=n;result.value+=value;}return result;
}
// A completed withdrawal is protected until the player leaves the warehouse.
export class WarehouseVisit{
 constructor(){this.reset();}reset(){this.hold=false;this.opened=false;this.dwell=0;}
 tick({near,moving,blocked,carrying,dt}){if(!near){this.reset();return null;}if(blocked||moving||dt<=0){this.dwell=0;return null;}if(this.hold)return null;if(carrying>1e-8){this.dwell=0;return'deposit';}if(!this.opened&&(this.dwell+=dt)>=.8){this.opened=true;return'open';}return null;}
 withdrawn(){this.hold=true;this.opened=true;}dismiss(){this.opened=true;this.dwell=0;}
}
