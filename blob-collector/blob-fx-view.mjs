import * as T from './vendor/three.module.js';
import {setProductDisplay} from './crafting-view.mjs';
import {SUNNY,sunnyHeight} from './sunny-area.mjs';
// Jakob 3.11.: Blobs saugen ihre Funde sichtbar ein und spucken sie am Lager wieder aus. Nur Darstellung.
const POOL=24,IN=.38,OUT=.6;
export class BlobFxView{
 constructor(scene){this.root=new T.Group();scene.add(this.root);this.sprites=Array.from({length:POOL},()=>{const s=new T.Sprite(new T.SpriteMaterial({transparent:true,depthWrite:false}));s.visible=false;this.root.add(s);return s;});}
 update(s){const list=s.blobFx??[],now=s.time,roster=s.forestBlobs?.roster??[],door={x:SUNNY.storage.x,z:SUNNY.storage.z+SUNNY.storage.d/2};let used=0;
  s.blobFx=list.filter(e=>now-e.at-(e.delay??0)<(e.type==='in'?IN:OUT)+.05);
  for(const e of s.blobFx){if(used>=POOL)break;const t=(now-e.at-(e.delay??0))/(e.type==='in'?IN:OUT);if(t<0)continue;const k=Math.min(1,t),sp=this.sprites[used++],b=roster.find(o=>o.id===e.blob)?.work?.position;setProductDisplay(sp,e.kind);sp.visible=!s.home?.interior&&!s.nursery?.interior;
   if(e.type==='in'){const tx=b?.x??e.x,ty=(b?.y??e.y)+.15,tz=b?.z??e.z,q=k*k;sp.position.set(e.x+(tx-e.x)*q,e.y+.12+(ty-e.y-.12)*q+Math.sin(k*Math.PI)*.12,e.z+(tz-e.z)*q);sp.scale.setScalar(.34*(1-.75*q));}
   else{/* Ziel frei wählbar (tx/tz), sonst Lagertür */const D=Number.isFinite(e.tx)?{x:e.tx,z:e.tz}:door,gy=sunnyHeight(D.x,D.z)+.5,q=k*(2-k);sp.position.set(e.x+(D.x-e.x)*q,e.y+.2+(gy-e.y-.2)*q+Math.sin(k*Math.PI)*.9,e.z+(D.z-e.z)*q);sp.scale.setScalar(.22+.18*Math.sin(Math.min(1,k*1.4)*Math.PI*.5)-(k>.85?(k-.85)*1.6:0));}}
  for(let i=used;i<POOL;i++)this.sprites[i].visible=false;}
}
