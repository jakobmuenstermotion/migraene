import {WORLD,COLLECTIBLES,stackLevels} from './content.mjs';
import {PRODUCTS} from './village-content.mjs';
const positive=n=>Number.isFinite(n)&&n>1e-8?n:0;
// Stable catalog order: raw harvest below every finished product. A tiny product
// stack still gets one visible bundle instead of disappearing among the flowers.
export function carriedStackEntries(raw={},products={}){
 return [
  ...Object.keys(COLLECTIBLES).map(id=>({id,kind:'raw',count:positive(typeof raw?.[id]==='number'?raw[id]:raw?.[id]?.count)})),
  ...Object.keys(PRODUCTS).map(id=>({id,kind:'product',count:positive(products?.[id])})),
 ].filter(e=>e.count>0);
}
export function cargoStackLayout(entries,capacity,config=WORLD.stack){
 const total=entries.reduce((n,e)=>n+e.count,0),levels=stackLevels(total,capacity,config);
 if(!levels||!entries.length)return{levels:0,layers:[]};
 const budget=Math.max(entries.length,Math.ceil(levels)),extra=budget-entries.length;
 const groups=entries.map((e,index)=>{const quota=extra*e.count/total;return{...e,index,slots:1+Math.floor(quota),remainder:quota-Math.floor(quota)};});
 let left=budget-groups.reduce((n,e)=>n+e.slots,0);
 for(const e of [...groups].sort((a,b)=>b.remainder-a.remainder||a.index-b.index)){if(left--<=0)break;e.slots++;}
 const height=levels/budget;
 return{levels,layers:groups.flatMap(e=>Array.from({length:e.slots},()=>({id:e.id,kind:e.kind,count:e.count/e.slots,height})))};
}
