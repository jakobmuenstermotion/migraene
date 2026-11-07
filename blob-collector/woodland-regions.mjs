import {coastRegion} from './coast-area.mjs';
// Shared geometry rules for the three connected woodland areas.
export const WOODLANDS=[
 {id:'steinbach',name:'Steinbach',x:1,z:-54,rx:21,rz:23,ground:'#8caa87',path:'#bec1a1'},
 {id:'mooswald',name:'Mooswald',x:48,z:38,rx:23,rz:19,ground:'#4f805c',path:'#9ba77c'},
 {id:'pilzhain',name:'Pilzhain',x:-59,z:0,rx:23,rz:22,ground:'#758874',path:'#c3b8a3'}
];
export function woodlandAt(x,z,margin=0){return WOODLANDS.find(r=>Math.hypot((x-r.x)/(r.rx+margin),(z-r.z)/(r.rz+margin))<1+.035*Math.sin(x*.4+z*.3));}
export function woodlandHeight(x,z){const r=woodlandAt(x,z,4);if(!r)return null;const blend=Math.max(0,Math.min(1,(Math.hypot(x-r.x,z-r.z)-5)/10));if(r.id==='steinbach')return .35+.35*Math.sin(x*.15)*Math.cos(z*.1)+.9*Math.exp(-((x+12)**2+(z+65)**2)/65);if(r.id==='mooswald')return .2+.4*Math.sin(x*.13)*Math.cos(z*.17)+.6*Math.exp(-((x-57)**2+(z-43)**2)/90);return 2.4+.5*Math.sin(x*.14)*Math.cos(z*.12)+.7*Math.exp(-((x+65)**2+(z+12)**2)/60);}
export function woodlandStream(x,z){if(z>-37||z<-74)return null;const center=3+Math.sin((z+48)*.14)*3+Math.sin(z*.31)*.65;return {center,width:1.3+.25*Math.sin(z*.23),distance:Math.abs(x-center)};}
export function woodlandPathDistance(x,z){const r=woodlandAt(x,z,3);if(!r)return Infinity;if(r.id==='steinbach')return Math.min(Math.abs(x+2.3+Math.sin(z*.15)*2.5),Math.hypot(x+6,z+64)-5);if(r.id==='mooswald')return Math.abs((z-26)-.72*(x-31)-Math.sin(x*.16)*1.1)/1.24;return Math.min(Math.abs(z-1-Math.sin((x+45)*.12)*2.5),Math.abs(z+8+.5*(x+47))/1.12);}
export const REGION_TREES=WOODLANDS.flatMap((r,index)=>Array.from({length:28},(_,i)=>{const a=i*2.399+index,d=.5+(i%7)*.065;return {region:r.id,x:r.x+Math.cos(a)*r.rx*d,z:r.z+Math.sin(a)*r.rz*d,size:.9+(i%5)*.13};}).filter(p=>!coastRegion(p.x,p.z,1)&&Math.hypot(p.x+43,p.z+8)>8&&woodlandPathDistance(p.x,p.z)>2.2&&(!woodlandStream(p.x,p.z)||woodlandStream(p.x,p.z).distance>2.6)));
export function woodlandResourcePoint(random,regionIndex){const r=WOODLANDS[regionIndex%3];for(let i=0;i<60;i++){const a=random()*Math.PI*2,d=Math.sqrt(random())*.85,x=r.x+Math.sin(a)*r.rx*d,z=r.z+Math.cos(a)*r.rz*d;if(coastRegion(x,z,1)||woodlandPathDistance(x,z)<1.3||REGION_TREES.some(t=>Math.hypot(t.x-x,t.z-z)<.8))continue;return {x,z};}return {x:r.x+6,z:r.z+3};}
