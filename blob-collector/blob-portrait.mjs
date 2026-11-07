import * as T from './vendor/three.module.js';
import {BlobModelBank,blobTime} from './blob-models.mjs';
// Menübilder aus den echten Modellen: einmal je Art gerendert und gemerkt.
const cache=new Map();let rig=null;
function setup(){const renderer=new T.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(220,220,false);renderer.toneMapping=T.NeutralToneMapping;const scene=new T.Scene();scene.add(new T.HemisphereLight('#fff0ca','#9ca77c',1.7));const sun=new T.DirectionalLight('#ffe6c0',2.4);sun.position.set(-3,6,5);scene.add(sun);const camera=new T.PerspectiveCamera(21,1,.1,30);camera.position.set(0,2.6,6.3);camera.lookAt(0,.72,0);return {renderer,scene,camera,bank:new BlobModelBank(scene,1)};}
const ID=new T.Matrix4();
export function blobPortrait(species){if(cache.has(species))return cache.get(species);let url=null;try{rig??=setup();const keep=blobTime.value;rig.bank.begin();rig.bank.put(species,ID);rig.bank.end(1.3);rig.renderer.render(rig.scene,rig.camera);url=rig.renderer.domElement.toDataURL('image/png');blobTime.value=keep;}catch{url=null;}cache.set(species,url);return url;}
