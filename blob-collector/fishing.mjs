import {daylightAt} from './daylight.mjs';
import {GAME_BALANCE,roundCoins} from './game-balance.mjs';
import {suctionCount,suctionAmount} from './inventory.mjs';
import {gearEffects} from './equipment.mjs';
import {vacuumContains} from './vacuums.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import {addMaterial,removeMaterial,capacityFor,reservedBagSlots} from './inventory.mjs';
import {BUTTERFLIES} from './butterflies.mjs';
import {coastShore,coastRiver,COAST} from './coast-area.mjs';
import {woodlandStream,woodlandHeight} from './woodland-regions.mjs';
import {LAKE} from './lake-area.mjs';
// Provisional, data-driven encounter values. Difficulty comes from trajectories.
export const FISH_RULES={captureSeconds:1.35,captureAnimation:.85,decay:.22,warning:1.7,interval:[75,150],baitDelay:[3,6]};
export const FISH={
 sternsaibling:{name:'Sternsaibling',water:'river',color:'#748b9d',accent:'#e0cf9a',pattern:'double',difficulty:4,value:180,weight:3,seconds:3.4,nightOnly:true,body:'trout'},
 nachtwels:{name:'Nachtwels',water:'lake',color:'#69776e',accent:'#c4c5a3',pattern:'high',difficulty:4,value:220,weight:3,seconds:3.1,nightOnly:true,body:'catfish'},
 mondmakrele:{name:'Mondmakrele',water:'sea',color:'#739cad',accent:'#dce1cc',pattern:'wide',difficulty:4,value:200,weight:3,seconds:3,nightOnly:true,body:'mackerel'},
 bernsteinkarpfen:{name:'Bernsteinkarpfen',water:'lake',color:'#b99b5e',accent:'#e2c68c',pattern:'arc',difficulty:3,value:140,weight:4,seconds:2.9,body:'carp'},
 bachflosse:{name:'Bachflosse',water:'river',color:'#87c7db',accent:'#e3f7df',pattern:'high',difficulty:1,value:20,weight:60,seconds:2.8},
 moosforelle:{name:'Moosforelle',water:'river',color:'#8db58a',accent:'#f3d6a3',pattern:'arc',difficulty:2,value:45,weight:25,seconds:2.5},
 goldschuppe:{name:'Goldschuppe',water:'river',color:'#f0c15e',accent:'#fff2bc',pattern:'double',difficulty:3,value:100,weight:12,seconds:3.2},
 sonnenfisch:{name:'Sonnenfisch',water:'sea',color:'#f5bd6c',accent:'#fff1c3',pattern:'arc',difficulty:1,value:20,weight:60,seconds:2.8},
 wellenflosse:{name:'Wellenflosse',water:'sea',color:'#85bdde',accent:'#e9eefb',pattern:'wide',difficulty:2,value:45,weight:25,seconds:2.5},
 korallenhuepfer:{name:'Korallenhüpfer',water:'sea',color:'#eaa3b1',accent:'#f7e9d4',pattern:'zigzag',difficulty:3,value:100,weight:12,seconds:2.2},
 seebluemchen:{name:'Seeblümchen',water:'lake',color:'#c3b1df',accent:'#fff1cb',pattern:'high',difficulty:1,value:20,weight:60,seconds:2.8},
 teichbaeuschen:{name:'Teichbäuschen',water:'lake',color:'#a9cfa1',accent:'#f6d4b5',pattern:'arc',difficulty:2,value:45,weight:25,seconds:2.5},
 mondflosse:{name:'Mondflosse',water:'lake',color:'#a2cde1',accent:'#f7ecb9',pattern:'double',difficulty:3,value:100,weight:12,seconds:3.2},
 seerosenkuss:{name:'Seerosenkuss',water:'lake',color:'#e9aebf',accent:'#fff3c8',pattern:'zigzag',difficulty:4,value:160,weight:3,seconds:2.3},
 // Jakob 31.10.: neue Gewässer, Testwerte
 eisforelle:{name:'Eisforelle',water:'ice',color:'#a9d6ec',accent:'#f2fbff',pattern:'high',difficulty:2,value:70,weight:60,seconds:2.6,body:'trout'},
 frostbarsch:{name:'Frostbarsch',water:'ice',color:'#7fa6cc',accent:'#e4eefa',pattern:'arc',difficulty:3,value:130,weight:25,seconds:2.5,body:'carp'},
 kristallhecht:{name:'Kristallhecht',water:'ice',color:'#c9f2ff',accent:'#ffffff',pattern:'zigzag',difficulty:4,value:240,weight:8,seconds:2.3,body:'mackerel'},
 glutflosse:{name:'Glutflosse',water:'lava',color:'#e8703a',accent:'#ffd27a',pattern:'high',difficulty:2,value:90,weight:60,seconds:2.6,body:'trout'},
 magmakarpfen:{name:'Magmakarpfen',water:'lava',color:'#b5432a',accent:'#ffb34a',pattern:'double',difficulty:3,value:170,weight:25,seconds:3,body:'carp'},
 feuerwels:{name:'Feuerwels',water:'lava',color:'#4a2a24',accent:'#ff8a2e',pattern:'zigzag',difficulty:4,value:300,weight:8,seconds:2.3,body:'catfish'}
};
// Jakob 1.11.: mehr Abwechslung, alle etwas schwerer und dafür wertvoller. cm = Grundgröße, jump = Größe beim Sprung, tankSize = Größe im Aquarium.
Object.assign(FISH,{
 flussaal:{name:'Flussaal',water:'river',color:'#5f6b4f',accent:'#c9c39a',pattern:'zigzag',difficulty:3,value:150,weight:10,seconds:2.6,body:'eel',cm:70},
 flusskrebs:{name:'Flusskrebs',water:'river',color:'#a8553a',accent:'#e8b48a',pattern:'arc',difficulty:2,value:80,weight:18,seconds:2.6,body:'crab',cm:14,tankSize:.8},
 hecht:{name:'Hecht',water:'lake',color:'#6f8a5c',accent:'#dfe3b8',pattern:'wide',difficulty:3,value:170,weight:9,seconds:2.4,body:'pike',cm:75,jump:1.25},
 schildkroete:{name:'Teichschildkröte',water:'lake',color:'#5f8a5a',accent:'#d9c88a',pattern:'high',difficulty:2,value:90,weight:10,seconds:3,body:'turtle',cm:22},
 tintenfisch:{name:'Tintenfisch',water:'sea',color:'#c46a8a',accent:'#f2c8d4',pattern:'zigzag',difficulty:3,value:180,weight:10,seconds:2.4,body:'squid',cm:45},
 kugelfisch:{name:'Kugelfisch',water:'sea',color:'#e0b85a',accent:'#fff2cc',pattern:'high',difficulty:2,value:90,weight:16,seconds:2.8,body:'puffer',cm:20,tankSize:.8},
 rochen:{name:'Rochen',water:'sea',color:'#6d8aa0',accent:'#e6eef2',pattern:'wide',difficulty:3,value:170,weight:8,seconds:2.6,body:'ray',cm:90,jump:1.3},
 hai:{name:'Kleiner Hai',water:'sea',color:'#7f95a6',accent:'#eef3f5',pattern:'double',difficulty:5,value:600,weight:2,seconds:2.6,body:'shark',cm:160,jump:1.8,tankSize:1.15},
 eisqualle:{name:'Eisqualle',water:'ice',color:'#bfe6f8',accent:'#ffffff',pattern:'arc',difficulty:3,value:190,weight:18,seconds:2.8,body:'jelly',cm:30},
 lavaaal:{name:'Lavaaal',water:'lava',color:'#3a2420',accent:'#ff8a2e',pattern:'zigzag',difficulty:4,value:320,weight:10,seconds:2.3,body:'eel',cm:80}
});
for(const [id,body]of Object.entries({bachflosse:'trout',moosforelle:'trout',goldschuppe:'carp',sonnenfisch:'disc',wellenflosse:'mackerel',korallenhuepfer:'angel',seebluemchen:'disc',teichbaeuschen:'carp',mondflosse:'angel',seerosenkuss:'disc'}))FISH[id].body=body;
for(const f of Object.values(FISH))if(!f.cm)f.value=Math.round(f.value*[1,1.75,1.55,1.4,1.3][f.difficulty]);
// Schwerere Fische kündigen sich kürzer an.
export const fishWarning=e=>Math.max(.6,2.1-.36*(FISH[e?.species]?.difficulty??1));
const river=coastRiver(63);
export const FISH_SPOTS=[
 {id:'lake',water:'lake',x:LAKE.x,z:LAKE.z-1.8,y:LAKE.water,axis:0},
 {id:'lake-east',water:'lake',x:LAKE.x+3,z:LAKE.z+.2,y:LAKE.water,axis:Math.PI/2},
 {id:'brook',water:'river',x:woodlandStream(0,-55).center,z:-55,y:woodlandHeight(woodlandStream(0,-55).center,-55)-.16,axis:0},
 {id:'brook-fall',water:'river',x:woodlandStream(0,-41).center,z:-41,y:woodlandHeight(woodlandStream(0,-41).center,-41)-.16,axis:0},
 {id:'mouth',water:'river',x:63,z:river.z+river.half-.65,y:river.water,axis:0},
 {id:'beach',water:'sea',x:coastShore(-5)+.1,z:-5,y:COAST.sea,axis:Math.PI/2},
 {id:'sea-south',water:'sea',x:coastShore(18)+.1,z:18,y:COAST.sea,axis:Math.PI/2},
 {id:'icehole',water:'ice',x:43.5,z:-66,y:2.38,axis:0},
 {id:'lavasee',water:'lava',x:-38,z:71.8,y:4.7,axis:0}
];
// Jakob 7.11.: Lieblingsplätze. Jeder Fisch beißt an seinen Plätzen öfter (×3), anderswo seltener (×.4), kommen kann er aber
// überall in seinem Gewässer. Angelehnt an echte Vorbilder: Forellen und Saiblinge im sauerstoffreichen Wasser am Wasserfall
// und in der Strömung, Karpfen, Krebse und Hechte am krautigen Ufer, Welse und Rapfen im tiefen Wasser, Aale an der Mündung.
export const FISH_HABITAT={bachflosse:[],moosforelle:['fall','mitte'],goldschuppe:['rand'],sternsaibling:['fall'],flussaal:['muendung','rand'],flusskrebs:['rand'],
 seebluemchen:['rand'],teichbaeuschen:['rand'],mondflosse:['mitte'],seerosenkuss:['rand'],nachtwels:['mitte'],bernsteinkarpfen:['mitte'],hecht:['rand'],schildkroete:['rand'],
 sonnenfisch:['flach'],wellenflosse:['tief'],korallenhuepfer:['flach'],mondmakrele:['tief'],tintenfisch:['tief'],kugelfisch:['flach'],rochen:['flach'],hai:['tief'],
 glutflosse:['rand'],magmakarpfen:['mitte'],feuerwels:['mitte'],lavaaal:['rand']};
export const HABITAT_NAMES={mitte:'Mitte',rand:'Ufer',fall:'Wasserfall',muendung:'Mündung',flach:'Flachwasser',tief:'tiefes Wasser'};
const VOLCANO_LAKE={x:-35.5,z:76,rx:7,rz:4.8,y:4.7};
// Wasser an einer Stelle: Gewässer, Höhe und Platzart; null = kein Wasser zum Angeln.
export function waterPoint(x,z){
 const lake=Math.hypot((x-LAKE.x)/LAKE.rx,(z-LAKE.z)/LAKE.rz);if(lake<.92)return {water:'lake',y:LAKE.water,habitat:lake<.5?'mitte':'rand'};
 const st=woodlandStream(x,z);if(st&&st.distance<st.width*.9)return {water:'river',y:woodlandHeight(st.center,z)-.16,habitat:z>-44?'fall':st.distance<st.width*.4?'mitte':'rand'};
 if(x>56&&x<82){const r=coastRiver(x);if(Math.abs(z-r.z)<r.half*.9)return {water:'river',y:r.water,habitat:x<60.5?'fall':x>coastShore(z)-7?'muendung':Math.abs(z-r.z)<r.half*.4?'mitte':'rand'};}
 const shore=coastShore(z);if(x>shore+.1&&x<shore+16&&z>-40&&z<45)return {water:'sea',y:COAST.sea,habitat:x<shore+3.5?'flach':'tief'};
 const lava=Math.hypot((x-VOLCANO_LAKE.x)/VOLCANO_LAKE.rx,(z-VOLCANO_LAKE.z)/VOLCANO_LAKE.rz);if(lava<.92)return {water:'lava',y:VOLCANO_LAKE.y,habitat:lava<.5?'mitte':'rand'};
 return null;}
// Ort einer Begegnung: Wurde ein Köder gezielt geworfen, springt der Fisch dort (e.at), sonst an der Fangstelle.
export const encounterSpot=(e,spot=FISH_SPOTS.find(p=>p.id===e?.spot))=>spot&&e?.at?{...spot,x:e.at.x,z:e.at.z,y:e.at.y,habitat:e.at.habitat}:spot;
const spotHabitat=spot=>spot?.habitat??(spot.id==='brook-fall'?'fall':waterPoint(spot.x,spot.z)?.habitat);
const spotOpen=(s,spot)=>spot&&!(spot.water==='ice'&&!s.builtSites?.iceDrill);
export function createFishing(){return {seed:92417,book:{},serial:0,encounters:FISH_SPOTS.map((p,i)=>({spot:p.id,status:'idle',wait:35+i*19,progress:0}))};}
function roll(f){f.seed=(Math.imul(f.seed,1664525)+1013904223)>>>0;return f.seed/4294967296;}
// Jakob 6.11.: Köderarten. Wurm/Schmetterling locken schwerere Fische etwas an, seltene Würmer, Glitzerköder und seltene Schmetterlinge (Stufe 3–4) viel stärker.
// Flussstellen haben Lieblingsfische (spot.favor), es können aber überall alle Fische des Gewässers kommen.
export const baitBoost=b=>b==='glitter'?4:(b==='rare'||b==='rarefly')?3:b?1.5:1;
const flyKinds=s=>Object.keys(s.inventory.bag).filter(k=>k.startsWith('bf_')&&s.inventory.bag[k]>0);
export const baitCount=s=>(s.inventory.bag.worm??0)+(s.inventory.bag.rareworm??0)+(s.inventory.bag.glitterbait??0)+flyKinds(s).reduce((n,k)=>n+s.inventory.bag[k],0);
// Zielpunkt 5 m in Blickrichtung (Jakob 6.11.: Köder selbst zielen, es zählt nur Wasser = Fangstelle in Reichweite).
export const aimAhead=s=>({x:s.player.x+Math.sin(s.player.angle??0)*5,z:s.player.z+Math.cos(s.player.angle??0)*5});
// Wählt den Köder aus dem Tank: Glitzer, Wurm, seltener Wurm, sonst der billigste Schmetterling; prefer erzwingt eine Sorte (z. B. 'bf_pfauenauge').
export function pickBait(s,prefer=null){const bag=s.inventory.bag,flies=flyKinds(s).sort((a,b)=>(BUTTERFLIES[a.slice(3)]?.difficulty??1)-(BUTTERFLIES[b.slice(3)]?.difficulty??1));if(prefer&&(bag[prefer]??0)>0)return {item:prefer,kind:prefer.startsWith('bf_')?((BUTTERFLIES[prefer.slice(3)]?.difficulty??1)>=3?'rarefly':'fly'):prefer==='rareworm'?'rare':prefer==='glitterbait'?'glitter':true};if((bag.glitterbait??0)>0)return {item:'glitterbait',kind:'glitter'};if((bag.worm??0)>0)return {item:'worm',kind:true};if((bag.rareworm??0)>0)return {item:'rareworm',kind:'rare'};if(flies.length)return {item:flies[0],kind:(BUTTERFLIES[flies[0].slice(3)]?.difficulty??1)>=3?'rarefly':'fly'};return null;}
export function startFish(s,spotId,species=null,bait=false){const f=s.fishing??=createFishing(),spot=FISH_SPOTS.find(p=>p.id===spotId),e=f.encounters.find(e=>e.spot===spotId);if(!spot||!e||!['idle'].includes(e.status))return false;if(!spotOpen(s,spot))return false;const hab=e.at?.habitat??spotHabitat(spot);let id=species;if(!id){const table=Object.entries(FISH).filter(([,a])=>a.water===spot.water&&(!a.nightOnly||fishNight(s)));const boost=baitBoost(bait),w=([k,a])=>(a.difficulty>1?a.weight*(a.difficulty>=3&&boost>=3?boost*1.4:boost):a.weight)*(FISH_HABITAT[k]?.length?(FISH_HABITAT[k].includes(hab)?3:.4):1);let n=roll(f)*table.reduce((n,t)=>n+w(t),0);id=table.find(t=>(n-=w(t))<=0)?.[0]??table[0][0];}if(FISH[id]?.water!==spot.water||FISH[id]?.nightOnly&&!fishNight(s))return false;Object.assign(e,{id:++f.serial,species:id,status:'warning',age:0,progress:0,sign:roll(f)<.5?-1:1,wait:0,blueprint:!species&&BLUEPRINT_JUMP.waters.includes(spot.water)&&!s.crafting?.blueprints?.fishtrophy&&(s.round?.day??1)>=BLUEPRINT_JUMP.day&&roll(f)<BLUEPRINT_JUMP.chance});return true;}
// Jakob 3.11.: ab Tag 2 springt an Waldsee oder Fluss mit 7 % statt eines Fischs der Wandfisch-Bauplan heraus (Testwerte).
export const BLUEPRINT_JUMP={waters:['lake','river'],day:2,chance:.07};
// Jakob 3.11.: seitliches Wackeln je Schwierigkeit [Schwünge, Weite in m]; leichte Fische fast ruhig, schwere zackig.
const WOBBLE={1:[1.5,.06],2:[2.5,.16],3:[6,.45],4:[7,.62],5:[8,.7]};
export function fishPose(e,spot=encounterSpot(e)){
 const a=FISH[e.species];if(!a||!spot)return null;const t=Math.max(0,Math.min(1,e.age/a.seconds)),double=a.pattern==='double',phase=double?(t<.5?t*2:(t-.5)*2):t;
 const height=(a.pattern==='high'?2.05:1.45)*Math.sin(Math.PI*phase),side=((a.pattern==='wide'?2.4:a.pattern==='zigzag'?Math.sin(t*Math.PI*4)*.9:a.pattern==='high'?.2:1.1)*(t*2-1)+Math.sin(t*Math.PI*WOBBLE[a.difficulty][0])*WOBBLE[a.difficulty][1])*e.sign;
 return {x:spot.x+Math.cos(spot.axis)*side,z:spot.z-Math.sin(spot.axis)*side,y:spot.y+.16+height,angle:spot.axis+e.sign*Math.PI/2,tilt:Math.cos(phase*Math.PI)*.5,t};
}
export function nearbyFishSpot(s,radius=7){if(s.home?.interior||s.nursery?.interior)return null;return FISH_SPOTS.filter(p=>spotOpen(s,p)&&Math.hypot(s.player.x-p.x,s.player.z-p.z)<radius).sort((a,b)=>Math.hypot(s.player.x-a.x,s.player.z-a.z)-Math.hypot(s.player.x-b.x,s.player.z-b.z))[0]??null;}
// Zielen (Jakob 7.11.): Der Spieler zieht einen Zielpunkt aufs Wasser (bis THROW_RANGE m entfernt). Geworfen wird an genau diese Stelle;
// die Begegnung gehört zur nächsten Fangstelle desselben Gewässers. Ohne gültigen Zielpunkt: nächste Fangstelle wie früher.
export const THROW_RANGE=7.5;
export function aimTarget(s,aim){if(!aim)return null;const d=Math.hypot(aim.x-s.player.x,aim.z-s.player.z);if(d>THROW_RANGE)return null;
 const ice=FISH_SPOTS.find(p=>p.water==='ice'&&Math.hypot(aim.x-p.x,aim.z-p.z)<1.8);if(ice)return spotOpen(s,ice)?{spot:ice,at:null}:null;
 const w=waterPoint(aim.x,aim.z);if(!w)return null;const spot=FISH_SPOTS.filter(p=>p.water===w.water&&spotOpen(s,p)).sort((a,b)=>Math.hypot(aim.x-a.x,aim.z-a.z)-Math.hypot(aim.x-b.x,aim.z-b.z))[0];if(!spot||Math.hypot(aim.x-spot.x,aim.z-spot.z)>40)return null;return {spot,at:{x:aim.x,z:aim.z,y:w.y,habitat:w.habitat}};}
export function aimSpot(s,aim){return aimTarget(s,aim)?.spot??null;}
export function throwBait(s,spotId,prefer=null,aim=null){const target=aimTarget(s,aim);if(aim&&!target&&spotId===null)return false;if(target)spotId=target.spot.id;const bait=pickBait(s,prefer),spot=FISH_SPOTS.find(p=>p.id===spotId),e=s.fishing?.encounters.find(e=>e.spot===spotId);if(!bait)return false;
 if(!spot||!spotOpen(s,spot)||!e||s.testWorld.enabled||s.home?.interior||s.nursery?.interior||s.area!=='sunny'||e.status!=='idle'||e.bait||(!target&&Math.hypot(s.player.x-spot.x,s.player.z-spot.z)>7)||!removeMaterial(s,bait.item,1))return false;
 e.wait=FISH_RULES.baitDelay[0]+roll(s.fishing)*(FISH_RULES.baitDelay[1]-FISH_RULES.baitDelay[0]);e.bait=bait.kind;e.at=target?.at??null;const to=encounterSpot(e,spot);s.fishing.baitFlight={at:s.time,from:{x:s.player.x,y:(s.player.y??0)+.9,z:s.player.z},to:{x:to.x,y:to.y+.06,z:to.z}};return true;}
export function updateFishing(s,dt){if(s.area!=='sunny'||s.testWorld.enabled||s.roundActive===false)return;const f=s.fishing??=createFishing(),mode=effectiveVacuum(s);
 for(const e of f.encounters){const spot=FISH_SPOTS.find(p=>p.id===e.spot),place=encounterSpot(e,spot),near=Math.hypot(s.player.x-place.x,s.player.z-place.z)<13;
  if(!near){if(e.status!=='idle'||e.at){e.status='idle';e.wait=Math.max(e.wait,FISH_RULES.interval[0]);e.progress=0;e.at=null;e.bait=false;}continue;}
  if(e.status==='idle'){e.wait-=dt;if(e.wait<=0){startFish(s,e.spot,null,e.bait);e.bait=false;}continue;}
  if(e.status==='caught'){e.age+=dt;if(e.age>FISH_RULES.captureAnimation){e.status='idle';e.at=null;e.wait=FISH_RULES.interval[0]+roll(f)*(FISH_RULES.interval[1]-FISH_RULES.interval[0]);}continue;}
  e.age+=dt;if(e.status==='warning'){if(e.age>=fishWarning(e)){e.status='jumping';e.age=0;}continue;}
  const pose=fishPose(e),capacity=capacityFor(mode),room=capacity-suctionCount(s)-reservedBagSlots(s);
  const hit=room>=1&&s.suctionActive&&mode.id==='focus'&&vacuumContains(s.player,pose,mode);
  e.progress=Math.max(0,Math.min(1,e.progress+dt*(hit?1/(FISH_RULES.captureSeconds*gearEffects(s).fish):-FISH_RULES.decay)));
  if(e.progress>=1&&e.blueprint){(s.crafting.blueprints??={}).fishtrophy=true;s.catchCard={kind:'blueprint',id:'fishtrophy',at:s.time};e.status='caught';e.captureFrom=pose;e.age=0;s.events.push('blueprint');}
  else if(e.progress>=1){addMaterial(s,e.species,1,'bag',capacity);const b=f.book[e.species]??={caught:0,sold:0};b.caught++;recordCatch(s,f,e,b,capacity);e.status='caught';e.captureFrom=pose;e.age=0;s.events.push('fish');}
  else if(e.age>=FISH[e.species].seconds){e.status='idle';e.at=null;e.wait=FISH_RULES.interval[0]+roll(f)*(FISH_RULES.interval[1]-FISH_RULES.interval[0]);e.progress=0;}
 }
}
// Jakob 31.10.: Fischgröße als Rekord, manchmal ein Prachtfang (zwei Fische), volles Gewässer gibt eine Belohnung.
export const FISH_REWARDS={lake:{coins:150,accessory:'blossom'},river:{coins:150,accessory:'hairbow'},sea:{coins:200,accessory:'starfish'},ice:{coins:400,accessory:'beanie'},lava:{coins:500,accessory:'partyhat'}};
export const FISH_WATERS=[['lake','Waldsee'],['river','Fluss'],['sea','Meer'],['ice','Eisloch'],['lava','Lavasee']];
export const waterProgress=(f,water)=>{const list=Object.entries(FISH).filter(([,a])=>a.water===water);return {done:list.filter(([id])=>f?.book[id]?.caught>0).length,total:list.length};};
function recordCatch(s,f,e,b,capacity){const a=FISH[e.species],base=a.cm??(14+a.difficulty*11),ratio=.7+roll(f)*.6,size=Math.round(base*ratio),record=size>(b.best??0)&&(b.best??0)>0,isNew=b.caught===1,price=a.value*GAME_BALANCE.fishSaleMultiplier/GAME_BALANCE.saleDivisor,bonus=roundCoins(price*Math.max(0,ratio-.85)*1.6);e.size=size;b.best=Math.max(b.best??0,size);if(bonus>0)s.inventory.coins=roundCoins(s.inventory.coins+bonus);const prize=roll(f)<.12;s.catchCard={kind:'fish',id:e.species,size,value:price,bonus,isNew,record,prize,at:s.time};if(prize&&suctionCount(s)<capacity){addMaterial(s,e.species,1,'bag',capacity);b.caught++;b.prizes=(b.prizes??0)+1;}const p=waterProgress(f,a.water),r=FISH_REWARDS[a.water];if(r&&p.done===p.total&&!f.rewards?.[a.water]){(f.rewards??={})[a.water]=true;s.inventory.coins+=r.coins;if(s.forestBlobs)s.forestBlobs.accessoryInventory[r.accessory]=(s.forestBlobs.accessoryInventory[r.accessory]??0)+1;s.events.push('caught');}}
export function fishingSnapshot(s){return {rewards:s.fishing?.rewards??{},seed:s.fishing?.seed,book:s.fishing?.book??{},bait:(s.fishing?.encounters??[]).filter(e=>e.bait&&e.status==='idle').map(e=>({spot:e.spot,wait:e.wait,kind:e.bait,at:e.at??undefined}))};}
export function restoreFishing(s,data){s.fishing=createFishing();for(const b of Array.isArray(data?.bait)?data.bait:[]){const e=s.fishing.encounters.find(e=>e.spot===b.spot);if(e&&Number.isFinite(b.wait)&&b.wait>=0&&b.wait<=6){e.bait=['glitter','rare','fly','rarefly'].includes(b.kind)?b.kind:true;e.wait=b.wait;if(Number.isFinite(b.at?.x)&&Number.isFinite(b.at?.z)){const w=waterPoint(b.at.x,b.at.z);if(w)e.at={x:b.at.x,z:b.at.z,y:w.y,habitat:w.habitat};}}}if(Number.isSafeInteger(data?.seed))s.fishing.seed=data.seed>>>0;for(const id of Object.keys(FISH)){const b=data?.book?.[id];if(b)s.fishing.book[id]={caught:Math.max(0,Math.floor(Number(b.caught)||0)),sold:Math.max(0,Math.floor(Number(b.sold)||0)),best:Math.max(0,Math.floor(Number(b.best)||0))};}s.fishing.rewards={};for(const k of Object.keys(FISH_REWARDS))if(data?.rewards?.[k])s.fishing.rewards[k]=true;}


export function fishNight(s){return daylightAt(s.time+(s.daylightOffset??0)).night>=.7;}

// Jakob 3.11.: Fische fliegen etwas länger durch die Luft (×1,3).
for(const a of Object.values(FISH))a.seconds=Math.round(a.seconds*1.3*100)/100;
