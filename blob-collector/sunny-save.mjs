import {sitesSnapshot,restoreSites} from './build-sites.mjs';
import {storySnapshot,restoreStory} from './story-dialogs.mjs';
import {endgameSnapshot,restoreEndgame} from './endgame.mjs';
import {introSnapshot,restoreIntro} from './intro.mjs';
import {migrateCharger} from './charger-building.mjs';
import {missionSnapshot,restoreMissions} from './missions.mjs';
import {butterflySnapshot,restoreButterflies} from './butterflies.mjs';
import {iceDepositSnapshot,restoreIceDeposits} from './ice-mining.mjs';
import {aquariumSnapshot,restoreAquariums} from './aquarium.mjs';
import {batterySnapshot,restoreBatteryBank} from './battery-bank.mjs';
import {inCave,caveFloorAt} from './cave-space.mjs';
import {flowerItemKind} from './flower-config.mjs';
import {woodlandAt} from './woodland-regions.mjs';
import {restoreGoal} from './goals-ui.mjs';
import {goldenSnapshot,restoreGolden} from './golden-leaf.mjs';
import {restoreRound} from './rounds.mjs';
import {restoreEquipment} from './equipment.mjs';
import {createWorldWind} from './world-wind.mjs';
import {inNursery,nurseryRegion,enterNursery} from './nursery-space.mjs';
import {restoreOutputs} from './production-output.mjs';
import {restorePreferences} from './preferences.mjs';
import {roundCoins} from './game-balance.mjs';
import {capacityFor} from './inventory.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import {trailSnapshot,restoreTrails} from './trails.mjs';
import {factoryState,restoreFactory,ownsVacuum} from './factory.mjs';
import {HOME_ROOM} from './home-space.mjs';
import {CRAFT_RECIPES,FURNITURE,placeableType} from './crafting-config.mjs';
import {restorePlacements} from './placement.mjs';
import {restoreCrafting} from './crafting.mjs';
import {fishingSnapshot,restoreFishing} from './fishing.mjs';
import {restoreForestBlobs} from './forest-blobs.mjs';

import {rebuildLeafIndex,setVacuum} from './simulation.mjs';
import {SUNNY,sunnyHeight,sunnyInside,sunnyCollision} from './sunny-area.mjs';
import {walkable} from './test-world.mjs';
import {updateCharging} from './charging.mjs';
import {PRESS,recountStorage,advancePress} from './material-press.mjs';
export const count=n=>Number.isFinite(n)?Math.max(0,Math.min(1e12,Math.floor(n))):0;
function counts(value){const out={};if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))if(/^[a-z][a-z0-9]{0,30}$/.test(k)&&k!=='constructor')out[k]=count(v);return out;}
export function sunnySnapshot(s,now){
 const world=s.area==='sunny'?{area:'sunny',player:s.buildReturn?s.buildReturn.player:s.testWorld.enabled?SUNNY.spawn:{x:s.player.x,z:s.player.z,angle:s.player.angle},blobCaught:['caught','pulling'].includes(s.blob.status),total:s.total,home:s.buildReturn?.home??s.home,nursery:s.nursery,cave:s.cave,buriedProgress:s.obstacles.filter(o=>o.tool==='ground'&&!o.cleared&&o.progress>0).map(o=>[o.id,o.progress]),buriedInventory:s.buriedInventory,renewableGround:s.obstacles.filter(o=>o.renewable&&o.cleared).map(o=>[o.id,Math.max(0,o.respawnAt-s.time)]),buriedSpots:s.obstacles.filter(o=>o.homeX!=null&&(o.x!==o.homeX||o.z!==o.homeZ)).map(o=>[o.id,+o.x.toFixed(2),+o.z.toFixed(2)]),cleared:s.obstacles.filter(o=>o.cleared).map(o=>o.id),iceDeposits:iceDepositSnapshot(s),
  leaves:s.leaves.filter(l=>l.status==='gone'||l.status==='returning').map(l=>[l.id,l.status==='gone'?Math.max(0,l.respawnAt-s.time):1,l.respawnCycle]),
  aquariums:aquariumSnapshot(s),tipsSeen:s.tipsSeen,missions:missionSnapshot(s),sites:sitesSnapshot(s),story:storySnapshot(s),endgame:endgameSnapshot(s),intro:introSnapshot(s),butterflies:butterflySnapshot(s),
  sandLayers:(s.testWorld.enabled?s.sunnyResources:s.resources).filter(r=>r.sandCell&&r.sandLeft<20).map(r=>r.snowLayer?[r.id,r.sandLeft,r.sandMask,Math.max(0,Math.round(r.respawnAt-s.time)),Math.max(0,Math.round(s.time-(r.harvestAt??s.time)))]:[r.id,r.sandLeft,r.sandMask]),
  woodHomes:(s.testWorld.enabled?s.sunnyResources:s.resources).filter(r=>r.kind==='wood'&&r.generation>0).map(r=>[r.id,r.homeX,r.homeZ,r.generation]),stoneHomes:(s.testWorld.enabled?s.sunnyResources:s.resources).filter(r=>['stone','moss','mushroom'].includes(r.kind)&&r.generation>0).map(r=>[r.id,r.homeX,r.homeZ,r.generation]),wood:(s.testWorld.enabled?s.sunnyResources:s.resources).filter(r=>r.status==='gone'||r.status==='returning').map(r=>[r.id,r.status==='gone'?Math.max(0,r.respawnAt-s.time):1])}:null;
 return {batteryBank:batterySnapshot(s),goal:s.goal??null,golden:goldenSnapshot(s),toolLessons:s.toolLessons??[],round:s.round?{...s.round,elapsed:Math.max(0,s.time-s.round.startedAt)}:null,market:s.market??{stock:{}},buildings:s.buildings,equipment:s.equipment,worldWind:s.worldWind?{seed:s.worldWind.seed,next:Math.max(0,s.worldWind.next-s.worldWind.clock)}:null,preferences:s.preferences,trails:trailSnapshot(s),factory:factoryState(s),crafting:s.crafting??null,fishing:fishingSnapshot(s),placements:s.placements??{},forestBlobs:s.forestBlobs?{...s.forestBlobs,spawnIn:s.forestBlobs.nextSpawn-s.time}:null,savedAt:now,vacuumId:s.vacuumId,inventory:s.inventory,pending:s.deliveries.map(d=>d.items??{leaf:d.amount}),press:s.press??null,charging:s.charging??null,storageWithdrawHold:Boolean(s.storageWithdrawHold),world};
}
export function restoreSunny(s,data,now,trees){
 // Retired briquettes become essence one for one; old wood charges are refunded.
 data=JSON.parse(JSON.stringify(data));
 const migrateStock=stock=>{if(stock)for(const k of Object.keys(stock)){const target=flowerItemKind(k);if(target!==k){stock[target]=(stock[target]??0)+stock[k];delete stock[k];}}if(stock?.briquette){stock.essence=(stock.essence??0)+stock.briquette;delete stock.briquette;}};
 for(const stock of [data.inventory?.bag,data.inventory?.normalBag,data.inventory?.storage,data.market?.stock,data.press?.outputs,data.press?.buffers,data.press?.job?.ingredients,...(data.pending??[]),...Object.values(data.crafting?.workshops??{}).flatMap(w=>[w.buffers,w.outputs])])migrateStock(stock);
 const old=data.press;if(old?.preferred==='briquette')old.preferred='essence';
 if(old?.job?.recipe==='briquette'){old.buffers??={};old.buffers.wood=(old.buffers.wood??0)+(old.job.consumed??0);old.job=null;}if(old?.buffers?.wood){data.inventory??={};data.inventory.storage??={};data.inventory.storage.wood=(data.inventory.storage.wood??0)+old.buffers.wood;delete old.buffers.wood;}
 
 s.buildings=(data.version??0)<12?{press:true,nursery:true}:{press:data.buildings?.press===true,nursery:data.buildings?.nursery===true};restoreEquipment(s,data.equipment);restoreBatteryBank(s,data.batteryBank);s.worldWind=createWorldWind();s.worldWind.seed=Number.isSafeInteger(data.worldWind?.seed)?data.worldWind.seed:s.worldWind.seed;s.worldWind.next=Math.max(5,Math.min(240,Number(data.worldWind?.next)||150));restorePreferences(s,data.preferences);restoreTrails(s,data.trails);restoreFishing(s,data.fishing);restoreCrafting(s,data.crafting);s.home??={visits:0};s.home.interior=Boolean(data.world?.home?.interior);s.nursery={interior:Boolean(data.world?.nursery?.interior),visits:count(data.world?.nursery?.visits)};s.cave={interior:Boolean(data.world?.cave?.interior),room:data.world?.cave?.room==='core'?'core':'cave'};s.home.wardrobeVersion=data.world?.home?.wardrobeVersion===1?1:0;s.home.spaceVersion=1;s.home.furnishingVersion=data.world?.home?.furnishingVersion===1?1:0;
 restoreGoal(s,data.goal);restoreRound(s,data);s.toolLessons=(Array.isArray(data.toolLessons)?data.toolLessons:[]).filter(id=>['focus','fan','power','vortex'].includes(id));s.market={stock:counts(data.market?.stock),level:Math.max(0,Math.min(3,count(data.market?.level)))};if(typeof data.market?.wish?.kind==='string'&&Number.isInteger(data.market.wish.day))s.market.wish={day:data.market.wish.day,kind:data.market.wish.kind};restoreFactory(s,data.factory,data.version<8);
 setVacuum(s,data.vacuumId&&trees[data.vacuumId]&&ownsVacuum(s,data.vacuumId)?data.vacuumId:'ground');
 s.deliveries=[];s.unloadBatch=null;s.unloading=s.unloadPending=false;
 s.storageWithdrawHold=Boolean(data.storageWithdrawHold);
 if(s.press){s.press.job=null;s.press.job2=null;s.press.job3=null;s.press.second=null;s.press.third=null;s.press.lastOutput=null;s.press.buffers={leaf:0,wood:0};}
 if(data.inventory){for(const k of Object.keys(s.inventory.bag))s.inventory.bag[k]=0;for(const k of Object.keys(s.inventory.storage))s.inventory.storage[k]=0;}
 if(data.inventory){Object.assign(s.inventory.bag,counts(data.inventory.bag));Object.assign(s.inventory.storage,counts(data.inventory.storage));s.inventory.coins=roundCoins(Math.max(0,Number(data.inventory.coins)||0));s.inventory.sold=count(data.inventory.sold);s.inventory.saleTenths=Math.max(0,Math.min(9,count(data.inventory.saleTenths)));s.inventory.normalBag={};for(const [k,n]of Object.entries(counts(data.inventory.normalBag)))s.inventory.normalBag[k]=Math.min(n,s.inventory.bag[k]??0);if((data.version??0)<13){for(const k of new Set(['paper','briquette','sandstone','shelllime',...Object.values(CRAFT_RECIPES).filter(r=>!r.furniture&&!r.clothing).map(r=>r.output)]))if(s.inventory.bag[k]>0)s.inventory.normalBag[k]=s.inventory.bag[k];}s.inventory.suctionRecent=(Array.isArray(data.inventory.suctionRecent)?data.inventory.suctionRecent:[]).slice(-96).map(flowerItemKind).filter(k=>typeof k==='string'&&(s.inventory.bag[k]??0)>0);s.carried=Object.values(s.inventory.bag).reduce((a,b)=>a+b,0);}
 // In-flight items already left the saved bag. Settle them in the restored
 // snapshot exactly once; reopening never adds to the previous runtime state.
 if(Array.isArray(data.pending))for(const packet of data.pending)for(const [kind,n]of Object.entries(counts(packet)))s.inventory.storage[kind]=(s.inventory.storage[kind]??0)+n;
 let overflow=(data.version??0)<12?Math.max(0,s.carried-capacityFor(effectiveVacuum(s))):0;for(const kind of Object.keys(s.inventory.bag)){const n=Math.min(overflow,s.inventory.bag[kind]);if(!n)continue;s.inventory.bag[kind]-=n;s.inventory.storage[kind]=(s.inventory.storage[kind]??0)+n;s.carried-=n;overflow-=n;}for(const k of Object.keys(s.inventory.normalBag??{}))s.inventory.normalBag[k]=Math.min(s.inventory.normalBag[k],s.inventory.bag[k]??0);recountStorage(s);s.charging=null;const charge=data.charging;if(charge&&Number.isFinite(charge.startedAt)&&Number.isFinite(charge.endsAt)&&charge.endsAt>=charge.startedAt&&Number.isFinite(charge.from)&&charge.from>=0&&charge.from<=s.battery.max){s.charging={bankCells:Array.isArray(charge.bankCells)?s.batteryBank.cells.map((v,i)=>Math.max(0,Math.min(s.battery.max,Number(charge.bankCells[i])||0))):undefined,from:charge.from,startedAt:charge.startedAt,endsAt:charge.endsAt,ready:false};updateCharging(s,now);}
 if(s.forestBlobs){if(data.forestBlobs)restoreForestBlobs(s,data.forestBlobs,now);else if(data.world?.blobCaught)restoreForestBlobs(s,{roster:[{id:'b1',genes:{moss:1,wood:0},stage:1,location:'pack',adult:false}]},now);}
 if(s.press&&data.press){const p=data.press;for(const [id,spec]of Object.entries(PRESS.upgrades))s.press.upgrades[id]=Math.min(spec.values.length-1,count(p.upgrades?.[id]));s.press.serial=count(p.serial);s.press.outputs=restoreOutputs(p.outputs);s.press.outputSerial=count(p.outputSerial);s.press.buffers=counts(p.buffers);s.press.preferred=PRESS.recipes[p.preferred]?p.preferred:((data.version??0)<13?(p.job?.recipe??'paper'):null);
  if(s.press.preferred&&s.press.upgrades.parallel>0&&PRESS.recipes[p.second]&&p.second!==s.press.preferred)s.press.second=p.second;
  if(s.press.second&&s.press.upgrades.parallel>1&&PRESS.recipes[p.third]&&p.third!==s.press.preferred&&p.third!==s.press.second)s.press.third=p.third;
  const readJob=j=>{const r=PRESS.recipes[j?.recipe];if(r&&j.input===r.input&&Number.isSafeInteger(j.quantity)&&j.quantity>=1&&j.quantity<=5&&Number.isFinite(j.startedAt)&&Number.isFinite(j.endsAt)&&Number.isFinite(j.duration)&&j.duration>0&&j.duration<=3600000&&j.endsAt>=j.startedAt&&Number.isSafeInteger(j.consumed)&&j.consumed>0&&j.consumed<=r.cost*j.quantity)return {id:count(j.id),recipe:r.id,input:r.input,quantity:j.quantity,consumed:j.consumed,ingredients:j.ingredients?Object.fromEntries(Object.entries(counts(j.ingredients)).filter(([k])=>(r.kinds??(r.inputs?Object.keys(r.inputs):[r.input])).includes(k))):{[r.input]:j.consumed},startedAt:j.startedAt,endsAt:j.endsAt,duration:j.duration};return null;};s.press.job=readJob(p.job);if(s.press.job&&s.press.upgrades.parallel>0)s.press.job2=readJob(p.job2);if(s.press.job2&&s.press.upgrades.parallel>1)s.press.job3=readJob(p.job3);
  advancePress(s,now,false);
 }
 const placements={...data.placements};if((data.version??0)<15){if(s.buildings.press&&!placements.press)placements.press={...SUNNY.press,rotation:0};if(s.buildings.nursery&&!placements.nursery)placements.nursery={...SUNNY.blobStation,rotation:0};}s.freeBuildings=true;if((data.version??0)<7)for(const [id,p]of Object.entries(placements)){if(FURNITURE[placeableType(id)]&&Math.abs(p.x-SUNNY.home.x)<SUNNY.home.w/2-.2&&Math.abs(p.z-SUNNY.home.z)<SUNNY.home.d/2-.2)placements[id]={...p,x:HOME_ROOM.x+(p.x-SUNNY.home.x)*1.7,z:HOME_ROOM.z+(p.z-SUNNY.home.z)*1.6};}
 restorePlacements(s,placements);
 const w=data.world;if(s.area!=='sunny'||w?.area!=='sunny')return;
 s.total=count(w.total);s.home.visits=count(w.home?.visits);s.home.expansion=Math.min(2,count(w.home?.expansion));restoreAquariums(s,w.aquariums);restoreButterflies(s,w.butterflies);restoreMissions(s,w.missions);restoreSites(s,w.sites);restoreStory(s,w.story);restoreEndgame(s,w.endgame);restoreIntro(s,w.intro);migrateCharger(s);s.tipsSeen=Array.isArray(w.tipsSeen)?w.tipsSeen.filter(k=>typeof k==='string').slice(0,200):null;s.buriedInventory={};for(const [k,v]of Object.entries(w.buriedInventory??{}))if(/^[a-z]+$/.test(k))s.buriedInventory[k]={normal:count(v.normal),rare:count(v.rare)};
 for(const [id,progress]of Array.isArray(w.buriedProgress)?w.buriedProgress:[]){const o=s.obstacles.find(o=>o.id===id&&o.tool==='ground');if(o&&Number.isFinite(progress))o.progress=Math.max(0,Math.min(.999,progress));}
 for(const [id,x,z]of Array.isArray(w.buriedSpots)?w.buriedSpots:[]){const o=s.obstacles.find(o=>o.id===id);if(o&&Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x-o.x,z-o.z)<12){o.homeX??=o.x;o.homeZ??=o.z;o.x=x;o.z=z;o.y=sunnyHeight(x,z);}}
 for(const o of s.obstacles)if(w.cleared?.includes(o.id)){o.cleared=true;o.clearedAt=-100;if(o.renewable){const saved=(w.renewableGround??[]).find(a=>a[0]===o.id);o.respawnAt=s.time+Math.max(0,Number(saved?.[1])||0);}}
 restoreIceDeposits(s,w.iceDeposits);
 if(w.blobCaught)s.blob.status='caught';
 const elapsed=Math.max(0,(now-(Number(data.savedAt)||now))/1000),leafMap=new Map((Array.isArray(w.leaves)?w.leaves:[]).filter(Array.isArray).map(a=>[a[0],a]));
 for(const l of s.leaves){const a=leafMap.get(l.id);if(a){l.status='gone';l.respawnAt=s.time+Math.max(0,(Number(a[1])||0)-elapsed);l.respawnCycle=count(a[2]);}}
 for(const [id,left,mask,wait,since]of Array.isArray(w.sandLayers)?w.sandLayers:[]){const r=s.resources.find(r=>r.id===id);if(r?.beachPile&&Number.isFinite(left)&&left<=0){r.status='gone';r.respawnAt=s.time+120;}else if(r?.sandCell&&Number.isFinite(left)){r.sandLeft=Math.max(0,Math.min(20,left));if(Number.isInteger(mask))r.sandMask=mask&1048575;/* Schneedecke: Nachrieseln läuft nur in aktiver Spielzeit weiter */if(r.snowLayer){const rest=Number.isFinite(wait)?Math.max(0,wait):150,ago=Number.isFinite(since)?Math.max(0,since):0;r.respawnAt=s.time+rest;r.harvestAt=s.time-ago;if(!r.sandLeft)r.status='gone';}}}
 for(const a of (Array.isArray(w.woodHomes)?w.woodHomes:[])){const r=s.resources.find(r=>r.id===a[0]&&r.kind==='wood');if(r&&(woodlandAt(a[1],a[2])?.id??'sunny')===(r.spawnRegion??'sunny')&&Number.isFinite(a[1])&&Number.isFinite(a[2])&&sunnyInside(a[1],a[2])&&!sunnyCollision(a[1],sunnyHeight(a[1],a[2]),a[2],.2)){r.x=r.homeX=a[1];r.z=r.homeZ=a[2];r.y=r.homeY=sunnyHeight(a[1],a[2])+.1;r.generation=Math.max(0,Math.floor(a[3])||0);}}for(const a of (Array.isArray(w.stoneHomes)?w.stoneHomes:[])){const r=s.resources.find(r=>r.id===a[0]&&['stone','moss','mushroom'].includes(r.kind));if(r&&Number.isFinite(a[1])&&Number.isFinite(a[2])&&Math.hypot(a[1]-r.homeX,a[2]-r.homeZ)<=7&&(woodlandAt(a[1],a[2])?.id??'sunny')===(woodlandAt(r.homeX,r.homeZ)?.id??'sunny')&&sunnyInside(a[1],a[2])&&!sunnyCollision(a[1],sunnyHeight(a[1],a[2]),a[2],.2)){r.originX=r.homeX;r.originZ=r.homeZ;r.x=r.homeX=a[1];r.z=r.homeZ=a[2];r.y=r.homeY=sunnyHeight(a[1],a[2])+.1;r.generation=Math.max(0,Math.floor(a[3])||0);}}const woodMap=new Map((Array.isArray(w.wood)?w.wood:[]).filter(Array.isArray).map(a=>[a[0],a]));for(const r of s.resources){const a=woodMap.get(r.id);if(a){r.status='gone';r.respawnAt=s.time+Math.max(0,(Number(a[1])||0)-elapsed);}}
 const p=w.player;if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&walkable(s,p.x,p.z,inCave(s)?caveFloorAt(p.x,p.z):sunnyHeight(p.x,p.z))){Object.assign(s.player,{x:p.x,z:p.z,y:sunnyHeight(p.x,p.z),angle:Number.isFinite(p.angle)?p.angle:Math.PI});s.flight.safe={x:s.player.x,y:s.player.y,z:s.player.z};}
 if((data.version??0)<11&&!s.home.interior&&Math.abs(s.player.x-SUNNY.blobStation.x)<4.8&&Math.abs(s.player.z-SUNNY.blobStation.z)<4)enterNursery(s);restoreGolden(s,data.golden);rebuildLeafIndex(s);
}


