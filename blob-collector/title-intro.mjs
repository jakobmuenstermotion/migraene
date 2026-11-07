import {preferences} from './preferences.mjs';
// Titelanimation beim allerersten Hereinkommen; rein DOM und CSS, Antippen überspringt sie.
const letters=(word,start,step)=>[...word].map((c,i)=>`<span style="--d:${(start+i*step).toFixed(2)}s">${c}</span>`).join('');
const leaves=Array.from({length:14},(_,i)=>`<em style="--a:${i*25.7}deg;--d:${(1.5+i*.05).toFixed(2)}s;--r:${44+i%4*9}vmin;--s:${.7+i%3*.25}"></em>`).join('');
export function showTitleIntro(getState,onSave,force=false){
 const p=preferences(getState());if(p.titleSeen&&!force)return;p.titleSeen=true;onSave?.();
 const root=document.getElementById('game'),el=document.createElement('div');el.id='title-intro';el.setAttribute('role','img');el.setAttribute('aria-label','Blob Collector');
 el.innerHTML=`<div class="ti-sun"></div><div class="ti-leaves">${leaves}</div><h1><b>${letters('Blob',.25,.16)}</b><i>${letters('Collector',.95,.05)}</i></h1><div class="ti-blob"><u></u><u></u></div>`;
 let done=false;const close=()=>{if(done)return;done=true;el.classList.add('leaving');setTimeout(()=>el.remove(),650);};
 el.addEventListener('pointerdown',close);root.append(el);setTimeout(close,globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches?1400:3900);
}
