// Jakob 4.11.: Möbel fliegen mit ihrem gemalten Möbelbild statt einem Ersatzbild mit eckigem Rahmen.
import {FURNITURE} from './crafting-config.mjs';
import {craftArtwork,selfContainedSvg} from './crafting-view.mjs';
import {CLOTHING} from './living-config.mjs';
import {clothingArtwork} from './gear-ui.mjs';
import * as T from './vendor/three.module.js';
import {itemArtwork} from './item-art.mjs';
export function recordPickup(s,kind,quantity,p){s.pickupFlights??=[];s.pickupFlights.push({kind,quantity,x:p.x,y:(p.y??0)+.3,z:p.z,at:s.time});if(s.pickupFlights.length>12)s.pickupFlights.shift();}
export class PickupFeedback{
 constructor(){this.point=new T.Vector3();this.pool=Array.from({length:8},()=>{const e=document.createElement('div');e.className='find-pickup';e.hidden=true;document.getElementById('game').append(e);return e;});}
 update(s,camera,w,h){const live=(s.pickupFlights??[]).filter(p=>s.time-p.at<1.3);s.pickupFlights=live;const target=(document.querySelector('.leaf-counter:not([hidden])')??document.querySelector('.pack-counter')??document.querySelector('.leaf-counter')).getBoundingClientRect();this.pool.forEach((e,i)=>{const p=live[i];e.hidden=!p;if(!p)return;if(e.dataset.kind!==p.kind||e.dataset.quantity!==String(p.quantity)){e.dataset.kind=p.kind;e.dataset.quantity=p.quantity;/* Jakob 6.11.: Verläufe und Masken mitnehmen, sonst liegt die Licht-Ebene als eckiger Kasten über dem Bild */let art=CLOTHING[p.kind]?clothingArtwork(p.kind):FURNITURE[p.kind]?craftArtwork(p.kind):itemArtwork(p.kind);art=selfContainedSvg(art);if(/url\(#item-silhouette/.test(art)&&!/<mask/.test(art))art=art.replace(/<rect[^>]*mask="url\(#item-silhouette[^"]*"[^>]*\/?>/g,'');e.innerHTML=art+(p.quantity>1?`<b>${p.quantity}</b>`:'');}this.point.set(p.x,p.y,p.z).project(camera);const age=(s.time-p.at)/1.3,t=Math.max(0,(age-.28)/.72),ease=t*t,x=Math.max(30,Math.min(w-30,(this.point.x*.5+.5)*w)),y=Math.max(50,Math.min(h-100,(-this.point.y*.5+.5)*h));e.style.left=x+(target.x+target.width/2-x)*ease+'px';e.style.top=y+(target.y+target.height/2-y)*ease-Math.sin(t*Math.PI)*65+'px';e.style.opacity=String(1-t*.7);e.style.transform=`translate(-50%,-50%) scale(${1.15-t*.7})`;});}
}
