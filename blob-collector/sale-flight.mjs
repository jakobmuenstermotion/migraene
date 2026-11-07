import * as T from './vendor/three.module.js';
import {MARKET} from './market.mjs';
import {sunnyHeight} from './sunny-area.mjs';
import {createProductDisplay,setProductDisplay} from './crafting-view.mjs';
// Jakob 3.11./4.11.: Waren für den Abendverkauf fliegen nach dem Schließen einzeln in den Stand, wie beim Abladen ins Lager:
// eine nach der anderen im Bogen vom Spieler zum Stand. Nur Darstellung, gebucht ist schon vorher.
const MAX=30,STEP=.09,TIME=.7;
export function bindSaleFlight(root,scene){const sprites=Array.from({length:MAX},()=>{const s=createProductDisplay();s.visible=false;s.scale.setScalar(.55);scene.add(s);return s;});let shown=null,units=[];
 return {update(s){const f=s.saleFlight;if(f!==shown){shown=f;units=[];if(f){const per=Math.max(1,Math.ceil(f.items.reduce((n,[,c])=>n+c,0)/MAX));for(const [k,c]of f.items)for(let i=0;i<Math.ceil(c/per)&&units.length<MAX;i++)units.push(k);f.from={x:s.player.x,y:(s.player.y??0)+1,z:s.player.z};}}
  if(!f){for(const sp of sprites)sp.visible=false;return;}const t=(performance.now()-f.at)/1000;if(t>TIME+STEP*units.length+.2){s.saleFlight=null;for(const sp of sprites)sp.visible=false;return;}
  const to={x:MARKET.x,y:sunnyHeight(MARKET.x,MARKET.z)+1.3,z:MARKET.z};
  sprites.forEach((sp,i)=>{const k=i<units.length?(t-i*STEP)/TIME:-1;sp.visible=k>0&&k<1;if(!sp.visible)return;setProductDisplay(sp,units[i]);const e=k*k*(3-2*k),side=((i%5)-2)*.12;sp.position.set(f.from.x+(to.x-f.from.x)*e+side*Math.sin(e*Math.PI),f.from.y+(to.y-f.from.y)*e+Math.sin(e*Math.PI)*1.6,f.from.z+(to.z-f.from.z)*e);sp.scale.setScalar(.55*(1-.35*e));});}};}
