import {fusionResult,fuseBlobs} from './forest-blobs.mjs';
import {nurseryBounds,inNursery} from './nursery-space.mjs';
import {residentPose} from './nursery-view.mjs';
export function fusionPlaying(s){const f=s.forestBlobs?.fusionScene;return Boolean(f&&s.time>=f.at&&s.time-f.at<(f.duration??.8));}
// Consumption, accessory return and the child are committed together. Reloading
// during the visual sequence therefore cannot lose or duplicate either parent.
export function startMenuFusion(s,leftId,rightId){if(!inNursery(s)||fusionPlaying(s))return null;const f=s.forestBlobs,a=f.roster.find(b=>b.id===leftId),b=f.roster.find(b=>b.id===rightId);if(fusionResult(a,b).reason)return null;const p=nurseryBounds(s),parents=[a,b].map((b,i)=>({...b,...residentPose(s,b,i)})),child=fuseBlobs(s,leftId,rightId);if(!child)return null;child.homeX=p.x;child.homeZ=p.z;child.restUntil=s.time+5.5;f.fusionScene={at:s.time,duration:4.2,childId:child.id,x:p.x,z:p.z,parents};f.lastFusionAt=s.time;return child;}
