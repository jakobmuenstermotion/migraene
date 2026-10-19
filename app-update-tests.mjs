import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('./app-update.js',import.meta.url),'utf8');
class Events{listeners={};addEventListener(n,f){(this.listeners[n]??=[]).push(f);}removeEventListener(n,f){this.listeners[n]=(this.listeners[n]??[]).filter(x=>x!==f);}dispatchEvent(e){for(const f of [...this.listeners[e.type]??[]])f(e);return !e.defaultPrevented;}}
const settle=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
function setup({first=false,embedded=false,frame=false}={}){
 const window=new Events(),document=new Events(),worker=new Events();let reloads=0,updates=0,options,ack;
 const location={protocol:'https:',origin:'https://example.test',reload(){reloads++;}};
 window.top=embedded?{}:window;document.hidden=false;document.currentScript={src:'https://example.test/farm/app-update.js'};
 const target={postMessage(data){ack=data;}};document.querySelectorAll=()=>frame?[{contentWindow:target}]:[];
 worker.controller=first?null:{};worker.register=async(url,opts)=>{options={url,...opts};return{update:async()=>{updates++;}};};
 const CustomEvent=class{constructor(type,opts={}){this.type=type;this.cancelable=opts.cancelable;this.defaultPrevented=false;}preventDefault(){if(this.cancelable)this.defaultPrevented=true;}};
 const timers=new Map();let tid=0;
 vm.runInNewContext(source,{window,document,location,navigator:{serviceWorker:worker},URL,CustomEvent,Math,Date,Promise,Array,setTimeout:f=>{timers.set(++tid,f);return tid;},clearTimeout:id=>timers.delete(id)});
 return{window,document,worker,target,timers,get options(){return options;},get updates(){return updates;},get reloads(){return reloads;},get ack(){return ack;},change(){worker.controller={};worker.dispatchEvent({type:'controllerchange'});}};
}
test('launch, foreground return, pageshow and game opening recheck the service worker bypassing HTTP cache',async()=>{
 const s=setup();await settle();assert.equal(s.updates,1);assert.equal(s.options.updateViaCache,'none');assert.equal(s.options.scope,'https://example.test/farm/');
 for(const type of ['pageshow','focus','online','app:check-update']){s.window.dispatchEvent({type});await settle();}
 s.document.dispatchEvent({type:'visibilitychange'});await settle();assert.equal(s.updates,6);assert.equal(s.reloads,0);
});
test('a real controller update saves the standalone game before reloading exactly once',async()=>{
 const s=setup();await settle();let saves=0;s.window.addEventListener('app:before-update',()=>saves++);s.change();await settle();s.change();await settle();assert.equal(saves,1);assert.equal(s.reloads,1);
});
test('a hosted game must acknowledge successful saving before its parent reloads',async()=>{
 const s=setup({frame:true});await settle();s.change();await settle();assert.equal(s.reloads,0);assert.equal(s.ack.type,'mondgarten:save');
 const ack={type:'message',origin:'https://example.test',source:s.target,data:{type:'mondgarten:saved',id:s.ack.id,ok:true}};
 s.window.dispatchEvent({...ack,origin:'https://other.test'});await settle();assert.equal(s.reloads,0);s.window.dispatchEvent(ack);await settle();assert.equal(s.reloads,1);
});
test('save failures and missing acknowledgements preserve the running game and allow later retry',async()=>{
 const s=setup({frame:true});await settle();s.change();await settle();s.window.dispatchEvent({type:'message',origin:'https://example.test',source:s.target,data:{type:'mondgarten:saved',id:s.ack.id,ok:false}});await settle();assert.equal(s.reloads,0);
 s.window.dispatchEvent({type:'focus'});await settle();for(const callback of [...s.timers.values()])callback();await settle();assert.equal(s.reloads,0);
 const direct=setup();await settle();direct.window.addEventListener('app:before-update',e=>e.preventDefault());direct.change();await settle();assert.equal(direct.reloads,0);
});
test('background updates reload only on returning, and first installation or embedded frames never trigger a reload',async()=>{
 const s=setup();await settle();s.document.hidden=true;s.change();await settle();assert.equal(s.reloads,0);s.document.hidden=false;s.document.dispatchEvent({type:'visibilitychange'});await settle();assert.equal(s.reloads,1);
 const first=setup({first:true});await settle();first.change();await settle();assert.equal(first.reloads,0);
 const child=setup({embedded:true});await settle();assert.equal(child.options,undefined);
});
const swSource=readFileSync(new URL('./sw.js',import.meta.url),'utf8');
function workerSetup(fail=false){const listeners={};let skipped=0,requests,network=0;const cached={version:'old'};
 const self={location:{origin:'https://example.test'},registration:{scope:'https://example.test/farm/'},clients:{claim:async()=>{}},addEventListener:(n,f)=>listeners[n]=f,skipWaiting:async()=>{skipped++;}};
 const cache={addAll:async files=>{requests=files;if(fail)throw Error('offline');},match:async()=>cached,put:async()=>{throw Error('must not overwrite cached version');}};
 vm.runInNewContext(swSource,{self,caches:{open:async()=>cache},URL,Request:class{constructor(url,opts){this.url=url;this.cache=opts.cache;}},fetch:async()=>{network++;throw Error('offline');},Response});
 return{listeners,cached,get requests(){return requests;},get skipped(){return skipped;},get network(){return network;}};
}
test('new workers activate only after all versioned assets are cached without the HTTP cache',async()=>{
 const s=workerSetup();let done;s.listeners.install({waitUntil:p=>done=p});await done;assert.ok(s.requests.length>70);assert.ok(s.requests.every(r=>r.cache==='no-store'));assert.equal(s.skipped,1);
 const failed=workerSetup(true);failed.listeners.install({waitUntil:p=>done=p});await assert.rejects(done,/offline/);assert.equal(failed.skipped,0);
});
test('cached assets remain a consistent version without background overwrites from a newer release',async()=>{
 const s=workerSetup();let response;s.listeners.fetch({request:{method:'GET',url:'https://example.test/farm/mondgarten/game.js'},respondWith:p=>response=p});assert.equal(await response,s.cached);assert.equal(s.network,0);
});
