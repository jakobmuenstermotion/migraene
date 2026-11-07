import * as T from './vendor/three.module.js';
import {nearbyFishSpot,throwBait,aimAhead,aimTarget,THROW_RANGE} from './fishing.mjs';
// Jakob 7.11.: Köder selbst zielen. Wurmknopf gedrückt halten und auf das Wasser ziehen: Ein Zielkreis folgt dem Finger
// (grün = Wasser in Wurfweite, rot = geht dort nicht). Loslassen wirft genau dorthin. Kurz antippen wirft wie bisher in Blickrichtung.
export function bindFishAim({button,canvas,scene,camera,getState,onThrow}){
 const ring=new T.Group(),mat=new T.MeshBasicMaterial({color:'#9be37f',transparent:true,opacity:.92,depthTest:false,side:T.DoubleSide});
 for(const [a,b] of [[.46,.6],[.1,.17]]){const m=new T.Mesh(new T.RingGeometry(a,b,40),mat);m.rotation.x=-Math.PI/2;m.renderOrder=30;ring.add(m);}
 ring.visible=false;scene.add(ring);
 const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0),hit=new T.Vector3(),ndc=new T.Vector2();let drag=null;
 const pointAt=(x,y)=>{const r=canvas.getBoundingClientRect(),s=getState(),spot=nearbyFishSpot(s,14);ndc.set((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1);ray.setFromCamera(ndc,camera());plane.constant=-(spot?.y??s.player.y??0);if(!ray.ray.intersectPlane(plane,hit))return null;const p={x:hit.x,z:hit.z},d=Math.hypot(p.x-s.player.x,p.z-s.player.z);if(d>THROW_RANGE){p.x=s.player.x+(p.x-s.player.x)/d*THROW_RANGE;p.z=s.player.z+(p.z-s.player.z)/d*THROW_RANGE;}return p;};
 const hide=()=>{ring.visible=false;button.classList.remove('aiming');};
 button.addEventListener('pointerdown',e=>{if(button.disabled||e.button>0)return;e.preventDefault();e.stopPropagation();button.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,aim:null,ok:false};});
 button.addEventListener('pointermove',e=>{if(drag?.id!==e.pointerId)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<14)return;drag.moved=true;button.classList.add('aiming');const s=getState(),p=pointAt(e.clientX,e.clientY),t=p&&aimTarget(s,p);drag.aim=p;drag.ok=Boolean(t);ring.visible=Boolean(p);if(p){ring.position.set(p.x,(t?.at?.y??t?.spot?.y??nearbyFishSpot(s,14)?.y??0)+.06,p.z);mat.color.set(t?'#9be37f':'#e7836b');}});
 button.addEventListener('pointerup',e=>{if(drag?.id!==e.pointerId)return;const d=drag;drag=null;hide();const s=getState();let ok=false;if(d.moved)ok=Boolean(d.aim&&d.ok)&&throwBait(s,null,null,d.aim);else{const p=nearbyFishSpot(s);ok=Boolean(p)&&throwBait(s,p.id,null,aimAhead(s));}if(ok)onThrow();canvas.focus({preventScroll:true});});
 button.addEventListener('pointercancel',e=>{if(drag?.id===e.pointerId){drag=null;hide();}});
 return {update(){if(ring.visible)ring.scale.setScalar(1+Math.sin(performance.now()/170)*.07);}};
}
