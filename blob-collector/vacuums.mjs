import {SAUGER as C} from './sauger-config.mjs';
const DEG=Math.PI/180;
export const VACUUMS=Object.freeze([
  {id:'ground',name:'Bodensauger',angle:0,radius:.65,width:.9,near:-.45,rate:240,speed:2.4,shape:'floor',style:'floor',streams:7,color:'#91ad69',description:'Der Gräber · Sammelt direkt unter dir und hebt versteckte Bodenfunde.',nozzleOffset:.62,nozzleY:.18,swirl:0},
  {id:'focus',name:'Fernsauger',angle:0,radius:C.focus.radius[0],width:C.focus.width[0],maxHeight:C.focus.height[0],rate:180,speed:3,shape:'beam',style:'focus',streams:5,color:'#d59b70',description:'Der Präzise · Ein langer, schmaler Strahl für entfernte Funde und Blobs.',swirl:0},
  {id:'fan',name:'Fächersauger',angle:C.fan.angle[0],radius:C.fan.radius[0],rate:480,speed:2.8,shape:'sector',style:'fan',streams:11,color:'#65ad9e',description:'Der Sammler · Eine breite Schneise für große Mengen leichter Materialien.',swirl:.08},
  {id:'power',name:'Kraftsauger',angle:38,radius:2.1,rate:150,speed:2.1,shape:'sector',style:'power',streams:7,color:'#ca886d',description:'Der Starke · Konzentrierte Kraft für schwere oder feststeckende Objekte.',swirl:.03},
  {id:'vortex',name:'Wirbelsauger',angle:360,radius:C.vortex.diameter[0]/2,rate:310,speed:2.6,shape:'circle',style:'vortex',streams:14,color:'#9b8bc3',description:'Der Allrounder · Kompakter Rundumsog für verstreute Funde und schnelle Blobs.',swirl:.8}
].map(mode=>Object.freeze({nozzleOffset:.984,nozzleY:.42,...mode})));
export const DEFAULT_VACUUM='focus';
const modes=new Map(VACUUMS.map(mode=>[mode.id,mode]));
export function getVacuum(id=DEFAULT_VACUUM){return modes.get(id)??modes.get(DEFAULT_VACUUM);}
export function vacuumAreaLabel(mode){return mode.shape==='floor'?'Unter dir':mode.angle+'°';}
export function vacuumBoundaryPoint(mode,t,out={}){
  if(mode.shape==='floor'||mode.shape==='beam'){const near=mode.shape==='floor'?mode.near:0,corners=[[-mode.width/2,near],[mode.width/2,near],[mode.width/2,mode.radius],[-mode.width/2,mode.radius]],u=Math.max(0,Math.min(1,t))*4,edge=Math.min(3,Math.floor(u)),fraction=u-edge,a=corners[edge],b=corners[(edge+1)%4];out.x=a[0]+(b[0]-a[0])*fraction;out.z=a[1]+(b[1]-a[1])*fraction;}
  else{const angle=(-mode.angle/2+t*mode.angle)*DEG;out.x=Math.sin(angle)*mode.radius;out.z=Math.cos(angle)*mode.radius;}return out;
}
export function vacuumContains(player,target,mode,radius=mode.radius){
  const dx=target.x-player.x,dz=target.z-player.z,d2=dx*dx+dz*dz;
  if(!(mode.shape==='floor'&&target.status==='wild')&&(target.y??0)-(target.status==='wild'?.4:0)-(player.y??0)>(mode.maxHeight??.5)+1e-9)return false;
  if(mode.shape==='beam'){const forward=dx*Math.sin(player.angle)+dz*Math.cos(player.angle),side=dx*Math.cos(player.angle)-dz*Math.sin(player.angle);return forward>=0&&forward<=radius+1e-10&&Math.abs(side)<=mode.width/2+1e-10;}
  if(mode.shape==='floor'){const forward=dx*Math.sin(player.angle)+dz*Math.cos(player.angle),side=dx*Math.cos(player.angle)-dz*Math.sin(player.angle);return forward>=mode.near-1e-10 && forward<=radius+1e-10 && Math.abs(side)<=mode.width/2+1e-10;}
  if(d2>radius*radius)return false;
  if(mode.shape==='circle'||d2<1e-12)return true;
  return (dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/Math.sqrt(d2)>=Math.cos(mode.angle*DEG/2)-1e-10;
}
export function vacuumBounds(player,mode,out={}){
  const {x,z,angle}=player,r=mode.radius;
  if(mode.shape==='circle'){Object.assign(out,{minX:x-r,maxX:x+r,minZ:z-r,maxZ:z+r});return out;}
  out.minX=out.maxX=x;out.minZ=out.maxZ=z;
  const include=(dx,dz)=>{out.minX=Math.min(out.minX,x+dx);out.maxX=Math.max(out.maxX,x+dx);out.minZ=Math.min(out.minZ,z+dz);out.maxZ=Math.max(out.maxZ,z+dz);};
  if(mode.shape==='floor'||mode.shape==='beam'){for(const front of [mode.shape==='floor'?mode.near:0,r])for(const side of [-mode.width/2,mode.width/2])include(front*Math.sin(angle)+side*Math.cos(angle),front*Math.cos(angle)-side*Math.sin(angle));}
  else{const half=mode.angle*DEG/2;for(const a of [angle-half,angle+half])include(Math.sin(a)*r,Math.cos(a)*r);for(let i=0;i<4;i++){const a=i*Math.PI/2,difference=Math.atan2(Math.sin(a-angle),Math.cos(a-angle));if(Math.abs(difference)<=half)include(Math.sin(a)*r,Math.cos(a)*r);}/* Small near-nozzle capture area. */out.minX=Math.min(out.minX,x-.58);out.maxX=Math.max(out.maxX,x+.58);out.minZ=Math.min(out.minZ,z-.58);out.maxZ=Math.max(out.maxZ,z+.58);}
  return out;
}
export function vacuumAirPoint(mode,lane,progress,time=0,out={}){
  const t=Math.max(0,Math.min(1,progress)),half=mode.angle*DEG/2;
  if(mode.shape==='beam'){out.x=lane*mode.width/2*(1-t);out.z=mode.radius*(1-t)+mode.nozzleOffset*t;out.y=.08*(1-t)+mode.nozzleY*t;return out;}
  if(mode.shape==='floor'){out.x=lane*mode.width/2*(1-t);out.z=mode.radius*(1-t)+mode.nozzleOffset*t;out.y=.06*(1-t)+mode.nozzleY*t;return out;}
  let a=lane*half;
  if(mode.style==='fan')a=Math.round(lane)*half*.67+(lane-Math.round(lane))*half*.35;
  const curl=Math.sin(t*Math.PI),r=mode.radius*(1-t);
  a+=mode.swirl*t*3;
  out.x=Math.sin(a)*r+Math.sin(t*7+lane*5+time)*.055*curl;
  out.z=Math.cos(a)*r+mode.nozzleOffset*t;
  out.y=.08*(1-t)+mode.nozzleY*t+curl*(.13+mode.swirl*.22);
  return out;
}

