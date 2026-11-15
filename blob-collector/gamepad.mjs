// Jakob 15.11.: Controller-Unterstützung (Gamepad API, Standard-Belegung: Xbox, PlayStation, MFi/„Extended“-Controller am iPad/iPhone).
//
// Belegung:
//   (PlayStation-Namen; Xbox: Kreuz = A, Kreis = B, Viereck = X, Dreieck = Y)
//   Linker Stick ........ laufen (und zielen)         Steuerkreuz .... laufen; in Menüs: Auswahl bewegen
//   Kreuz ............... Saugen an/aus bzw. aufheben; in Menüs: bestätigen; bei Sprechblasen: weiter
//   Viereck ............. Aktion (Gebäude, Blob füttern, Köder … alle Interaktionsknöpfe)
//   Kreis (halten) ...... Sprinten; in Menüs: zurück/schließen; bei Sprechblasen: überspringen
//   L2 oder L3 .......... Sprinten (zusätzlich)       L1 / R1 ........ Sauger wechseln
//   Dreieck, Start ...... Einstellungen
// Hinweis iOS: Safari meldet einen Controller erst, nachdem darauf eine Taste gedrückt wurde.

const DEAD=.2,STICK_NAV=.6;
const CONTEXT_BUTTONS=['world-interact','pet-blob','feed-blob','fish-bait','stone-action','push-action','filter-action','transport-action','home-computer','site-build','mission-board-btn','blob-info','journal-btn'];
const PANELS=['save-safety','hud-setup','preferences','vacuum-picker','craft-panel','area-panel','test-panel'];
const CLOSE_BY_PANEL={preferences:'preferences-close','vacuum-picker':'vacuum-close','area-panel':'area-close','test-panel':'test-close'};
const FOCUSABLE='button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])';

const visible=el=>Boolean(el)&&!el.hidden&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';
const byId=id=>document.getElementById(id);
const clickId=id=>{const el=byId(id);if(visible(el)&&!el.disabled){el.click();return true;}return false;};

export function bindGamepad({getState,vacuums,owns,setVacuum,persist}){
 const style=document.createElement('style');style.textContent=`
body.pad-nav :focus{outline:4px solid #5b8f3a!important;outline-offset:3px!important;border-radius:12px}
#pad-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top));transform:translateX(-50%);z-index:2100;max-width:min(380px,calc(100% - 24px));padding:9px 14px;border-radius:16px;background:#fff7dc;border:2px solid #b9a47c;color:#4b3f2a;font:700 14px/1.35 system-ui;box-shadow:0 6px 18px #0004;pointer-events:none;text-align:center}
#pad-toast[hidden]{display:none}`;
 document.head.append(style);
 const toast=document.createElement('div');toast.id='pad-toast';toast.hidden=true;toast.setAttribute('role','status');(byId('game')??document.body).append(toast);
 let toastTimer=0;const say=(t,ms=2600)=>{toast.textContent=t;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},ms);};

 let prev=[],prevNav={x:0,y:0},lastNavAt=0,seen=false;
 addEventListener('gamepadconnected',e=>{seen=true;document.body.classList.add('pad-nav');const xbox=/xbox/i.test(e.gamepad?.id??''),[cross,circle,square]=xbox?['A','B','X']:['✕','○','□'];say(`Controller verbunden · Stick: laufen · ${cross}: saugen an/aus · ${circle} halten: sprinten · ${square}: Aktion · L1/R1: Sauger · Start: Menü`,4800);});
 addEventListener('gamepaddisconnected',()=>{say('Controller getrennt');});

 const activePanel=()=>PANELS.map(id=>byId(id)).find(visible)??null;
 const nav=(panel,dir)=>{
  const list=[...panel.querySelectorAll(FOCUSABLE)].filter(visible);if(!list.length)return;
  const i=list.indexOf(document.activeElement);
  if(i<0){list[0].focus();return;}
  const cur=list[i];
  if(cur.type==='range'&&(dir==='left'||dir==='right')){const step=Number(cur.step)||1,min=Number(cur.min)||0,max=Number(cur.max)||100,v=Number(cur.value)+(dir==='right'?step:-step)*Math.max(1,Math.round((max-min)/20/step));cur.value=String(Math.max(min,Math.min(max,v)));cur.dispatchEvent(new Event('input',{bubbles:true}));return;}
  const next=(dir==='down'||dir==='right')?(i+1)%list.length:(i-1+list.length)%list.length;list[next].focus();list[next].scrollIntoView?.({block:'nearest'});
 };
 const closePanel=panel=>{
  const id=panel.id;if(CLOSE_BY_PANEL[id]&&clickId(CLOSE_BY_PANEL[id]))return true;
  const b=[...panel.querySelectorAll('button')].filter(visible).find(x=>/Schließen|Abbrechen|Später|^OK$|Zurück|×/.test(x.textContent.trim()||x.getAttribute('aria-label')||''));
  if(b){b.click();return true;}return false;
 };
 const cycleVacuum=dir=>{
  const s=getState(),list=vacuums.filter(v=>owns(s,v.id));if(list.length<2)return;
  const i=Math.max(0,list.findIndex(v=>v.id===s.vacuumId)),next=list[(i+dir+list.length)%list.length];
  setVacuum(s,next.id);persist?.();say('Sauger: '+next.name,1500);
 };

 /** Pro Bild aufrufen. Gibt die Bewegung zurück: {x,z,aimX,aimZ,active (analog),sprint}. */
 function poll(){
  const out={x:0,z:0,aimX:0,aimZ:0,active:false,sprint:false};
  let gp=null;try{for(const p of navigator.getGamepads?.()??[])if(p&&p.connected&&(!gp||(p.mapping==='standard'&&gp.mapping!=='standard')))gp=p;}catch{}
  if(!gp){prev=[];return out;}
  if(!seen){seen=true;document.body.classList.add('pad-nav');}
  const b=i=>Boolean(gp.buttons[i]?.pressed)||(gp.buttons[i]?.value>.5);
  const down=i=>b(i)&&!prev[i];/* gerade gedrückt (steigende Flanke) */
  const ax=gp.axes[0]||0,ay=gp.axes[1]||0,len=Math.hypot(ax,ay);
  const panel=activePanel(),story=byId('story-ui');
  const storyOpen=!panel&&story&&visible(story)&&(visible(byId('story-think'))||visible(byId('story-big')));

  if(panel){
   // Menü-Navigation: Steuerkreuz und linker Stick (mit Wiederholung), A bestätigt, B schließt
   let dir=null;
   if(down(12))dir='up';else if(down(13))dir='down';else if(down(14))dir='left';else if(down(15))dir='right';
   else if(len>STICK_NAV&&performance.now()-lastNavAt>260){dir=Math.abs(ax)>Math.abs(ay)?(ax>0?'right':'left'):(ay>0?'down':'up');lastNavAt=performance.now();}
   if(dir)nav(panel,dir);
   if(down(0)){const f=document.activeElement;if(f&&panel.contains(f))f.click();else nav(panel,'down');}
   if(down(1)||down(9))closePanel(panel);
  }else{
   if(len>DEAD){const k=Math.min(1,(len-DEAD)/(1-DEAD));out.x=ax/len*k;out.z=ay/len*k;out.aimX=ax/len;out.aimZ=ay/len;out.active=true;}
   else{out.x=(b(15)?1:0)-(b(14)?1:0);out.z=(b(13)?1:0)-(b(12)?1:0);}/* Steuerkreuz: wie Pfeiltasten */
   out.sprint=(!storyOpen&&b(1))||b(6)||b(10);/* Kreis halten = Sprinten */
   if(down(0)){if(storyOpen)clickId('story-think')||clickId('story-big');else clickId('vacuum-choose');}
   if(down(2)){for(const id of CONTEXT_BUTTONS)if(clickId(id))break;}
   if(down(3)||down(9))clickId('settings-open');
   if(down(4))cycleVacuum(-1);
   if(down(5))cycleVacuum(1);
   if(down(1)&&storyOpen)clickId('story-skip');
  }
  prev=gp.buttons.map((_,i)=>b(i));
  return out;
 }
 return {poll};
}
