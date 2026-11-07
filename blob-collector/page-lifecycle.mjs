// Jakob 1.11.: iPhone-Safari. Lange Drücker markieren nichts, Tabwechsel und Schließen verlieren nichts.
const TAB_KEY='blob-active-tab';
const editable=target=>Boolean(target?.closest?.('input:not([type=range]),textarea,[contenteditable]'));
// Der zuletzt geladene Tab schreibt den Spielstand. Ein älterer schreibt nicht mehr und lädt neu, sobald man zu ihm zurückkehrt.
export function bindTabOwner(storage,reload,id=Date.now()+'-'+Math.random().toString(36).slice(2)){
 const read=()=>{try{return storage.getItem(TAB_KEY);}catch{return null;}};
 try{storage.setItem(TAB_KEY,id);}catch{}
 return {superseded:()=>{const owner=read();return owner!==null&&owner!==id;},check(){if(this.superseded()){reload();return true;}return false;}};
}
// iOS verwirft den Grafikspeicher gern im Hintergrund. Kommt er nicht zügig von selbst zurück, lädt die Seite den eben gespeicherten Stand neu.
export function bindContextRecovery(canvas,{persist,reload,isHidden,waitMs=2500}){
 let timer=null,due=false;
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();persist();clearTimeout(timer);timer=setTimeout(()=>{if(isHidden())due=true;else reload();},waitMs);});
 canvas.addEventListener('webglcontextrestored',()=>{clearTimeout(timer);timer=null;due=false;});
 return {visible(){if(due)reload();}};
}
export function bindPageLifecycle({storage,canvas,persist,resumeAudio,reload=()=>location.reload()}){
 const owner=bindTabOwner(storage,reload),context=bindContextRecovery(canvas,{persist,reload,isHidden:()=>document.hidden});
 const back=()=>{if(document.hidden||owner.check())return;context.visible();resumeAudio();};
 document.addEventListener('visibilitychange',back);addEventListener('pageshow',back);addEventListener('focus',back);
 for(const type of ['selectstart','contextmenu','dragstart'])document.addEventListener(type,e=>{if(!editable(e.target))e.preventDefault();});
 for(const type of ['gesturestart','gesturechange','gestureend','dblclick'])document.addEventListener(type,e=>e.preventDefault(),{passive:false});
 return owner;
}
