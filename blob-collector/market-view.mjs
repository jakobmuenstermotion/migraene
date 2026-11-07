import * as T from './vendor/three.module.js';
import {MARKET} from './market.mjs';
import {sunnyHeight} from './sunny-area.mjs';
import {ScenicBatch} from './scenic-geometry.mjs';
export class MarketView{
 constructor(scene){const b=new ScenicBatch(),cube=new T.BoxGeometry(1,1,1),ball=new T.SphereGeometry(1,10,7),cyl=new T.CylinderGeometry(1,1,1,12),add=(g,c,x,y,z,sx,sy,sz,rx=0)=>b.add(g,c,x,y,z,sx,sy,sz,rx);this.root=new T.Group();scene.add(this.root);this.root.position.set(MARKET.x,sunnyHeight(MARKET.x,MARKET.z),MARKET.z);
  add(cube,'#a48159',0,.8,0,2.8,.2,1.8);add(cube,'#be9964',0,.5,.8,2.8,.7,.12);for(const x of [-1.28,1.28])for(const z of [-.8,.8])add(cube,'#8d724f',x,1.45,z,.11,2.9,.11);for(let i=0;i<9;i++){add(cube,i%2?'#f1d8a0':'#91ad7d',-1.44+i*.36,2.7,.1,.36,.1,2.25,-.15);add(cube,i%2?'#f1d8a0':'#91ad7d',-1.44+i*.36,2.5,1.2,.36,.27,.09);}
  for(const x of [-.85,0,.85]){add(cube,'#d8bd84',x,1,-.05,.7,.2,.9);for(let j=0;j<3;j++)add(ball,x<0?'#e8bb79':x>0?'#a3bd82':'#8ac0ca',x+(j-1)*.17,1.16,.1,.13,.1,.25);}
  add(cyl,'#e9cd84',0,2.43,1.18,.29,.07,.29,Math.PI/2);add(cyl,'#ae8f55',0,2.43,1.225,.17,.025,.17,Math.PI/2);b.finish(this.root);
  // Neugestaltung: Ausbaustufen sichtbar am Stand – Auslage (Regal mit Waren), Stammkunden (Wimpelkette und Tafel), Händlerkarren.
  this.stages=[];const stage=draw=>{const g=new ScenicBatch(),a=(geo,c,x,y,z,sx,sy,sz,rx=0,ry=0,rz=0)=>g.add(geo,c,x,y,z,sx,sy,sz,rx,ry,rz);draw(a);const m=g.finish(this.root);m.visible=false;this.stages.push(m);};
  stage(a=>{a(cube,'#a48159',1.9,.45,.2,.9,.9,1.2);a(cube,'#be9964',1.9,.95,.2,.95,.08,1.25);for(let i=0;i<4;i++)a(ball,['#e9aebf','#f0c15e','#87c7db','#a3bd82'][i],1.68+(i%2)*.42,1.08,-.15+Math.floor(i/2)*.6,.14,.12,.14);a(cube,'#f6e8c8',1.9,.6,.81,.7,.3,.04);});
  stage(a=>{for(let i=0;i<9;i++)a(cube,['#e9aebf','#f0d27a','#9bc7e0'][i%3],-1.3+i*.33,2.28-Math.sin(i/8*Math.PI)*.18,1.32,.16,.2,.02,0,0,.0);a(cube,'#5d4a3a',-1.95,.95,.9,.06,1.9,.06);a(cube,'#3f4a3e',-1.95,1.55,.92,.6,.45,.05);a(cube,'#f6efe0',-1.95,1.6,.95,.4,.06,.01);});
  stage(a=>{a(cube,'#b58d60',2.6,.75,1.6,1.3,.45,.8);a(cube,'#8d724f',2.6,1,1.6,1.36,.08,.86);for(const z of [1.18,2.02])a(cyl,'#6b5440',2.6,.4,z,.38,.08,.38,Math.PI/2);a(cube,'#8d724f',1.7,.85,1.6,.7,.06,.06,0,0,.3);for(let i=0;i<5;i++)a(ball,['#d99ac5','#f0c15e','#b9e3f2','#e3bf84','#87c7db'][i],2.25+(i%3)*.32,1.12,1.4+Math.floor(i/3)*.4,.14,.12,.14);});
  cube.dispose();ball.dispose();cyl.dispose();
 }
 update(s){this.root.visible=!s.testWorld.enabled;{const q=s.placementPreview?.id==='market'?s.placementPreview:MARKET;this.root.position.set(q.x,sunnyHeight(q.x,q.z),q.z);this.root.rotation.y=q.rotation??0;}const level=s.market?.level|0;this.stages?.forEach((m,i)=>m.visible=level>i);}
}
