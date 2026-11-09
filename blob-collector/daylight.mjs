import * as T from './vendor/three.module.js';
import {SUNNY,sunnyHeight} from './sunny-area.mjs';
export const DAY_CYCLE_SECONDS=600; // Compatibility name: one-way transition to night.
// Jakob 9.11.: Dunkelheit später – bis 5 Minuten hell, dann Abendrot (~5:50), dunkel ab ~6:50, volle Nacht ab ~8:10.
const frames=[
 {t:0,sky:'#a7bd7c',sun:'#fff0ca',ground:'#9ca77c',ambient:1.9,power:2.3,x:-16,y:30,night:0},
 {t:.42,sky:'#cbbd8c',sun:'#ffcf91',ground:'#9a986e',ambient:1.65,power:2.1,x:-24,y:21,night:0},
 {t:.58,sky:'#d99883',sun:'#ff9662',ground:'#806e78',ambient:1.15,power:1.8,x:-32,y:8,night:.15},
 {t:.69,sky:'#4d5f92',sun:'#a9bdf0',ground:'#46557c',ambient:.95,power:.7,x:-30,y:8,night:.85},
 {t:.81,sky:'#2b3f6b',sun:'#c4d8ff',ground:'#3a4c78',ambient:1.05,power:.95,x:-15,y:24,night:1},
 {t:1,sky:'#2b3f6b',sun:'#c4d8ff',ground:'#3a4c78',ambient:1.05,power:.95,x:-15,y:24,night:1}
];
export function daylightAt(seconds,cycle=DAY_CYCLE_SECONDS){const phase=Math.max(0,Math.min(1,seconds/cycle));let i=1;while(frames[i].t<phase)i++;const a=frames[i-1],b=frames[i],raw=(phase-a.t)/(b.t-a.t),mix=raw*raw*(3-2*raw),out={a,b,mix,phase};for(const k of ['ambient','power','x','y','night'])out[k]=a[k]+(b[k]-a[k])*mix;return out;}
export class Daylight{
 constructor(scene,sun,ambient,world){this.scene=scene;this.sun=sun;this.ambient=ambient;this.colors={sky:new T.Color(),sun:new T.Color(),ground:new T.Color()};this.temp=new T.Color();this.windows=new Set();world.traverse(o=>{if(o.isMesh&&o.material.emissiveIntensity>0)this.windows.add(o.material);});this.root=new T.Group();scene.add(this.root);const lamps=[[-11.7,-8.5],[-3.8,-8.3],[6.6,-8.6]],dummy=new T.Object3D();
  this.bulbs=new T.InstancedMesh(new T.SphereGeometry(.12,8,6),new T.MeshBasicMaterial({color:'#ffe7a2'}),lamps.length);const posts=new T.InstancedMesh(new T.CylinderGeometry(.045,.065,1.55,6),new T.MeshStandardMaterial({color:'#6c7058'}),lamps.length);
  const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);data.set([255,195,95,Math.round(Math.max(0,1-r)**2*135)],i);}const texture=new T.DataTexture(data,32,32);texture.needsUpdate=true;this.glows=new T.InstancedMesh(new T.PlaneGeometry(3.8,3.8),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,opacity:0,blending:T.AdditiveBlending}),lamps.length);
  lamps.forEach(([x,z],i)=>{const h=sunnyHeight(x,z);dummy.position.set(x,h+.78,z);dummy.rotation.set(0,0,0);dummy.updateMatrix();posts.setMatrixAt(i,dummy.matrix);dummy.position.y=h+1.6;dummy.updateMatrix();this.bulbs.setMatrixAt(i,dummy.matrix);dummy.position.y=h+.045;dummy.rotation.x=-Math.PI/2;dummy.updateMatrix();this.glows.setMatrixAt(i,dummy.matrix);});for(const mesh of [posts,this.bulbs,this.glows]){mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();this.root.add(mesh);}
 }
 update(seconds,inTest=false){const d=daylightAt(seconds);for(const k of Object.keys(this.colors))this.colors[k].set(d.a[k]).lerp(this.temp.set(d.b[k]),d.mix);this.scene.background.copy(this.colors.sky);this.scene.fog.color.copy(this.colors.sky);this.ambient.color.copy(this.colors.sun);this.ambient.groundColor.copy(this.colors.ground);this.ambient.intensity=d.ambient;this.sun.color.copy(this.colors.sun);this.sun.intensity=d.power;this.sun.position.set(d.x,d.y,12);for(const mat of this.windows)mat.emissiveIntensity=.02+d.night*.95;this.root.visible=!inTest;this.bulbs.material.color.set('#806f4e').lerp(this.temp.set('#ffe7a2'),d.night);this.glows.material.opacity=d.night;return d;}
}
