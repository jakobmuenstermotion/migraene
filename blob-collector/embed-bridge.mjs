// Schnittstelle zur Migräne-Begleitapp (nur aktiv mit ?embedded=1 in einem iframe derselben Herkunft).
// App -> Spiel:  {type:'blob:start-day'}  neuer Spieltag beginnt (alle Akkus voll)
//                {type:'blob:save', id}    sofort speichern, Antwort {type:'blob:saved', id, ok}
// Spiel -> App:  {type:'blob:ready', day}  Spiel geladen, aktueller Spieltag
//                {type:'blob:day-started', day}
//                {type:'blob:day-ended', day}   Figur hat geschlafen (Tag `day` ist vorbei)
//                {type:'blob:areas', coast, ice} welche Gebiete schon erreicht wurden
import {fillBatteryBank} from './battery-bank.mjs';
const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&window.parent!==window;
if(embedded){
 const post=msg=>window.parent.postMessage(msg,location.origin);
 let startDay=null,areas='',greeted=false;
 const game=()=>globalThis.__redesign,state=()=>game()?.state,day=()=>state()?.round?.day??1;
 const save=()=>{try{return game()?.save?.()!==false;}catch{return false;}};
 window.addEventListener('message',e=>{
  if(e.origin!==location.origin||e.source!==window.parent)return;
  const s=state();if(!s)return;
  if(e.data?.type==='blob:start-day'){fillBatteryBank(s);startDay=day();save();post({type:'blob:day-started',day:startDay});}
  if(e.data?.type==='blob:continue-day'){startDay=Number(e.data.day)||day();}
  if(e.data?.type==='blob:save'){const ok=save();post({type:'blob:saved',id:e.data.id,ok});}
 });
 setInterval(()=>{
  const s=state();if(!s)return;
  if(!greeted){greeted=true;post({type:'blob:ready',day:day()});}
  const seen=s.story?.seen??[],now=JSON.stringify([seen.includes('coast'),seen.includes('snow')]);
  if(now!==areas){areas=now;post({type:'blob:areas',coast:seen.includes('coast'),ice:seen.includes('snow')});}
  if(startDay!==null&&day()>startDay){const ended=startDay;startDay=null;save();post({type:'blob:day-ended',day:ended});}
 },400);
 addEventListener('pagehide',save);
}
