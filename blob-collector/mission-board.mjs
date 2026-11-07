import * as T from './vendor/three.module.js';
import {sunnyHeight} from './sunny-area.mjs';
import {boardMissions,missionProgress,claimMission,readyCount} from './missions.mjs';
import {formatCoins} from './game-balance.mjs';
// Pinnwand vor dem Haus links der Veranda (Jakob 3.11.): eigenes Brett auf zwei Pfosten, Zettel mit Aufgaben, Münzen beim Einlösen.
// An der Hauswand selbst verschwand es unter dem Vordach.
export const BOARD={x:-14.2,z:-8.2,reach:2};
const fmt=n=>n>=1000?n.toLocaleString('de-DE'):String(n);
export function bindMissionBoard({scene,getState,onSave}){
 const root=new T.Group(),y=sunnyHeight(BOARD.x,BOARD.z);root.position.set(BOARD.x,y,BOARD.z);scene.add(root);
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.9});
 for(const px of [-.66,.66]){const post=new T.Mesh(new T.BoxGeometry(.1,2.15,.1),mat('#6e4f33'));post.position.set(px,1.07,0);root.add(post);}
 const frame=new T.Mesh(new T.BoxGeometry(1.5,1.05,.08),mat('#7a5634'));frame.position.set(0,1.55,.05);root.add(frame);
 const cork=new T.Mesh(new T.BoxGeometry(1.34,.89,.04),mat('#c79a62'));cork.position.set(0,1.55,.1);root.add(cork);
 const roof=new T.Mesh(new T.BoxGeometry(1.7,.08,.26),mat('#5f4128'));roof.position.set(0,2.12,.14);roof.rotation.x=-.25;root.add(roof);
 const notes=[];const paper=['#fff6dc','#f6e7b8','#e9f2d6','#f8dcd2','#dbe9f4'];
 for(let i=0;i<5;i++){const n=new T.Mesh(new T.BoxGeometry(.32,.26,.012),mat(paper[i]));n.position.set(-.44+(i%3)*.44+(i>2?.22:0),1.74-(i>2?.36:0),.125);n.rotation.z=(i%2?1:-1)*.07;root.add(n);const pin=new T.Mesh(new T.SphereGeometry(.028,8,6),mat(i%2?'#d0473a':'#3f7fc4'));pin.position.set(n.position.x,n.position.y+.09,.14);root.add(pin);notes.push([n,pin]);}
 const glow=new T.Mesh(new T.SphereGeometry(.06,10,8),new T.MeshBasicMaterial({color:'#ffd65a'}));glow.position.set(.62,2.02,.16);root.add(glow);
 const game=document.getElementById('game'),btn=document.createElement('button');btn.id='mission-board-btn';btn.type='button';btn.hidden=true;btn.setAttribute('aria-label','Pinnwand ansehen');btn.innerHTML='<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="10" width="48" height="40" rx="4" fill="#c79a62" stroke="#7a5634" stroke-width="3"/><rect x="14" y="16" width="16" height="13" fill="#fff6dc"/><rect x="34" y="18" width="16" height="13" fill="#e9f2d6"/><rect x="22" y="33" width="16" height="12" fill="#f8dcd2"/><circle cx="22" cy="16" r="2.6" fill="#d0473a"/><circle cx="42" cy="18" r="2.6" fill="#3f7fc4"/><circle cx="30" cy="33" r="2.6" fill="#d0473a"/></svg><b></b>';game.append(btn);
 const sheet=document.createElement('section');sheet.id='mission-sheet';sheet.hidden=true;sheet.setAttribute('role','dialog');game.append(sheet);
 const render=()=>{const s=getState(),list=boardMissions(s);sheet.innerHTML=`<header><div class="mission-sign"><i>🍂</i><strong>Aufgaben</strong><i>🍂</i></div><small>Erledige sie und hol dir Münzen</small><button id="mission-close" aria-label="Schließen">×</button></header><div class="mission-notes">${list.map((m,i)=>{const p=missionProgress(s,m),done=p>=m.goal;return `<article class="mission-note n${i}${done?' done':''}"><i class="pin"></i><strong>${m.title}</strong><div class="mission-bar"><i style="width:${Math.round(p/m.goal*100)}%"></i></div><small>${fmt(Math.floor(p))} / ${fmt(m.goal)}</small>${done?`<button data-claim="${m.id}">+${fmt(m.reward)} ◉ einlösen</button>`:`<em>Belohnung ${fmt(m.reward)} ◉</em>`}</article>`;}).join('')||'<p class="mission-empty">Alles erledigt! Bald gibt es neue Zettel.</p>'}</div>`;};
 let key='';const open=()=>{key='';render();sheet.hidden=false;};btn.addEventListener('click',open);
 sheet.addEventListener('click',e=>{if(e.target.closest('#mission-close')){sheet.hidden=true;return;}const c=e.target.closest('[data-claim]');if(c){const s=getState();if(claimMission(s,c.dataset.claim)){onSave?.();render();}}});
 return {update(){const s=getState(),outside=s.area==='sunny'&&!s.home?.interior&&!s.nursery?.interior&&!s.cave?.interior&&!s.testWorld?.enabled;root.visible=outside;const list=boardMissions(s),ready=readyCount(s);notes.forEach(([n,p],i)=>{n.visible=p.visible=i<list.length;});glow.visible=ready>0;if(ready)glow.scale.setScalar(1+Math.sin(s.time*4)*.25);
  const near=outside&&Math.hypot(s.player.x-BOARD.x,s.player.z-(BOARD.z+1))<BOARD.reach,other=!document.getElementById('world-interact')?.hidden||!document.getElementById('pet-blob')?.hidden;btn.hidden=!near||other;btn.querySelector('b').textContent=ready?String(ready):'';btn.classList.toggle('ready',ready>0);
  if(!near&&!sheet.hidden)sheet.hidden=true;if(!sheet.hidden){const k=JSON.stringify(list.map(m=>[m.id,Math.floor(missionProgress(s,m))]));if(k!==key){key=k;render();}}}};
}
