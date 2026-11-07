import * as T from './vendor/three.module.js';
import {ScenicBatch} from './scenic-geometry.mjs';

// Neugestaltung Eistal: Modelle der neuen Schnee- und Eisfunde.
export const ICE_KINDS=new Set(['snow','frostwood','frostflower','frostmoss','ice','icecrystal','ironore','pinecone','cinderpod','icebell','starcone','frostcone','iceheart','frostrelic','desertsand','clay','coloredearth','cactusfibre','desertflower','cactusfruit','suncapsule','paintedstone','fossilshell','sunshard','desertcrystal','copperore','frozenseed','frozenpearl','blueicestone','starshard','luckycap']);
// Vulkan: große flache Ascheflocke (unregelmäßig, hellgrau mit glimmendem Rand) und die übrigen Funde.
function volcanoMaterial(b,kind,{stone,sphere,chip,stem}){
 if(kind==='desertsand'){const pos=[0,.012,0],col=[],c=new T.Color('#2a2827');col.push(c.r,c.g,c.b);const idx=[],n=9;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=.145+.045*Math.sin(i*2.3)+.025*Math.cos(i*4.1);pos.push(Math.cos(a)*r,.006*Math.sin(i*1.7),Math.sin(a)*r*.82);c.set(i%2?'#1c1b1a':'#343230');col.push(c.r,c.g,c.b);idx.push(0,1+(i+1)%n,1+i);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(idx);g.computeVertexNormals();b.add(g,null);g.dispose();return true;}
 if(kind==='frozenseed'){b.add(sphere,'#a8d8c8',0,.08,0,.08,.11,.07,.2,.3,.2);b.add(chip,'#e8fff6',.03,.14,.03,.02,.03,.02);return true;}
 if(kind==='frozenpearl'){b.add(sphere,'#dff2fb',0,.09,0,.09,.09,.09);b.add(sphere,'#ffffff',-.03,.13,.04,.025,.025,.02);return true;}
 if(kind==='blueicestone'){b.add(chip,'#6fb4e4',0,.1,0,.1,.16,.09,.2,.4,.1);b.add(chip,'#bfe6fb',.05,.13,.03,.035,.06,.03);return true;}
 if(kind==='starshard'){for(const [x,y,z,s]of [[0,.2,0,.14],[.08,.28,.03,.06],[-.08,.14,.05,.05]])b.add(chip,'#fff1a8',x,y,z,s,s*1.4,s,.3,x*9,.2);b.add(chip,'#ffffff',0,.24,.05,.05,.07,.05);return true;}
 if(kind==='luckycap'){b.add(stem,'#fbf0d8',0,.1,0,2,.22,2);b.add(sphere,'#e8667a',0,.22,0,.15,.08,.15);for(let i=0;i<4;i++){const a=i*1.57+.4;b.add(sphere,'#fff8ea',Math.sin(a)*.08,.285,Math.cos(a)*.08,.024,.012,.024);}return true;}
 if(kind==='clay'){b.add(stone,'#352a29',0,.11,0,.27,.2,.23,.3,.4,.2);b.add(stone,'#4a3d3a',.17,.19,-.05,.13,.11,.12,.5,.2,.3);b.add(stone,'#2a2222',-.16,.08,.1,.14,.09,.12,.2,1.1,.4);b.add(stone,'#3e3230',.03,.05,-.2,.1,.06,.09,.1,2,.2);for(const [x,y,z,s] of [[.05,.27,.1,.045],[-.12,.19,.1,.035],[.18,.13,.11,.03],[-.04,.17,-.19,.03],[.2,.27,-.01,.026]])b.add(chip,'#ff8a2a',x,y,z,s,s*.7,s);b.add(chip,'#ffd27a',.05,.29,.11,.02,.015,.02);return true;}
 if(kind==='coloredearth'){const tip=new T.CylinderGeometry(.08,1,1,5);b.add(stone,'#5a5040',0,.025,0,.17,.05,.14,.1,.8,.1);for(const [x,z,w,h,c,lx,lz] of [[0,0,.055,.32,'#f2d63f',0,0],[.07,.03,.04,.22,'#ffe765',.3,.2],[-.06,.05,.045,.25,'#e3bf2c',-.25,.2],[.03,-.07,.035,.18,'#fff08a',.15,-.35],[-.05,-.05,.03,.14,'#efcf38',-.3,-.25],[.1,-.03,.028,.12,'#d9b324',.5,-.15]]){b.add(tip,c,x,.04+h/2,z,w,h,w,lz,x*20,-lx);}b.add(chip,'#fffbd0',.002,.33,0,.014,.02,.014);tip.dispose();return true;}
 if(kind==='cactusfibre'){b.add(stone,'#2f2626',0,.05,0,.15,.08,.13,.2,.6,.1);for(let i=0;i<7;i++){const a=i*2.399;b.add(stem,i%3?'#e0762a':'#ffc15a',Math.sin(a)*.08,.09,Math.cos(a)*.08,.32,.34,.32,Math.PI/2-.12,a,0);}return true;}
 if(kind==='desertflower'){b.add(stone,'#2f2626',0,.04,0,.15,.06,.13,.2,.6,.1);b.add(stem,'#4a3a30',0,.16,0,1.3,.34,1.3,.05,0,.05);for(let i=0;i<5;i++){const a=i*1.257+.3;b.add(sphere,'#3f3a2e',Math.sin(a)*.12,.1,Math.cos(a)*.12,.1,.025,.045,0,a+1.57,.3);}for(let i=0;i<7;i++){const a=i/7*Math.PI*2;b.add(sphere,i%2?'#ff6a2a':'#ffa23c',Math.sin(a)*.12,.36+(i%2)*.02,Math.cos(a)*.12,.1,.035,.055,0,a+1.57,.35);}b.add(sphere,'#ffe68a',0,.385,0,.05,.045,.05);b.add(chip,'#fff6c8',0,.43,0,.022,.03,.022);return true;}
 if(kind==='cactusfruit'){b.add(sphere,'#c9402e',0,0,0,.15,.18,.15);b.add(sphere,'#f07a3c',-.05,.05,.07,.06,.06,.05);b.add(stem,'#3e3430',0,.2,0,.4,.14,.4);return true;}
 if(kind==='suncapsule'){b.add(sphere,'#f0a23c',0,0,0,.13,.2,.13);b.add(chip,'#ffe9a8',.04,.08,.08,.04,.05,.04);return true;}
 if(kind==='paintedstone'){b.add(stone,'#b5ada2',0,.05,0,.16,.11,.14,.2,.4,.1);return true;}
 if(kind==='fossilshell'){b.add(sphere,'#8f8679',0,.04,0,.17,.05,.15);return true;}
 if(kind==='sunshard'){b.add(chip,'#e8552c',0,.1,0,.1,.2,.08);b.add(chip,'#ffc06a',.05,.14,.03,.04,.1,.03);return true;}
 if(kind==='desertcrystal'){b.add(chip,'#e0603a',0,.1,0,.08,.2,.08);return true;}
 if(kind==='copperore'){b.add(stone,'#b0683c',0,.07,0,.17,.12,.15,.2,.5,.1);return true;}
 return false;
}
function iceMaterial(b,kind,{stone,sphere,chip,stem},ground=true){
 if(volcanoMaterial(b,kind,{stone,sphere,chip,stem}))return;
 const prism=new T.CylinderGeometry(1,1,1,6),tip=new T.ConeGeometry(1,1,6),cone=new T.ConeGeometry(1,1,7),log=new T.CylinderGeometry(1,1,1,7);
 // Jakob 29.10.: Eistal-Materialien heben sich durch kräftige Farben vom Schnee ab (ohne Unterteller);
 // Schnee ist wie der Strandsand ein kleines flaches Häufchen.
 if(kind==='snow'){
  const pos=[],col=[],idx=[],rings=3,segments=9,c=new T.Color();for(let j=0;j<=rings;j++){const r=j/rings;for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2,contour=1+.1*Math.sin(a*3+.5)+.05*Math.cos(a*5),x=Math.cos(a)*.3*r*contour,z=Math.sin(a)*.25*r*contour,y=-.015+.11*Math.pow(Math.max(0,1-r*r),1.6);pos.push(x,y,z);c.set(r>.9?'#d5dff0':r>.5?'#edf2fb':'#ffffff');col.push(c.r,c.g,c.b);if(j<rings&&i<segments){const q=j*(segments+1)+i;idx.push(q,q+1,q+segments+1,q+1,q+segments+2,q+segments+1);}}}
  const mound=new T.BufferGeometry();mound.setAttribute('position',new T.Float32BufferAttribute(pos,3));mound.setAttribute('color',new T.Float32BufferAttribute(col,3));mound.setIndex(idx);mound.computeVertexNormals();b.add(mound,null);mound.dispose();
  for(let i=0;i<1;i++){const a=i*2.399,r=.05+(i%5)*.05;b.add(chip,'#d4f2fd',Math.sin(a)*r,-.01+.11*Math.pow(Math.max(0,1-(r/.3)**2),1.6),Math.cos(a)*r*.8,.014,.018,.014);}
 }else if(kind==='frostwood'){
  b.add(log,'#6f6a86',0,.12,0,.1,.46,.1,0,.35,Math.PI/2);
  for(const s of [-1,1])b.add(log,'#e7dcc8',Math.cos(.35)*.235*s,.12,-Math.sin(.35)*.235*s,.085,.02,.085,0,.35,Math.PI/2);
  for(const s of [-1,1])b.add(log,'#c9b393',Math.cos(.35)*.242*s,.12,-Math.sin(.35)*.242*s,.042,.012,.042,0,.35,Math.PI/2);
  b.add(sphere,'#f7faff',-.02,.21,.01,.2,.04,.075,0,.35,0);b.add(sphere,'#ffffff',.1,.215,-.03,.075,.025,.05,0,.35,0);
  b.add(log,'#7c7894',.05,.24,.1,.028,.2,.028,.6,.35,.5);b.add(chip,'#9fe3f5',.11,.33,.17,.03,.05,.03);
 }else if(kind==='frostflower'){
  b.add(stem,'#4f8f86',0,.12,0,1.2,.38,1.2);
  for(const a of [.8,3.9])b.add(cone,'#5fa08f',Math.sin(a)*.07,.07,Math.cos(a)*.07,.045,.16,.018,1,a,0);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;b.add(cone,i%2?'#7fcdf0':'#a9e2f7',Math.sin(a)*.085,.32,Math.cos(a)*.085,.05,.17,.025,Math.PI/2,a,0);b.add(chip,'#ffffff',Math.sin(a)*.17,.325,Math.cos(a)*.17,.022,.018,.022);}
  b.add(sphere,'#3f9fcf',0,.33,0,.05,.04,.05);b.add(chip,'#ffffff',0,.38,0,.025,.035,.025);
 }else if(kind==='frostmoss'){
  for(let i=0;i<11;i++){const a=i*2.399,r=.03+(i%4)*.055;b.add(sphere,['#4f8f72','#64a585','#3f7d64'][i%3],Math.sin(a)*r,.04+(i%3)*.018,Math.cos(a)*r,.085,.06,.075);}
  for(let i=0;i<7;i++){const a=i*1.7;b.add(chip,'#f4fbff',Math.sin(a)*.12,.1+(i%2)*.02,Math.cos(a)*.12,.022,.028,.022);}
 }else if(kind==='ice'){
  b.add(stone,'#7fbfdc',0,.06,0,.2,.14,.17,.2,.5,.1);b.add(stone,'#b9e2f1',.06,.12,-.03,.1,.07,.08,.4,.2,.3);b.add(chip,'#ffffff',-.06,.15,.05,.03,.04,.02);
 }else if(kind==='icecrystal'){
  for(const [x,z,h,r,rx,rz] of [[0,0,.34,.06,0,0],[.07,.04,.24,.045,.35,.2],[-.06,.03,.2,.04,-.3,.25],[.01,-.07,.18,.035,.2,-.35]]){b.add(prism,'#9fdbe6',x,.02+h*.5,z,r,h,r,rx,0,rz);b.add(tip,'#e4f8fb',x+Math.sin(rz)*-h*.55,.02+h+.04,z+Math.sin(rx)*h*.55,r,.09,r,rx,0,rz);}
 }else if(kind==='ironore'){
  b.add(stone,'#6e706d',0,.07,0,.2,.15,.17,.1,.6,.2);
  for(const [x,y,z] of [[-.08,.15,.05],[.1,.11,-.04],[.02,.19,-.07]])b.add(chip,'#b8693a',x,y,z,.05,.035,.04,.3,x*9,.2);
  b.add(chip,'#d9d2c4',.05,.18,.08,.025,.02,.02);
 }else if(kind==='pinecone'||kind==='cinderpod'){
  b.add(sphere,'#7a5236',0,.11,0,.08,.13,.08);
  for(let j=0;j<4;j++)for(let i=0;i<6;i++){const a=i/6*Math.PI*2+j*.5,y=.03+j*.06,r=.08-j*.012;b.add(cone,j%2?'#93653f':'#a87749',Math.sin(a)*r,y,Math.cos(a)*r,.03,.06,.02,1.2,a,0);}
  b.add(stem,'#5c4330',0,.27,0,.6,.08,.6);
 }else if(kind==='icebell'){
  b.add(cone,'#cfeef4',0,.12,0,.12,.2,.12);b.add(sphere,'#e6f7fa',0,.21,0,.06,.05,.06);b.add(sphere,'#9fd2df',0,.02,0,.12,.02,.12);b.add(sphere,'#7fb8c8',0,.0,0,.03,.03,.03);b.add(stem,'#c8a96c',0,.27,0,.5,.07,.5);
 }else if(kind==='starcone'){
  b.add(cone,'#c9a65e',0,.12,0,.08,.24,.08);
  for(let i=0;i<5;i++){const a=i/5*Math.PI*2;b.add(cone,'#f0d98f',Math.sin(a)*.07,.12,Math.cos(a)*.07,.03,.1,.02,Math.PI/2,a,0);}
  b.add(chip,'#fff2b8',0,.27,0,.03,.04,.03);
 }else if(kind==='frostcone'){
  b.add(cone,'#bcdfe9',0,.13,0,.07,.26,.07,Math.PI,0,0);b.add(sphere,'#eaf6f9',0,.24,0,.06,.035,.06);b.add(chip,'#ffffff',.03,.16,.04,.02,.03,.015);
 }else if(kind==='iceheart'){
  b.add(sphere,'#7fc6de',-.045,.15,0,.075,.075,.06);b.add(sphere,'#7fc6de',.045,.15,0,.075,.075,.06);b.add(cone,'#6fb6d2',0,.07,0,.11,.13,.06,Math.PI,0,0);b.add(chip,'#e8fbff',-.04,.19,.04,.025,.025,.015);
 }else{
  b.add(log,'#8a93a3',0,.03,0,.18,.05,.18);b.add(log,'#a5afbe',0,.065,0,.15,.02,.15);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;b.add(chip,'#9fd8ea',Math.sin(a)*.1,.08,Math.cos(a)*.1,.022,.012,.022);}b.add(chip,'#d7f3fb',0,.09,0,.04,.02,.04);
 }
 for(const g of [prism,tip,cone,log])g.dispose();
}
// Small shared meshes used by instanced world resources, with no extra lights.
export function specialMaterialGeometry(kind,{ground=true}={}){
 const b=new ScenicBatch({smooth:true}),stone=new T.IcosahedronGeometry(1,1),sphere=new T.SphereGeometry(1,10,6),chip=new T.OctahedronGeometry(1,0),stem=new T.CylinderGeometry(.025,.035,1,5);
 if(kind==='rarestone'){
  b.add(stone,'#899c97',0,.02,0,.22,.14,.18,.1,.5,.1);
  for(const [x,y,z,s] of [[-.08,.14,.02,.065],[.08,.12,-.04,.052],[.01,.18,.08,.045]])b.add(chip,'#d1eee0',x,y,z,s,s*1.5,s,.2,.3,.2);
 }else if(kind==='beachglass'){
  b.add(chip,'#79bdb1',0,.025,0,.21,.075,.14,.12,.5,.2);
  b.add(chip,'#ddf2dd',-.05,.09,.01,.055,.018,.025,0,.5,0);
 }else if(kind==='resinlump'){
  b.add(stone,'#b46f28',0,.035,0,.19,.16,.15,.1,.4,.18);
  b.add(sphere,'#df9b3d',-.055,.10,.025,.13,.15,.105,-.2,.2,.1);
  b.add(sphere,'#efbb5b',.075,.07,-.025,.11,.115,.09,.2,-.3,.1);
  b.add(stone,'#865637',-.105,-.015,-.045,.085,.035,.12,.2,.6,.2);
  b.add(sphere,'#ffe6a3',-.09,.195,.045,.038,.018,.023,.15,0,.3);
  b.add(chip,'#fff1bc',.09,.14,.035,.018,.028,.012,.2,.3,.1);
 }else if(kind==='seedpod'){
  b.add(stem,'#829667',0,-.08,0,1,.32,1);b.add(sphere,'#b89b6c',0,.14,0,.13,.19,.13);b.add(chip,'#e2ce95',-.04,.22,.04,.035,.06,.035);
 }else if(kind==='glowfruit'||kind==='palmfruit'){
  b.add(sphere,kind==='glowfruit'?'#efbf5f':'#a97a50',0,0,0,.17,.18,.15);b.add(stem,'#6f905d',0,.19,0,1,.14,1,.2,0,.2);b.add(chip,kind==='glowfruit'?'#fff0a0':'#dabb88',-.04,.11,.09,.05,.025,.025);
 }else if(ICE_KINDS.has(kind)){
  iceMaterial(b,kind,{stone,sphere,chip,stem},ground);
 }else{
  b.add(sphere,kind==='windshell'?'#e7d6bf':'#c9cce2',0,.015,0,.18,.08,.15);for(let i=-2;i<=2;i++)b.add(stem,kind==='windshell'?'#bdaaa0':'#f5e9df',i*.055,.08,0,.3,.23,.3,Math.PI/2,i*.2,0);
 }
 const group=new T.Group(),mesh=b.finish(group);mesh.material.dispose();
 // Eistal-Materialien liegen in der Welt etwas größer, damit sie zwischen Schnee und Tannen erkennbar sind.
 if(ground&&ICE_KINDS.has(kind)&&!['pinecone','cinderpod','icebell','starcone','frostwood','snow','desertsand'].includes(kind))mesh.geometry.scale(1.3,1.3,1.3);
 for(const g of [stone,sphere,chip,stem])g.dispose();return mesh.geometry;
}
