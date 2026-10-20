import {getBuildPads} from './village.mjs';
import {BOUTIQUES} from './boutiques.mjs';
export function morningDiscoveries(s,tools){
 const j=s.journey;if(j.asleep||j.round<=0||j.announcedRound===j.round)return null;
 j.announcedRound=j.round;
 const previous={...s,journey:{...j,round:Math.max(0,j.round-1)}},before=new Map(getBuildPads(previous,tools).map(p=>[p.id,p]));
 const news=getBuildPads(s,tools).filter(p=>p.visible&&!p.locked&&!p.max&&(!before.get(p.id)?.visible||before.get(p.id)?.locked)).map(p=>p.label);
 for(const shop of BOUTIQUES)if(shop.round===j.round&&!news.some(n=>n.includes(shop.name)))news.push(shop.id==='style'?'Accessoiresladen mit Angel & Metalldetektor':shop.name+' · Dekorationen');
 return [...new Set(news)].slice(0,4);
}
