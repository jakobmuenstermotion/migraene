/* Check on launch, foreground return and game opening; preserve local progress. */
(function(){
 'use strict';
 if(window.top!==window||!('serviceWorker' in navigator)||location.protocol!=='https:')return;
 var script=document.currentScript,workerURL=new URL('sw.js',script.src),registration=null,checking=false,pending=false,reloading=false;
 var controller=navigator.serviceWorker.controller;
 function requestSave(frame){return new Promise(function(resolve){
  var target=frame.contentWindow;if(!target){resolve(true);return;}
  var id='update-'+Date.now()+'-'+Math.random(),timer;
  function done(ok){clearTimeout(timer);window.removeEventListener('message',ack);resolve(ok);}
  function ack(e){if(e.origin===location.origin&&e.source===target&&e.data?.type==='mondgarten:saved'&&e.data.id===id)done(e.data.ok===true);}
  window.addEventListener('message',ack);timer=setTimeout(function(){done(false);},2500);
  target.postMessage({type:'mondgarten:save',id:id},location.origin);
 });}
 async function reload(){
  if(!pending||reloading||document.hidden)return;
  reloading=true;
  try{
   var event=new CustomEvent('app:before-update',{cancelable:true});window.dispatchEvent(event);
   if(event.defaultPrevented){reloading=false;return;}
   var frames=Array.from(document.querySelectorAll('iframe[data-mondgarten="1"]'));
   var saved=await Promise.all(frames.map(requestSave));
   if(saved.some(function(ok){return !ok;})){reloading=false;return;}
   if(document.hidden){reloading=false;return;}
   location.reload();
  }catch(_){reloading=false;}
 }
 navigator.serviceWorker.addEventListener('controllerchange',function(){
  var next=navigator.serviceWorker.controller;
  if(controller&&next&&next!==controller)pending=true;
  controller=next;reload();
 });
 async function check(){
  if(document.hidden)return;
  if(pending){reload();return;}
  if(checking||!registration)return;
  checking=true;try{await registration.update();}catch(_){}finally{checking=false;}
 }
 document.addEventListener('visibilitychange',check);
 for(var name of ['pageshow','focus','online','app:check-update'])window.addEventListener(name,check);
 navigator.serviceWorker.register(workerURL.href,{scope:new URL('./',workerURL).href,updateViaCache:'none'}).then(function(r){registration=r;check();}).catch(function(){});
})();
