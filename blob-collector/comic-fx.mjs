// Jakob 8.11.: Statt Comic-Wörtern („KRACH!“ usw.) erschrickt die Figur: Schreck-Striche rund um den Kopf
// und ein kurzer Hüpfer mit Zittern. Höchstens einmal alle 2,5 s.
const EVENTS=new Set(['caught','fish','blueprint','build','obstacle','lock','golden']);
const DURATION=650;
export function bindComicFx(root=document.getElementById('game')){
 const el=document.createElement('div');el.id='comic-fx';el.hidden=true;
 // Kurze Striche, strahlenförmig um die Figur (wie in Zeichentrick-Schreckmomenten).
 const lines=[-150,-120,-90,-60,-30,-180,0].map(a=>{const r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return `<line x1="${(50+c*30).toFixed(1)}" y1="${(50+s*30).toFixed(1)}" x2="${(50+c*44).toFixed(1)}" y2="${(50+s*44).toFixed(1)}"/>`;}).join('');
 el.innerHTML=`<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="#3a2e3f" stroke-width="4.5" stroke-linecap="round">${lines}</g></svg>`;root.append(el);
 const style=document.createElement('style');style.textContent=`#comic-fx{position:absolute;left:0;top:0;width:120px;height:120px;z-index:35;pointer-events:none;transform:translate(-50%,-50%)}#comic-fx[hidden]{display:none}
#comic-fx svg{width:100%;height:100%;overflow:visible}`;document.head.append(style);
 let start=0,next=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let v=null;
 return {
  trigger(event){if(!EVENTS.has(event))return;const now=performance.now();if(now<next)return;next=now+2500;start=now;el.hidden=false;},
  update(camera,character){if(el.hidden)return;const k=(performance.now()-start)/DURATION;if(k>=1){el.hidden=true;return;}{const svg=el.firstElementChild,sc=k<.18?.55+k/.18*.53:k<.55?1.08-(k-.18)/.37*.08:1+(k-.55)/.45*.12,op=k<.18?k/.18:k<.55?1:1-(k-.55)/.45;svg.style.transform=reduced?'':`scale(${sc.toFixed(3)})`;svg.style.opacity=op.toFixed(3);}
   if(camera&&character){
    // Schreck-Hüpfer: schnell hoch, kurz zittern, wieder landen. Die Figurposition wird jedes Bild neu gesetzt, deshalb nur aufaddieren.
    if(!reduced){const hop=Math.sin(Math.min(1,k/.55)*Math.PI)*.35,shake=k<.55?Math.sin(k*90)*.05*(1-k/.55):0;character.position.y+=hop;character.position.x+=shake;}
    v??=character.position.clone();v.copy(character.position);v.y+=1.1;v.project(camera);const r=root.getBoundingClientRect();
    el.style.left=((v.x+1)/2*r.width)+'px';el.style.top=((1-v.y)/2*r.height)+'px';}
  }
 };
}
