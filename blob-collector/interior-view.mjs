import * as T from './vendor/three.module.js';
import {SUNNY,sunnyHeight,insideBuilding} from './sunny-area.mjs';
import {chargerOwned} from './charger-building.mjs';
export function addInteriors(b,root){
 for(const id of ['home','storage']){const p=SUNNY[id],g=b.group(p.x,sunnyHeight(p.x,p.z)-.3,p.z);for(let i=0;i<9;i++)b.box(i%2?'#c3a37b':'#d2b58b',g,-p.w/2+.25+i*(p.w-.5)/8,.29,0,(p.w-.5)/9,.06,p.d-.15,true);
  for(const side of [-1,1])b.box('#aa8b65',g,side*(p.w/2-.1),.6,0,.15,.6,p.d,true);b.box('#b89c73',g,0,.6,-p.d/2+.1,p.w,.6,.16,true);
  if(id==='home'){
   const bed=b.group(-1.12,.3,-.65,g);b.box('#9b7855',bed,0,.25,0,1.25,.4,1.75,true);b.box('#e8dbc2',bed,0,.51,0,1.2,.16,1.7,true);b.box('#7c9b87',bed,0,.65,.15,1.22,.12,1.28,true);b.box('#f7ebd0',bed,0,.67,-.65,.85,.22,.42,true);b.box('#997a59',bed,0,.74,-.87,1.3,.9,.13,true);
   b.box('#ad895e',g,.35,.7,-1.28,.9,.8,.62,true);b.box('#d5b882',g,.35,1.13,-1.28,1,.09,.7,true);b.box('#6c8a73',g,.35,.32,.3,1.45,.025,1.8,true);
   for(let i=0;i<4;i++)b.box(['#a4b58b','#c8a76d','#8fa6a1','#ddbf8f'][i],g,.12+i*.15,1.28,-1.32,.12,.24,.26,true);
   const table=b.group(-1.25,.3,1.05,g);b.cylinder('#ba9769',table,0,.48,0,.4,.4,.1,16);b.cylinder('#8c7254',table,0,.22,0,.07,.12,.44,8);b.cylinder('#e0c78f',table,0,.7,0,.13,.22,.35,12);
  }
 }
 const charger=root.parent?new T.Group():new T.Group();charger.position.set(SUNNY.charger.x,sunnyHeight(SUNNY.charger.x,SUNNY.charger.z),SUNNY.charger.z);root.add(charger);
 b.box('#617d72',charger,0,.13,0,.76,.26,.62,true);b.box('#d6ba7b',charger,0,.28,0,.83,.08,.68,true);for(const x of [-.25,.25])b.box('#80998a',charger,x,.5,-.1,.08,.44,.12,true);
 const meter=b.box('#b3d88e',charger,0,.39,.25,.46,.07,.025,true),tool=b.group(0,.42,0,charger);b.cylinder('#bc9a66',tool,0,.1,0,.12,.12,.48,10).rotation.z=Math.PI/2;b.box('#739682',tool,.18,.08,0,.25,.25,.32,true);
 return {charger,meter,tool,update(s){tool.visible=Boolean(s.charging);meter.scale.x=Math.max(.03,s.battery.charge/s.battery.max);meter.material.color.set(s.charging?'#d4e9a0':'#89b67e');charger.visible=!s.testWorld.enabled&&chargerOwned(s);}};
}
