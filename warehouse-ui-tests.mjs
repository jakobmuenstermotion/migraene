import test from 'node:test';
import assert from 'node:assert/strict';
import {freshState} from './mondgarten/core.mjs';
import {WarehouseShelf,warehouseIcon} from './mondgarten/warehouse-ui.mjs';
import {withdrawWarehouse} from './mondgarten/warehouse.mjs';
// Minimal event/element fixture: exercise the actual component's click, range and
// submit handlers without requiring Chromium or a WebGL context in Node.
class Element{
 constructor(){this.events={};this.attrs={};this.dataset={};this.style={};this.hidden=false;this.value='0';this.max='0';this._html='';this.focused=false;}
 addEventListener(type,handler){this.events[type]=handler;}emit(type,extra={}){this.events[type]?.({preventDefault(){},stopPropagation(){},...extra});}
 set innerHTML(s){this._html=s;}get innerHTML(){return this._html;}
 setAttribute(k,v){this.attrs[k]=v;}hasAttribute(k){return k in this.attrs;}focus(){this.focused=true;}
 getBoundingClientRect(){return{width:350,height:400};}
 querySelectorAll(){const buttons=[];for(const m of this._html.matchAll(/<button\b([^>]*)>/g)){const b=new Element(),id=m[1].match(/data-warehouse-item="([^"]+)"/);if(id)b.dataset.warehouseItem=id[1];b.closest=()=>b;buttons.push(b);}return buttons;}
 querySelector(){return this.querySelectorAll()[0]??null;}
}
class Root extends Element{constructor(){super();this.nodes=new Map();}querySelector(selector){const attr=selector.slice(1,-1);assert.ok(this._html.includes(attr),'real shelf markup must contain '+attr);if(!this.nodes.has(selector))this.nodes.set(selector,new Element());return this.nodes.get(selector);}}
function ready(){const state=freshState();state.village.raw.lavender=72;state.village.rawValues.lavender=360;state.village.storedGoods={bouquet:{count:12,value:240}};const root=new Root(),calls=[],shelf=new WarehouseShelf(root,{onWithdraw:(id,n)=>{calls.push({id,n});withdrawWarehouse(state,id,n);}});shelf.open(state);return{state,root,shelf,calls};}
test('clicking a shelf tile opens a slider from zero to all stored units and Okay packs exactly its selected quantity',()=>{
 const {state,root,shelf,calls}=ready();assert.equal(root.hidden,false);assert.match(shelf.grid.innerHTML,/Lavendelbündel/);const tile=shelf.grid.querySelectorAll().find(b=>b.dataset.warehouseItem==='lavender');root.emit('click',{target:tile});assert.equal(shelf.range.value,'0');assert.equal(shelf.range.max,'72');assert.equal(shelf.picker.hidden,false);assert.equal(calls.length,0);
 shelf.range.value='12';shelf.range.emit('input');assert.equal(root.querySelector('[data-amount]').textContent,'12');assert.equal(root.querySelector('[data-confirm]').textContent,'Okay · 12 einpacken');shelf.picker.emit('submit');assert.deepEqual(calls,[{id:'lavender',n:12}]);assert.equal(state.cargo.lavender.count,12);assert.equal(state.village.raw.lavender,60);assert.equal(shelf.picker.hidden,true);assert.ok(shelf.visible);
});
test('slider still reaches all stock when bag room is smaller, and the confirmation explains the actual amount',()=>{
 const {state,root,shelf}=ready();state.bag=75;state.bagValue=75;state.cargo={moonbloom:{count:75,value:75}};shelf.select('lavender');assert.equal(shelf.range.max,'72');shelf.range.value='72';shelf.range.emit('input');assert.equal(root.querySelector('[data-confirm]').textContent,'Okay · 5 einpacken');assert.match(root.querySelector('[data-room]').textContent,/67 bleiben im Lager/);shelf.range.value='50';shelf.range.emit('input');assert.match(root.querySelector('[data-room]').textContent,/67 bleiben im Lager/);shelf.picker.emit('submit');assert.equal(state.bag,80);assert.equal(state.village.raw.lavender,67);
});
test('shelf refresh handles changed counts without replacing a slider being dragged; close and Escape dismiss it',()=>{
 const {state,root,shelf}=ready();shelf.select('lavender');const range=shelf.range;shelf.range.value='72';state.village.raw.lavender=20;shelf.refresh(state);assert.equal(shelf.range,range);assert.equal(shelf.range.max,'20');assert.equal(shelf.range.value,'20');root.emit('keydown',{key:'Escape'});assert.equal(shelf.visible,false);assert.equal(root.hidden,true);shelf.open(state);const close=new Element();close.attrs['data-close']='';close.closest=()=>close;root.emit('click',{target:close});assert.equal(shelf.visible,false);
});
test('empty shelves remain usable and their floating panel stays within a narrow portrait viewport',()=>{
 const root=new Root(),shelf=new WarehouseShelf(root);shelf.open(freshState());assert.equal(root.querySelector('[data-empty]').hidden,false);assert.equal(shelf.picker.hidden,true);shelf.position({x:-200,y:20},375,667);assert.ok(parseFloat(root.style.left)>=12);assert.ok(parseFloat(root.style.top)>=78);assert.match(warehouseIcon({kind:'fish',color:'#85becb'}),/viewBox="0 0 64 64"/);
});
