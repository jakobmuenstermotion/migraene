import * as T from './vendor/three.module.js';
import {coastRiver} from './coast-area.mjs';
export const CASCADE={start:57.4,end:58.9};
export function coastRiverGeometry(){
 const xs=[...new Set([...Array.from({length:65},(_,i)=>55.9+i*.45),CASCADE.start,CASCADE.end])].sort((a,b)=>a-b),p=[],uv=[],ids=[];
 for(const [i,x]of xs.entries()){
  const r=coastRiver(x);p.push(x,r.water,r.z-r.half,x,r.water,r.z+r.half);uv.push((x-55.9)/5.4,0,(x-55.9)/5.4,1);
  // The cascade owns this whole interval. Never bridge it with a steep river
  // triangle; floating point sample boundaries used to leave a vertical sliver.
  if(i<xs.length-1&&(xs[i+1]<=CASCADE.start||x>=CASCADE.end)){const a=i*2;ids.push(a,a+2,a+1,a+1,a+2,a+3);}
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
