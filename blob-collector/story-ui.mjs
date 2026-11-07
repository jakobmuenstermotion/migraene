import * as T from './vendor/three.module.js';
import {sunnyHeight} from './sunny-area.mjs';
import {NOTES,storyState,nextDialog,markDialog,collectNote,nearNote,TOOL_LINES} from './story-dialogs.mjs';
import {updateIntro} from './intro.mjs';
import {giveRelic} from './relics.mjs';
import {homeRegion,inHome} from './home-space.mjs';
// Jakob 6.11.: Sprechblasen im warmen Animal-Crossing-Stil (Creme, runde Ecken, brauner Rand und Text).
// A = kleine Gedankenblase (verschwindet von selbst, blockiert nichts), B = große Blase (Antippen = weiter, Schreibmaschine,
// Überspringen), C = Papierkarte „Fundstück“. Einmal-Erklärungskarten (first-tips) bleiben unabhängig davon bestehen.
const SYMBOL={enthusiasm:'✨',joy:'♪',pride:'⭐',curious:'?',excited:'❗',hearts:'♥',dismay:'💧',wonder:'✦',shock:'❗'};
export class StoryNotesView{
 // Jakob 6.11.: Notizen sehen alt aus (vergilbtes, fleckiges, eingerissenes Papier mit verblasster Schrift) und liegen flach und unauffällig am Boden.
 // Nur aus der Nähe (unter 4 m) blitzt ein winziger Funke, damit man sie beim genauen Hinsehen findet.
 // Jakob 7.11.: noch älter und ausgefranster: unregelmäßig zerrissener Rand mit Fransen, ein abgerissenes Eck, angesengter/brauner
 // Randverlauf, Knickfalten, Wasserflecken, kleine Löcher, verblasste krakelige Schrift. Drei Varianten, Blatt leicht gewellt.
 constructor(scene){this.root=new T.Group();scene.add(this.root);this.items=new Map();
  let seed=7;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const paper=v=>{const W=256,H=320,cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');seed=31+v*977;
   const pts=[],edge=(x0,y0,x1,y1,n,jag)=>{for(let i=0;i<n;i++){const k=i/n,nx=-(y1-y0),ny=x1-x0,l=Math.hypot(nx,ny),r=(rnd()-.35)*jag*(rnd()<.18?2.6:1);pts.push([x0+(x1-x0)*k+nx/l*r,y0+(y1-y0)*k+ny/l*r]);}};
   const torn=v%3;edge(14,16,torn===0?180:W-12,10,40,7);if(torn===0){edge(180,10,W-10,92,22,9);}else edge(W-12,10,W-8,H-14,46,6);edge(W-8,H-14,torn===1?120:12,H-8,40,8);if(torn===1)edge(120,H-8,8,230,24,10);else edge(12,H-8,8,230,14,7);edge(8,230,14,16,40,6);
   g.save();g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.clip();
   const base=g.createRadialGradient(W*.48,H*.46,30,W/2,H/2,W*.75);base.addColorStop(0,'#d8c39a');base.addColorStop(.6,'#c4a676');base.addColorStop(.88,'#9c7a4c');base.addColorStop(1,'#5e4428');g.fillStyle=base;g.fillRect(0,0,W,H);
   for(let i=0;i<40;i++){g.fillStyle=`rgba(${90+rnd()*40},${60+rnd()*30},${30},${.04+rnd()*.08})`;g.beginPath();g.ellipse(rnd()*W,rnd()*H,4+rnd()*26,3+rnd()*18,rnd()*3,0,6.3);g.fill();}
   for(let i=0;i<3;i++){const x=rnd()*W,y=rnd()*H,r=18+rnd()*30;g.strokeStyle='rgba(95,65,35,.35)';g.lineWidth=2.5;g.beginPath();g.ellipse(x,y,r,r*(.6+rnd()*.4),rnd()*3,0,6.3);g.stroke();g.fillStyle='rgba(120,90,50,.12)';g.fill();}
   g.strokeStyle='rgba(70,50,28,.35)';g.lineWidth=1.6;g.beginPath();g.moveTo(0,H*.5+rnd()*8);g.lineTo(W,H*.5+rnd()*8);g.moveTo(W*.5,0);g.lineTo(W*.5+rnd()*6,H);g.stroke();g.strokeStyle='rgba(255,240,210,.25)';g.lineWidth=1.2;g.beginPath();g.moveTo(0,H*.5+3);g.lineTo(W,H*.5+5);g.stroke();
   g.strokeStyle='rgba(55,38,22,.5)';g.lineCap='round';for(let y=34;y<H-30;y+=17){if(rnd()<.12)continue;g.lineWidth=1.4+rnd();g.globalAlpha=.35+rnd()*.45;g.beginPath();let x=24+rnd()*8;g.moveTo(x,y);const end=W-30-rnd()*50;while(x<end){const w=6+rnd()*16;for(let k=0;k<w;k+=3)g.lineTo(x+k,y+Math.sin((x+k)*.9+y)*2.2+(rnd()-.5)*1.5);x+=w;g.moveTo(x+4+rnd()*4,y);x+=6;}g.stroke();}g.globalAlpha=1;
   g.globalCompositeOperation='destination-out';for(let i=0;i<5;i++){const x=20+rnd()*(W-40),y=20+rnd()*(H-40),r=1.5+rnd()*4;g.beginPath();g.ellipse(x,y,r,r*(.6+rnd()*.5),rnd()*3,0,6.3);g.fill();}g.globalCompositeOperation='source-over';
   g.restore();g.lineWidth=2.4;g.strokeStyle='rgba(60,40,20,.55)';g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.stroke();
   g.strokeStyle='rgba(190,165,120,.9)';g.lineWidth=1;for(let i=0;i<pts.length;i+=2){const [x,y]=pts[i],cx=W/2,cy=H/2,l=Math.hypot(x-cx,y-cy),f=3+rnd()*6;g.beginPath();g.moveTo(x,y);g.lineTo(x+(x-cx)/l*f+(rnd()-.5)*3,y+(y-cy)/l*f+(rnd()-.5)*3);g.stroke();}
   const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;return new T.MeshStandardMaterial({map:tex,transparent:true,alphaTest:.35,side:T.DoubleSide,roughness:1});};
  const mats=[0,1,2].map(paper),geo=new T.PlaneGeometry(.4,.5,8,10),pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);pos.setZ(i,.018*Math.sin(x*14)+.03*Math.max(0,Math.abs(y)-.16)*8*(y>0?1:.6)+.012*Math.cos(y*19));}geo.computeVertexNormals();
  const spark=new T.OctahedronGeometry(.045,0),sparkMat=new T.MeshBasicMaterial({color:'#fff8e0'});
  for(const [i,n] of NOTES.entries()){if(n.relic)continue;const g=new T.Group(),sheet=new T.Mesh(geo,mats[i%3]);sheet.rotation.set(-Math.PI/2+.04,0,i*1.3);sheet.position.y=.035;g.add(sheet);const sp=new T.Mesh(spark,sparkMat);sp.position.set(.08,.12,0);g.add(sp);g.position.set(n.x,sunnyHeight(n.x,n.z),n.z);g.userData.spark=sp;this.root.add(g);this.items.set(n.id,g);}}
 update(s){const show=s.area==='sunny'&&!s.home?.interior&&!s.nursery?.interior&&!s.cave?.interior&&!s.testWorld?.enabled,got=storyState(s).notes;this.root.visible=show;if(!show)return;for(const [id,g]of this.items){g.visible=!got.includes(id);if(!g.visible)continue;const near=Math.hypot(s.player.x-g.position.x,s.player.z-g.position.z)<4,tw=Math.max(0,Math.sin(s.time*3+id.length*2));g.userData.spark.visible=near&&tw>.6;g.userData.spark.scale.setScalar(.6+tw);}}
}
export function bindStory({getState,onSave}){
 const root=document.getElementById('game'),box=document.createElement('aside');box.id='story-ui';
 box.innerHTML='<div id="story-think" hidden></div><section id="story-big" hidden role="dialog"><i id="story-fx"></i><p></p><footer><button id="story-skip" type="button">Überspringen</button><span>Antippen ▸</span></footer></section><section id="story-card" hidden role="dialog"><small>Fundstück</small><h3></h3><p></p><button type="button" id="story-card-ok">Ins Notizbuch</button></section><section id="story-journal" hidden role="dialog"><header><strong>Notizbuch</strong><button type="button" id="story-journal-x" aria-label="Schließen">×</button></header><div></div></section><button id="journal-btn" type="button" hidden aria-label="Notizbuch">📖</button>';
 root.append(box);const relicBtn=document.createElement('button');relicBtn.id='relic-pick';relicBtn.type='button';relicBtn.hidden=true;relicBtn.textContent='✋ Aufheben';root.append(relicBtn);let relicWanted=false;relicBtn.addEventListener('click',()=>{relicWanted=true;relicBtn.hidden=true;});const $=q=>box.querySelector(q),think=$('#story-think'),big=$('#story-big'),card=$('#story-card'),journal=$('#story-journal'),jbtn=$('#journal-btn'),fx=$('#story-fx');
 const style=document.createElement('style');style.textContent=`#story-ui{position:fixed;inset:0;pointer-events:none;z-index:40;font-family:ui-rounded,"SF Pro Rounded","Hiragino Maru Gothic ProN","Arial Rounded MT Bold","Varela Round","Nunito",system-ui,sans-serif;letter-spacing:.015em;color:#5a3f26}
#story-ui [hidden]{display:none!important}
#story-think{position:absolute;left:50%;top:15%;transform:translateX(-50%);max-width:min(80vw,340px);background:radial-gradient(circle at 30% 20%,#fffdf6,#fff1d4);border:3px solid #c98f5b;border-radius:34px 34px 34px 14px;padding:12px 18px;font-weight:800;font-size:15.5px;text-align:center;box-shadow:0 5px 0 rgba(160,100,50,.28),0 10px 22px rgba(80,50,20,.18);animation:storyPop .3s cubic-bezier(.3,1.6,.5,1)}
#story-think:before{content:"";position:absolute;left:-16px;bottom:-20px;width:10px;height:10px;border-radius:50%;background:#fff1d4;border:3px solid #c98f5b}
#story-think:after{content:"";position:absolute;left:-30px;bottom:-34px;width:6px;height:6px;border-radius:50%;background:#fff1d4;border:2px solid #c98f5b}
#story-big{position:absolute;left:50%;bottom:19%;transform:translateX(-50%);width:min(88vw,380px);background:radial-gradient(circle at 20% 10%,#fffdf6,#fff1d4);border:4px solid #c98f5b;border-radius:38px 38px 38px 16px;padding:18px 20px 10px 62px;pointer-events:auto;box-shadow:0 7px 0 rgba(160,100,50,.3),0 14px 28px rgba(80,50,20,.2);animation:storyPop .3s cubic-bezier(.3,1.6,.5,1)}
#story-big:before{content:"";position:absolute;left:12px;top:14px;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 6%,transparent 7%),radial-gradient(circle at 65% 30%,#fff 0 6%,transparent 7%),radial-gradient(circle at 50% 55%,#f4cdb0,#e9b995);border:3px solid #c98f5b;box-shadow:inset 0 -9px 0 -3px #8f7048}
#story-big:after{content:"";position:absolute;left:-14px;bottom:-22px;width:22px;height:22px;background:#fff1d4;border-left:4px solid #c98f5b;border-bottom:4px solid #c98f5b;border-radius:0 0 0 22px;transform:skewX(-22deg)}
#story-big p{margin:0;font-weight:800;font-size:17px;line-height:1.4;min-height:3.9em;letter-spacing:.01em}
#story-big footer{display:flex;justify-content:space-between;align-items:center;margin-top:8px;font-size:12px;opacity:.8}
#story-big button,#story-card button,#story-journal button{font:inherit;font-weight:800;border:2px solid #7a5634;background:#f3dfae;color:#5a3f26;border-radius:999px;padding:6px 14px;pointer-events:auto}
#story-fx{position:absolute;right:16px;top:-22px;font-style:normal;font-size:30px;animation:storyBounce .6s ease-in-out infinite alternate}
#story-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(-1.5deg);width:min(86vw,360px);background:#fbf0d2;border:3px solid #b79864;border-radius:6px;padding:18px 20px;pointer-events:auto;box-shadow:0 10px 24px rgba(60,40,20,.4)}
#story-card small{letter-spacing:.12em;text-transform:uppercase;opacity:.7;font-weight:800}#story-card h3{margin:4px 0 8px;font-size:19px}#story-card p{margin:0 0 12px;font-size:15px;line-height:1.45;font-style:italic}
#story-journal{position:absolute;inset:8% 6%;background:#fff6df;border:4px solid #7a5634;border-radius:22px;padding:14px;overflow:auto;pointer-events:auto}
#story-journal header{display:flex;justify-content:space-between;align-items:center;font-size:20px;margin-bottom:8px}#story-journal article{background:#fbf0d2;border:2px solid #d3b886;border-radius:10px;padding:10px 12px;margin-bottom:10px}#story-journal h4{margin:0 0 4px}#story-journal article p{margin:0;font-size:14px;line-height:1.4}
#journal-btn{position:absolute;left:10px;top:46%;width:42px;height:42px;border-radius:50%;border:3px solid #7a5634;background:#fff6df;font-size:20px;pointer-events:auto}
/* Einmal-Erklärungen sehen jetzt wie Sprechblasen der Figur aus (Jakob 6.11.) */
html body #first-tip{position:fixed!important;left:50%!important;right:auto!important;top:auto!important;bottom:19%!important;transform:translateX(-50%)!important;width:min(88vw,380px)!important;max-height:none!important;background:radial-gradient(circle at 20% 10%,#fffdf6,#fff1d4)!important;border:4px solid #c98f5b!important;border-radius:38px 38px 38px 16px!important;padding:16px 18px 12px 62px!important;box-shadow:0 7px 0 rgba(160,100,50,.3),0 14px 28px rgba(80,50,20,.2)!important;color:#5a3f26!important;font-family:ui-rounded,'SF Pro Rounded','Hiragino Maru Gothic ProN','Arial Rounded MT Bold','Varela Round','Nunito',system-ui,sans-serif!important;text-align:left!important;z-index:41!important}
html body #first-tip:before{content:'';position:absolute;left:12px;top:14px;width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff 0 6%,transparent 7%),radial-gradient(circle at 65% 30%,#fff 0 6%,transparent 7%),radial-gradient(circle at 50% 55%,#f4cdb0,#e9b995);border:3px solid #c98f5b;box-shadow:inset 0 -9px 0 -3px #8f7048}
html body #first-tip:after{content:'';position:absolute;left:-14px;bottom:-22px;width:22px;height:22px;background:#fff1d4;border-left:4px solid #c98f5b;border-bottom:4px solid #c98f5b;border-radius:0 0 0 22px;transform:skewX(-22deg)}
html body #first-tip .tip-art{position:absolute!important;right:10px;top:-34px;width:52px!important;height:52px!important;margin:0!important}
html body #first-tip h2{font-size:15px!important;margin:0 0 4px!important;color:#9a6a3a!important}
html body #first-tip p{font-size:16px!important;font-weight:800!important;line-height:1.38!important;margin:0 0 8px!important}
html body #first-tip button{font:inherit!important;font-weight:800!important;border:2px solid #7a5634!important;background:#f3dfae!important;color:#5a3f26!important;border-radius:999px!important;padding:6px 16px!important;min-height:0!important;width:auto!important;float:right}
@keyframes storyPop{from{transform:translateX(-50%) scale(.8);opacity:0}to{transform:translateX(-50%) scale(1);opacity:1}}@keyframes storyBounce{to{transform:translateY(-6px) rotate(8deg)}}
@media (prefers-reduced-motion:reduce){#story-think,#story-big,#story-fx{animation:none}}`;document.head.append(style);
 let cur=null,line=0,typed=0,typing=false,lastT=0,thinkUntil=0,thinkQueue=[],cardOpen=false,quiet=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const react=(s,kind)=>{s.reaction={kind,at:s.time};fx.textContent=SYMBOL[kind]??'';};
 function showLine(){const text=cur.lines[line];typed=0;typing=!reduced;big.querySelector('p').textContent=reduced?text:'';fx.textContent=line===0?(SYMBOL[cur.react]??''):'';}
 function finish(s){if(cur){if(cur.tool)s.toolLessons?.shift();else markDialog(s,cur.id);onSave?.();}cur=null;big.hidden=true;think.hidden=true;thinkQueue=[];quiet=s.time+4;}
 function advance(s){if(!cur)return;if(cur.kind==='big'){if(typing){typing=false;big.querySelector('p').textContent=cur.lines[line];return;}if(++line>=cur.lines.length){finish(s);return;}showLine();}}
 big.addEventListener('click',e=>{const s=getState();if(e.target.closest('#story-skip')){finish(s);return;}advance(s);});
 card.addEventListener('click',e=>{if(e.target.closest('#story-card-ok')){card.hidden=true;cardOpen=false;onSave?.();}});
 const renderJournal=s=>{const got=storyState(s).notes;journal.querySelector('div').innerHTML=NOTES.filter(n=>got.includes(n.id)).map(n=>`<article><h4>${n.title}</h4><p>${n.text}</p></article>`).join('')||'<p>Noch keine Fundstücke.</p>';};
 jbtn.addEventListener('click',()=>{renderJournal(getState());journal.hidden=false;});$('#story-journal-x').addEventListener('click',()=>{journal.hidden=true;});
 return {
  isOpen:()=>Boolean((cur&&cur.kind==='big')||cardOpen||!journal.hidden),
  // Jakob 7.11.: Kamera nur zu Zielen im selben Raum (drinnen/draußen), sonst flog sie ins Leere.
  focus(){const s=getState(),f=cur?.kind==='big'?cur.focus?.(s):null;return f&&homeRegion(f.x,f.z)===inHome(s)&&!s.nursery?.interior?{x:f.x,z:f.z,zoom:1.1}:null;},
  update(s,dt,tipsOpen){updateIntro(s);jbtn.hidden=true;
   if(cardOpen||!journal.hidden)return;
   if(cur?.kind==='big'&&typing){typed+=dt*34;const t=cur.lines[line];{const before=Math.floor(typed-dt*34),now=Math.floor(typed);for(let k=Math.max(0,before);k<now&&k<t.length;k+=2){const ch=t[k];if(/[a-zäöüß]/i.test(ch))document.dispatchEvent(new CustomEvent('story-babble',{detail:ch}));}}big.querySelector('p').textContent=t.slice(0,Math.floor(typed));if(typed>=t.length)typing=false;}
   if(cur?.kind==='think'){if(s.time>=thinkUntil){if(++line>=cur.lines.length)finish(s);else{think.textContent=cur.lines[line];thinkUntil=s.time+3.4;}}return;}
   if(cur)return;
   // Sperren-Hinweise: Gedankenblase, solange man davor steht (nicht gespeichert, kommt bei jedem Besuch wieder).
   if(s.routeHint){if(think.dataset.hint!==s.routeHint){think.dataset.hint=s.routeHint;think.textContent=s.routeHint;}think.hidden=false;}else if(think.dataset.hint){think.dataset.hint='';think.hidden=true;}
   if(tipsOpen||s.time<quiet)return;
   /* Jakob 7.11.: Bauteile hebt man per Knopf auf, Notizen weiter im Vorbeigehen */const n=nearNote(s);relicBtn.hidden=!n?.relic;if(n?.relic&&!relicWanted)return;relicWanted=false;if(n){const found=collectNote(s,n.id);if(found){if(found.relic)giveRelic(s,found.relic);card.querySelector('h3').textContent=found.title;card.querySelector('p').textContent='„'+found.text+'“';card.hidden=false;cardOpen=true;react(s,'curious');onSave?.();return;}}
   const tool=s.toolLessons?.[0],d=tool?{id:'tool:'+tool,kind:'big',react:'excited',lines:TOOL_LINES[tool]??['Ein neuer Sauger! ♪'],tool:true}:nextDialog(s);if(!d)return;cur=d;line=0;react(s,d.react);
   if(d.kind==='big'){big.hidden=false;showLine();}else{think.hidden=false;think.textContent=d.lines[0];thinkUntil=s.time+3.4;}}
 };
}
