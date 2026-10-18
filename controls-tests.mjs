import test from 'node:test';
import assert from 'node:assert/strict';
import {GardenControls} from './mondgarten/controls.js';
class Target{
 constructor(){this.listeners=new Map();this.captured=new Set();this.hidden=false;}
 addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(fn);}
 emit(type,props={}){const event={type,target:{tagName:'CANVAS'},preventDefault(){},...props};for(const fn of this.listeners.get(type)??[])fn(event);}
 hasPointerCapture(id){return this.captured.has(id);}
 setPointerCapture(id){this.captured.add(id);}
 releasePointerCapture(id){this.captured.delete(id);this.emit('lostpointercapture',{pointerId:id});}
 focus(){}
 getBoundingClientRect(){return{left:0,top:0};}
}
function setup(){
 const win=new Target(),doc=new Target(),canvas=new Target(),classes=new Set(),joystick={style:{},firstElementChild:{style:{}},parentElement:canvas,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}};
 globalThis.window=win;globalThis.document=doc;let taps=0;
 const controls=new GardenControls(canvas,joystick,null,{onTap:()=>taps++});
 const down=(id=1)=>canvas.emit('pointerdown',{pointerId:id,button:0,clientX:10,clientY:10});
 const drag=(id=1)=>{down(id);canvas.emit('pointermove',{pointerId:id,clientX:38,clientY:10,pointerType:'touch'});assert.equal(controls.direction({x:0,z:0}).x,1);};
 return{win,doc,canvas,joystick,classes,controls,down,drag,taps:()=>taps};
}
const oldWindow=globalThis.window,oldDocument=globalThis.document;
test.after(()=>{globalThis.window=oldWindow;globalThis.document=oldDocument;});
function neutral(v){assert.deepEqual(v.controls.direction({x:0,z:0}),{x:0,z:0});assert.equal(v.controls.pointer,null);assert.equal(v.classes.has('active'),false);assert.equal(v.canvas.captured.size,0);assert.equal(v.joystick.firstElementChild.style.transform,'');}
test('system interruptions and return reset touch, keyboard and capture; the next drag works',()=>{
 for(const event of ['blur','focus','pagehide','pageshow','touchcancel']){
  const v=setup();v.drag();v.controls.keys.add('w');v.win.emit(event);neutral(v);assert.equal(v.taps(),0);v.drag(2);
 }
 const v=setup();v.drag();v.doc.hidden=true;v.doc.emit('visibilitychange');neutral(v);
});
test('window pointer cancellation, lost capture and missing touch-end pointer events cannot latch movement',()=>{
 for(const type of ['pointerup','pointercancel']){const v=setup();v.drag();v.win.emit(type,{pointerId:1,clientX:38,clientY:10});neutral(v);assert.equal(v.taps(),0);}
 const v=setup();v.drag();v.canvas.releasePointerCapture(1);neutral(v);
 v.drag(2);v.win.emit('touchend',{touches:[]});neutral(v);
});
test('stale un-captured pointer can be replaced, active extra fingers do not steal control and taps still work',()=>{
 const v=setup();v.drag();v.down(2);assert.equal(v.controls.pointer,1);
 v.canvas.captured.clear();v.down(3);assert.equal(v.controls.pointer,3);v.controls.stop();neutral(v);
 v.down(4);v.canvas.emit('pointerup',{pointerId:4,clientX:10,clientY:10});neutral(v);assert.equal(v.taps(),1);
});
