import {CRAFT_RECIPES,WORKSHOPS,FURNITURE} from './crafting-config.mjs';
import {PRESS,PRODUCT_NAMES} from './material-press.mjs';
import {CLOTHING} from './living-config.mjs';
import {FISH} from './fishing.mjs';
import {MEALS,SNACKS,BAIT} from './cooking.mjs';
import {salePrice} from './market.mjs';
import {formatCoins} from './game-balance.mjs';
import {itemArtwork} from './item-art.mjs';
import {craftArtwork} from './crafting-view.mjs';
import {clothingArtwork,effectText} from './gear-ui.mjs';
import {fishArtwork} from './fishing-view.mjs';
import {materialSources} from './material-sources.mjs';
import {UPGRADE_COSTS} from './factory-config.mjs';
import {WORKSHOP_UPGRADE_COSTS} from './workshop-upgrades.mjs';
import {PRESS_UPGRADE_COSTS} from './material-press.mjs';
// Jakob 4.11.: Gedrückt halten auf einem Produkt öffnet eine Infoseite: genaue Zutaten, Wirkung, wofür es gebraucht wird, Verkaufswert.
export const HOLD_MS=480;
const name=k=>FURNITURE[k]?.name??CLOTHING[k]?.name??FISH[k]?.name??PRODUCT_NAMES[k]??k;
const art=k=>FURNITURE[k]?craftArtwork(k):CLOTHING[k]?clothingArtwork(k):FISH[k]?fishArtwork(k):itemArtwork(k);
function recipeOf(k){const r=Object.values(CRAFT_RECIPES).find(r=>r.output===k&&!r.retired);if(r)return {where:WORKSHOPS[r.workshop]?.name??'Werkstatt',inputs:r.inputs,seconds:r.seconds};const p=PRESS.recipes[k];if(p)return {where:'Materialpresse',inputs:p.inputs??{[p.input==='flowers'?'commonflower':p.input]:p.cost},seconds:p.seconds};return null;}
function effect(k){if(MEALS[k])return `Essen: +${Math.round(MEALS[k].speed*100)} % Lauftempo für ${MEALS[k].seconds/60} Minuten`;if(SNACKS[k])return `Blob-Snack: +${SNACKS[k].friend} Zuneigung (höchstens 3 je Blob und Tag)`;if(k===BAIT.id)return 'Lockt im aktuellen Gebiet einen wilden Blob in deine Nähe (braucht die Blobstation)';if(CLOTHING[k])return effectText(k);const f=FURNITURE[k];if(f)return [f.light?'Leuchtet nachts':'',f.fishTank?`Platz für ${f.fishTank} Fische`:'',f.wall?'Hängt an der Wand':'',f.outdoor?'Nur draußen':'','Macht es gemütlicher (mehr Ausdauer)'].filter(Boolean).join(' · ');return '';}
function usedIn(k){const out=[];for(const r of Object.values(CRAFT_RECIPES))if(!r.retired&&r.inputs?.[k])out.push(r.name);for(const r of Object.values(PRESS.recipes))if(r.inputs?.[k]||r.input===k)out.push(PRODUCT_NAMES[r.id]??r.id);let upgrades=0;for(const t of Object.values(UPGRADE_COSTS))for(const c of Object.values(t))if(c.materials?.[k])upgrades++;for(const t of Object.values(WORKSHOP_UPGRADE_COSTS))for(const l of Object.values(t))for(const c of l)if(c[0]?.[k])upgrades++;for(const l of Object.values(PRESS_UPGRADE_COSTS))for(const c of l)if(c.materials?.[k])upgrades++;return {recipes:[...new Set(out)],upgrades};}
export function productInfoHTML(s,k){const r=recipeOf(k),e=effect(k),u=usedIn(k),price=salePrice(k),src=r?null:materialSources(s,k);
 return `<header><strong>${name(k)}</strong><button data-info-close aria-label="Schließen">×</button></header><div class="info-hero"><i>${art(k)}</i>${e?`<p class="info-effect">${e}</p>`:''}</div>
 ${r?`<h3>Herstellung · ${r.where}${r.seconds?` · ${Math.round(r.seconds)} s`:''}</h3><div class="info-chips">${Object.entries(r.inputs).map(([c,n])=>`<span><i>${art(c)}</i><b>${n}×</b><small>${name(c)}</small></span>`).join('')}</div>`:src?.length?`<h3>Zu finden</h3><p>${src.join(' · ')}</p>`:''}
 ${u.recipes.length||u.upgrades?`<h3>Wird gebraucht für</h3><p>${u.recipes.slice(0,14).join(' · ')}${u.recipes.length>14?' …':''}${u.upgrades?`${u.recipes.length?' · ':''}${u.upgrades} Verbesserung${u.upgrades>1?'en':''}`:''}</p>`:''}
 ${price>0?`<h3>Verkauf</h3><p>${formatCoins(price)} ◉ je Stück am Abendstand</p>`:''}`;}
// Welche Kachel zeigt welches Produkt. Rohstoffkacheln an Maschinen sind ausgenommen, dort heißt langes Halten Ziehen.
function itemFromElement(el){const d=el.dataset;if(d.item)return d.item;if(d.machineMode)return CRAFT_RECIPES[d.machineMode]?.output??d.machineMode;return d.stockSelect??d.stock??d.reclaim??d.treePick??d.eat??d.select??d.tree??null;}
const SELECTOR='[data-item],[data-machine-mode],[data-stock-select],[data-stock],[data-reclaim],[data-tree-pick],[data-eat],[data-select],[data-tree]';
export function bindProductInfo(getState){
 const root=document.getElementById('game'),sheet=document.createElement('section');sheet.id='product-info';sheet.hidden=true;sheet.setAttribute('role','dialog');root.append(sheet);
 let timer=null,start=null,suppress=false;
 const cancel=()=>{clearTimeout(timer);timer=null;start=null;};
 document.addEventListener('pointerdown',e=>{const el=e.target.closest?.(SELECTOR);if(!el||sheet.contains(el))return;const k=itemFromElement(el);if(!k)return;start={x:e.clientX,y:e.clientY};timer=setTimeout(()=>{timer=null;sheet.innerHTML=productInfoHTML(getState(),k);sheet.hidden=false;suppress=true;navigator.vibrate?.(12);},HOLD_MS);},true);
 document.addEventListener('pointermove',e=>{if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)>10)cancel();},true);
 for(const t of ['pointerup','pointercancel','scroll'])document.addEventListener(t,cancel,true);
 document.addEventListener('click',e=>{if(suppress&&!sheet.contains(e.target)){suppress=false;e.preventDefault();e.stopPropagation();}},true);
 document.addEventListener('contextmenu',e=>{if(e.target.closest?.(SELECTOR))e.preventDefault();},true);
 sheet.addEventListener('click',e=>{if(e.target.closest('[data-info-close]')||e.target===sheet){sheet.hidden=true;suppress=false;}});
}
