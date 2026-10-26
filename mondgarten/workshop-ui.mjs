import {warehouseIcon} from './warehouse-ui.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>n.toLocaleString('de-DE',{maximumFractionDigits:1});
export class WorkshopDelivery{
 constructor(root,{onDeliver=()=>{},onDrag=()=>{}}={}){this.root=root;this.onDeliver=onDeliver;this.onDrag=onDrag;this.drag=null;this.clickGuard=null;root.hidden=true;
 root.addEventListener('keydown',e=>{if([' ','Enter'].includes(e.key))e.stopPropagation();});
 root.addEventListener('pointerdown',e=>{const button=e.target.closest('[data-ingredient]');if(!button||button.disabled)return;e.preventDefault();this.clickGuard=null;this.drag={id:button.dataset.ingredient,pointer:e.pointerId,x:e.clientX,y:e.clientY,moved:false};try{button.setPointerCapture(e.pointerId);}catch{}this.onDrag(true);root.classList.add('is-dragging');});
 root.addEventListener('pointermove',e=>{if(!this.drag||this.drag.pointer!==e.pointerId)return;const d=this.drag;d.moved||=Math.hypot(e.clientX-d.x,e.clientY-d.y)>8;const ghost=root.querySelector('[data-drag-ghost]');ghost.hidden=false;ghost.textContent=this.view.items.find(x=>x.id===d.id)?.name??'';const bounds=root.getBoundingClientRect();ghost.style.left=(e.clientX-bounds.left)+'px';ghost.style.top=(e.clientY-bounds.top+root.scrollTop)+'px';const r=root.querySelector('[data-drop]').getBoundingClientRect();root.classList.toggle('over-drop',e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom);});
 root.addEventListener('pointerup',e=>{if(!this.drag||this.drag.pointer!==e.pointerId)return;const d=this.drag,r=root.querySelector('[data-drop]').getBoundingClientRect(),inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;this.clickGuard={id:d.id,until:Date.now()+600};this.release();if(!d.moved||inside)this.deliver(d.id);});
 for(const name of ['pointercancel','lostpointercapture'])root.addEventListener(name,()=>{if(this.drag)this.clickGuard={id:this.drag.id,until:Date.now()+600};this.release();});
 root.addEventListener('click',e=>{const b=e.target.closest('[data-ingredient]');if(!b||b.disabled)return;const id=b.dataset.ingredient;if(this.clickGuard?.id===id&&Date.now()<=this.clickGuard.until)return;this.deliver(id);});
 }
 release(){this.drag=null;this.onDrag(false);this.root.classList.remove('is-dragging','over-drop');const ghost=this.root.querySelector('[data-drag-ghost]');if(ghost)ghost.hidden=true;}
 deliver(id){this.onDeliver(this.workshop,id);}
 hide(){if(this.drag)this.release();this.root.hidden=true;this.workshop=null;this.key='';}
 show(w,view){if(this.workshop?.id!==w.id)this.release();this.workshop=w;this.view=view;this.root.hidden=false;if(this.drag)return;
 const key=JSON.stringify([w.id,view]);if(key===this.key)return;this.key=key;
 this.root.innerHTML=`<header><strong>${esc(w.name)}</strong><small>${view.automatic?'Passende Ware fliegt automatisch hinein.':'Zutaten hineinziehen oder antippen.'}</small></header><div class="workshop-drop" data-drop><span>↓ ${view.room?'Hier hineinziehen':'Eingang voll · fehlende Zutaten antippen'}</span><div>${view.rows.map(row=>`<div class="delivery-need ${row.missing?'missing':'ready'}">${warehouseIcon({...view.items.find(x=>x.id===row.id),...row,kind:view.items.find(x=>x.id===row.id)?.kind})}<b>${row.need} ${esc(row.name)}</b><small>${number(row.have)} / ${row.need} vor Ort${row.missing?' · fehlt '+number(row.missing):' ✓'}</small></div>`).join('')}</div></div><div class="workshop-carried" aria-label="Passende Zutaten auf deinem Stapel">${view.items.filter(x=>x.count>0).map(x=>`<button type="button" data-ingredient="${esc(x.id)}">${warehouseIcon(x)}<span>${number(x.count)} ${esc(x.name)}</span></button>`).join('')||'<p>Diese Zutaten musst du noch mitbringen.</p>'}</div>${view.alternatives?`<p class="delivery-alternatives">Auch möglich: ${esc(view.alternatives)}</p>`:''}<span data-drag-ghost class="ingredient-ghost" hidden></span>`;
 }
}
