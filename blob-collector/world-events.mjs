import {SUNNY,sunnyHeight,sunnyInside,sunnyGapAt,sunnyCollision} from './sunny-area.mjs';
import {coastRegion,coastShore} from './coast-area.mjs';
import {startWind} from './world-wind.mjs';
import {spawnGoldenLeaf} from './golden-leaf.mjs';
import {spawnForestBlob} from './forest-blobs.mjs';
import {fishNight} from './fishing.mjs';
// Überraschungen (Jakob 31.10., Testwerte): selten passiert draußen etwas Besonderes, nichts davon ist Pflicht.
export const EVENT_RULES={interval:[200,420],lifetime:45,lucky:6};
const roll=(a,b)=>a+Math.random()*(b-a);
function spot(s,near,far){const p=s.player;for(let t=0;t<40;t++){const a=Math.random()*Math.PI*2,d=roll(near,far),x=p.x+Math.sin(a)*d,z=p.z+Math.cos(a)*d;if(sunnyInside(x,z)&&!sunnyGapAt(x,z)&&!sunnyCollision(x,sunnyHeight(x,z),z,.5)&&!(coastRegion(x,z)&&x>coastShore(z)-1))return {x,z};}return null;}
function drop(s,kind,x,z){const e=s.worldEvent,y=sunnyHeight(x,z)+.05,r={id:'event_'+(e.serial=(e.serial??0)+1),kind,eventItem:true,ephemeral:true,x,y,z,homeX:x,homeY:y,homeZ:z,status:'ground',progress:0,respawnAt:1e12,angle:Math.random()*6,expiresAt:s.time+EVENT_RULES.lifetime};s.resources.push(r);return r;}
export function startWorldEvent(s,kind=null){const e=s.worldEvent??={wait:roll(...EVENT_RULES.interval)},pick=kind??(fishNight(s)?'star':['lucky','storm','visitor'][Math.floor(Math.random()*3)]);if(pick==='star'){const q=spot(s,5,12);if(!q)return false;drop(s,'starshard',q.x,q.z);}else if(pick==='lucky'){const q=spot(s,5,11);if(!q)return false;for(let i=0;i<EVENT_RULES.lucky;i++){const a=i/EVENT_RULES.lucky*Math.PI*2;drop(s,'luckycap',q.x+Math.sin(a)*1.3,q.z+Math.cos(a)*1.3);}}else if(pick==='storm'){startWind(s,2);spawnGoldenLeaf(s);}else if(pick==='visitor'){const group=['moss','forest'][Math.floor(Math.random()*2)];if(!spawnForestBlob(s,group,false))return false;}else return false;e.last=pick;e.wait=roll(...EVENT_RULES.interval);s.events?.push('lock');return true;}
export function advanceWorldEvents(s,dt){if(s.area!=='sunny'||s.testWorld?.enabled||s.roundActive===false)return;const e=s.worldEvent??={wait:roll(...EVENT_RULES.interval)};for(let i=s.resources.length-1;i>=0;i--){const r=s.resources[i];if(!r.eventItem)continue;if(r.status==='ground'&&s.time>r.expiresAt)s.resources.splice(i,1);}if(s.home?.interior||s.nursery?.interior)return;e.wait-=dt;if(e.wait<=0&&!startWorldEvent(s))e.wait=20;}
