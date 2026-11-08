import {coastHabitat,coastRegion} from './coast-area.mjs';
import {iceRegion,inIcePass,icePondRadius} from './ice-area.mjs';
import {volcanoRegion,inVolcanoPass,onLava,VOLCANO_LAVA,lavaDistance} from './volcano-area.mjs';
import {sunnyHeight,facilityFootprint} from './sunny-area.mjs';
import {walkable} from './test-world.mjs';
import {woodlandAt} from './woodland-regions.mjs';
const MOSS_WOODS=new Set(['steinbach','mooswald','pilzhain']);
import {vacuumContains} from './vacuums.mjs';
// Wilde Blobs (Jakob 31.10., Testwerte): jede Art hat ihren eigenen Charakter, spätere Gebiete sind schwerer.
// catch = Sekunden Saugkontakt; restless = bewegt sich auch im Sog weiter.
export const WILD_RULES={
 moss:{group:'wald',catch:.9,trait:'Döser: schläft viel und wacht nur widerwillig auf.'},
 forest:{group:'wald',catch:1.1,trait:'Flitzer: rennt im Zickzack, schaut aber neugierig zurück.'},
 sand:{group:'kueste',catch:1.2,trait:'Buddler: taucht ab und kommt ein paar Meter weiter wieder hoch.'},
 tide:{group:'kueste',catch:1.3,restless:true,trait:'Wellenreiter: schießt in kurzen Schüben davon und muss dann verschnaufen.'},
 snow:{group:'berg',catch:1.4,restless:true,trait:'Schneeball: rollt schnell, kann kaum lenken und ist nach einem Aufprall benommen.'},
 crystal:{group:'berg',catch:1.5,restless:true,trait:'Springer: teleportiert sich dreimal weg, dann ist er erschöpft.'},
 ash:{group:'vulkan',catch:1.5,restless:true,trait:'Trickser: macht zwei Doppelgänger aus Rauch, nur einer ist echt.'},
 lava:{group:'vulkan',catch:.8,restless:true,trait:'Lavaspringer: lässt sich nur im Sprung aus dem Lavastrom fangen.'}
};
export const WILD_HOMES={moss:[48,38],forest:[-23,14],sand:[64,-3],tide:[73,13],snow:[33,-52],crystal:[45,-80],ash:[-58,40],lava:[-48,56.5]};
export function wildGroupAt(x,z){return volcanoRegion(x,z)?'vulkan':iceRegion(x,z)?'berg':coastRegion(x,z)&&x>45?'kueste':'wald';}
export const GROUP_SPECIES={wald:['moss','forest'],kueste:['sand','tide'],berg:['snow','crystal'],vulkan:['ash','lava']};
export function wildNature(x,z){return Math.hypot((x+6)/21,(z+7)/17)>1&&!facilityFootprint(x,z,4);}
export function blobHabitat(species,x,z){
 if(species==='sand'||species==='tide')return coastHabitat(species,x,z);
 if(species==='snow'||species==='crystal')return iceRegion(x,z,-.6)&&!inIcePass(x,z)&&icePondRadius(x,z)>1.1;
 if(species==='ash')return volcanoRegion(x,z,-.6)&&!inVolcanoPass(x,z)&&!onLava(x,z,.4);
 if(species==='lava')return lavaDistance(x,z)<.8;
 /* Jakob 8.11.: Moosblobs leben nur in Steinbach, Mooswald und Pilzhain. */if(species==='moss'&&!MOSS_WOODS.has(woodlandAt(x,z)?.id))return false;
 return wildNature(x,z)&&!(coastRegion(x,z)&&x>45)&&!iceRegion(x,z,1)&&!volcanoRegion(x,z,1);
}
const step=(s,b,x,z)=>{if(!blobHabitat(b.species,x,z)||!walkable(s,x,z,sunnyHeight(b.x,b.z)))return false;b.x=x;b.z=z;return true;};
const go=(s,b,a,v,dt)=>{b.angle=a;return step(s,b,b.x+Math.sin(a)*v*dt,b.z+Math.cos(a)*v*dt);};
const away=(b,p)=>Math.atan2(b.x-p.x,b.z-p.z);
function lavaSpot(s,b){const line=VOLCANO_LAVA[Math.floor(Math.random()*VOLCANO_LAVA.length)],points=[];for(let k=0;k<line.length-1;k++)for(let t=0;t<1;t+=.2)points.push([line[k][0]+(line[k+1][0]-line[k][0])*t,line[k][1]+(line[k+1][1]-line[k][1])*t]);const p=s.player;points.sort((a,c)=>Math.hypot(a[0]-p.x,a[1]-p.z)-Math.hypot(c[0]-p.x,c[1]-p.z));const near=points.slice(0,6);return near[Math.floor(Math.random()*near.length)];}
// Kann der Blob gerade gefangen werden? 0 = nein, sonst Tempo-Faktor für den Fortschritt.
export function catchRate(b){const a=b.ai??{};if(b.species==='sand'&&a.mode==='buried')return 0;if(b.species==='lava')return a.mode==='leap'?1:0;if(b.species==='crystal'&&a.mode==='blink')return 0;if(b.species==='snow')return a.mode==='dizzy'?2:a.mode==='roll'?.45:1;if(b.species==='tide')return a.mode==='rest'?1.25:.5;if(b.species==='moss'&&a.mode==='sleep')return 1.3;return 1;}
export function wildTick(s,b,i,dt,slow,mode,active){const a=b.ai??={mode:'idle',t:0},p=s.player,d=Math.hypot(b.x-p.x,b.z-p.z),idle=()=>go(s,b,s.time*.5+i*2,.2*slow,dt);a.t=(a.t??0)+dt;let lift=null;b.hideProgress=0;
 switch(b.species){
  case 'moss':if(d<2.2){a.mode='wake';a.t=0;go(s,b,away(b,p)+Math.sin(s.time*2)*.3,.9*slow,dt);}else if(a.t>2.5)a.mode='sleep';else if(a.mode!=='sleep')idle();break;
  case 'forest':if(d<4){const pausing=(s.time+i)%3.2<.8;if(pausing){b.angle=away(b,p)+Math.PI;}else go(s,b,away(b,p)+Math.sin(s.time*5)*.9,1.7*slow,dt);}else idle();break;
  case 'sand':if(a.mode==='buried'){b.hideProgress=.92;go(s,b,a.dir,3.2*slow,dt);if(a.t>1.3){a.mode='up';a.t=0;}}else if(d<3&&a.t>1.6){a.mode='buried';a.t=0;a.dir=away(b,p)+(Math.random()-.5)*1.2;}else idle();break;
  case 'tide':if(a.mode==='dash'){if(!go(s,b,a.dir,4.6*slow,dt))a.t=9;if(a.t>.7){a.mode='rest';a.t=0;}}else if(d<3.8&&(a.mode!=='rest'||a.t>1.6)){a.mode='dash';a.t=0;a.dir=away(b,p)+(Math.random()-.5)*.8;}else if(a.mode!=='rest')idle();break;
  case 'snow':if(a.mode==='dizzy'){b.angle+=dt*6;if(a.t>2.4){a.mode='idle';a.t=0;}}else if(a.mode==='roll'){const t=away(b,p),limit=5*slow;a.vx=(a.vx??0)+Math.sin(t)*dt*3.2;a.vz=(a.vz??0)+Math.cos(t)*dt*3.2;const v=Math.hypot(a.vx,a.vz);if(v>limit){a.vx*=limit/v;a.vz*=limit/v;}b.roll=(b.roll??0)+v*dt*2.2;b.angle=Math.atan2(a.vx,a.vz);if(!step(s,b,b.x+a.vx*dt,b.z+a.vz*dt)){a.mode='dizzy';a.t=0;a.vx=a.vz=0;s.events?.push('obstacle');}else if(d>9&&a.t>2){a.mode='idle';a.t=0;a.vx=a.vz=0;}}else if(d<4.5){a.mode='roll';a.t=0;a.vx=a.vz=0;}else idle();break;
  case 'crystal':{a.charges=Math.min(3,(a.charges??3)+dt/16);if(a.mode==='blink'){b.hideProgress=Math.min(1,a.t/.3);if(a.t>.35){for(let k=0;k<14;k++){const q=Math.random()*6.28,r=5+Math.random()*4,x=b.x+Math.sin(q)*r,z=b.z+Math.cos(q)*r;if(blobHabitat(b.species,x,z)&&walkable(s,x,z,sunnyHeight(x,z))&&Math.hypot(x-p.x,z-p.z)>4){b.x=x;b.z=z;break;}}a.mode='idle';a.t=0;b.catch=Math.min(b.catch??0,.3);}}else if(a.charges>=1&&(d<3.2||(b.catch??0)>.55)){a.charges-=1;a.mode='blink';a.t=0;}else if(a.charges<1){b.angle+=dt*2;}else idle();break;}
  case 'ash':{if(d<5.5&&!b.decoys?.length&&s.time>(a.again??0))b.decoys=[0,1].map(k=>({x:b.x,z:b.z,dir:away(b,p)+(k?1.3:-1.3)}));for(let k=(b.decoys?.length??0)-1;k>=0;k--){const q=b.decoys[k],x=q.x+Math.sin(q.dir)*1.5*dt,z=q.z+Math.cos(q.dir)*1.5*dt;if(blobHabitat('ash',x,z)&&walkable(s,x,z,sunnyHeight(q.x,q.z))){q.x=x;q.z=z;}else q.dir+=1.7;q.dir+=Math.sin(s.time*2+k)*dt;if(active&&vacuumContains(p,{...q,y:sunnyHeight(q.x,q.z)+.3},mode)){b.decoys.splice(k,1);a.again=s.time+7;}}if(d<5.5)go(s,b,away(b,p)+Math.sin(s.time*2.3)*.6,1.6*slow,dt);else{idle();if(d>11)b.decoys=[];}break;}
  case 'lava':{if(a.mode==='leap'){const t=Math.min(1,a.t/1.7),side=Math.sin(t*Math.PI);b.x=a.fx+(a.tx-a.fx)*t+a.sx*side;b.z=a.fz+(a.tz-a.fz)*t+a.sz*side;lift=sunnyHeight(a.fx,a.fz)+.15+side*2.6;b.angle=Math.atan2(a.tx-a.fx,a.tz-a.fz);if(t===1){a.mode='under';a.t=0;a.wait=1.4+Math.random()*2;}}else{b.hideProgress=1;lift=sunnyHeight(b.x,b.z)-.3;if(d<13&&a.t>(a.wait??1.5)){const to=lavaSpot(s,b),dx=p.x-b.x,dz=p.z-b.z,l=Math.max(.1,Math.hypot(dx,dz)),reach=Math.min(2.4,l*.7);Object.assign(a,{mode:'leap',t:0,fx:b.x,fz:b.z,tx:to[0],tz:to[1],sx:dx/l*reach,sz:dz/l*reach});}}break;}
  default:idle();
 }
 return lift;
}
