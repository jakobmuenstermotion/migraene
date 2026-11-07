import * as T from './vendor/three.module.js';
import {getVacuum} from './vacuums.mjs';
import {TEST_OBSTACLES} from './vacuum-skills.mjs';
import {nozzlePosition} from './simulation.mjs';
import {updateCanopyCrack} from './canopy-visibility.mjs';
const DUST=24;
// Gemeinsame Rissform: Hauptäste mit Knicken und Seitenzweigen, flach auf dem Boden.
const CRACK=(()=>{const pos=[],seg=(x0,z0,x1,z1,w)=>{const dx=x1-x0,dz=z1-z0,l=Math.hypot(dx,dz)||1,nx=-dz/l*w,nz=dx/l*w;pos.push(x0-nx,0,z0-nz,x1-nx*.4,0,z1-nz*.4,x1+nx*.4,0,z1+nz*.4,x0-nx,0,z0-nz,x1+nx*.4,0,z1+nz*.4,x0+nx,0,z0+nz);};for(let k=0;k<6;k++){let a=k*1.047+.3*Math.sin(k*2.1),x=0,z=0,w=.06;for(let j=0;j<4;j++){const l=.16+((k+j)%3)*.05,nx=x+Math.sin(a)*l,nz=z+Math.cos(a)*l;seg(x,z,nx,nz,w);if(j===1||j===2){const b=a+(j%2?.8:-.8);seg(nx,nz,nx+Math.sin(b)*.14,nz+Math.cos(b)*.14,w*.55);}x=nx;z=nz;w*=.72;a+=(j%2?.35:-.35);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;})();
const CRACK_MAT=new T.MeshBasicMaterial({color:'#1d140c',side:T.DoubleSide,transparent:true,opacity:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});

export class ChallengeView{
  constructor(scene,source=TEST_OBSTACLES){
    this.dust=new T.Points(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(DUST*3),3)),new T.PointsMaterial({color:'#d8c49c',size:.075,transparent:true,opacity:.55,depthWrite:false}));this.dust.frustumCulled=false;this.dust.visible=false;scene.add(this.dust);
    this.items=new Map();const mat=color=>new T.MeshStandardMaterial({color,roughness:.85});
    const sphere=new T.IcosahedronGeometry(1,1),box=new T.BoxGeometry(1,1,1);
    for(const o of source){if(o.rockGate)continue;const mode=getVacuum(o.tool),root=new T.Group(),model=new T.Group();scene.add(root);root.position.set(o.x,0,o.z);root.add(model);
      const add=(geo,color,x,y,z,sx,sy,sz)=>{const m=new T.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);model.add(m);return m;};
      if(o.tool==='ground'){
        const spot=new T.Group();root.add(spot);root.userData.spot=spot;/* Jakob 3.11.: kein dunkles Loch mehr, sondern breite verzweigte Risse mit aufgeworfener Erde */const crack=new T.Mesh(CRACK,CRACK_MAT);crack.position.y=.03;crack.renderOrder=2;spot.add(crack);const soil=new T.InstancedMesh(sphere,mat('#b58d5e'),6),dm=new T.Object3D();for(let k=0;k<6;k++){const a=k*1.13+.4,r=.5+(k%3)*.18;dm.position.set(Math.sin(a)*r,.02,Math.cos(a)*r);dm.scale.set(.09,.035,.07);dm.rotation.y=a;dm.updateMatrix();soil.setMatrixAt(k,dm.matrix);}spot.add(soil);root.userData.crack=crack;
        const colors={acorn:'#b58a4e',stone:'#b9beb0',root:'#ab8358',amber:'#e6b355',relic:'#dac57d',crystal:'#8fc7cd'},color=colors[o.kind]??'#d9a393',pickups=[];
        for(let j=0;j<2;j++){const pickup=new T.Group();model.add(pickup);const core=new T.Mesh(o.kind==='crystal'||o.kind==='amber'?new T.OctahedronGeometry(.17):sphere,mat(color));if(o.kind!=='crystal'&&o.kind!=='amber')core.scale.set(.16,.19,.15);pickup.add(core);if(o.kind==='worm'){core.scale.set(.08,.08,.08);for(let k=0;k<5;k++){const segment=new T.Mesh(sphere,mat('#d9a393'));segment.scale.setScalar(.075);segment.position.set(Math.sin(k*.9)*.05,k*.07-.1,0);pickup.add(segment);}}if(o.kind==='acorn'){const cap=new T.Mesh(new T.SphereGeometry(.17,8,6,0,Math.PI*2,0,Math.PI/2),mat('#88683f'));cap.position.y=.08;pickup.add(cap);}if(o.kind==='root')core.scale.set(.065,.26,.075);if(o.kind==='relic'){core.scale.set(.19,.08,.19);}pickups.push(pickup);}
        root.userData.pickups=pickups;root.userData.color=color;root.userData.rare=false;
      }
      if(o.id==='fruit'){
        const tree=new T.Group();root.add(tree);const trunk=new T.Mesh(new T.CylinderGeometry(.12,.2,2.7,7),mat('#a18a61'));trunk.position.y=1.3;tree.add(trunk);
        const branch=new T.Mesh(box,mat('#a18a61'));branch.position.set(.5,2.2,0);branch.scale.set(1,.1,.12);tree.add(branch);
        for(let i=0;i<3;i++){const crown=new T.Mesh(sphere,mat(i%2?'#9ab578':'#b3c789'));crown.position.set((i-1)*.5,2.9,0);crown.scale.set(.9,.7,.8);tree.add(crown);}
        add(sphere,'#efb85f',.82,2.02,.05,.22,.24,.22);add(box,'#728f50',.83,2.28,.05,.06,.17,.05);
      }
      if(o.id==='leaves'){
        const pile=new T.InstancedMesh(sphere,mat('#bca05a'),12),dummy=new T.Object3D();for(let i=0;i<12;i++){const a=i*2.4,r=.18+i/20;dummy.position.set(Math.sin(a)*r,.15+(i%3)*.13,Math.cos(a)*r);dummy.scale.set(.32,.16,.25);dummy.rotation.y=a;dummy.updateMatrix();pile.setMatrixAt(i,dummy.matrix);}model.add(pile);
      }
      if(o.id==='rock'){const rock=add(sphere,'#a3a697',0,.46,0,.74,.65,.68);rock.rotation.y=.6;add(box,'#7e8874',.02,.6,.56,.035,.45,.02);}
      const ring=new T.Mesh(new T.RingGeometry(.77,.8,48),new T.MeshBasicMaterial({color:mode.color,transparent:true,opacity:.8,side:T.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.11;root.add(ring);
      this.items.set(o.id,{root,model,ring});
    }
  }
  update(state,reduced){
    let open=null,gap=Infinity;
    for(const o of state.obstacles){const item=this.items.get(o.id);if(!item)continue;const {model,root,ring}=item;root.position.set(o.x,o.y??0,o.z);ring.visible=o.tool!=='ground'&&!o.cleared&&o.progress>0;
      const buried=o.tool==='ground',detected=(o.detectedUntil??0)>state.time;
      if(buried){const rare=Boolean(o.reward?.rare);if(root.userData.rare!==rare){root.userData.rare=rare;for(const pickup of root.userData.pickups)pickup.traverse(mesh=>{if(mesh.material){mesh.material.color.set(rare?'#cba5f2':root.userData.color);mesh.material.emissive.set(rare?'#a16be2':'#000000');mesh.material.emissiveIntensity=rare?.6:0;}});}root.userData.spot.visible=!o.cleared&&o.tool==='ground'&&!o.route&&o.progress>0;root.userData.spot.scale.setScalar(.45+o.progress*.35);if(root.userData.spot.visible){const d=Math.hypot(o.x-state.player.x,o.z-state.player.z);if(d<gap){gap=d;open=o;}}root.userData.pickups.forEach((pickup,j)=>{pickup.visible=j===0||Boolean(o.reward?.quantity===2);pickup.position.set(j*.3,.2,0);});}
      if(!o.cleared){model.visible=!buried||detected;model.position.set(0,buried?o.progress*.55:0,0);model.scale.setScalar(buried&&detected&&o.progress===0?.75:1);if(!reduced&&o.progress>0){model.position.x=Math.sin(state.time*37)*o.progress*.05;model.rotation.z=Math.sin(state.time*30)*o.progress*.03;}else model.rotation.z=0;
      }else{const t=Math.min(1,(state.time-o.clearedAt)/1.1),target=nozzlePosition(state.player);model.visible=t<1;model.position.set((target.x-o.x)*t,.5*Math.sin(t*Math.PI)+(target.y-(o.y??0))*t,(target.z-o.z)*t);model.scale.setScalar(1-t);}
    }
    updateCanopyCrack(open);this.dust.visible=!!open&&!reduced;if(this.dust.visible){const p=this.dust.geometry.attributes.position,y0=open.y??0,reach=.2+open.progress*.3;for(let i=0;i<DUST;i++){const a=i*2.399,life=(state.time*.45+i/DUST)%1,r=reach*(.35+(i%5)/6)*(1+life*.5);p.setXYZ(i,open.x+Math.sin(a+life)*r,y0+.05+life*.55,open.z+Math.cos(a+life)*r);}p.needsUpdate=true;this.dust.material.opacity=.25+open.progress*.4;}
  }
}

