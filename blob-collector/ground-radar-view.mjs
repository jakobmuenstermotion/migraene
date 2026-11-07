import * as T from './vendor/three.module.js';
import {RADAR} from './ground-systems.mjs';
import {sunnyHeight} from './sunny-area.mjs';
// Bodendetektor: Scanwelle und Kreise auf dem Boden, in denen ein Fund liegt. Sie folgen dem Gelände und werden von Bäumen und Häusern verdeckt.
const lay=(geometry,x,z,r,lift)=>{const p=geometry.attributes.position,base=geometry.userData.base??=p.array.slice();for(let i=0;i<p.count;i++){const lx=base[i*3],lz=base[i*3+2];p.setXYZ(i,lx*r,sunnyHeight(x+lx*r,z+lz*r)+lift,lz*r);}p.needsUpdate=true;};
const flat=(geometry)=>{geometry.rotateX(-Math.PI/2);return geometry;};
const paint=(color,opacity)=>new T.MeshBasicMaterial({color,transparent:true,opacity,side:T.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});
export class GroundRadarView{
  constructor(scene,indicator){indicator.hidden=true;this.pulse=new T.Mesh(flat(new T.RingGeometry(.985,1,120)),paint('#c8e79d',.4));this.pulse.visible=false;this.pulse.frustumCulled=false;this.pulse.renderOrder=3;scene.add(this.pulse);this.zones=Array.from({length:RADAR.zones},()=>{const g=new T.Group(),fill=new T.Mesh(flat(new T.RingGeometry(.001,.96,40,5)),paint('#fff0c0',.05)),ring=new T.Mesh(flat(new T.RingGeometry(.975,1,64)),paint('#fff0c0',.4));fill.renderOrder=ring.renderOrder=3;fill.frustumCulled=ring.frustumCulled=false;g.add(fill,ring);g.visible=false;scene.add(g);return {g,ring,fill,key:''};});}
  update(state,camera,reduced){const radar=state.groundRadar,indoors=state.home?.interior||state.nursery?.interior||state.cave?.interior;this.pulse.visible=radar.active&&radar.scanning&&!indoors;if(this.pulse.visible){const r=Math.max(.01,radar.radius);lay(this.pulse.geometry,state.player.x,state.player.z,r,.14);this.pulse.position.set(state.player.x,0,state.player.z);this.pulse.material.opacity=(reduced?.15:.32)*(1-radar.radius/RADAR.radius);}
    this.zones.forEach((z,i)=>{const q=radar.active&&!indoors?radar.zones?.[i]:null;z.g.visible=!!q;if(!q)return;const key=q.id+':'+q.x;if(z.key!==key){z.key=key;z.g.position.set(q.x,0,q.z);lay(z.fill.geometry,q.x,q.z,q.r,.12);lay(z.ring.geometry,q.x,q.z,q.r,.14);}z.ring.material.opacity=.34+(reduced?0:.08*Math.sin(state.time*2));});}
}
