import {vacuumContains} from './vacuums.mjs';
import {addMaterial,capacityFor,suctionCount} from './inventory.mjs';
import {woodlandAt} from './woodland-regions.mjs';
import {coastRegion} from './coast-area.mjs';
import {iceRegion} from './ice-area.mjs';
import {volcanoRegion} from './volcano-area.mjs';
import {sunnyInside,sunnyHeight} from './sunny-area.mjs';
import {painter,tint} from './painted-icons.mjs';
import {lakeRadius} from './lake-area.mjs';
import {woodlandStream} from './woodland-regions.mjs';
import {icePondRadius} from './ice-area.mjs';
import {daylightAt} from './daylight.mjs';
// Schmetterlinge (Jakob 1.11., Testwerte): vorher unsichtbar, flattern hoch, wenn man vorbeiläuft, und fliegen schnell hin und her.
// catch = Sekunden im Saugstrahl, speed = Tempo, life = Sekunden bis er wegfliegt, weight = Häufigkeit im Gebiet.
const AREA_NAMES={sunny:'Lichtung',steinbach:'Steinbach',mooswald:'Mooswald',pilzhain:'Pilzhain',coast:'Küste',ice:'Eistal',volcano:'Vulkan'};
// Schwierigkeit 1 leicht, 2 mittel, 3–4 schwer: Tempo, Richtungswechsel, Flugweite und Flucht nehmen zu. Testwerte.
const TIERS={1:{catch:.55,speed:1.05,turn:1.9,roam:.5,life:34},2:{catch:.85,speed:1.7,turn:1.3,roam:.75,life:28},3:{catch:1.25,speed:2.55,turn:.95,roam:1,life:22,flee:1.4},4:{catch:1.6,speed:3.1,turn:.8,roam:1.1,life:18,flee:1.7}};
const b=(name,area,wing,wing2,mark,pattern,difficulty,weight,extra={})=>({name,area,areaName:AREA_NAMES[area],wing,wing2,mark,pattern,difficulty,weight,...TIERS[difficulty],coins:difficulty*difficulty*2,...extra});
const NIGHT={night:true},WATER={water:true,dragon:true};
export const BUTTERFLIES={
 zitronenfalter:b('Zitronenfalter','sunny','#f7e26b','#fff6b4','#e39a2d','dots',1,6),
 pfauenauge:b('Tagpfauenauge','sunny','#c9503a','#e8804e','#27304a','eyes',2,3),
 bachblau:b('Bachbläuling','steinbach','#6fb7e8','#bfe6fb','#21476e','bands',2,5),
 silberstrich:b('Silberstrich','steinbach','#c0ccd6','#f3f7fa','#5a6d7c','stripes',3,2),
 moosfalter:b('Moosfalter','mooswald','#7fbf6a','#c8e6a0','#2f5a2c','veins',2,5),
 smaragd:b('Smaragdschwinge','mooswald','#2fae8e','#8fe6c8','#0f3f3a','eyes',4,1),
 pilzfalter:b('Pilzfalter','pilzhain','#a77be0','#e0c8f6','#4a2a78','dots',3,5),
 nachtauge:b('Nachtauge','pilzhain','#3a2f6a','#7a62c8','#ffd978','eyes',4,1),
 muschelfalter:b('Muschelfalter','coast','#f6c3a8','#fff0e0','#c26a55','scallop',2,5),
 meerblau:b('Meerblau','coast','#2fb4c4','#a4ecec','#0f4a66','bands',3,2),
 frostfalter:b('Frostfalter','ice','#dff2fb','#ffffff','#6fa8d0','crystal',3,5),
 schneefunke:b('Schneefunke','ice','#a9d8ef','#f6fcff','#3f7fb0','stripes',4,1),
 glutfalter:b('Glutfalter','volcano','#ee6a2a','#ffc04a','#2a1a16','flame',3,5),
 aschenschwinge:b('Aschenschwinge','volcano','#3a3232','#6a5c58','#ff8a2e','veins',4,2),
 kohlweissling:b('Kohlweißling','sunny','#fbfbf2','#ffffff','#5a5a5a','dots',1,7),
 mondspinner:b('Mondspinner','sunny','#b9c7e8','#e8eeff','#3d4a7a','eyes',3,4,NIGHT),
 bachweissling:b('Bachweißling','steinbach','#f6f8f0','#e8f3ff','#7a9cb8','veins',1,6),
 blaulibelle:b('Blaue Libelle','steinbach','#3f8fd8','#bfe6fb','#123a66','dragon',2,4,WATER),
 brettspiel:b('Waldbrettspiel','mooswald','#a7865a','#e6d3a8','#4a3520','dots',1,6),
 smaragdlibelle:b('Smaragdlibelle','mooswald','#2fa87a','#bfeedd','#0f4a3a','dragon',3,3,WATER),
 glimmfalter:b('Glimmfalter','mooswald','#6a7fd0','#b6c8ff','#fff3a8','eyes',2,4,NIGHT),
 sporenfalter:b('Sporenfalter','pilzhain','#e8d6b8','#fff6e6','#9a6a4a','dots',1,6),
 pilzblaeuling:b('Pilzbläuling','pilzhain','#9db6f0','#d8e4ff','#3a4a8a','bands',2,4),
 duenenweissling:b('Dünenweißling','coast','#fff4dc','#ffffff','#c8a46a','scallop',1,6),
 salzlibelle:b('Salzlibelle','coast','#e88a5a','#ffe0c8','#7a3a1a','dragon',2,4,WATER),
 reiffalter:b('Reiffalter','ice','#eef6fb','#ffffff','#9ac0dc','crystal',1,6),
 eislibelle:b('Eislibelle','ice','#7fd0f0','#e8faff','#1f5a7a','dragon',2,3,WATER),
 aschenweissling:b('Aschenweißling','volcano','#d6cfc8','#f0ebe6','#5a4a44','veins',1,6),
 funkenfalter:b('Funkenfalter','volcano','#ff9a3a','#ffe08a','#3a1a10','flame',2,4,NIGHT)
};
BUTTERFLIES.nachtauge.night=true;
export function nearWater(x,z){return lakeRadius(x,z)<1.7||(woodlandStream(x,z)?.distance??99)<5||(coastRegion(x,z)&&x>60)||(iceRegion(x,z)&&icePondRadius(x,z)<1.35);}
// Einzelner Flügel (rechte Seite, Gelenk bei x=0), damit die 3D-Figur zwei Flächen falten kann. inline: für Texturen.
export function wingBody(P,a){
 const UP='M2 34C4 16 16 6 40 3c14-1 21 4 20 12-1 8-6 13-14 17-14 6-30 6-44 2z',LO='M2 37c12 4 26 5 36 2 8 3 9 9 6 15-1 4-5 3-7 7-4 4-8 1-12 3-12-3-20-14-23-27z',upper=P.s(UP,a.wing,.6),lower=P.s(LO,a.wing2,.6);let m='';const c=a.mark;
 if(a.pattern==='dots')m=[[40,14,3],[50,18,2.4],[30,20,2.4],[26,48,2.4]].map(([x,y,r])=>P.dot(x,y,r,c)).join('');
 if(a.pattern==='eyes')m=P.e(40,18,8.5,8.5,tint(a.wing2,.2),1)+P.e(40,18,5,5,c,.8)+P.dot(39,17,1.6,'#ffffff')+P.e(26,48,5,5,tint(a.wing2,.2),.9)+P.dot(26,48,2.4,c);
 if(a.pattern==='bands')m=P.l('M20 10q10 12 4 26M36 6q10 12 6 28M12 42q10 10 22 12',c,3,.85);
 if(a.pattern==='stripes')m=P.l('M6 30q24-20 50-14M6 34q26-10 50-8M8 42q14 8 26 6',c,2,.8);
 if(a.pattern==='veins')m=P.l('M4 34Q26 22 56 12M4 34Q24 30 52 26M4 36q14 10 34 16M4 36q10 14 20 22',c,1.6,.85);
 if(a.pattern==='scallop')m=[8,16,24,32,40].map((y,i)=>P.l(`M${58-i*2} ${y}q-5 3-10 0`,c,2,.9)).join('')+P.l('M34 52q-6 3-10 0',c,2,.9);
 if(a.pattern==='crystal')m=[[38,16],[24,22],[28,48]].map(([x,y])=>P.l(`M${x-6} ${y}h12M${x-3} ${y-5}l6 10M${x+3} ${y-5}l-6 10`,c,1.4,.9)).join('');
 if(a.pattern==='flame')m=P.s('M4 34Q16 16 22 8q2 10 12 4-4 10 8 12-12 6-38 10z',c,.8)+P.s('M6 38q12 2 24 6-6 8-14 8z',c,.8);
 return lower+upper+m+P.l(UP,c,2.2,.92)+P.l(LO,c,2,.92)+P.l('M4 34Q20 20 44 8M4 34Q24 26 52 18M4 36q14 7 34 14',tint(a.wing,-.35),.8,.5)+[[50,7],[56,12],[56,20],[48,27],[38,32],[40,48],[36,57],[28,60]].map(([x,y])=>P.dot(x,y,1.25,'#fff8e0',.95)).join('')+P.g('M12 22Q24 10 38 8',2,.45);
}
export function wingSVG(id){const a=BUTTERFLIES[id],{P,done}=painter('bfw-'+id,{inline:true});return `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 64 64">${done(wingBody(P,a))}</svg>`;}
const dragonSVG=(a,attrs)=>`<svg ${attrs} viewBox="-68 -4 136 72">${[[-1,20,-8],[1,20,8],[-1,30,-14],[1,30,14]].map(([k,y,r])=>`<ellipse cx="${k*30}" cy="${y}" rx="30" ry="6.5" transform="rotate(${r} 0 ${y})" fill="${a.wing2}" fill-opacity=".55" stroke="${a.wing}" stroke-width="1.3"/>`).join('')}<rect x="-3.2" y="14" width="6.4" height="48" rx="3.2" fill="${a.wing}"/>${[24,32,40,48,56].map(y=>`<rect x="-3.2" y="${y}" width="6.4" height="1.6" fill="${a.mark}" opacity=".7"/>`).join('')}<circle cx="-4.5" cy="11" r="4.6" fill="${a.mark}"/><circle cx="4.5" cy="11" r="4.6" fill="${a.mark}"/><circle cx="-3.2" cy="9.6" r="1.3" fill="#fff"/><circle cx="5.8" cy="9.6" r="1.3" fill="#fff"/></svg>`;
export function butterflyArtwork(id){const a=BUTTERFLIES[id];if(!a)return '';if(a.dragon)return dragonSVG(a,'aria-hidden="true"');const {P,done}=painter('bfa-'+id),w=wingBody(P,a),{P:Q,done:d2}=painter('bfb-'+id),w2=wingBody(Q,a);return `<svg viewBox="-68 -4 136 72" aria-hidden="true">${done(w)}<g transform="scale(-1 1)">${d2(w2)}</g><ellipse cx="0" cy="34" rx="2.6" ry="15" fill="#3a2c28"/><circle cx="0" cy="18" r="3" fill="#3a2c28"/><path d="M0 16q-3-9-9-11M0 16q3-9 9-11" fill="none" stroke="#3a2c28" stroke-width="1.5" stroke-linecap="round"/></svg>`;}
export function butterflyArea(x,z){if(volcanoRegion(x,z))return 'volcano';if(iceRegion(x,z))return 'ice';if(coastRegion(x,z)&&x>45)return 'coast';return woodlandAt(x,z)?.id??'sunny';}
export const BUTTERFLY_RULES={wait:[100,240],decay:.35,height:[.75,1.9],radius:5};
const roll=(a,c)=>a+Math.random()*(c-a);
export function startButterfly(s,id=null){const p=s.player,area=butterflyArea(p.x,p.z),night=daylightAt(s.time+(s.daylightOffset??0)).night>.6,water=nearWater(p.x,p.z),list=Object.entries(BUTTERFLIES).filter(([k,a])=>a.area===area&&(k===id||(!a.night||night)&&(!a.water||water))).map(([k,a])=>[k,{...a,weight:a.weight*(night&&!a.night?.35:1)*(a.water?2:1)}]);if(!list.length)return null;let kind=id;if(!kind){let n=Math.random()*list.reduce((v,[,a])=>v+a.weight,0);kind=list.find(([,a])=>(n-=a.weight)<=0)?.[0]??list[0][0];}const a=Math.random()*Math.PI*2,x=p.x+Math.sin(p.angle+(a-3.14)*.4)*1.8,z=p.z+Math.cos(p.angle+(a-3.14)*.4)*1.8;if(!sunnyInside(x,z))return null;const g=sunnyHeight(x,z);s.butterfly={id:kind,x,z,y:g+.05,ground:g,homeX:x,homeZ:z,tx:x,tz:z,ty:g+1.2,turn:0,age:0,progress:0,status:'rising',angle:a};return s.butterfly;}
export function advanceButterflies(s,mode,active,dt){if(s.area!=='sunny'||s.testWorld?.enabled||s.roundActive===false||s.home?.interior||s.nursery?.interior||s.cave?.interior)return;const p=s.player;s.butterflies??={book:{}};let f=s.butterfly;
 if(!f){if(p.moving){s.butterflyWait=(s.butterflyWait??roll(50,140))-dt;if(s.butterflyWait<=0){s.butterflyWait=roll(...BUTTERFLY_RULES.wait);startButterfly(s);}}return;}
 const a=BUTTERFLIES[f.id];f.age+=dt;
 if(f.status==='caught'){f.t=(f.t??0)+dt;const k=Math.min(1,f.t/.45);f.x+=(p.x-f.x)*k*.4;f.z+=(p.z-f.z)*k*.4;f.y+=((p.y??0)+.6-f.y)*k*.4;if(f.t>=.45)s.butterfly=null;return;}
 if(f.status==='leaving'){f.y+=dt*3.2;f.x+=Math.sin(f.angle)*dt*a.speed;f.z+=Math.cos(f.angle)*dt*a.speed;f.t=(f.t??0)+dt;if(f.t>1.8)s.butterfly=null;return;}
 if(f.age>=a.life||Math.hypot(f.x-p.x,f.z-p.z)>16){f.status='leaving';f.t=0;return;}
 f.turn-=dt;if(f.turn<=0){f.turn=roll(.2,.62)*a.turn;const ang=Math.random()*Math.PI*2,r=roll(1.2,BUTTERFLY_RULES.radius*a.roam),cx=(f.homeX*.55+p.x*.45),cz=(f.homeZ*.55+p.z*.45);f.tx=cx+Math.sin(ang)*r;f.tz=cz+Math.cos(ang)*r;f.ty=f.ground+roll(...BUTTERFLY_RULES.height);if(!sunnyInside(f.tx,f.tz)){f.tx=f.x;f.tz=f.z;}}
 const dx=f.tx-f.x,dz=f.tz-f.z,d=Math.hypot(dx,dz)||1,step=Math.min(d,a.speed*dt*(f.progress>0?(a.flee??.85):1));f.x+=dx/d*step+Math.sin(f.age*23)*dt*.5;f.z+=dz/d*step+Math.cos(f.age*19)*dt*.5;f.ground=sunnyHeight(f.x,f.z);f.y+=(f.ty+Math.sin(f.age*14)*.14-f.y)*Math.min(1,dt*6);f.angle=Math.atan2(dx,dz);if(f.status==='rising'&&f.age>.5)f.status='flying';
 /* Jakob 7.11.: der Bodensauger erwischt keine Schmetterlinge */const hit=active&&mode.id!=='ground'&&vacuumContains(p,{x:f.x,y:p.y??0,z:f.z},mode);if(hit&&a.flee&&!f.hit){const d0=Math.hypot(f.x-p.x,f.z-p.z)||1;f.tx=f.x+(f.x-p.x)/d0*3.2;f.tz=f.z+(f.z-p.z)/d0*3.2;if(!sunnyInside(f.tx,f.tz)){f.tx=f.x;f.tz=f.z;}f.turn=.55;}f.hit=hit;f.progress=hit?Math.min(1,f.progress+dt/a.catch):Math.max(0,f.progress-dt*BUTTERFLY_RULES.decay);
 if(f.progress>=1){f.status='caught';f.t=0;const cap=capacityFor(mode);if(suctionCount(s)>=cap){f.progress=0;f.status='leaving';f.t=0;return;}addMaterial(s,'bf_'+f.id,1,'bag',cap);const e=s.butterflies.book[f.id]??={caught:0},isNew=!e.caught;e.caught++;s.catchCard={kind:'butterfly',id:f.id,isNew,coins:0,at:s.time};s.events?.push('caught');}
}
export const butterflySnapshot=s=>s.butterflies?.book??{};
export function restoreButterflies(s,data){s.butterflies={book:{}};for(const id of Object.keys(BUTTERFLIES))if(data?.[id])s.butterflies.book[id]={caught:Math.max(0,Math.floor(Number(data[id].caught)||0))};}

export function butterflyImage(id){if(BUTTERFLIES[id]?.dragon)return dragonSVG(BUTTERFLIES[id],'xmlns="http://www.w3.org/2000/svg" width="272" height="144"');const a=BUTTERFLIES[id],{P,done}=painter('bfi-'+id,{inline:true}),{P:Q,done:d2}=painter('bfj-'+id,{inline:true});return `<svg xmlns="http://www.w3.org/2000/svg" width="272" height="144" viewBox="-68 -4 136 72">${done(wingBody(P,a))}<g transform="scale(-1 1)">${d2(wingBody(Q,a))}</g><ellipse cx="0" cy="34" rx="2.6" ry="15" fill="#3a2c28"/><circle cx="0" cy="18" r="3" fill="#3a2c28"/></svg>`;}
