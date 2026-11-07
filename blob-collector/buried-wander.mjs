import {sunnyInside,sunnyHeight,sunnyCollision} from './sunny-area.mjs';
import {resourceArea} from './blob-workers.mjs';
// Jakob 3.11.: Nachwachsende Bodenfunde tauchen nicht immer an derselben Stelle auf, sondern ein Stück daneben,
// im selben Gebiet und auf ähnlicher Höhe wie ihr ursprünglicher Platz. Die Heimatstelle bleibt der Mittelpunkt.
// Jakob 7.11.: Funde wandern weiter (4–18 m), damit man sie wirklich suchen muss.
export const WANDER={min:4,max:18,tries:40};
export function wanderBuried(o,random=Math.random){if(o.blueprint||o.route)return false;o.homeX??=o.x;o.homeZ??=o.z;const area=resourceArea(o.homeX,o.homeZ),h0=sunnyHeight(o.homeX,o.homeZ);
 for(let i=0;i<WANDER.tries;i++){const a=random()*Math.PI*2,r=WANDER.min+random()*(WANDER.max-WANDER.min),x=o.homeX+Math.sin(a)*r,z=o.homeZ+Math.cos(a)*r;if(!sunnyInside(x,z)||resourceArea(x,z)!==area)continue;const h=sunnyHeight(x,z);if(Math.abs(h-h0)>1.2||sunnyCollision(x,h,z,.6))continue;o.x=x;o.z=z;o.y=h;return true;}
 return false;}
