import {suctionAmount} from './inventory.mjs';
export function stackSample(s,slots){
 if(slots<=0)return [];
 const remaining=Object.fromEntries(Object.keys(s.inventory.bag).map(k=>[k,suctionAmount(s,k)])),recent=[];
 for(const kind of (s.inventory.suctionRecent??[]).slice().reverse())if(remaining[kind]>0){recent.push(kind);remaining[kind]--;}
 recent.reverse();if(recent.length>=slots)return recent.slice(-slots);
 const oldSlots=slots-recent.length,total=Object.values(remaining).reduce((a,b)=>a+b,0),out=[];
 for(let i=0;i<oldSlots;i++){let q=(i+.5)/Math.max(1,oldSlots)*total,kind='leaf';for(const [k,n]of Object.entries(remaining)){q-=n;if(q<0){kind=k;break;}}out.push(kind);}
 return out.concat(recent);
}
