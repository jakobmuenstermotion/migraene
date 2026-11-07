import * as T from './vendor/three.module.js';
const player={value:new T.Vector3(1e6,1e6,1e6)};
const crack={value:new T.Vector3(1e6,1e6,1e6)};
export function updateCanopyTarget(p){player.value.set(p.x,(p.y??0)+.9,p.z);}
export function updateCanopyCrack(p){if(p)crack.value.set(p.x,(p.y??0)+.2,p.z);else crack.value.set(1e6,1e6,1e6);}
export function canopyMaterial(m){if(m.userData.canopyFade)return m;m.userData.canopyFade=true;const previous=m.onBeforeCompile;m.transparent=true;m.onBeforeCompile=shader=>{previous.call(m,shader);shader.uniforms.canopyPlayer=player;shader.uniforms.canopyCrack=crack;shader.vertexShader='uniform vec3 canopyPlayer;uniform vec3 canopyCrack;varying float canopyFade;\n'+shader.vertexShader.replace('#include <project_vertex>',`vec4 canopyWorld=vec4(transformed,1.0);
#ifdef USE_INSTANCING
canopyWorld=instanceMatrix*canopyWorld;
#endif
canopyWorld=modelMatrix*canopyWorld;vec3 delta=canopyWorld.xyz-canopyPlayer;vec3 ray=normalize(cameraPosition-canopyPlayer);float along=dot(delta,ray);float distanceToRay=length(delta-ray*along);canopyFade=1.0-.9*(1.0-smoothstep(1.0,2.25,distanceToRay))*smoothstep(.35,1.4,along)*smoothstep(.6,1.6,delta.y);vec3 crackDelta=canopyWorld.xyz-canopyCrack;vec3 crackRay=normalize(cameraPosition-canopyCrack);float crackAlong=dot(crackDelta,crackRay);canopyFade*=1.0-.88*(1.0-smoothstep(.9,2.0,length(crackDelta-crackRay*crackAlong)))*smoothstep(.35,1.4,crackAlong)*smoothstep(.6,1.6,crackDelta.y);
#include <project_vertex>`);shader.fragmentShader='varying float canopyFade;\n'+shader.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\ngl_FragColor.a*=canopyFade;');};m.customProgramCacheKey=()=> previous.toString()+'canopy-fade-v3';return m;}
