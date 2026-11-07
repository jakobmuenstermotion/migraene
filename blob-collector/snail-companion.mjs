// Schnecki (Jakob 1.11.): kriecht der Figur nach und hinterlässt eine Schleimspur. Auf der Spur läuft man 25 % schneller, sie hält eine Minute.
export const SNAIL_TRAIL={seconds:60,boost:1.25,radius:.85,spacing:.7,max:120,intro:3.2};
const indoors=s=>Boolean(s.home?.interior||s.nursery?.interior||s.cave?.interior);
export function updateSnail(s,dt){const b=s.forestBlobs?.snail;if(!b||s.testWorld?.enabled)return;const p=s.player;if(!Number.isFinite(b.x)||!Number.isFinite(b.z)){b.x=p.x-Math.sin(p.angle)*1.5;b.z=p.z-Math.cos(p.angle)*1.5;}
 const trail=s.snailTrail??=[];while(trail.length&&trail[0].t<s.time-SNAIL_TRAIL.seconds)trail.shift();
 if(s.snailIntro&&s.time-s.snailIntro.at<SNAIL_TRAIL.intro)return;
 const tx=p.x-Math.sin(p.angle)*1.5,tz=p.z-Math.cos(p.angle)*1.5,d=Math.hypot(tx-b.x,tz-b.z);if(d>22){b.x=tx;b.z=tz;return;}if(d>.5){const step=Math.min(d,dt*Math.min(7,.6+d*1.3));b.x+=(tx-b.x)/d*step;b.z+=(tz-b.z)/d*step;}
 if(indoors(s))return;const last=trail.at(-1);if(!last||Math.hypot(last.x-b.x,last.z-b.z)>=SNAIL_TRAIL.spacing){trail.push({x:b.x,z:b.z,t:s.time});if(trail.length>SNAIL_TRAIL.max)trail.shift();}
}
export function snailBoost(s){const trail=s.snailTrail;if(!trail?.length||indoors(s))return 1;const p=s.player,r=SNAIL_TRAIL.radius;for(const q of trail)if(Math.abs(q.x-p.x)<r&&Math.abs(q.z-p.z)<r&&Math.hypot(q.x-p.x,q.z-p.z)<r)return SNAIL_TRAIL.boost;return 1;}
