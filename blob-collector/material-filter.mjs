import {itemArtwork} from './item-art.mjs';
import {PRODUCT_NAMES} from './material-press.mjs';
import {SAUGER as C} from './sauger-config.mjs';
import {resourceArea} from './blob-workers.mjs';
// Jakob 7.11.: Materialfilter des Fächersaugers: nur Sachen, die wirklich am Boden liegen und einsaugbar sind, mit Bild,
// nach Fundort sortiert. Antippen schaltet an/aus (s.filters[kind]===false heißt aus).
const GROUPS=[['wald','Wald'],['coast','Küste'],['ice','Eistal'],['volcano','Vulkan']];
const groupOf=r=>{if(r.x< -190)return 'coast';const a=resourceArea(r.x,r.z);return a==='coast'||a==='ice'||a==='volcano'?a:'wald';};
export function filterKinds(s){const seen=new Map([['leaf','wald']]);for(const r of s.resources??[]){if(r.buried||r.deposit||r.focusOnly||r.hanging||r.ephemeral)continue;const k=r.kind;if(!seen.has(k))seen.set(k,groupOf(r));}return GROUPS.map(([g,label])=>[label,[...seen].filter(([,x])=>x===g).map(([k])=>k)]).filter(([,l])=>l.length);}
const name=k=>PRODUCT_NAMES[k]??C.material[k]?.name??k;
export function filterHTML(s){return filterKinds(s).map(([label,list])=>`<h4 class="filter-group">${label}</h4><div class="filter-grid">${list.map(k=>`<button type="button" data-material="${k}" aria-pressed="${s.filters?.[k]!==false}"><i>${itemArtwork(k)}</i><small>${name(k)}</small></button>`).join('')}</div>`).join('');}
