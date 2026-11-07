import {CRAFT_RECIPES,WORKSHOPS} from './crafting-config.mjs';
import {PRESS,PRODUCT_NAMES} from './material-press.mjs';
import {itemArtwork} from './item-art.mjs';
import {goalStock} from './goal-state.mjs';
import {materialSources} from './material-sources.mjs';
// Produktionsbaum: Antippen einer Kostenkachel zeigt, was insgesamt zu sammeln ist und wie der Gegenstand entsteht.
// Erst beim ersten Gebrauch aufbauen: material-press hängt über goals-ui im Importkreis.
let book=null;
const recipeBook=()=>{if(book)return book;book={};for(const r of Object.values(CRAFT_RECIPES))if(!r.retired&&!book[r.output])book[r.output]={where:WORKSHOPS[r.workshop]?.name??'Werkstatt',inputs:r.inputs,per:r.quantity??1};for(const r of Object.values(PRESS.recipes))book[r.id]??={where:'Materialpresse',inputs:r.inputs??{[r.input==='flowers'?'commonflower':r.input]:r.cost},per:1};return book;};
export const hasRecipe=k=>Boolean(recipeBook()[k]);
export function buildTree(k,n=1,path=[]){const r=path.includes(k)?null:recipeBook()[k];return {k,n,where:r?.where,kids:r?Object.entries(r.inputs).map(([c,m])=>buildTree(c,m*n/r.per,[...path,k])):[]};}
export function rawMaterials(t,out={}){if(!t.kids.length)out[t.k]=(out[t.k]??0)+t.n;t.kids.forEach(c=>rawMaterials(c,out));return out;}
const name=k=>PRODUCT_NAMES[k]??k;
const fmt=n=>{const v=Number.isInteger(n)?n:+n.toFixed(1);return v>=1000?(v/1000).toFixed(v%1000?1:0)+'k':v;};
export function bindProductionTree(getState){
 const root=document.getElementById('game'),sheet=document.createElement('section');sheet.id='tree-sheet';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');root.append(sheet);
 let kind='',amount=1,picked='',host=root;
 const close=()=>{sheet.hidden=true;if(host!==root)host.style.overflow='';sheet.classList.remove('in-card','dark');sheet.removeAttribute('style');};
 // Die Karten scrollen selbst: Das Blatt deckt immer genau ihren sichtbaren Teil ab und schließt mit ihnen.
 const follow=()=>{if(sheet.hidden)return;if(host!==root){if(!host.offsetParent){close();return;}if(!sheet.isConnected)host.append(sheet);Object.assign(sheet.style,{top:host.scrollTop+'px',left:host.scrollLeft+'px',width:host.clientWidth+'px',height:host.clientHeight+'px'});}requestAnimationFrame(follow);};
 const stock=k=>goalStock(getState(),k);
 const chip=(k,n)=>`<button class="tree-chip ${recipeBook()[k]?'':'raw'} ${stock(k)>=n?'ok':''}" data-tree-pick="${k}" aria-pressed="${picked===k}" aria-label="${name(k)}: ${fmt(n)}"><i>${itemArtwork(k)}</i><b>${fmt(n)}</b></button>`;
 const org=t=>`<li>${chip(t.k,t.n)}${t.kids.length?`<ul>${t.kids.map(org).join('')}</ul>`:''}</li>`;
 const info=k=>recipeBook()[k]?'Hergestellt in: '+recipeBook()[k].where:materialSources(getState(),k).join(' · ');
 function render(left=null){const tree=buildTree(kind,amount),shown=picked||kind,raws=Object.entries(rawMaterials(tree));
  sheet.innerHTML=`<header><strong>${fmt(amount)} × ${name(kind)}</strong><button id="tree-close" aria-label="Schließen">×</button></header><div class="tree-info"><i>${itemArtwork(shown)}</i><div><strong>${name(shown)}</strong><p>${info(shown)}</p></div></div>${tree.kids.length?`<h3>Insgesamt sammeln</h3><div class="tree-sum">${raws.map(([k,n])=>`<button class="${stock(k)>=n?'ok':''}" data-tree-pick="${k}" aria-pressed="${picked===k}"><small>${name(k)}</small><i>${itemArtwork(k)}</i><b>${fmt(stock(k))} / ${fmt(n)}</b></button>`).join('')}</div><h3>Herstellung</h3><div class="tree-scroll"><ul class="tree-org">${org(tree)}</ul></div>`:''}`;
  const wide=sheet.querySelector('.tree-scroll');if(wide)wide.scrollLeft=left??(wide.scrollWidth-wide.clientWidth)/2;}
 document.addEventListener('click',e=>{const open=e.target.closest?.('[data-tree]');if(open){kind=open.dataset.tree;amount=Number(open.dataset.treeN)||1;picked='';if(!sheet.hidden)close();host=open.closest('#craft-panel,#area-panel,#vacuum-picker')??root;host.append(sheet);if(host!==root){host.style.overflow='hidden';sheet.classList.add('in-card');sheet.classList.toggle('dark',host.id==='vacuum-picker'||!!host.querySelector('.press-tree,.workshop-tree-scroll'));}render();sheet.scrollTop=0;sheet.hidden=false;follow();return;}if(sheet.hidden)return;if(e.target.closest('#tree-close')){close();return;}const pick=e.target.closest('[data-tree-pick]');if(pick){const top=sheet.scrollTop,left=sheet.querySelector('.tree-scroll')?.scrollLeft??null;picked=picked===pick.dataset.treePick?'':pick.dataset.treePick;render(left);sheet.scrollTop=top;}});
}
