import {facilityFootprint} from './sunny-area.mjs';
// Provisional play-time values. A fixed field bounds memory even after long runs.
// Neugestaltung (Jakob, 28.10.2026): nach etwa drei Spieltagen häufigen Laufens erster Weg sichtbar,
// danach zunehmend deutlicher. Vorher 0,024 je Runde, jetzt 0,09.
export const TRAIL_RULES=Object.freeze({minX:-56,minZ:-48,cell:.5,width:224,height:256,radius:.42,snap:1.4,gain:.28,roundSeconds:600,wearPerRound:.09,regrowDelay:600,regrowSeconds:4200,sweepSeconds:1});
const R=TRAIL_RULES,N=R.width*R.height;
export function createTrails(){return {clock:0,nextSweep:1,revision:0,wear:new Float32Array(N),touched:new Float64Array(N),updated:new Float64Array(N),round:new Float64Array(N).fill(-1),spent:new Float32Array(N),active:new Set()};}
export function trailIndex(x,z){const ix=Math.floor((x-R.minX)/R.cell),iz=Math.floor((z-R.minZ)/R.cell);return ix>=0&&ix<R.width&&iz>=0&&iz<R.height?iz*R.width+ix:-1;}
function decay(t,i){const start=t.touched[i]+R.regrowDelay,age=Math.max(0,t.clock-start),previousAge=Math.max(0,t.updated[i]-start);if(age>previousAge){const remaining=Math.max(0,1-age/R.regrowSeconds),previousRemaining=Math.max(0,1-previousAge/R.regrowSeconds),wear=previousRemaining>0?t.wear[i]*remaining/previousRemaining:0;if(wear!==t.wear[i]){t.wear[i]=wear;t.revision++;}if(wear===0)t.active.delete(i);}t.updated[i]=t.clock;}
function stamp(t,x,z,distance,preview=false){const ix=Math.floor((x-R.minX)/R.cell),iz=Math.floor((z-R.minZ)/R.cell),span=Math.ceil(R.radius/R.cell),round=Math.floor(t.clock/R.roundSeconds);for(let j=Math.max(0,iz-span);j<=Math.min(R.height-1,iz+span);j++)for(let k=Math.max(0,ix-span);k<=Math.min(R.width-1,ix+span);k++){
 const dx=R.minX+(k+.5)*R.cell-x,dz=R.minZ+(j+.5)*R.cell-z,q=Math.hypot(dx,dz)/R.radius;if(q>=1)continue;const i=j*R.width+k;decay(t,i);if(t.round[i]!==round){t.round[i]=round;t.spent[i]=0;}const amount=preview?distance*R.gain*(1-q*q):Math.max(0,Math.min(distance*R.gain*(1-q*q),R.wearPerRound-t.spent[i]));if(!preview)t.spent[i]+=amount;if(amount){t.wear[i]=Math.min(1,t.wear[i]+amount);t.revision++;}t.touched[i]=t.updated[i]=t.clock;t.active.add(i);
}}
export function advanceTrails(s,fromX,fromZ,dt,airborne=false){if(s.area!=='sunny'||s.testWorld.enabled)return;const t=s.trails??=createTrails();t.clock+=Math.max(0,Math.min(.05,dt));if(t.clock>=t.nextSweep){for(const i of t.active)decay(t,i);t.nextSweep=t.clock+R.sweepSeconds;}
 const p=s.player,d=Math.hypot(p.x-fromX,p.z-fromZ);if(airborne||s.home?.interior||!p.moving||!Number.isFinite(d)||d<=1e-6||d>.8)return;
 // Only the clearing's grassy soil: indoors, water, cliffs and remote biomes do not wear.
 if(Math.hypot(p.x/35,p.z/(p.z>0?39:26))>.98||facilityFootprint(p.x,p.z,0))return;
 const steps=Math.ceil(d/.16),ux=(p.x-fromX)/d,uz=(p.z-fromZ)/d;for(let j=0;j<steps;j++){const f=(j+.5)/steps,[sx,sz]=snapToTrail(t,fromX+(p.x-fromX)*f,fromZ+(p.z-fromZ)*f,ux,uz);stamp(t,sx,sz,d/steps);calm(t,sx,sz,d/steps);}
}
export function trailSnapshot(s){const t=s.trails;if(!t)return null;const cells=[];for(const i of t.active){decay(t,i);if(t.wear[i]>.001)cells.push([i,Math.round(t.wear[i]*65535)/65535,Math.min(1e9,t.clock-t.touched[i]),t.round[i],t.spent[i]]);}return {version:2,clock:t.clock,cells};}
export function restoreTrails(s,data){const t=s.trails=createTrails();if(![1,2].includes(data?.version)||!Array.isArray(data.cells))return;if(data.version===2&&Number.isFinite(data.clock)&&data.clock>=0)t.clock=Math.min(1e9,data.clock);t.nextSweep=t.clock+1;for(const entry of data.cells.slice(0,N)){if(!Array.isArray(entry))continue;const [i,w,age,round,spent]=entry;if(!Number.isInteger(i)||i<0||i>=N||!Number.isFinite(w)||w<=0||w>1||!Number.isFinite(age)||age<0)continue;t.wear[i]=w;t.touched[i]=t.clock-Math.min(1e9,age);t.updated[i]=t.clock;t.round[i]=Number.isInteger(round)&&round>=0&&round<=Math.floor(t.clock/R.roundSeconds)?round:Math.floor(t.clock/R.roundSeconds);t.spent[i]=Number.isFinite(spent)?Math.max(0,Math.min(R.wearPerRound,spent)):R.wearPerRound;t.active.add(i);}t.revision++;}
// Explicit previews live exclusively in the existing Testlabor.
export function previewTrail(s){if(s.area!=='sunny'||s.testWorld.enabled||s.home?.interior)return;const t=s.trails??=createTrails(),p=s.player;for(let i=0;i<40;i++){const d=i*.16-1.4,side=Math.sin(i/39*Math.PI)*.6,x=p.x+Math.sin(p.angle)*d+Math.cos(p.angle)*side,z=p.z+Math.cos(p.angle)*d-Math.sin(p.angle)*side;if(Math.hypot(x/35,z/(z>0?39:26))<.98&&!facilityFootprint(x,z,0))stamp(t,x,z,.16*8,true);}}
export function previewTrailRecovery(s){const t=s.trails;if(!t)return;t.clock+=R.regrowDelay+R.regrowSeconds*.55;for(const i of t.active)decay(t,i);t.nextSweep=t.clock+1;}

// Jakob 3.11.: feinere, zusammenhängende Wege statt brauner Flächen. Schmalerer Abdruck (0,42 m statt 0,72 m),
// und jeder Schritt rutscht zum stärksten schon vorhandenen Weg in bis zu 1,4 m Nähe. So verstärkt Herumlaufen
// die vorhandenen Linien, statt die Fläche zu verbreitern.
function snapToTrail(t,x,z,ux,uz){const i0=trailIndex(x,z);if(i0<0)return [x,z];const here=t.wear[i0],nx=-uz,nz=ux;let best=0,score=here+.05;
 for(let o=-R.snap;o<=R.snap+1e-6;o+=.25){if(Math.abs(o)<.2)continue;const i=trailIndex(x+nx*o,z+nz*o);if(i<0)continue;const w=t.wear[i]*(1-Math.abs(o)/R.snap*.4);if(w>score){score=w;best=o;}}
 if(!best)return [x,z];const pull=Math.min(PULL[0],(score-here)*PULL[1]);return [x+nx*best*pull,z+nz*best*pull];}
// Neben dem Abdruck (0,7–1,5 m) erholt sich das Gras ein wenig, so bleiben Wege schmal statt zu Flächen zusammenzuwachsen.
function calm(t,x,z,distance){const span=Math.ceil(1.5/R.cell),ix=Math.floor((x-R.minX)/R.cell),iz=Math.floor((z-R.minZ)/R.cell),here=t.wear[trailIndex(x,z)]??0;for(let j=Math.max(0,iz-span);j<=Math.min(R.height-1,iz+span);j++)for(let k=Math.max(0,ix-span);k<=Math.min(R.width-1,ix+span);k++){const dd=Math.hypot(R.minX+(k+.5)*R.cell-x,R.minZ+(j+.5)*R.cell-z);if(dd<.7||dd>1.5)continue;const i=j*R.width+k;if(t.wear[i]<=0||t.wear[i]>=here*.8)continue;t.wear[i]=Math.max(0,t.wear[i]-distance*R.gain*.03);t.revision++;}}
const PULL=[.9,5];
