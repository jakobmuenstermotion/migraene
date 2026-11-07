import {iceRegion} from './ice-area.mjs';
import {CAVE_ROOM} from './cave-space.mjs';
import {gorgeBanks,gorgeDepth} from './gorge-shape.mjs';
// Geometry rules shared by scenery, movement, resources and blob habitats.
export const COAST={id:'coast',name:'Sonnenküste',minX:42,maxX:118,minZ:-43,maxZ:25,sea:-4.65,beach:{x:65,z:-4},tides:{x:74,z:13},mouth:{x:63,z:-29},cave:{x:50,z:-20}};
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function coastShore(z){return 79+2.5*Math.sin(z*.12)+1.3*Math.sin(z*.31);}
export function coastRegion(x,z,margin=0){if(windLower(x,z,margin)||windUpper(x,z,margin)||reefLand(x,z,margin)||windApproach(x,z))return true;if(z< -33&&x<75)return false;return x>=42-margin&&x<coastShore(z)+margin&&z>-43-margin&&z<25+margin;}
export function coastRiver(x){const t=smooth((x-56)/25),bank=gorgeBanks(56),start=coastBase(56,bank.center)-gorgeDepth(56)+.12;return {z:bank.center+1.2*Math.sin((x-56)*.23)+.6*Math.sin((x-56)*.51),half:bank.half*(1-t)+3.2*t,water:start+(COAST.sea-start+.20)*smooth((x-57.4)/1.5)-.20*t};}
export function coastBridge(x,z){const r=coastRiver(x);return Math.abs(x-60)<.95&&Math.abs(z-r.z)<r.half+1.6;}
// The bridge rises with its banks, keeping both ends on solid ground.
export function coastBridgeDeck(x,z){const r=coastRiver(x),southZ=r.z+r.half+1,northZ=r.z-r.half-1,south=coastBase(x,southZ)+.08,northBase=coastBase(x,northZ),t=Math.max(0,Math.min(1,(-northZ-32)/2)),smoothT=t*t*(3-2*t),ramp=-.6+Math.max(0,Math.min(8,-northZ-32))*.34,north=northBase*(1-smoothT)+ramp*smoothT+.08,u=Math.max(0,Math.min(1,(southZ-z)/(southZ-northZ)));return south+(north-south)*u;}
export function coastPool(x,z){for(const p of [{x:74,z:12,rx:3,rz:2},{x:78,z:19,rx:2.3,rz:1.7},{x:69,z:17,rx:2.1,rz:1.4}])if(Math.hypot((x-p.x)/p.rx,(z-p.z)/p.rz)<1)return p;return null;}
export function coastGap(x,z){if(!coastRegion(x,z))return false;const r=coastRiver(x);return x>=56&&Math.abs(z-r.z)<r.half&&!coastBridge(x,z);}
export function coastBase(x,z){const slope=smooth((x-46)/(coastShore(z)-46)),dune=1.05*Math.exp(-((x-57)**2+(z-6)**2)/45)+.7*Math.exp(-((x-65)**2+(z+15)**2)/35),cliff=3.7*smooth((-z-27)/18)*(1-smooth((x-64)/9));const upper=3.5*smooth((x-39)/16)*(1-smooth((x-56)/2.5))*smooth((-z-23)/5);return .2-4.78*slope+dune+cliff+upper-Math.max(0,x-coastShore(z))*.8;}
export function coastHeight(x,z,groundOnly=false){if(!groundOnly&&reefLand(x,z))return reefHeight(x,z);if(windUpper(x,z))return 6.2+.13*Math.sin(x*.4+z*.3);let h=coastBase(x,z);if(!groundOnly&&coastBridge(x,z))return coastBridgeDeck(x,z);const r=coastRiver(x);if(x>=56&&Math.abs(z-r.z)<r.half+.7){const t=smooth((r.half+.7-Math.abs(z-r.z))/.7);h+=(r.water-.6-h)*t;}const pool=coastPool(x,z);if(pool)h-=.22*smooth((1-Math.hypot((x-pool.x)/pool.rx,(z-pool.z)/pool.rz))*5);if(windLower(x,z)||windApproach(x,z)){const edge=windLower(x,z)?1:smooth((x-58.5)/1.4)*smooth((68-x)/2),t=smooth((-z-32)/2)*edge,ramp=-.6+Math.max(0,Math.min(8,-z-32))*.34;h=h*(1-t)+ramp*t;}return h;}
export function coastHabitat(species,x,z){return coastRegion(x,z)&&!coastGap(x,z)&&x>47&&(species==='tide'?z>6&&x>65:z>-22&&z<16&&!coastPool(x,z));}
export function coastPoint(random,kind='sand'){for(let i=0;i<100;i++){const x=kind==='seagrass'?66+random()*13:49+random()*28,z=kind==='seagrass'?7+random()*15:-22+random()*43;if(coastRegion(x,z)&&!coastGap(x,z)&&x<coastShore(z)-.8&&(kind!=='seagrass'||coastPool(x,z)||z>10&&x>70))return {x,z};}return kind==='seagrass'?{x:73,z:13}:{x:64,z:0};}
export const COAST_PALMS=[[55,-14,3.6],[55,10,3.9],[62,-17,4.3],[65,1,3.8],[70,-10,3.4]];
export const COAST_WIND_TREES=[[47,-47,2.5],[53,-52,2.8],[58,-50,2.4]];
const ALL_COAST_TREES=[...COAST_PALMS,...COAST_WIND_TREES];
export const COAST_ROCKS=Array.from({length:22},(_,i)=>({x:46+i*1.5,z:-41+.5*Math.sin(i*1.8),r:.9+(i%3)*.3})).concat([{x:48,z:-21,r:2},{x:52,z:-21,r:2},{x:50,z:-21.7,r:2.3}]);
export const COAST_TIDE_ROCKS=/* Neugestaltung (Jakob: Steine dauernd im Weg): 7 statt 20 Felsen, nur auf der Meer- und Südseite der Becken, Landseite und Gänge frei */[[77.2,11.4,.75],[75.9,14.2,.55],[71.2,9.9,.5],[80.4,18.6,.65],[79.3,20.7,.5],[70.7,18.7,.55],[68.1,18.6,.42]].map(([x,z,r],i)=>({x,z,r,a:i*.7,i}));
export function coastCollision(x,y,z,radius=.35){if(ALL_COAST_TREES.some(p=>Math.hypot(x-p[0],z-p[1])<.25+radius&&y<coastHeight(p[0],p[1])+p[2]))return true;if(COAST_TIDE_ROCKS.some(r=>Math.hypot((x-r.x)/(r.r*1.23+radius),(z-r.z)/(r.r*.9+radius))<1&&y<coastHeight(r.x,r.z)+r.r*.9))return true;if(CAVE_WALLS.some(r=>Math.hypot((x-r.x)/(r.rx+radius),(z-r.z)/(r.rz+radius))<1&&y<coastHeight(r.x,r.z)+r.h))return true;return COAST_ROCKS.filter(r=>r.z<-30&&!windLower(r.x,r.z)&&!windUpper(r.x,r.z)).some(r=>Math.hypot(x-r.x,z-r.z)<r.r+radius&&y<coastHeight(r.x,r.z)+r.r*2);}
export const COAST_RESOURCE_BEDS={sand:[[57,-9],[63,-3],[69,4],[60,14],[71,-16],[66,20],[74,-5],[56,3]],shell:[[70,-10],[74,1],[72,15],[66,-23],[75,-18],[68,21]],seagrass:[[72.1,11],[74.9,12.7],[76.8,18],[78.7,19.4],[68.2,16.5],[70,17.7]]};
export function createCoastMaterials(height){const list=[];for(const [kind,n]of [['shell',160],['seagrass',52]])for(let i=0;i<n;i++){const beds=COAST_RESOURCE_BEDS[kind];let p=null;for(let j=0;j<180;j++){const bed=beds[(i+j)%beds.length],a=(i*2.399+j*.71),r=(.35+((i*17+j*11)%97)/97)*(kind==='seagrass'?1.05:kind==='shell'?2.5:3.2),x=bed[0]+Math.sin(a)*r,z=bed[1]+Math.cos(a)*r;if(!coastRegion(x,z)||coastGap(x,z)||x>coastShore(z)-.9||list.some(r=>r.kind===kind&&Math.hypot(r.x-x,r.z-z)<.26)||coastCollision(x,height(x,z),z,.3)||COAST_GATE_ROCKS.some(r=>Math.hypot((x-r.x)/(r.rx*.9+.3),(z-r.z)/(r.rz*.9+.3))<1))continue;p={x,z};break;}if(!p)throw Error('No authored resource slot '+kind+i);const y=height(p.x,p.z)+.06;list.push({id:kind+i,kind,...p,y,homeX:p.x,homeZ:p.z,homeY:y,status:'ground',progress:0,respawnAt:0,angle:i*2.399});}return [...createSandPiles(height),...list];}

// The only walk-through between forest and coast is the driftwood-filled notch.
// These exact rounded volumes are also used by the visible headland.
export const COAST_GATE_ROCKS=Array.from({length:77},(_,i)=>{const z=-44+i*.94;return {x:39+2.4*Math.sin((z+2.9)*.095)+.65*Math.sin((z+2.9)*.44),z,rx:1.55+.28*Math.sin(i*1.7),rz:.95+.14*Math.cos(i*.8),h:3.2+Math.sin(z*.14)+.5*Math.sin(i*2.1),i};}).filter(r=>Math.abs(r.z+2.9)>3.1&&!iceRegion(r.x,r.z,1.2)).concat(Array.from({length:45},(_,i)=>({x:40+i*.95,z:24.9+.3*Math.sin(i*.55),rx:.8,rz:1.15,h:2.6+.4*Math.sin(i*.8),i:i+80})));

export const COAST_GATES=[{id:'routeWindRoots',kind:'root',tool:'ground',name:'Windklippen · Grabtiefe II',x:65,z:-35.7,gateX:65,gateZ:-35.7,gateWidth:4,gateDepth:.22,gateRadius:1,depth:2,size:1,seconds:4},{id:'routeCave',kind:'stone',tool:'power',rockGate:2,x:50,z:-19.4,gateX:50,gateZ:-19.4,gateRadius:1.35,gateWidth:2.25,gateDepth:.8,depth:0,size:2,seconds:3.2},{id:'routeReef',kind:'stone',tool:'power',rockGate:3,x:83.5,z:5.5,gateX:83.5,gateZ:5.5,gateRadius:1.5,depth:0,size:3,seconds:4}];
export function reefContour(a){return 1+.035*Math.sin(a*3)+.022*Math.sin(a*7+.6);}
export function reefDistance(x,z){const a=Math.atan2((z-11)/10.5,(x-99)/13.5),island=Math.hypot((x-99)/13.5,(z-11)/10.5)/reefContour(a),cx=Math.max(79.5,Math.min(92,x)),bridge=Math.hypot((x-cx)/1.3,(z-(5+(cx-80)*.15))/1.3);return Math.min(island,bridge);}
export function reefLand(x,z,margin=0){return reefDistance(x,z)<1+margin/10.5;}
export function reefHeight(x,z){const d=reefDistance(x,z);return COAST.sea+.34+.07*Math.sin(x*.9)*Math.cos(z*.7)-.7*smooth((d-.78)/.4);}
export const CAVE_WALLS=[{x:46.5,z:-20.9,rx:1.8,rz:1.5,h:3},{x:53.5,z:-20.9,rx:1.8,rz:1.5,h:3}];
// Jakob 7.11.: zieht über die Felskante (Bahn wird nicht geprüft), Landung weiter nur auf festem Boden.
export const COAST_ANCHORS=[{id:'wind-upper',x:56,z:-45.5,rank:3,requiresGate:'routeWindRoots',skipPath:true}];
export function windContour(a){return 1+.04*Math.sin(a*3)+.025*Math.sin(a*7+.4);}
export function windApproach(x,z){return x>58.5&&x<68&&z< -31&&z> -37;}
export function windLower(x,z,margin=0){const a=Math.atan2((z+43)/10,(x-64)/13);return z< -33&&Math.hypot((x-64)/(13+margin),(z+43)/(10+margin))<windContour(a);}
export function windUpper(x,z,margin=0){const a=Math.atan2((z+47)/7.2,(x-53)/8.5);return Math.hypot((x-53)/(8.5+margin),(z+47)/(7.2+margin))<windContour(a);}
export const COAST_SUPPLY={shoreDrift:[900,1500],openedDrift:[180,300],caveDrift:[200,340],coral:[240,420]};
// Jakob 7.11.: getauscht: Korallen liegen jetzt in der Höhle (Hindernisse I), Treibholz auf der Riffinsel (Hindernisse II).
// IDs bleiben (caveDrift…, reefCoral…), damit gespeicherte Stände passen; nur die Sorte wechselt.
export function createLaterCoastMaterials(height){const out=[];const add=(id,kind,x,z,gate=null,wait=0)=>{const y=height(x,z)+.07;out.push({id,kind,x,z,y,homeX:x,homeZ:z,homeY:y,status:wait?'gone':'ground',progress:0,respawnAt:wait,unlockGate:gate,shoreDrift:!gate&&kind==='driftwood',angle:x+z});};for(const [i,p]of [[64,11],[70,-11]].entries())add('shoreDrift'+i,'driftwood',...p,null,420+i*540);for(const [i,p]of [[-8,-5],[-5,1],[-2,-6],[3,-4],[7,0],[5,6]].entries())for(let j=0;j<3;j++){const x=CAVE_ROOM.x+p[0]+(j-1)*.38,z=CAVE_ROOM.z+p[1]+Math.sin(j*2.4)*.3,id='caveDrift'+i+'_'+j;out.push({id,kind:'coral',x,z,y:CAVE_ROOM.floor+.07,homeX:x,homeZ:z,homeY:CAVE_ROOM.floor+.07,status:'ground',progress:0,respawnAt:0,unlockGate:'routeCave',angle:x+z});}for(const [i,p]of [[92,8],[94,15],[99,5],[105,10],[101,18],[109,14]].entries())for(let j=0;j<4;j++)add('reefCoral'+i+'_'+j,'driftwood',p[0]+Math.sin(j*2.4)*.4,p[1]+Math.cos(j*2.4)*.4,'routeReef');return out;}

export const SAND_LAYER={cell:1.6,units:20,portion:5,regen:[240,420],minX:48,minZ:-43,width:48,height:44};
export function createSandCells(height){const out=[];for(let j=0;j<SAND_LAYER.height;j++)for(let i=0;i<SAND_LAYER.width;i++){const x=48+(i+.5)*1.6,z=-43+(j+.5)*1.6;if(windLower(x,z)||windUpper(x,z)||x<52||x>coastShore(z)-.8||z>24||z< -40||coastGap(x,z)||coastPool(x,z)||coastCollision(x,height(x,z),z,.35)||COAST_GATE_ROCKS.some(r=>Math.hypot((x-r.x)/(r.rx+ .4),(z-r.z)/(r.rz+.4))<1))continue;const y=height(x,z)+.04;out.push({id:'sandcell_'+i+'_'+j,kind:'sand',x,y,z,homeX:x,homeY:y,homeZ:z,sandCell:true,sandIndex:j*SAND_LAYER.width+i,sandLeft:20,status:'ground',progress:0,respawnAt:0});}return out.sort((a,b)=>Math.hypot(a.x-65,a.z)-Math.hypot(b.x-65,b.z));}

// The beach keeps individual, finite piles; the surface implementation remains available for the desert.
// Jakob 5.11.: viel mehr Sand am Strand: jede Zelle trägt zwei Häufchen (vorher jede zweite eins).
export function createSandPiles(height){return createSandCells(height).filter(r=>r.z>-25&&r.x>54).flatMap((r,i)=>[0,1].map(k=>({r,i:i*2+k,k}))).map(({r,i,k})=>{const dx=Math.sin(i*12.989)*.38+k*.55,dz=Math.cos(i*8.31)*.38-k*.5,xx=r.x+dx,zz=r.z+dz,valid=!coastGap(xx,zz)&&!coastPool(xx,zz)&&xx<coastShore(zz)-1&&zz>-25&&!coastCollision(xx,height(xx,zz),zz,.35),x=valid?xx:r.x,z=valid?zz:r.z,y=height(x,z)+.01;return {id:k?r.id+'b':r.id,kind:'sand',x,z,y,homeX:x,homeZ:z,homeY:y,beachPile:true,status:'ground',progress:0,respawnAt:0,angle:i*2.399};});}

export function sandMask(r){if(Number.isInteger(r.sandMask))return r.sandMask&1048575;const spent=20-Math.max(0,Math.min(20,r.sandLeft??20));return spent?(1<<spent)-1:0;}
export function sandPoint(r,i,out={}){out.x=r.homeX+((i%4)+.5)/4*SAND_LAYER.cell-SAND_LAYER.cell/2;out.z=r.homeZ+(Math.floor(i/4)+.5)/5*SAND_LAYER.cell-SAND_LAYER.cell/2;out.y=r.homeY;return out;}

export function consumeSandUnit(r){let mask=sandMask(r);if((r.sandLeft??20)<=0)return false;for(let i=0;i<20;i++)if(!(mask&(1<<i))){r.sandMask=mask|(1<<i);r.sandLeft=(r.sandLeft??20)-1;return true;}return false;}

// Neugestaltung: kleiner Felsentümpel auf der unteren Windterrasse (nur Darstellung, Seegras am Rand).
export const WIND_POOL={x:66,z:-44,rx:1.55,rz:1.05};
