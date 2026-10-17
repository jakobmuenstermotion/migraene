import {credit} from './money.mjs';
export const BUTTERFLIES=[
 {id:'moon',name:'Mondweißling',color:'#f3edd2'},
 {id:'lavender',name:'Lavendelfalter',color:'#bb91e4'},
 {id:'coral',name:'Korallenfuchs',color:'#ed9c8e'},
 {id:'sun',name:'Goldflügel',color:'#f3cc65'},
 {id:'blue',name:'Sternenbläuling',color:'#88bfe8'},
];
export const FLOWER_CROPS=['moonbloom','lavender','coral','sunbloom'];
export const GLOW_SECONDS=6,BUTTERFLY_MIN_SECONDS=600;
const finite=(v,fallback,max)=>Number.isFinite(v)&&v>=0?Math.min(v,max):fallback;
const delay=(min,span,random)=>min+Math.max(0,Math.min(.999999,random()))*span;
export function freshHarvestMoments(){return{glowWait:40,glow:null,butterflyWait:BUTTERFLY_MIN_SECONDS,flowerPicks:0,found:[],wingsUnlocked:false,wearer:null};}
export function normalizeHarvestMoments(raw,snails){
 const m=freshHarvestMoments();
 m.glowWait=finite(raw?.glowWait,40,65);
 m.butterflyWait=finite(raw?.butterflyWait,BUTTERFLY_MIN_SECONDS,1000);
 m.flowerPicks=Math.floor(finite(raw?.flowerPicks,0,120));
 m.found=BUTTERFLIES.filter(b=>raw?.found?.includes?.(b.id)).map(b=>b.id);
 m.wingsUnlocked=m.found.length===BUTTERFLIES.length;
 m.wearer=m.wingsUnlocked&&Number.isInteger(raw?.wearer)&&raw.wearer>=0&&raw.wearer<snails?raw.wearer:null;
 return m;
}
export function advanceHarvestMoments(s,cells,player,dt,time,random=Math.random){
 const m=s.harvestMoments;if(!m||dt<=0||s.journey.asleep||s.journey.round===0)return null;
 m.butterflyWait=Math.max(0,m.butterflyWait-dt);
 if(m.glow){m.glow.remaining-=dt;const cell=cells.find(c=>c.key===m.glow.key);if(m.glow.remaining<=0||!cell||cell.readyAt>time)m.glow=null;return null;}
 m.glowWait=Math.max(0,m.glowWait-dt);if(m.glowWait>0)return null;
 const candidates=cells.filter(c=>FLOWER_CROPS.includes(c.crop)&&c.readyAt<=time&&Math.hypot(c.x-player.x,c.z-player.z)>=3&&Math.hypot(c.x-player.x,c.z-player.z)<=9);
 if(!candidates.length)return null;
 const cell=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
 m.glow={key:cell.key,remaining:GLOW_SECONDS};m.glowWait=delay(35,30,random);return cell;
}
export function recordManualHarvest(s,picks,random=Math.random){
 const m=s.harvestMoments,events=[];
 for(const pick of picks){if(pick.units<=0||!FLOWER_CROPS.includes(pick.cell.crop))continue;
  m.flowerPicks=Math.min(120,m.flowerPicks+pick.units);
  if(m.glow?.key===pick.cell.key&&m.glow.remaining>0){const bonus=pick.value*.5;credit(s,bonus);events.push({kind:'glow',cell:pick.cell,value:bonus});m.glow=null;}
  if(m.butterflyWait<=0&&m.flowerPicks>=120){
   const butterfly=BUTTERFLIES[Math.min(4,Math.floor(random()*BUTTERFLIES.length))],isNew=!m.found.includes(butterfly.id);
   if(isNew)m.found.push(butterfly.id);
   const reward=!m.wingsUnlocked&&m.found.length===BUTTERFLIES.length;
   if(reward)m.wingsUnlocked=true;
   m.butterflyWait=delay(BUTTERFLY_MIN_SECONDS,400,random);m.flowerPicks=0;
   events.push({kind:'butterfly',cell:pick.cell,butterfly,isNew,reward});
  }
 }
 return events;
}
export function equipButterflyWings(s,index){
 if(!s.harvestMoments.wingsUnlocked||index!==null&&(!Number.isInteger(index)||index<0||index>=s.village.snails))return false;
 s.harvestMoments.wearer=index;return true;
}
export function wearsButterflyWings(s,index){return s.harvestMoments?.wingsUnlocked===true&&s.harvestMoments.wearer===index;}
