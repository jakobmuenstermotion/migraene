import * as T from './vendor/three.module.js';
import {WOODLANDS} from './woodland-regions.mjs';
// Neugestaltung: kräftigeres Wiesengrün mit sonnigen gelbgrünen und schattigen dunklen Flecken.
const grass=new T.Color('#679a33'),light=new T.Color('#98be44'),deep=new T.Color('#3f6f26'),tints=WOODLANDS.map(r=>new T.Color(r.ground));
const patch=(x,z)=>.5+.22*Math.sin(x*.41+z*.23+1.3)*Math.sin(z*.37-x*.19)+.14*Math.sin(x*.93-z*.71)*Math.sin(z*1.07+x*.53);
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
// Every overlapping terrain tile samples the same continuous colour field.
// Their grid edges cannot introduce rectangular patches or painted roads.
export function terrainColor(x,z,out=new T.Color()){
 const noise=.5+.12*Math.sin(x*.24+z*.15)+.08*Math.sin(z*.33+x*.12);out.copy(grass).lerp(light,smooth((noise-.38)*2.2)*.8);const p=patch(x,z);out.lerp(deep,smooth((.42-p)*4)*.55);
 WOODLANDS.forEach((r,i)=>{const radius=Math.hypot((x-r.x)/r.rx,(z-r.z)/r.rz),entry=r.id==='steinbach'?(-z-35)/9:r.id==='mooswald'?Math.min((x-32)/10,(z-25)/8):(-x-42)/9,weight=smooth(entry)*smooth((1.17-radius)/.18);out.lerp(tints[i],weight*.82);});return out;
}
