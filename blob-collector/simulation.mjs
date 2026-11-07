import {syncSites} from './build-sites.mjs';
import './recipe-mix.mjs';import './butterfly-goods.mjs';import {updateEndgame} from './endgame.mjs';
import {friendGreetings} from './blob-friends.mjs';
import {mealSpeed} from './cooking.mjs';
import {wanderBuried} from './buried-wander.mjs';
// Jakob 2.11.: beim ersten Drübersaugen entsteht ein Riss, der bleibt; einsaugen dauert je nach Tiefe ein paar Sekunden (Testwerte).
const DIG_SECONDS=[.25,3,4];
import {updatePortals} from './portal-blob.mjs';
import {updateSnail,snailBoost} from './snail-companion.mjs';
import {advanceButterflies} from './butterflies.mjs';
import {comfortStamina} from './comfort.mjs';
import {advanceWorldEvents} from './world-events.mjs';
import {setHomeLevel} from './home-space.mjs';
import {rootContactPoint} from './root-contact.mjs';
import {updateCaveTraversal} from './cave-systems.mjs';
import {advanceGoldenLeaf} from './golden-leaf.mjs';
import {inServiceZone} from './sunny-area.mjs';
import {suctionCount,suctionAmount,takeSuction} from './inventory.mjs';
import {RESOURCE_RULES} from './living-config.mjs';
import {createEquipment,gearEffects} from './equipment.mjs';
import {makeResourceClusters,rotateLeaf} from './resource-world.mjs';
import {createWorldWind,advanceWind,windVector} from './world-wind.mjs';
import {updateNurseryTraversal} from './nursery-space.mjs';
import {GAME_BALANCE} from './game-balance.mjs';
import {createTrails,advanceTrails} from './trails.mjs';
import {updateHomeTraversal} from './home-systems.mjs';
import {createForestMaterials} from './forest-materials.mjs';
import {advanceBlobWorkers} from './blob-workers.mjs';
import {woodlandResourcePoint} from './woodland-regions.mjs';
import {createForestBlobs,advanceForestBlobs} from './forest-blobs.mjs';
import {DEFAULT_VACUUM,getVacuum,vacuumContains,vacuumBounds} from './vacuums.mjs';
import {createProgression,effectiveVacuum,awardToolXP,TEST_OBSTACLES} from './vacuum-skills.mjs';
import {createGroundSystems,collectBuried,updateGroundRadar} from './ground-systems.mjs';
import {updateBlueprints} from './blueprint.mjs';
import {createFishing,updateFishing} from './fishing.mjs';
import {createSaugerSystems,activeSuction,prepareFlight,advanceAnchor,updateAdvanced,collectionReward,finishReward,enabledMaterial,slowBlob} from './sauger-systems.mjs';
import {capacityFor,takeBag,reservedBagSlots} from './inventory.mjs';
import {groundAt,walkable,collides} from './test-world.mjs';
import {initializeSunny,sunnyLeafPoint,sunnyHeight,storageTarget,sunnyInside,SUNNY} from './sunny-area.mjs';
import {volcanoRegion} from './volcano-area.mjs';
export const CONFIG = Object.freeze({capacity:3000, leafCount:4800, leafCellSize:2.5, stackLayers:30, speed:3.3, sprintMultiplier:1.6, sprintDuration:3.6, regen:25, regenDelay:.8, suctionRadius:2.35, suctionHalfAngle:Math.PI*.37, blobRadius:1.9, captureSeconds:1.05, worldX:11.4, worldZ:8.6, leafRespawn:RESOURCE_RULES.leaf.regen[0], leafRespawnSpread:RESOURCE_RULES.leaf.regen[1]-RESOURCE_RULES.leaf.regen[0], leafFallSeconds:3, maxReturningLeaves:64, windLeaves:56, basketX:-6.8, basketZ:4.4, basketY:.6, unloadRadius:2.35, unloadHalfAngle:Math.PI*.28, unloadSeconds:2, unloadPackets:24, deliverySeconds:.38, nozzleOffset:.984, nozzleY:.42});
export function randomSource(seed=42){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
export function leafVariation(id,cycle=0){let n=(Math.imul(id+1,374761393)+Math.imul(cycle+1,668265263))>>>0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;}
function queueRespawn(queue,leaf){let i=queue.length;queue.push(leaf);while(i>0){const parent=(i-1)>>1;if(queue[parent].respawnAt<=leaf.respawnAt)break;queue[i]=queue[parent];i=parent;}queue[i]=leaf;}
function nextRespawn(queue){const first=queue[0],last=queue.pop();if(queue.length){let i=0;while(i*2+1<queue.length){let child=i*2+1;if(child+1<queue.length && queue[child+1].respawnAt<queue[child].respawnAt)child++;if(queue[child].respawnAt>=last.respawnAt)break;queue[i]=queue[child];i=child;}queue[i]=last;}return first;}
export function stackLayerCount(amount,capacity=CONFIG.capacity){return Math.min(CONFIG.stackLayers,Math.ceil(amount/capacity*CONFIG.stackLayers));}
export function rebuildLeafIndex(state){
  const cells=new Map();
  for(const l of state.leaves){/* Vulkan: dort liegt nur Asche, kein Laub. Betroffene Blätter wandern in den Pilzhain */if(l.status==='ground'&&volcanoRegion(l.x,l.z)){l.x=-59+(l.x+59)*.35;l.z=l.z*.2;l.y=sunnyHeight(l.x,l.z)+.08;}if(l.status==='ground'){l.homeX=l.x;l.homeZ=l.z;l.homeY=l.y;l.homeAngle=l.angle;}const key=Math.floor(l.homeX/CONFIG.leafCellSize)+','+Math.floor(l.homeZ/CONFIG.leafCellSize);let bucket=cells.get(key);if(!bucket)cells.set(key,bucket=[]);bucket.push(l);}
  state.leafIndex={source:state.leaves,length:state.leaves.length,cells};
  state.pullingLeaves=state.leaves.filter(l=>l.status==='pulling');state.returningLeaves=state.leaves.filter(l=>l.status==='returning');state.respawns=[];for(const l of state.leaves)if(l.status==='gone')queueRespawn(state.respawns,l);state.leafChanges=state.leaves.slice();
}
export function createState({leafCount=CONFIG.leafCount,vacuumId=DEFAULT_VACUUM,area=null,backpackCapacity=area==='sunny'?GAME_BALANCE.backpack:CONFIG.capacity,productionTimeScale=1,startBuilt=false}={}){
  const random=randomSource();
  const leaves=Array.from({length:leafCount},(_,id)=>{let x,z;do{x=(random()*2-1)*10.8;z=(random()*2-1)*8;}while(x*x/(10.8*10.8)+z*z/64>1 || Math.hypot(x-CONFIG.basketX,z-CONFIG.basketZ)<.85);const y=.06+random()*.035,angle=random()*Math.PI*2;return {id,x,z,homeX:x,homeZ:z,homeY:y,homeAngle:angle,y,angle,size:.72+random()*.35,color:id%5,status:'ground',progress:0,respawnAt:0,respawnCycle:0};});
  vacuumId=getVacuum(vacuumId).id;
  const state={backpackCapacity,productionTimeScale,time:0,vacuumId,suctionBudget:0,player:{x:0,z:4.3,angle:Math.PI,stamina:100,rest:0,sprinting:false,moving:false,exhausted:false,vacuumId},leaves,carried:0,total:0,stored:0,deliveries:[],deliveryId:0,unloadBatch:null,unloadPending:false,unloading:false,blob:{x:3.2,z:-.4,y:.45,status:'wild',progress:0,angle:0},won:false,events:[]};
  state.equipment=createEquipment();state.buildings={press:startBuilt,nursery:startBuilt};state.worldWind=createWorldWind();state.progression=createProgression();state.skillRevision=0;state.obstacles=TEST_OBSTACLES.map(o=>({...o,progress:0,cleared:false,clearedAt:0}));
  Object.assign(state,createGroundSystems());
  Object.assign(state,createSaugerSystems());state.player.y=0;
  if(area==='sunny'){initializeSunny(state);state.resources=state.sunnyResources=createForestMaterials();state.forestBlobs=createForestBlobs();const clusterData=makeResourceClusters('leaf',leaves.length);state.resourceClusters=clusterData.clusters;for(const l of leaves){const point=clusterData.points[l.id];Object.assign(l,point,{homeX:point.x,homeZ:point.z,y:sunnyHeight(point.x,point.z)+.07,homeY:sunnyHeight(point.x,point.z)+.07});}}
  if(area==='sunny'){state.fishing=createFishing();state.trails=createTrails();}
  rebuildLeafIndex(state);return state;
}
export function inSuction(player,target,radius){
  const dx=target.x-player.x,dz=target.z-player.z,d=Math.hypot(dx,dz);
  return d<=radius && (d<.85 || (dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/d>Math.cos(CONFIG.suctionHalfAngle));
}
function constrain(p){const q=Math.hypot(p.x/CONFIG.worldX,p.z/CONFIG.worldZ);if(q>1){p.x/=q;p.z/=q;}}
function approachAngle(current,target,alpha){return current+Math.atan2(Math.sin(target-current),Math.cos(target-current))*alpha;}
export function setVacuum(state,id){const mode=getVacuum(id);state.vacuumId=state.player.vacuumId=mode.id;state.suctionBudget=0;return mode;}
export function nozzlePosition(player){const mode=getVacuum(player.vacuumId);return {x:player.x+Math.sin(player.angle)*mode.nozzleOffset,y:mode.nozzleY+(player.y??0),z:player.z+Math.cos(player.angle)*mode.nozzleOffset};}
export function basketInFront(player,state){
  if(state?.area==='sunny'&&!inServiceZone(state,'storage'))return false;
  const target=storageTarget(state)??{x:CONFIG.basketX,z:CONFIG.basketZ};
  const dx=target.x-player.x,dz=target.z-player.z,d=Math.hypot(dx,dz);
  return d>.15 && d<=(state?.area==='sunny'?SUNNY.unloadRadius:CONFIG.unloadRadius) && (dx*Math.sin(player.angle)+dz*Math.cos(player.angle))/d>=Math.cos(CONFIG.unloadHalfAngle);
}
export function step(state,input,dt){syncSites(state);setHomeLevel(state);
  const trailX=state.player.x,trailZ=state.player.z;
  updateHomeTraversal(state);updateNurseryTraversal(state);updateCaveTraversal(state);
  dt=Math.min(Math.max(dt,0),.05);state.time+=dt;state.events=[];
  const p=state.player,mag=Math.hypot(input.x||0,input.z||0),moving=mag>(input.analog ? .001 : .05),aimMag=Math.hypot(input.aimX||0,input.aimZ||0);let mode=effectiveVacuum(state);let active=activeSuction(state,input,mode);state.inputSuction=input.suction;
  if(aimMag>.05)p.angle=approachAngle(p.angle,Math.atan2(input.aimX,input.aimZ),1-Math.exp(-dt*20));
  prepareFlight(state,mode,active,dt);mode=effectiveVacuum(state);const capacity=capacityFor(mode),pullingAnchor=advanceAnchor(state,dt);
  const suctionMoving=active&&suctionCount(state)<capacity&&!basketInFront(p,state);
  if(!input.sprint || p.stamina>=25)p.exhausted=false;
  p.moving=moving;p.sprinting=moving && Boolean(input.sprint) && p.stamina>0 && !p.exhausted;
  if(p.sprinting){p.stamina=Math.max(0,p.stamina-dt*100/(CONFIG.sprintDuration*comfortStamina(state)));p.rest=0;if(p.stamina===0)p.exhausted=true;}
  else{p.rest+=dt;if(p.rest>CONFIG.regenDelay)p.stamina=Math.min(100,p.stamina+dt*CONFIG.regen);}
  if(moving&&!pullingAnchor){const x=input.x/Math.max(1,mag),z=input.z/Math.max(1,mag),speed=CONFIG.speed*gearEffects(state).speed*snailBoost(state)*mealSpeed(state)*(state.charging?1.2:1)*(state.flight.active?mode.movementMultiplier:(p.sprinting?CONFIG.sprintMultiplier:1)*(suctionMoving?mode.movementMultiplier:1)),nx=p.x+x*speed*dt,nz=p.z+z*speed*dt;
    if(state.testWorld.enabled||state.area==='sunny'){if((state.area!=='sunny'||state.testWorld.enabled||groundAt(state,nx,nz)!==null||(state.flight.active&&sunnyInside(nx,nz)))&&(state.flight.active?!collides(state,nx,p.y,nz):walkable(state,nx,nz,p.y))){p.x=nx;p.z=nz;if(!state.flight.active)p.y=groundAt(state,nx,nz);}if(state.testWorld.enabled){p.x=Math.max(-11.4,Math.min(25,p.x));p.z=Math.max(-8,Math.min(8,p.z));}}else{p.x=nx;p.z=nz;constrain(p);}if(aimMag<=.05)p.angle=approachAngle(p.angle,Math.atan2(x,z),1-Math.exp(-dt*16));}
  updateHomeTraversal(state);updateNurseryTraversal(state);updateCaveTraversal(state);
  advanceTrails(state,trailX,trailZ,dt,state.flight.active||pullingAnchor);
  state.toolWorking=false;state.autoPush=false;
  for(const o of state.obstacles){if(o.renewable&&o.cleared&&state.time>=(o.respawnAt??Infinity)){o.cleared=false;o.progress=0;if(o.tool==='ground')wanderBuried(o);}if(o.cleared)continue;
    const dx=o.x-p.x,dz=o.z-p.z,d=Math.hypot(dx,dz);
    const working=(o.route&&o.tool==='power'?state.suctionEnabled&&state.inputSuction!==false&&!state.charging&&state.battery.charge>0:active)&&o.tool===mode.id&&(o.depth??0)<=mode.digDepth&&(o.size??1)<=(mode.obstacleSize??1)&&vacuumContains(p,o.route&&(o.tool==='ground'||o.kind==='icewall'||o.kind==='lavawall')?rootContactPoint(o,p):o,mode)&&(o.tool!=='ground'||o.route||suctionCount(state)+reservedBagSlots(state)+(mode.doubleChance>0?2:1)<=capacity);
    if(working)state.toolWorking=true;
    o.progress=working?Math.min(1,Math.max(o.tool==='ground'?.03:0,o.progress+dt*mode.work/(o.tool==='ground'&&!o.route?DIG_SECONDS[o.depth??0]:o.seconds))):o.tool==='ground'?o.progress:Math.max(0,o.progress-dt*.3);
    if(o.progress>=1){o.cleared=true;o.clearedAt=state.time;if(o.renewable)o.respawnAt=state.time+480+(state.lootSeed%421);if(o.tool==='ground'&&(!o.route||suctionCount(state)+reservedBagSlots(state)+2<=capacity))collectBuried(state,o,mode);awardToolXP(state,mode.id,500);state.events.push('obstacle');continue;}
    if(o.solid&&d<1.05){const a=d>.001?Math.atan2(-dx,-dz):p.angle+Math.PI;p.x=o.x+Math.sin(a)*1.05;p.z=o.z+Math.cos(a)*1.05;}
  }
  const nozzle=nozzlePosition(p),aimingAtBasket=basketInFront(p,state);
  /* Jakob 7.11.: während der Abkühlung saugt der Kraftsauger gar nicht */state.suctionActive=active&&!(mode.id==='power'&&state.heat?.locked)&&!aimingAtBasket&&!state.autoPush&&!(state.intro&&!state.builtSites?.introVacuum);
  updateAdvanced(state,mode,state.suctionActive,dt);
  updateFishing(state,dt);updateBlueprints(state,dt);updateEndgame(state,dt);updateSnail(state,dt);friendGreetings(state);updatePortals(state,dt);advanceButterflies(state,mode,state.suctionActive,dt);
  if(state.suctionActive){const consumed=dt*mode.energyRate;state.progression[mode.id].energyUsed+=consumed;state.battery.charge=Math.max(0,state.battery.charge-consumed*mode.drain*(mode.id==='power'&&state.miningDeposit?(mode.miningDrain??1):1));}
  if(state.battery.charge===0){active=false;state.suctionActive=false;prepareFlight(state,mode,false,dt);}
  updateGroundRadar(state,mode);
  state.suctionBudget=Math.min(mode.rate*.15,state.suctionBudget+dt*mode.rate);
  if(state.leafIndex.source!==state.leaves || state.leafIndex.length!==state.leaves.length)rebuildLeafIndex(state);
  state.leafChanges=state.handLeaves?.splice(0)??[];/* Jakob 5.11.: Manche Blätter ließen sich nicht einsaugen (Index und Lage liefen auseinander): alle 8 s Fächer neu nach der echten Lage aufbauen. */if(state.leafIndex&&state.time>=(state.leafIndexAt??0)){state.leafIndexAt=state.time+8;const cells=state.leafIndex.cells;cells.clear();for(const l of state.leaves){const gone=l.status==='gone'||l.status==='returning',k=Math.floor((gone?l.homeX??l.x:l.x)/2.5)+','+Math.floor((gone?l.homeZ??l.z:l.z)/2.5);let b=cells.get(k);if(!b)cells.set(k,b=[]);b.push(l);}}state.leafChecks=0;advanceWind(state,dt);advanceGoldenLeaf(state,dt,mode,state.suctionActive);advanceWorldEvents(state,dt);
  for(let i=state.returningLeaves.length-1;i>=0;i--){const l=state.returningLeaves[i];l.returnProgress=Math.min(1,l.returnProgress+dt/l.fallSeconds);if(l.returnProgress>=1){l.status='ground';l.x=l.homeX;l.z=l.homeZ;l.y=l.homeY;l.angle=l.homeAngle;l.progress=0;state.leafChanges.push(l);state.returningLeaves[i]=state.returningLeaves[state.returningLeaves.length-1];state.returningLeaves.pop();}}
  while(state.returningLeaves.length<CONFIG.maxReturningLeaves && state.respawns.length && state.respawns[0].respawnAt<=state.time){const l=nextRespawn(state.respawns);rotateLeaf(state,l);l.status='returning';l.returnProgress=0;l.fallSeconds=CONFIG.leafFallSeconds+leafVariation(l.id,l.respawnCycle+17)*.8;state.returningLeaves.push(l);}
  let reserved=state.pullingLeaves.reduce((a,l)=>a+(l.reward?(l.reward.route==='bag'?l.reward.quantity:0):1),0)+state.resources.filter(r=>r.status==='pulling'&&r.reward?.route==='bag').reduce((a,r)=>a+r.reward.quantity,0);
  let slots=Math.min(mode.transport>0?Math.floor(state.suctionBudget):capacity-suctionCount(state)-reserved,Math.floor(state.suctionBudget));
  if(!state.testWorld.enabled&&state.suctionActive&&!aimingAtBasket&&enabledMaterial(state,mode,'leaf')&&slots>0){
    const raw=vacuumBounds(p,mode),pad=state.worldWind?.gust?2:0,bounds={minX:raw.minX-pad,maxX:raw.maxX+pad,minZ:raw.minZ-pad,maxZ:raw.maxZ+pad},cell=CONFIG.leafCellSize;
    query:for(let cx=Math.floor(bounds.minX/cell);cx<=Math.floor(bounds.maxX/cell);cx++)for(let cz=Math.floor(bounds.minZ/cell);cz<=Math.floor(bounds.maxZ/cell);cz++){
      const bucket=state.leafIndex.cells.get(cx+','+cz);if(!bucket)continue;
      for(const l of bucket){state.leafChecks++;if(l.status==='ground' && vacuumContains(p,l,mode)){const reward=collectionReward(state,mode,l.gold?'goldleaf':'leaf');if(reward.route==='bag'&&suctionCount(state)+reserved+reward.quantity>capacity)continue;if(reward.route==='bag')reserved+=reward.quantity;l.reward=reward;l.status='pulling';l.toolId=mode.id;l.startX=l.x;l.startZ=l.z;l.startY=l.y;l.progress=0;l.pullSpeed=mode.speed;l.swirl=mode.swirl;state.suctionBudget--;state.pullingLeaves.push(l);state.leafChanges.push(l);if(--slots<=0)break query;}}
    }
  }
  for(let i=state.pullingLeaves.length-1;i>=0;i--){const l=state.pullingLeaves[i];
      const air=windVector(state),distance=Math.max(.1,Math.hypot(nozzle.x-l.x,nozzle.z-l.z)),assist=Math.max(.82,Math.min(1.18,1+(air.x*(nozzle.x-l.x)+air.z*(nozzle.z-l.z))/distance*.15));l.progress=Math.min(1,l.progress+dt*(l.pullSpeed??mode.speed)*assist);const t=l.progress,e=t*t,swirl=(l.swirl??0)*Math.sin(t*Math.PI)*(1-t);
      l.x=l.startX+(nozzle.x-l.startX)*e+Math.sin(t*Math.PI*3+l.id)*(.1*Math.sin(t*Math.PI)+swirl);
      l.z=l.startZ+(nozzle.z-l.startZ)*e+Math.cos(t*Math.PI*3+l.id)*swirl;l.y=(l.startY??.06)+Math.sin(t*Math.PI)*(.5+swirl*.3)+t*(nozzle.y-(l.startY??.06));const wind=windVector(state);l.x+=wind.x*Math.sin(t*Math.PI)*.18;l.z+=wind.z*Math.sin(t*Math.PI)*.18;l.angle+=dt*(9+swirl*8);
      if(t>=1){l.status='gone';l.respawnCycle++;l.respawnAt=state.time+(CONFIG.leafRespawn+leafVariation(l.id,l.respawnCycle)*CONFIG.leafRespawnSpread)/(1+(l.reward?.regrowth??0));queueRespawn(state.respawns,l);finishReward(state,l.reward??{kind:'leaf',quantity:1,route:'bag',capacity});state.total+=l.reward?.quantity??1;awardToolXP(state,l.toolId??mode.id);state.pullingLeaves[i]=state.pullingLeaves[state.pullingLeaves.length-1];state.pullingLeaves.pop();state.events.push('leaf');if(suctionCount(state)===capacity)state.events.push('full');}
  }
  const b=state.blob;
  if(!state.forestBlobs&&b.status==='wild'){
    const blobSpeed=slowBlob(state,b,mode,state.suctionActive);
    const dx=b.x-p.x,dz=b.z-p.z,d=Math.hypot(dx,dz);
    if(active&&!aimingAtBasket&&vacuumContains(p,b,mode,mode.radius*.85)){b.status='pulling';b.captureSpeed=mode.captureSpeed;b.startX=b.x;b.startZ=b.z;b.progress=0;b.captureDistance=Math.hypot(b.x-nozzle.x,b.z-nozzle.z);b.captureSide=Math.max(-.7,Math.min(.7,Math.atan2(Math.sin(Math.atan2(b.x-nozzle.x,b.z-nozzle.z)-p.angle),Math.cos(Math.atan2(b.x-nozzle.x,b.z-nozzle.z)-p.angle))));state.events.push('lock');}
    else if(d<3.5){const a=Math.atan2(dx,dz)+Math.sin(state.time*2)*.5;b.x+=Math.sin(a)*1.65*dt*blobSpeed;b.z+=Math.cos(a)*1.65*dt*blobSpeed;b.angle=a;}
    else{b.x+=Math.sin(state.time*.8)*.22*dt*blobSpeed;b.z+=Math.cos(state.time*.65)*.22*dt*blobSpeed;}
    // Softly steer the blob back into the clearing, away from decorative trees.
    const q=Math.hypot(b.x/8.8,b.z/6.4);if(q>1){b.x/=q;b.z/=q;}
    b.y=(state.area==='sunny'&&!state.testWorld.enabled?sunnyHeight(b.x,b.z):0)+.43+Math.max(0,Math.sin(state.time*5))*.32;
  }
  if(!state.forestBlobs&&b.status==='pulling'){
    b.progress=Math.min(1,b.progress+dt*(b.captureSpeed??1)/CONFIG.captureSeconds);const t=b.progress,e=t*t;
    b.x=b.startX+(nozzle.x-b.startX)*e;b.z=b.startZ+(nozzle.z-b.startZ)*e;b.y=.45+Math.sin(t*Math.PI)*.7;
    if(t>=1){b.status='caught';state.events.push('caught');}
  } else if(b.status==='caught'){
    b.x=p.x-Math.sin(p.angle)*.38;b.z=p.z-Math.cos(p.angle)*.38;b.angle=p.angle;
    b.y=1.08+Math.max(0,stackLayerCount(state.carried)-1)*.075+.195;
  }
  advanceForestBlobs(state,mode,active&&!aimingAtBasket,dt,nozzle);
  advanceBlobWorkers(state,dt,harvestLeafForWorker);
  advanceStorageTransfers(state,dt);
  if(!state.won && state.total>=20 && b.status==='caught'){state.won=true;state.events.push('complete');}
  return state;
}

export function advanceStorageTransfers(state,dt){
  const p=state.player,nozzle=nozzlePosition(p),aimingAtBasket=basketInFront(p,state);
  if(state.storageWithdrawHold){const target=storageTarget(state);if(!target||!inServiceZone(state,'storage'))state.storageWithdrawHold=false;}
  // Inventory leaves the backpack when launched; it reaches storage on landing.
  // Flights keep their launch position even if the player walks away.
  for(let i=state.deliveries.length-1;i>=0;i--){const d=state.deliveries[i];d.progress=Math.min(1,d.progress+dt/(d.duration??CONFIG.deliverySeconds));if(d.progress>=1-1e-9){state.stored+=d.amount;for(const [kind,n]of Object.entries(d.items??{leaf:d.amount}))state.inventory.storage[kind]=(state.inventory.storage[kind]??0)+n;state.deliveries.splice(i,1);state.events.push('deposit');}}
  state.unloading=suctionCount(state)>0 && aimingAtBasket&&!state.storageWithdrawHold;
  if(state.unloading){
    if(!state.unloadPending)state.events.push('unload-start');state.unloadPending=true;
    if(!state.unloadBatch){const total=suctionCount(state)+state.pullingLeaves.length;state.unloadBatch={total,packets:Math.min(CONFIG.unloadPackets,total),next:0,sent:0,elapsed:0};}
    else state.unloadBatch.elapsed+=dt;
    const batch=state.unloadBatch,interval=batch.packets>1?(CONFIG.unloadSeconds-CONFIG.deliverySeconds)/(batch.packets-1):0;
    // Packet size scales with the load; the final packet always lands after
    // the same two seconds. A single leaf uses one longer continuous flight.
    while(batch.next<batch.packets&&batch.elapsed+1e-9>=batch.next*interval){
      const target=Math.floor(batch.total*(batch.next+1)/batch.packets),amount=Math.min(suctionCount(state),target-batch.sent),age=Math.max(0,batch.elapsed-batch.next*interval),duration=batch.packets===1?CONFIG.unloadSeconds:CONFIG.deliverySeconds;batch.next++;
      if(amount>0){const items=takeSuction(state,amount);state.deliveries.push({id:state.deliveryId++,amount,items,progress:age/duration,duration,...nozzle,angle:p.angle,target:storageTarget(state)});state.carried-=amount;batch.sent+=amount;}
    }
  } else state.unloadBatch=null;
  if(state.unloadPending && !state.unloading && state.deliveries.length===0){state.unloadPending=false;state.events.push('unload');}
}


export function harvestLeafForWorker(state,l){if(l.status!=='ground')return false;l.status='gone';l.respawnCycle++;l.respawnAt=state.time+CONFIG.leafRespawn+leafVariation(l.id,l.respawnCycle)*CONFIG.leafRespawnSpread;queueRespawn(state.respawns,l);state.leafChanges.push(l);return true;}
