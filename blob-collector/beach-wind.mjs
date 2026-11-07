import * as T from './vendor/three.module.js';
import {coastRegion,coastGap,coastPool,coastShore} from './coast-area.mjs';
import {sunnyHeight} from './sunny-area.mjs';
export class BeachWind{
 constructor(root){this.root=new T.Group();root.add(this.root);this.dummy=new T.Object3D();this.grains=new T.InstancedMesh(new T.OctahedronGeometry(.033,0),new T.MeshBasicMaterial({color:'#edcf99',transparent:true,opacity:.65,depthWrite:false}),128);this.grains.frustumCulled=false;this.grains.count=0;this.root.add(this.grains);}
 update(s){this.root.visible=!s.testWorld.enabled&&!s.home?.interior&&!s.nursery?.interior&&!s.cave?.interior;let n=0;const d=this.dummy,p=s.player;if(!this.root.visible)return;for(let i=0;i<46;i++){const cycle=Math.floor(s.time/5+i*.618),t=(s.time/5+i*.618)%1,a=i*2.399+cycle*.27,r=2+(i%8)*1.35,x=p.x+Math.sin(a)*r+(t-.5)*2,z=p.z+Math.cos(a)*r+(t-.5)*.7;if(!coastRegion(x,z)||coastGap(x,z)||coastPool(x,z)||x>coastShore(z)-.8||x<54||z< -25)continue;d.position.set(x,sunnyHeight(x,z)+.08+Math.sin(t*Math.PI)*(.18+(i%3)*.1),z);d.scale.setScalar(Math.sin(t*Math.PI)*(.35+(i%3)*.2));d.updateMatrix();this.grains.setMatrixAt(n++,d.matrix);}
 for(const r of s.resources){if(!r.beachPile||r.status!=='returning'||Math.hypot(r.x-p.x,r.z-p.z)>14)continue;for(let i=0;i<3&&n<128;i++){const t=(s.time*.8+i*.33+r.angle*.1)%1;d.position.set(r.x-1.4*(1-t),r.homeY+.04+Math.sin(t*Math.PI)*.24,r.z-.35*(1-t));d.scale.setScalar(Math.sin(t*Math.PI)*.8);d.updateMatrix();this.grains.setMatrixAt(n++,d.matrix);}}this.grains.count=n;if(n)this.grains.instanceMatrix.needsUpdate=true;}
}
