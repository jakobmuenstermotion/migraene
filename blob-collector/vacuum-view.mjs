import {groundAt} from './test-world.mjs';
import * as T from './vendor/three.module.js';
import {vacuumAirPoint,vacuumBoundaryPoint} from './vacuums.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import {makeVacuumTool,ribbedHose,decorateTank} from './vacuum-models.mjs';

const SEGMENTS=72,POINTS=19;
export class VacuumView{
  constructor(scene,nozzle){
    this.nozzle=nozzle;this.root=new T.Group();scene.add(this.root);this.tools=new Map();this.mode=null;this.motion={};
    const body=nozzle.parent;if(body?.userData.hose)ribbedHose(body.userData.hose);this.tankDeco=body?decorateTank(body):null;
    const positions=new Float32Array((SEGMENTS+2)*3),indices=[];
    for(let i=0;i<SEGMENTS;i++)indices.push(0,i+1,i+2);
    const field=new T.BufferGeometry();field.setAttribute('position',new T.BufferAttribute(positions,3));field.setIndex(indices);
    this.field=new T.Mesh(field,new T.MeshBasicMaterial({color:'#9bded0',transparent:true,opacity:.12,side:T.DoubleSide,depthWrite:false}));this.field.frustumCulled=false;this.root.add(this.field);
    this.edge=new T.Line(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array((SEGMENTS+1)*3),3)),new T.LineBasicMaterial({color:'#78b7a6',transparent:true,opacity:.65,depthWrite:false}));this.edge.frustumCulled=false;this.root.add(this.edge);
    this.streams=[];
    for(let i=0;i<16;i++){
      const geometry=new T.BufferGeometry(),indices=[];geometry.setAttribute('position',new T.BufferAttribute(new Float32Array(POINTS*2*3),3));
      for(let j=0;j<POINTS-1;j++){const k=j*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}geometry.setIndex(indices);
      const mesh=new T.Mesh(geometry,new T.MeshBasicMaterial({color:i%2?'#8dcfbe':'#f2fff4',transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false}));mesh.frustumCulled=false;this.root.add(mesh);this.streams.push(mesh);
    }
    this.dust=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(72*3),3)),new T.PointsMaterial({color:'#dcfff0',size:.06,transparent:true,opacity:.65,depthWrite:false}));this.dust.frustumCulled=false;this.root.add(this.dust);
    this.pulse=new T.Mesh(new T.RingGeometry(.95,1,72),new T.MeshBasicMaterial({color:'#ffffff',transparent:true,opacity:.6,side:T.DoubleSide,depthWrite:false}));this.pulse.rotation.x=-Math.PI/2;this.pulse.position.y=.11;this.root.add(this.pulse);this.pulse.visible=false;
    this.pulseGeometry=this.pulse.geometry;this.fanPulseGeometry=new T.RingGeometry(.95,1,48,1,-Math.PI/2-75*Math.PI/180,150*Math.PI/180);
  }
  select(mode){
    if(this.mode===(mode)||this.mode?.profileKey&&this.mode.profileKey===mode.profileKey)return;
    this.mode=mode;
    for(const tool of this.tools.values())tool.visible=false;
    if(!this.tools.has(mode.id)){const tool=this.makeTool(mode);this.tools.set(mode.id,tool);this.nozzle.add(tool);}
    this.tool=this.tools.get(mode.id);this.tool.visible=true;
    this.nozzle.position.set(0,mode.nozzleY,mode.nozzleOffset-.204);
    const field=this.field.geometry.attributes.position,edge=this.edge.geometry.attributes.position;
    field.setXYZ(0,0,.055,mode.shape==='floor'?(mode.near+mode.radius)/2:0);
    for(let i=0;i<=SEGMENTS;i++){const point=vacuumBoundaryPoint(mode,i/SEGMENTS,this.motion);field.setXYZ(i+1,point.x,.055,point.z);edge.setXYZ(i,point.x,.065,point.z);}
    field.needsUpdate=edge.needsUpdate=true;
    this.field.material.color.set(mode.color);this.edge.material.color.set(mode.color);this.dust.material.color.set(mode.color);
    this.pulse.geometry=mode.id==='fan'?this.fanPulseGeometry:this.pulseGeometry;
    this.streams.forEach((mesh,i)=>{mesh.visible=i<mode.streams;mesh.material.color.set(i%2?mode.color:'#f5fff3');});
  }
  makeTool(mode){
    return makeVacuumTool(mode);
  }
  makeToolOriginal(mode){
    const root=new T.Group(),spins=[];root.userData.spins=spins;
    const material=new T.MeshStandardMaterial({color:mode.color,roughness:.65,metalness:.12}),rim=new T.MeshStandardMaterial({color:'#e8c17e',roughness:.6}),dark=new T.MeshStandardMaterial({color:mode.style==='black-hole'?'#241536':'#304e46',roughness:.4});
    const add=(geometry,mat,x=0,y=0,z=0)=>{const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);root.add(m);return m;};
    const port=(x=0,scale=1,angle=0)=>{
      const g=new T.Group();g.position.x=x;g.scale.setScalar(scale);g.rotation.y=angle;root.add(g);
      const cone=new T.Mesh(new T.CylinderGeometry(.24,.13,.35,16),material);cone.rotation.x=Math.PI/2;g.add(cone);
      const ring=new T.Mesh(new T.TorusGeometry(.24,.032,6,24),rim);ring.position.z=.2;g.add(ring);
      const hole=new T.Mesh(new T.CircleGeometry(.215,24),dark);hole.position.z=.204;g.add(hole);return g;
    };
    switch(mode.style){
      case 'floor':add(new T.BoxGeometry(.7,.13,.48),material,0,0,.04);for(const x of [-.29,.29]){const wheel=add(new T.CylinderGeometry(.08,.08,.08,12),dark,x,-.035,-.09);wheel.rotation.z=Math.PI/2;}break;
      case 'fan':port(-.28,.65,-.35);port(0,.8);port(.28,.65,.35);break;
      case 'vortex':{port();const ring=add(new T.TorusGeometry(.3,.022,6,32),rim,0,0,.16);spins.push(ring);break;}
      case 'focus':{port(0,.65);const barrel=add(new T.CylinderGeometry(.1,.12,.46,12),material,0,0,-.27);barrel.rotation.x=Math.PI/2;break;}
      case 'power':{port(0,1.15);for(const x of [-.23,.23]){const piston=add(new T.CylinderGeometry(.05,.05,.5,8),rim,x,0,-.16);piston.rotation.x=Math.PI/2;}add(new T.BoxGeometry(.45,.3,.25),material,0,0,-.28);break;}
      default:port();
    }
    return root;
  }
  update(state,time,reduced){
    const mode=effectiveVacuum(state);this.select(mode);if(this.tankDeco)this.tankDeco.group.visible=this.tankDeco.tank.visible;
    this.root.position.set(state.player.x,state.player.y??0,state.player.z);this.root.rotation.y=state.player.angle;
    const fieldPositions=this.field.geometry.attributes.position,edgePositions=this.edge.geometry.attributes.position,ca=Math.cos(state.player.angle),sa=Math.sin(state.player.angle);for(const positions of [fieldPositions,edgePositions]){for(let i=0;i<positions.count;i++){const x=positions.getX(i),z=positions.getZ(i),wx=state.player.x+ca*x+sa*z,wz=state.player.z-sa*x+ca*z;positions.setY(i,(groundAt(state,wx,wz)??state.player.y)-state.player.y+.075);}positions.needsUpdate=true;}this.field.material.depthTest=false;this.edge.material.depthTest=false;this.pulse.material.depthTest=false;this.field.renderOrder=this.edge.renderOrder=this.pulse.renderOrder=30;
    const running=state.suctionActive;const working=running||state.toolWorking||(mode.id==='vortex'&&state.blob.status==='pulling');
    this.root.visible=Boolean(state.suctionActive||state.autoPush||state.unloading||state.toolWorking||(mode.id==='power'&&state.powerMode==='push'&&mode.pushClass&&state.suctionEnabled&&state.battery.charge>0));
    this.pulse.visible=working;this.pulse.material.color.set(mode.color);
    if(working){const radius=mode.radius,phase=(time*1.2)%1;
      this.pulse.rotation.set(-Math.PI/2,0,0);this.pulse.position.set(0,.11,0);this.pulse.scale.setScalar(radius*(reduced?1:.3+phase*.7));
      if(mode.id==='focus'){this.pulse.rotation.x=0;this.pulse.position.set(0,mode.nozzleY,mode.nozzleOffset+(reduced?.5:1-phase)*(radius-mode.nozzleOffset));this.pulse.scale.setScalar(.14+(reduced?.5:1-phase)*.4);}
      if(mode.id==='power'){this.pulse.rotation.x=0;this.pulse.position.set(0,mode.nozzleY,mode.nozzleOffset+(reduced?.3:phase)*.6);this.pulse.scale.setScalar(.2+(reduced?.2:phase)*.25);}
      if(mode.id==='ground'){const size=reduced?.5:1-phase;this.pulse.position.set(0,.11,(mode.near+mode.radius)/2);this.pulse.scale.set((mode.floorWidth??mode.width??1)*size*.5,radius*size*.24,1);}
      this.pulse.material.opacity=reduced?.25:(1-phase)*.75;this.field.material.opacity=running?.21:.2;
    }else this.field.material.opacity=.1;
    const speed=(reduced?.3:1)*mode.speed/2.5,blowing=state.unloading||state.autoPush||(mode.id==='power'&&state.powerMode==='push');
    for(let i=0;i<mode.streams;i++){
      const head=(time*speed+i*.137)%1,attribute=this.streams[i].geometry.attributes.position,lane=mode.shape==='circle'?(i/mode.streams*2-1):(i/(mode.streams-1)*2-1);
      for(let j=0;j<POINTS;j++){const progress=Math.max(0,head-j*.014),p=vacuumAirPoint(mode,lane*(blowing?.2:1),blowing?1-progress:progress,reduced?0:time,this.motion),width=Math.sin(j/(POINTS-1)*Math.PI)*.035;attribute.setXYZ(j*2,p.x-width,p.y,p.z);attribute.setXYZ(j*2+1,p.x+width,p.y+.012,p.z);}
      attribute.needsUpdate=true;this.streams[i].material.opacity=Math.sin(head*Math.PI)*.9;
    }
    const attribute=this.dust.geometry.attributes.position;
    for(let i=0;i<72;i++){const progress=(time*speed+i/72)%1,p=vacuumAirPoint(mode,Math.sin(i*7.7)*(blowing?.2:1),blowing?1-progress:progress,reduced?0:time,this.motion);attribute.setXYZ(i,p.x,p.y,p.z);}attribute.needsUpdate=true;
    if(!reduced)for(const ring of this.tool.userData.spins)ring.rotation.z=time*(working?2.5:1);
  }
}
