import {BLUEPRINTS,SNAIL_SCULPTURES,placeableType} from './crafting-config.mjs';
import {craftState} from './crafting.mjs';
import {vacuumContains} from './vacuums.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import {sunnyHeight} from './sunny-area.mjs';
// Jakob 7.11.: Pläne, die am Boden liegen (ohne Höhe), holt auch der Bodensauger; schwebende nur der Fernsauger.
export const planTool=(p,mode)=>mode.id===p.tool||(p.tool==='focus'&&!p.height&&mode.id==='ground');
export function updateBlueprints(s,dt){if(s.area!=='sunny'||s.testWorld.enabled||s.roundActive===false)return;const c=craftState(s),mode=effectiveVacuum(s);s.blueprintProgress??={};for(const p of BLUEPRINTS){if(c.blueprints[p.id])continue;const point={...p,y:sunnyHeight(p.x,p.z)+(p.height??.12)},hit=s.suctionActive&&planTool(p,mode)&&(p.depth??0)<=(mode.digDepth??0)&&vacuumContains(s.player,point,mode);s.blueprintProgress[p.id]=Math.max(0,Math.min(1,(s.blueprintProgress[p.id]??0)+dt*(hit?1:-.3)));if(s.blueprintProgress[p.id]>=1){c.blueprints[p.id]=true;s.catchCard={kind:'blueprint',id:p.id,at:s.time};s.events.push('blueprint');}}settleSnails(s);}
// Die vierte aufgestellte Skulptur ruft Schnecki (Jakob 1.11.).
function settleSnails(s){const f=s.forestBlobs;if(!f||f.snail||s.snailKey===s.layoutRevision)return;s.snailKey=s.layoutRevision;const placed=Object.entries(s.placements??{}).filter(([id])=>SNAIL_SCULPTURES.includes(placeableType(id)));if(new Set(placed.map(([id])=>placeableType(id))).size<SNAIL_SCULPTURES.length)return;const near=placed.map(([,p])=>p).sort((a,b)=>Math.hypot(a.x-s.player.x,a.z-s.player.z)-Math.hypot(b.x-s.player.x,b.z-s.player.z))[0];f.snail={id:'snail',species:'snail',stage:2,name:'Schnecki',friend:0,accessories:{head:null,collar:null},genes:{moss:1,wood:0},x:near.x+1.7,z:near.z+1.4};f.seen=[...new Set([...(f.seen??[]),'snail'])];f.revision++;s.snailIntro={x:f.snail.x,z:f.snail.z,at:s.time};s.events.push('caught');}
