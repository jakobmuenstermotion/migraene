import * as T from './vendor/three.module.js';
import {HOME_ROOM,inHome,homeRegion} from './home-space.mjs';
import {SUNNY,sunnyHeight} from './sunny-area.mjs';
// Reuse the actual outdoor geometry around the cottage. A shader cutout makes
// room for the larger interior without duplicating geometry buffers or terrain.
export class HomeSurroundings{
 constructor(scene,sources){/* Neugestaltung: Ausschnitt wächst mit dem Hausanbau mit (Ostgrenze je Stufe) */this.extent={value:6.15};this.root=new T.Group();scene.add(this.root);this.sources=sources;this.revision=-1;this.materials=new Map();this.root.visible=false;}
 material(original){if(this.materials.has(original))return this.materials.get(original);const m=original.clone(),before=original.onBeforeCompile;m.onBeforeCompile=shader=>{before?.(shader);shader.uniforms.homeExtent=this.extent;shader.vertexShader='varying vec2 homeOutsidePosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 homeOutdoor=vec4(transformed,1.0);
 #ifdef USE_INSTANCING
 homeOutdoor=instanceMatrix*homeOutdoor;
 #endif
 homeOutsidePosition=(modelMatrix*homeOutdoor).xz;
 #include <project_vertex>`);shader.fragmentShader='uniform float homeExtent;varying vec2 homeOutsidePosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
 float homeDx=homeOutsidePosition.x-(${HOME_ROOM.x.toFixed(1)});if(homeDx>-6.15&&homeDx<homeExtent&&abs(homeOutsidePosition.y-(${HOME_ROOM.z.toFixed(1)}))<5.15)discard;`);};m.customProgramCacheKey=()=>original.uuid+'-home-surroundings';m.transparent=original.transparent;m.opacity=1;this.materials.set(original,m);return m;}
 rebuild(s){this.root.clear();for(const [i,source]of this.sources.entries()){const c=source.clone(true);c.visible=true;if(i===2)for(const child of c.children)child.visible=!homeRegion(child.position.x,child.position.z)&&Math.hypot(child.position.x,child.position.z)>1;c.position.x+=HOME_ROOM.x-SUNNY.home.x;c.position.z+=HOME_ROOM.z-SUNNY.home.z;c.position.y+=HOME_ROOM.floor-sunnyHeight(SUNNY.home.x,SUNNY.home.z);c.traverse(o=>{if(o.isLight)o.visible=false;if(o.isMesh||o.isPoints||o.isLine){o.castShadow=o.receiveShadow=false;o.material=Array.isArray(o.material)?o.material.map(m=>this.material(m)):this.material(o.material);}});this.root.add(c);}this.revision=s.layoutRevision??0;}
 update(s){const show=inHome(s);this.root.visible=show;this.extent.value=[6.15,14.15,22.15][Math.max(0,Math.min(2,s.home?.expansion|0))];if(show&&(!this.root.children.length||this.revision!==(s.layoutRevision??0)))this.rebuild(s);}
}
