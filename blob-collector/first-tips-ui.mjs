import {nextTip,markTip} from './first-tips.mjs';
import {craftArtwork} from './crafting-view.mjs';
import {materialIcon} from './sunny-ui.mjs';
import {blobPortrait} from './blob-portrait.mjs';
// Karte für einmalige Erklärungen, liegt auch über dem Werkstattmenü; nur Testlabor, Skilltree, Computer und Aquarium lässt sie ausreden.
const BUSY='#test-panel:not([hidden]),#material-panel:not([hidden]),#vacuum-picker:not([hidden]),#craft-panel:not([hidden]):not(.craft-floating),#aquarium-panel:not([hidden])';
function art([kind,id]){try{if(kind==='craft')return craftArtwork(id);if(kind==='blob'){const url=blobPortrait(id);return url?`<img src="${url}" alt="">`:'';}return materialIcon(id);}catch{return '';}}
export function bindFirstTips({getState,onSave}){
 const card=document.createElement('section');card.id='first-tip';card.setAttribute('role','dialog');card.setAttribute('aria-live','polite');card.hidden=true;document.getElementById('game').append(card);let tip=null,page=0,next=0;
 function draw(){card.innerHTML=`<div class="tip-art">${art(tip.art)}</div><h2>${tip.title}</h2><p>${tip.pages[page]}</p>${tip.pages.length>1?`<div class="tip-dots">${tip.pages.map((_,i)=>`<i class="${i===page?'on':''}"></i>`).join('')}</div>`:''}<button class="craft-primary" id="tip-next">${page<tip.pages.length-1?'Weiter':'Verstanden'}</button>`;card.querySelector('#tip-next').onclick=()=>{if(!tip)return;if(page<tip.pages.length-1){page++;draw();return;}markTip(getState(),tip.id);onSave();tip=null;card.hidden=true;next=Date.now()+1200;};}
 return {isOpen:()=>Boolean(tip),focus(){const f=tip?.focus?.(getState());return f?{x:f.x,z:f.z,zoom:1.12}:null;},update(){if(tip||Date.now()<next)return;next=Date.now()+300;const s=getState();const introBusy=Boolean(s.intro&&s.intro.step!=='done');if(!s.round||s.round.waking||(introBusy&&(!s.builtSites?.introVacuum||['wake','leaves','computer','charger'].includes(s.intro.step)))||document.querySelector('#story-big:not([hidden])')||s.toolLessons?.length||s.testWorld?.enabled||s.placementPreview||s.saleVisual||s.anchorPull||document.querySelector(BUSY))return;const found=nextTip(s,introBusy?['fish','butterfly']:null);if(!found)return;tip=found;page=0;card.hidden=false;draw();}};
}
