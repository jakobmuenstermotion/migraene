import {COLLECTIBLES} from './content.mjs';
import {PRODUCTS} from './village-content.mjs';
import {HIVES} from './honey-content.mjs';
import {FISH} from './outdoors.mjs';
import {SNAILS} from './snail-farm.mjs';
const total=o=>Object.values(o??{}).reduce((n,x)=>n+(typeof x==='number'?x:x?.count??0),0);
export function warehouseCatalog(){return[
 ...Object.entries(COLLECTIBLES).map(([id,c])=>({id,name:c.plural,color:c.color,kind:'raw'})),
 ...Object.entries(PRODUCTS).map(([id,c])=>({id,name:c.plural,color:c.color,kind:id.endsWith('Honey')?'honey':id==='bouquet'?'bouquet':id==='giftbox'?'gift':id==='tea'?'tea':'product'})),
 ...FISH.map(f=>({id:'fish:'+f.id,name:f.name,color:f.color,kind:'fish'})),
 {id:'fertilizer',name:'Dünger',color:'#97b67b',kind:'bag'},
 {id:'food',name:'Schneckenfutter',color:'#a8bc7d',kind:'bag'},
 {id:'honeyFood',name:'Honigmahlzeiten',color:'#dabd75',kind:'bag'},
 ...HIVES.map(h=>({id:'snack:'+h.honey,name:h.name+'-Häppchen',color:h.color,kind:'bag'})),
 {id:'scrap',name:'Schrottteile',color:'#9aaba7',kind:'scrap'},
 {id:'treasure',name:'Kleinfunde',color:'#dbb77c',kind:'coin'},
 ...SNAILS.map(n=>({id:'shell:'+n.id,name:n.name+'nhäuser',color:n.color,kind:'shell'})),
];}
export function normalizeWarehouseGoods(raw){const goods={};for(const {id,kind}of warehouseCatalog()){const e=raw?.[id];if(kind==='raw'||!Number.isFinite(e?.count)||e.count<=0)continue;goods[id]={count:Math.min(e.count,1e9),value:Number.isFinite(e.value)&&e.value>=0?Math.min(e.value,1e100):0};}return goods;}
export function extraWarehouseCount(v){return HIVES.reduce((n,h)=>n+(v.finished?.[h.honey]??0),0)+total(v.storedGoods)+Number(v.farm?.storedFood??0)+Number(v.farm?.storedHoneyFood??0)+total(v.farm?.storedSnacks);}
export function takeStoredGood(v,id,count){const e=v.storedGoods?.[id],n=Math.min(Math.max(0,count),e?.count??0);if(!n)return{count:0,value:0};const value=e.value*n/e.count;e.count-=n;e.value-=value;if(e.count<1e-8)delete v.storedGoods[id];return{count:n,value};}
