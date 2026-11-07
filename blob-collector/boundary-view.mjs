import {coastRegion} from './coast-area.mjs';
import {iceRegion} from './ice-area.mjs';
import {volcanoRegion} from './volcano-area.mjs';
import {woodlandAt} from './woodland-regions.mjs';
import * as T from './vendor/three.module.js';
import {sunnyHeight,SUNNY} from './sunny-area.mjs';
import {ScenicBatch} from './scenic-geometry.mjs';
export function boundaryPass(a){let distance=Infinity;for(const p of SUNNY.transitions){const b=Math.atan2(p.z/(p.z>0?61.5:41),p.x/52),d=Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));distance=Math.min(distance,d);}return Math.min(1,(distance/.16)**2);}
export function boundaryPoint(a,ring){const r=1+.045*Math.sin(a*5)+.025*Math.cos(a*7),spread=[.985,1.025,1.065,1.10,1.14,1.22,1.34][ring],offset=(ring>1?Math.sin(a*19+ring*2)*.008:0),x=Math.cos(a)*52*r*(spread+offset),z=Math.sin(a)*(Math.sin(a)>0?61.5:41)*r*(spread+offset),ridge=5.8+2.1*Math.sin(a*7+.8)+1.3*Math.sin(a*13),height=[-.2,.4,1.65,ridge*.75,ridge,ridge*.63,1.2][ring]*boundaryPass(a)*(woodlandAt(x,z,2)||coastRegion(x,z,2)?0:1);return {x,y:sunnyHeight(x,z)+height,z};}
export function addBoundary(root){
 const batch=new ScenicBatch(),segments=144,palette=['#728059','#7c8965','#99947e','#8c8977','#b3ac92','#8c8d7d'],color=new T.Color();
 for(let j=0;j<6;j++)for(let i=0;i<segments;i++){
  const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2,p=[boundaryPoint(a,j),boundaryPoint(b,j),boundaryPoint(a,j+1),boundaryPoint(b,j+1)],cx=p.reduce((n,v)=>n+v.x,0)/4,cz=p.reduce((n,v)=>n+v.z,0)/4;if(coastRegion(cx,cz,3)||iceRegion(cx,cz,4)||volcanoRegion(cx,cz,4)||(cx>36&&cz< -22&&cz> -50))continue;color.set(palette[j]);color.multiplyScalar(.94+.06*Math.sin(i*1.7+j));for(const n of [0,2,1,1,2,3]){batch.positions.push(p[n].x,p[n].y,p[n].z);batch.colors.push(color.r,color.g,color.b);}
 }
 // Broken buttresses and mossy ledges interrupt the formerly uniform wall.
 const rock=new T.DodecahedronGeometry(1,0);for(let i=0;i<54;i++){const a=i/54*Math.PI*2;if(boundaryPass(a)<.75)continue;const p=boundaryPoint(a,1),height=1.4+(i%5)*.55;if(woodlandAt(p.x,p.z,2)||coastRegion(p.x,p.z,2)||iceRegion(p.x,p.z,4)||volcanoRegion(p.x,p.z,4)||(p.x>36&&p.z< -22&&p.z> -50))continue;batch.add(rock,i%3?'#92917d':'#a6a088',p.x,p.y+height*.55,p.z,1.5+(i%3)*.4,height,1.2+(i%4)*.24,.08*Math.sin(i),a,.1*Math.cos(i));batch.add(rock,'#78855e',p.x,p.y+height*1.15,p.z,1.45+(i%3)*.35,.22,1.2,0,a,0);}rock.dispose();return batch.finish(root);
}
