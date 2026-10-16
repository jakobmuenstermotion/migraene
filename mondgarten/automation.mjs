import {advanceWoodcock} from './woodcock.mjs';
import {materialHarvestRemaining,fundingProgress} from './funding.mjs';
import {growthFactor} from './journey.mjs';
import {BEDS,WORKSHOPS,VILLAGE,PRODUCTS} from './village-content.mjs';
import {WORLD} from './content.mjs';
import {availableProducts,depositRaw,bedYield,bedRegrow,stockCount,storageCapacity,collectProducts,takeBag,takeStoredRaw} from './village.mjs';
import {capacity} from './core.mjs';
import {credit} from './money.mjs';
function walk(actor,target,speed,dt){const dx=target.x-actor.x,dz=target.z-actor.z,d=Math.hypot(dx,dz);actor.moving=d>.16;if(!actor.moving)return true;actor.x+=dx/d*Math.min(d,speed*dt);actor.z+=dz/d*Math.min(d,speed*dt);let a=Math.atan2(dx,dz);while(a-actor.angle>Math.PI)a-=Math.PI*2;while(a-actor.angle<-Math.PI)a+=Math.PI*2;actor.angle=a;return d<Math.max(.2,speed*dt);}
export class GardenAutomation {
  constructor(s){this.snails=[];this.snailClock=0;this.partner={x:VILLAGE.partner.x,z:VILLAGE.partner.z+2,angle:0,moving:false,visible:s.village.partner,bag:0};this.partnerJob='';this.sync(s);}
  sync(s){const beds=BEDS.map((b,i)=>({...b,index:i})).filter(b=>s.village.beds[b.index]);while(this.snails.length<s.village.snails){const i=this.snails.length,b=beds[i%beds.length],load=s.village.snailLoads?.[i],items={...(load?.items??{})},values={...(load?.values??{})};this.snails.push({x:load?.x??b.x,z:load?.z??b.z+b.rows*b.spacing*.45,angle:0,moving:false,target:null,bed:b.index,items,values,bag:Object.values(items).reduce((a,b)=>a+b,0),timer:0,mode:load?.mode??'graze'});}this.snails.length=s.village.snails;this.partner.visible=s.village.partner;for(const [i,a]of this.snails.entries()){a.level=s.village.snailLevel;a.species=s.village.farm.helpers[i]??null;}}
  snapshot(s){s.village.snailLoads=this.snails.map(a=>({x:a.x,z:a.z,items:{...a.items},values:{...a.values},mode:a.mode}));}
  update(s,cells,player,dt,time){const events=advanceWoodcock(s,dt),v=s.village;this.sync(s);this.snapshot(s);const beds=BEDS.map((b,i)=>({...b,index:i})).filter(b=>v.beds[b.index]);
    for(let i=0;i<this.snails.length;i++){const snail=this.snails[i],speed=Math.min(3,VILLAGE.snail.speed*Math.pow(1.18,v.snailLevel));
      if(snail.mode==='deliver'){if(walk(snail,VILLAGE.warehouse,speed*1.25,dt)){for(const id of Object.keys(snail.items)){const count=snail.items[id],accepted=depositRaw(s,id,count,snail.values[id]);snail.items[id]-=accepted;snail.values[id]*=count?Math.max(0,1-accepted/count):0;snail.bag-=accepted;if(accepted>0)events.push({kind:'warehouseDelivery',x:snail.x,z:snail.z});}if(snail.bag<.01){snail.items={};snail.values={};snail.bag=0;snail.mode='graze';snail.target=null;}}continue;}
      if(growthFactor(s)<=0){snail.moving=false;if(snail.bag>0)snail.mode='deliver';continue;}if(stockCount(v)>=storageCapacity(s)){snail.moving=false;continue;}snail.bed=beds[i%beds.length].index;
      if(snail.target&&player&&Math.hypot(snail.target.x-player.x,snail.target.z-player.z)<VILLAGE.snail.playerSpace)snail.target=null;
      if(!snail.target||snail.target.readyAt>time||snail.target.bed!==snail.bed){snail.target=cells.filter(p=>p.bed===snail.bed&&p.readyAt<=time&&(!player||Math.hypot(p.x-player.x,p.z-player.z)>=VILLAGE.snail.playerSpace)&&materialHarvestRemaining(s,p.crop)>0).sort((a,b)=>Math.hypot(a.x-snail.x,a.z-snail.z)-Math.hypot(b.x-snail.x,b.z-snail.z))[0]??null;}
      if(!snail.target){snail.moving=false;if(snail.bag>0)snail.mode='deliver';continue;}if(walk(snail,snail.target,speed,dt)){snail.timer+=dt;if(snail.timer>=Math.max(.12,(BEDS[snail.bed].pickSeconds??VILLAGE.snail.harvestSeconds)/Math.pow(1.18,v.snailLevel))){snail.timer=0;const cell=snail.target;if(cell.readyAt<=time&&materialHarvestRemaining(s,cell.crop)>0){const count=Math.min(cell.rare?2:1,materialHarvestRemaining(s,cell.crop)),value=count*bedYield(s,cell.bed);cell.cutAt=time;cell.readyAt=time+bedRegrow(s,cell.bed);snail.items[cell.crop]=(snail.items[cell.crop]??0)+count;snail.values[cell.crop]=(snail.values[cell.crop]??0)+value;snail.bag+=count;s.stats.harvested+=count;s.stats.runHarvested+=count;events.push({kind:'snail',x:cell.x,z:cell.z});}snail.target=null;if(snail.bag>=VILLAGE.snail.capacity+v.snailLevel*2)snail.mode='deliver';}}
    }
    this.snapshot(s);const p=this.partner;p.visible=v.partner;if(!v.partner)return events;const cargo=v.hauler,count=Object.values(cargo.items).reduce((a,b)=>a+b,0);p.bag=count;p.productID=cargo.kind==='finished'?Object.keys(cargo.items).find(id=>PRODUCTS[id])??null:null;
    if(count>0){const target=cargo.kind==='finished'?WORLD.bank:VILLAGE.warehouse;if(walk(p,target,VILLAGE.partner.speed,dt)){if(cargo.kind==='finished'){const value=Object.values(cargo.values).reduce((a,b)=>a+b,0);credit(s,value);v.autoSold+=count;events.push({kind:'partnerSale',value});v.hauler={kind:'',items:{},values:{}};p.bag=0;}else{for(const id of Object.keys(cargo.items)){const accepted=depositRaw(s,id,cargo.items[id],cargo.values[id]);const before=cargo.items[id];cargo.items[id]-=accepted;cargo.values[id]*=before?1-accepted/before:0;if(accepted>0)events.push({kind:'warehouseDelivery',x:p.x,z:p.z});}if(Object.values(cargo.items).every(x=>x<1e-6)){v.hauler={kind:'',items:{},values:{}};p.bag=0;}}}return events;}
    const product=Object.keys(PRODUCTS).find(id=>availableProducts(s,id,true)>0);
    if(product){const w=WORKSHOPS.find(w=>w.product===product);if(walk(p,{x:w.x,z:w.z+1.4},VILLAGE.partner.speed,dt)){const batch=collectProducts(s,VILLAGE.partner.capacity,true,product);v.hauler={kind:'finished',items:batch.items,values:batch.values};}return events;}
    if(fundingProgress(s)>=1&&Object.values(v.raw).some(n=>n>0)){if(walk(p,VILLAGE.warehouse,VILLAGE.partner.speed,dt)){const batch=takeStoredRaw(s,VILLAGE.partner.capacity);v.hauler={kind:'finished',items:batch.items,values:batch.values};}return events;}
    if(player&&s.bag>=capacity(s)*.5&&stockCount(v)<storageCapacity(s)){if(walk(p,player,VILLAGE.partner.speed,dt)){const batch=takeBag(s,Math.min(VILLAGE.partner.capacity,storageCapacity(s)-stockCount(v)));v.hauler={kind:'raw',items:batch.items,values:batch.values};events.push({kind:'partnerCollect',value:batch.count});}return events;}
    walk(p,{x:VILLAGE.warehouse.x-1,z:VILLAGE.warehouse.z+1.5},2.4,dt);return events;
  }
  returnSnailCargo(s){for(const snail of this.snails)for(const id of Object.keys(snail.items)){// preserve carried harvest when saving/closing; it joins the common supply
    const count=snail.items[id],accepted=depositRaw(s,id,count,snail.values[id]);if(accepted>0){snail.items[id]-=accepted;snail.values[id]*=1-accepted/count;snail.bag-=accepted;}
  }}
}


