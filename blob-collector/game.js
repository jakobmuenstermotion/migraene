import {BlobFxView} from './blob-fx-view.mjs';
import {bindSaleFlight} from './sale-flight.mjs';
import {bindProductionTree} from './production-tree.mjs';
import {showTitleIntro} from './title-intro.mjs';
import {PortalView} from './portal-view.mjs';
import {portalJumpScale} from './portal-blob.mjs';
import {bindPageLifecycle} from './page-lifecycle.mjs';
import {MossHedgeView,ButterflyView,bindCatchCard} from './world-extras-view.mjs';
import {bindFirstTips} from './first-tips-ui.mjs';
import {bindStory,StoryNotesView} from './story-ui.mjs';
import {CoreView,coreFocus} from './core-view.mjs';
import {startIntro} from './intro.mjs';
import {comfortStamina} from './comfort.mjs';
import {SceneryView} from './scenery-pickups.mjs';
import {gameStorage} from './isolated-storage.mjs';
import {shadeCanopies} from './redesign-foliage.mjs';
import {CaveView} from './cave-view.mjs';
import {inCave,CAVE_ROOM,roomOf} from './cave-space.mjs';
import {PrototypeDetails} from './visual-prototype.mjs';
import {PolishPalette} from './visual-polish.mjs';
import {applyPolishLight} from './visual-polish.mjs';
import {bindVisualLab} from './visual-lab.mjs';
import {updateCanopyTarget} from './canopy-visibility.mjs';
import {bindGoals} from './goals-ui.mjs';
import {createRound,bedStart} from './rounds.mjs';
import {bindHomeLife} from './home-life-ui.mjs';
import {suctionCount,suctionAmount} from './inventory.mjs';
import {CharacterPolish} from './character-polish.mjs';
import {LivingView} from './living-view.mjs';
import {inNursery,NURSERY_ROOM,nurseryBounds} from './nursery-space.mjs';
import {fusionPlaying} from './blob-menu-fusion.mjs';
import {HomeSurroundings} from './home-surroundings.mjs';
import {preferences,bindPreferencesUI} from './preferences.mjs';
import {GameAudio} from './game-audio.mjs';
import {PickupFeedback} from './pickup-feedback.mjs';
import {bindComputerUI,furnishHome,startComputerPlacement,finishComputerPlacement} from './home-computer.mjs';
import {ownsVacuum,grantTestVacuums,buyFactoryUpgrade} from './factory.mjs';
import {HomeView} from './home-view.mjs';
import {inHome,homeCameraZoom} from './home-space.mjs';
import {MarketView} from './market-view.mjs';
import {BlueprintView} from './blueprint-view.mjs';
import {bindMissionBoard} from './mission-board.mjs';
import {bindProductInfo} from './product-info.mjs';
import {bindDevPanel} from './dev-panel.mjs';
import {BuildSiteView,bindSiteUI} from './build-sites.mjs';
import {bindCraftingUI} from './crafting-ui.mjs';
import {bindFishAim} from './fish-aim.mjs';
import {RelicView} from './relic-view.mjs';
import {bindComicFx} from './comic-fx.mjs';
import {handMode} from './hand-pickup.mjs';
import {normalCount,normalCapacity} from './inventory.mjs';
import {CraftingView} from './crafting-view.mjs';
import {advanceCrafting} from './crafting.mjs';
import {FishingView} from './fishing-view.mjs';
import {CoastView} from './coast-view.mjs';
import {IceView} from './ice-view.mjs';
import {VolcanoView} from './volcano-view.mjs';
import {bindPlacementUI} from './placement-ui.mjs';
import {bindNurseryTouch} from './nursery-touch.mjs';
import {ForestBlobView} from './forest-blob-view.mjs';
import {matureBlobs} from './forest-blobs.mjs';
import * as T from './vendor/three.module.js';
import {CONFIG,createState,randomSource,step,advanceStorageTransfers,stackLayerCount,setVacuum} from './simulation.mjs';
import {blobCapturePose,deliveryPosition} from './effects.mjs';
import {LeafRenderer} from './leaf-renderer.mjs';
import {VacuumView} from './vacuum-view.mjs';
import {bindVacuumUI} from './vacuum-ui.mjs';
import {ChallengeView} from './challenge-view.mjs';
import {GroundRadarView} from './ground-radar-view.mjs';
import {buySkill,resetSkills,effectiveVacuum} from './vacuum-skills.mjs';
import {TestWorldView} from './test-world-view.mjs';
import {bindTestUI} from './test-ui.mjs';
import {capacityFor} from './inventory.mjs';
import {saveProgress,loadProgress,resetSavedGame,exportSaveText,importSaveText} from './progress-save.mjs';
import {Daylight} from './daylight.mjs';
import {groundAt} from './test-world.mjs';
import {JOYSTICK,joystickInput} from './joystick.mjs';
import {initHUDTheme} from './hud-art.mjs';
import {SunnyView} from './sunny-view.mjs';
import {materialIcon} from './sunny-ui.mjs';
import {bindWorldUI} from './world-ui.mjs';
import {updateCharging} from './charging.mjs';
import {advancePress} from './material-press.mjs';
import {sunnyHeight,insideBuilding} from './sunny-area.mjs';
import './embed-bridge.mjs';

const $=id=>document.getElementById(id);
initHUDTheme();/* Jakob 7.11.: Saugtank als eigener Tank mit Sichtfenster, Rucksack als Rucksack */document.querySelector('.leaf-counter>svg').outerHTML='<svg class="tank-icon" viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="58" rx="18" ry="3.5" fill="#4d5d4433"/><rect x="26" y="4" width="12" height="8" rx="3" fill="#8a6a46"/><path d="M38 8h8q6 0 6 6v6" fill="none" stroke="#6f8a8a" stroke-width="4" stroke-linecap="round"/><rect x="14" y="11" width="36" height="44" rx="12" fill="#6fa7a4" stroke="#3f6f6c" stroke-width="2"/><rect x="21" y="18" width="22" height="30" rx="7" fill="#e8f4ee" stroke="#3f6f6c" stroke-width="1.5"/><rect x="21" y="32" width="22" height="16" rx="6" fill="#dcab4d"/><path d="M25 36q4-3 7 0t7 0" fill="none" stroke="#f3d38a" stroke-width="2"/><rect x="14" y="24" width="5" height="16" rx="2" fill="#4f8784"/></svg>';
let story,storyNotes,coreView,fishAim,relicView,comicFx;let blobFxView,saleFlight,caveView,iceView,volcanoView,sceneryView;let visualLab,worldPolish,worldPalette;let siteView,siteUI,missionBoard,characterPolish,livingView,firstTips,hedgeView,butterflyView,catchCard,forestBlobView,nurseryTouch,placementUI,coastView,fishingView,craftingView,craftingUI,marketView,blueprintView,homeView,homeSurroundings,computerUI,homeLife,goalsUI,pickupFeedback,settingsUI,gameAudio;
let state=createState({area:'sunny',vacuumId:'ground',leafCount:13200}),renderer,scene,camera,character,blob,stack,nozzle,blobShadow,playerShadow,blobAura,blobLight,blobGlow,leafRenderer,vacuumView,vacuumUI,challengeView,groundRadarView,testUI,testWorldView,areaUI,sunnyView,daylight,lastSave=0;
let loaded=false;try{loaded=loadProgress(state,gameStorage);}catch{}
furnishHome(state);if(!loaded){state.round=createRound();state.suctionEnabled=false;startIntro(state);bedStart(state);}else if(state.round?.waking)bedStart(state);preferences(state);addEventListener('storage',e=>{if(e.key==='blob-redesign:blob-collector-reset-epoch')location.reload();});
let pageLife=null,portalView=null;
const persist=()=>{if(visualLab?.active||pageLife?.superseded())return false;try{return saveProgress(state,gameStorage);}catch{return false;}};
const stackMeshes=[],decor=[],puffs=[];
let forestScenery=[];
const deliveryMeshes=new Map();
const keys=new Set(),stick={x:0,z:0,aimX:0,aimZ:0,id:null,startX:0,startY:0};
let touchSprint=false,previous=0,soundOn=false,audio=null,lastLeafSound=0;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const palette=['#d8a64c','#c18a4b','#e0ba63','#acb66a','#cc764b'];
const rand=randomSource(128),materials=new Map();
const v=new T.Vector3();
const unloadTrailMaterial=new T.LineBasicMaterial({color:'#efffe5',transparent:true,opacity:.45,depthWrite:false});
const uiCache={},camShift={x:0,z:0,zoom:1};
function textIfChanged(id,value){if(uiCache[id]!==value){$(id).textContent=value;uiCache[id]=value;}}
function mat(color,options={}){const key=color+JSON.stringify(options);if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.85,...options}));return materials.get(key);}
function mesh(geometry,color,parent,x=0,y=0,z=0,options={}){const m=new T.Mesh(geometry,mat(color,options));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
const ball=(r=1)=>new T.SphereGeometry(r,20,12);
const box=(x,y,z)=>new T.BoxGeometry(x,y,z);
function ellipsoid(parent,color,x,y,z,sx,sy,sz){const m=mesh(ball(),color,parent,x,y,z);m.scale.set(sx,sy,sz);return m;}
function cylinder(parent,color,x,y,z,rt,rb,h,n=12){return mesh(new T.CylinderGeometry(rt,rb,h,n),color,parent,x,y,z);}
function shadow(parent,radius){const c=document.createElement('canvas');c.width=c.height=64;const cx=c.getContext('2d'),g=cx.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(48,62,32,0.25)');g.addColorStop(.5,'rgba(48,62,32,0.13)');g.addColorStop(1,'rgba(48,62,32,0)');cx.fillStyle=g;cx.fillRect(0,0,64,64);const m=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.03;parent.add(m);return m;}
const leafShape=new T.Shape();leafShape.moveTo(0,-.23);leafShape.bezierCurveTo(-.27,-.05,-.17,.18,0,.31);leafShape.bezierCurveTo(.2,.13,.23,-.1,0,-.23);
const leafGeometry=new T.ExtrudeGeometry(leafShape,{depth:.035,bevelEnabled:false,curveSegments:5});leafGeometry.rotateX(-Math.PI/2);
const stemGeometry=new T.CylinderGeometry(.009,.009,.43,4);
function leaf(parent,color){const group=new T.Group();mesh(leafGeometry,color,group);const stem=mesh(stemGeometry,'#8e763c',group,0,.023,0);stem.rotation.x=Math.PI/2;parent.add(group);return group;}
function makePlayer(){
  const root=new T.Group();scene.add(root);const body=new T.Group();root.add(body);root.userData.body=body;
  const left=ellipsoid(body,'#635846',-.19,.19,0,.14,.19,.23),right=ellipsoid(body,'#635846',.19,.19,0,.14,.19,.23);root.userData.feet=[left,right];
  ellipsoid(body,'#e9b568',0,.72,0,.38,.48,.27);
  ellipsoid(body,'#f2d6ac',0,1.24,.04,.32,.32,.3);
  ellipsoid(body,'#625143',0,1.39,-.08,.34,.23,.28);
  cylinder(body,'#c77c58',0,1.48,.01,.37,.39,.14,24);ellipsoid(body,'#d28b64',0,1.57,-.01,.32,.18,.3);
  ellipsoid(body,'#d9a176',0,1.49,.29,.23,.038,.17);
  for(const x of [-.115,.115])ellipsoid(body,'#374b40',x,1.25,.318,.029,.043,.018);
  ellipsoid(body,'#e6aa94',-.2,1.16,.27,.045,.024,.015);ellipsoid(body,'#e6aa94',.2,1.16,.27,.045,.024,.015);
  ellipsoid(body,'#f2d6ac',-.36,.86,.24,.115,.14,.13);ellipsoid(body,'#f2d6ac',.36,.86,.24,.115,.14,.13);
  ellipsoid(body,'#567f72',0,.77,-.35,.34,.4,.19);mesh(box(.5,.07,.3),'#d8c99c',body,0,1.04,-.38);
  for(const x of [-.22,.22])mesh(box(.065,.6,.05),'#5d7461',body,x,.82,.245);
  const pipe=new T.CatmullRomCurve3([new T.Vector3(.25,.65,-.38),new T.Vector3(.53,.45,-.15),new T.Vector3(.5,.65,.35),new T.Vector3(.14,.5,.72)]);
  body.userData.hose=mesh(new T.TubeGeometry(pipe,20,.075,8,false),'#526d64',body);
  nozzle=new T.Group();nozzle.position.set(0,.42,.78);body.add(nozzle);
  stack=new T.Group();stack.position.set(0,.98,-.5);body.add(stack);
  for(let i=0;i<CONFIG.stackLayers;i++){const group=new T.Group();stack.add(group);stackMeshes.push(group);}
  return root;
}
function makeBlob(){
  const root=new T.Group();scene.add(root);
  const flesh=ellipsoid(root,'#a6df71',0,0,0,.62,.57,.54);
  flesh.material=new T.MeshPhysicalMaterial({color:'#a6df71',roughness:.19,metalness:0,clearcoat:1,clearcoatRoughness:.13,emissive:'#88d345',emissiveIntensity:.48});
  root.userData.flesh=flesh;root.userData.rest=new Float32Array(flesh.geometry.attributes.position.array);
  for(const x of [-.18,.18]){ellipsoid(root,'#2f4e3c',x,.035,.509,.052,.072,.03);ellipsoid(root,'#fff8df',x-.012,.061,.537,.015,.02,.009);}
  const smile=new T.EllipseCurve(0,0,.065,.045,Math.PI,Math.PI*2,false,0);const mouth=new T.Line(new T.BufferGeometry().setFromPoints(smile.getPoints(16).map(p=>new T.Vector3(p.x,p.y-.07,.54))),new T.LineBasicMaterial({color:'#476440'}));root.add(mouth);
  for(const x of [-.31,.31])ellipsoid(root,'#e8bb99',x,-.065,.46,.065,.03,.015);
  const sprout=leaf(root,'#5b905a');sprout.position.set(.04,.49,0);sprout.rotation.z=-.5;sprout.rotation.x=-.7;sprout.scale.setScalar(.85);
  ellipsoid(root,'#f3ffd3',-.22,.27,.43,.13,.065,.02);
  blobAura=new T.Sprite(new T.SpriteMaterial({map:glowTexture(),color:'#ccff80',transparent:true,opacity:.6,blending:T.AdditiveBlending,depthWrite:false}));blobAura.scale.set(2.6,2.6,1);scene.add(blobAura);
  blobGlow=new T.Mesh(new T.PlaneGeometry(3,3),new T.MeshBasicMaterial({map:glowTexture(),color:'#b6ed64',transparent:true,opacity:.42,depthWrite:false,blending:T.AdditiveBlending}));blobGlow.rotation.x=-Math.PI/2;scene.add(blobGlow);
  blobLight=new T.PointLight('#b7ff6a',2.6,3.1,2);scene.add(blobLight);
  return root;
}
let glowMap;
function glowTexture(){
  if(glowMap)return glowMap;const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,.65)');g.addColorStop(.3,'rgba(255,255,255,.35)');g.addColorStop(.65,'rgba(255,255,255,.11)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(0,0,128,128);glowMap=new T.CanvasTexture(c);return glowMap;
}
function makeAirflow(){vacuumView=new VacuumView(scene,nozzle);vacuumView.select(effectiveVacuum(state));}
function updateAirflow(p,time){vacuumView.update(state,time,reduced);if(state.charging||(state.intro&&!state.builtSites?.introVacuum))vacuumView.root.visible=false;}
function updateBlob(b,time){
  blob.position.set(b.x,b.y,b.z);
  const pulling=b.status==='pulling',carried=b.status==='caught';
  blob.rotation.y=carried?b.angle:Math.sin(time*.7)*.3;
  const bounce=reduced?0:Math.sin(time*5),squash=1+bounce*.09;blob.scale.set(squash,1/(squash*squash),squash);
  if(carried){
    const top=stackMeshes[stackLayerCount(suctionCount(state),capacityFor(effectiveVacuum(state)))-1];character.updateMatrixWorld(true);
    v.set(top?.position.x??0,(top?.position.y??0)+.195,0);blob.position.copy(stack.localToWorld(v));blob.scale.multiplyScalar(.45);
  }
  if(pulling){
    character.updateMatrixWorld(true);nozzle.localToWorld(v.set(0,0,.204));
    const pose=blobCapturePose(b,state.player,v);blob.position.set(pose.x,pose.y,pose.z);blob.rotation.y=pose.angle;blob.scale.set(pose.scale.x,pose.scale.y,pose.scale.z);
  }
  const flesh=blob.userData.flesh,positions=flesh.geometry.attributes.position,rest=blob.userData.rest;
  for(let i=0;i<positions.count;i++){
    const x=rest[i*3],y=rest[i*3+1],z=rest[i*3+2],a=Math.atan2(z,x);
    const ripple=reduced?1:1+Math.sin(a*3+time*4+y*3)*.055*(1-y)*.5+Math.sin(time*3+y*6)*.025;
    const taper=pulling?1-Math.max(0,z)*Math.sin(b.progress*Math.PI)*.38:1;
    positions.setXYZ(i,x*ripple*taper,y<-.3?-.3+(y+.3)*.38:y,z*ripple);
  }positions.needsUpdate=true;flesh.geometry.computeVertexNormals();
  const glow=carried?.45:pulling?Math.max(.1,1-b.progress*.8):1;
  blobAura.position.copy(blob.position);blobAura.scale.setScalar((2.45+Math.sin(time*2)*.12)*glow);blobAura.material.opacity=(.58+Math.sin(time*2)*.08)*glow;
  blobGlow.position.set(blob.position.x,sunnyHeight(blob.position.x,blob.position.z)+.075,blob.position.z);blobGlow.scale.setScalar(glow);blobLight.position.set(blob.position.x,blob.position.y+.3,blob.position.z);blobLight.intensity=(2.6+Math.sin(time*2)*.3)*glow;
  blobShadow.position.set(blob.position.x,sunnyHeight(blob.position.x,blob.position.z)+.035,blob.position.z);blobShadow.scale.setScalar(glow);
  blobGlow.visible=blobShadow.visible=!carried;blobLight.intensity*=carried?.35:1;
}
function updateDeliveries(time){
  const live=new Set(state.deliveries.map(d=>d.id));
  for(const [id,trail] of deliveryMeshes){if(!live.has(id)){scene.remove(trail);trail.geometry.dispose();deliveryMeshes.delete(id);}}
  for(const d of state.deliveries){
    let trail=deliveryMeshes.get(d.id);
    if(!trail){trail=new T.Line(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(new Float32Array(12*3),3)),unloadTrailMaterial);scene.add(trail);deliveryMeshes.set(d.id,trail);}
    const attribute=trail.geometry.attributes.position;for(let i=0;i<12;i++){const p=deliveryPosition({...d,progress:Math.max(0,d.progress-i*.012)});attribute.setXYZ(i,p.x,p.y,p.z);}attribute.needsUpdate=true;
  }
}
function init(){
  renderer=new T.WebGLRenderer({canvas:$('world'),antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.NeutralToneMapping;renderer.toneMappingExposure=1.05;
  scene=new T.Scene();scene.background=new T.Color('#dce9c5');scene.fog=new T.Fog('#dce9c5',45,100);globalThis.__redesign={get scene(){return scene;},get renderer(){return renderer;},get camera(){return camera;},get state(){return state;},get save(){return persist;}};
  camera=new T.OrthographicCamera(-15,15,10,-10,.1,100);const ambient=new T.HemisphereLight('#fff6dc','#9ca77c',1.9);scene.add(ambient);
  const sun=new T.DirectionalLight('#fff0ca',2.3);sun.position.set(-16,30,12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-36,right:36,top:33,bottom:-33,near:1,far:90});sun.shadow.bias=-.0005;sun.shadow.normalBias=.025;sun.shadow.radius=4;scene.add(sun,sun.target);
  livingView=new LivingView(scene);sunnyView=new SunnyView(scene);coastView=new CoastView(scene);iceView=new IceView(scene);sceneryView=new SceneryView(scene);volcanoView=new VolcanoView(scene);caveView=new CaveView(scene);relicView=new RelicView(scene);comicFx=bindComicFx();fishingView=new FishingView(scene);craftingView=new CraftingView(scene);marketView=new MarketView(scene);hedgeView=new MossHedgeView(scene);butterflyView=new ButterflyView(scene);blueprintView=new BlueprintView(scene);missionBoard=bindMissionBoard({scene,getState:()=>state,onSave:persist});bindProductInfo(()=>state);bindDevPanel({getState:()=>state,onSave:persist});siteView=new BuildSiteView(scene);storyNotes=new StoryNotesView(scene);coreView=new CoreView(scene);story=bindStory({getState:()=>state,onSave:persist});siteUI=bindSiteUI({getState:()=>state,onSave:persist});homeView=new HomeView(scene);forestBlobView=new ForestBlobView(scene);homeSurroundings=new HomeSurroundings(scene,[sunnyView.root,coastView.root,craftingView.root]);daylight=new Daylight(scene,sun,ambient,sunnyView.root);character=makePlayer();characterPolish=new CharacterPolish(character);blob=makeBlob();playerShadow=shadow(scene,.7);blobShadow=shadow(scene,.7);
  leafRenderer=new LeafRenderer(scene,stack,stackMeshes,state);pickupFeedback=new PickupFeedback();
  makeAirflow();
  challengeView=new ChallengeView(scene,state.obstacles);
  groundRadarView=new GroundRadarView(scene,$('ground-radar-bearing'));
  testWorldView=new TestWorldView(scene,state);
  for(let i=0;i<20;i++){const m=mesh(ball(.035),'#fff0a1',scene);m.castShadow=false;m.userData={x:(rand()-.5)*23,z:(rand()-.5)*17,phase:rand()*9};decor.push(m);}
  resize();addEventListener('resize',resize);bindControls();
  vacuumUI=bindVacuumUI({onModeChange:persist,getState:()=>state,onCloseTree:()=>craftingUI?.resumeFactory(),onOpen:()=>{areaUI?.close();craftingUI?.close();clearInput();},
    onChoose:id=>{if(!ownsVacuum(state,id))return;setVacuum(state,id);persist();vacuumView.select(effectiveVacuum(state));if(!vacuumUI.isOpen())$('world').focus({preventScroll:true});},
    onRefill:()=>{const fresh=createState({vacuumId:state.vacuumId,area:'sunny',leafCount:7200});Object.assign(fresh,{round:state.round,market:state.market,goal:state.goal,toolLessons:state.toolLessons,freeBuildings:state.freeBuildings,daylightOffset:state.daylightOffset,buildings:state.buildings,equipment:state.equipment,worldWind:state.worldWind,total:state.total,time:state.time,progression:state.progression,skillRevision:state.skillRevision+1,stored:state.stored,inventory:state.inventory,carried:state.carried,press:state.press,fishing:state.fishing,preferences:state.preferences,crafting:state.crafting,factory:state.factory,trails:state.trails,backpackCapacity:state.backpackCapacity,productionTimeScale:state.productionTimeScale,forestBlobs:state.forestBlobs,placements:state.placements,layoutRevision:state.layoutRevision,home:state.home,nursery:state.nursery,deliveries:state.deliveries,deliveryId:state.deliveryId,buriedInventory:state.buriedInventory,lootSeed:state.lootSeed,battery:state.battery,filters:state.filters,transportMode:state.transportMode});fresh.inventory.storage=state.inventory.storage;fresh.inventory.coins=state.inventory.coins;fresh.inventory.sold=state.inventory.sold;state=fresh;clearInput();},
    onUpgrade:(id,node)=>{if(buyFactoryUpgrade(state,id,node)){vacuumView.select(effectiveVacuum(state));tone(580,.12);persist();}},
    onResetTree:id=>{resetSkills(state,id);persist();},
    onGrant:id=>{state.progression[id].bonus+=5;state.skillRevision++;persist();}
  });
  testUI=bindTestUI({getState:()=>state,onChoose:id=>{grantTestVacuums(state);setVacuum(state,id);},onOpen:()=>{vacuumUI.close();areaUI?.close();clearInput();},onSave:persist,onReset:resetGame});
  areaUI=bindWorldUI({getState:()=>state,onOpen:()=>{vacuumUI.close();testUI.close();clearInput();},onSave:persist,onMove:id=>placementUI.open(id),onBuild:()=>craftingUI.open(),isOtherOpen:()=>Boolean(visualLab?.active)||Boolean(state.toolLessons?.length)||Boolean(settingsUI?.isOpen())||vacuumUI.isOpen()||testUI.isOpen()||Boolean(placementUI?.isOpen())||Boolean(craftingUI?.isVisible())});
  placementUI=bindPlacementUI({getState:()=>state,scene,onClose:()=>{if(finishComputerPlacement(state))craftingUI.open();},onSave:persist,onOpen:()=>{areaUI.close();vacuumUI.close();testUI.close();clearInput();}});
  craftingUI=bindCraftingUI({getState:()=>state,onOpenTree:id=>vacuumUI.openTree(id),onEquip:id=>{if(ownsVacuum(state,id)){setVacuum(state,id);vacuumView.select(effectiveVacuum(state));persist();}},onSave:persist,onPlace:(id,space)=>{if(startComputerPlacement(state,id,space))placementUI.open(id);},onOpen:(floating=false)=>{areaUI.close();vacuumUI.close();testUI.close();if(!floating)clearInput();},isBlocked:()=>Boolean(visualLab?.active)||Boolean(state.toolLessons?.length)||Boolean(settingsUI?.isOpen())||vacuumUI.isOpen()||testUI.isOpen()||areaUI.isOpen()||placementUI.isOpen()});
  fishAim=bindFishAim({button:$('fish-bait'),canvas:$('world'),scene,camera:()=>camera,getState:()=>state,onThrow:persist});
  computerUI=bindComputerUI({getState:()=>state,onOpen:()=>craftingUI.open(),isBlocked:()=>Boolean(visualLab?.active)||Boolean(settingsUI?.isOpen())||vacuumUI.isOpen()||testUI.isOpen()||areaUI.isOpen()||placementUI.isOpen()||craftingUI.isOpen()});
  goalsUI=bindGoals({getState:()=>state,onSave:persist});saleFlight=bindSaleFlight(document.getElementById('game'),scene);bindProductionTree(()=>state);
  firstTips=bindFirstTips({getState:()=>state,onSave:persist});catchCard=bindCatchCard({getState:()=>state});homeLife=bindHomeLife({getState:()=>state,onSave:persist,onPause:()=>{clearInput();areaUI.close();craftingUI.close();},onWardrobe:()=>areaUI.open('equipment'),isBlocked:()=>Boolean(visualLab?.active)||Boolean(settingsUI?.isOpen())||vacuumUI.isOpen()||testUI.isOpen()||areaUI.isOpen()||placementUI.isOpen()||craftingUI.isOpen()});
  nurseryTouch=bindNurseryTouch({getState:()=>state,getView:()=>forestBlobView,onInspect:id=>areaUI.inspectBlob(id),onClose:()=>areaUI.close(),onSave:persist,isBlocked:()=>Boolean(visualLab?.active)||Boolean(settingsUI?.isOpen())||vacuumUI.isOpen()||testUI.isOpen()||areaUI.isOpen()||placementUI.isOpen()});
  addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist();});
  gameAudio=new GameAudio(()=>state);document.addEventListener('placement-open',e=>placementUI?.open(e.detail));document.addEventListener('story-babble',e=>gameAudio.babble(e.detail));for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>gameAudio.start(),{passive:true});pageLife=bindPageLifecycle({storage:gameStorage,canvas:renderer.domElement,persist,resumeAudio:()=>gameAudio.resume()});
  showTitleIntro(()=>state,persist,new URLSearchParams(location.search).has('title'));
  settingsUI=bindPreferencesUI({getState:()=>state,onOpen:()=>{vacuumUI.close();testUI.close();areaUI.close();craftingUI.close();clearInput();},onSave:persist,onSound:()=>gameAudio.start(),onExport:()=>exportSaveText(state,gameStorage),onImport:text=>{if(!importSaveText(gameStorage,text))return false;location.reload();return true;}});
  worldPolish=new PrototypeDetails(scene,sunnyView,fishingView,leafRenderer,true);worldPolish.ensure();worldPalette=new PolishPalette([sunnyView.root,craftingView.root,coastView.root]);worldPalette.set(true);shadeCanopies(scene);worldPolish.apply(4);homeSurroundings.sources.push(worldPolish.root);
  visualLab=bindVisualLab({renderer,scene,sunnyView,fishingView,leafRenderer,paletteRoots:[sunnyView.root,craftingView.root],getState:()=>state,setState:s=>{state=s;clearInput();camera.zoom=1;camera.updateProjectionMatrix();},createState,step,height:sunnyHeight,onOpen:()=>{worldPolish.restore();worldPalette.set(false);testUI.close();areaUI.close();craftingUI.close();vacuumUI.close();clearInput();},onClose:()=>{worldPalette.set(true);shadeCanopies(scene);worldPolish.apply(4);homeSurroundings.revision=-1;clearInput();}});
  persist();
  vacuumUI.update();render(0);
  $('loading').style.opacity='0';setTimeout(()=>$('loading').remove(),600);
}
function resize(){const w=innerWidth,h=innerHeight,aspect=w/h;const half=aspect<.8?Math.max(11.5,5.3/aspect):aspect<1.3?11.5:11.8;camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();renderer.setSize(w,h);}
function tone(freq,duration=.08,gain=.025,type='sine',end=freq*1.4){if(!preferences(state).sound)return;gain*=preferences(state).volume;try{audio??=new AudioContext();audio.resume();const osc=audio.createOscillator(),amp=audio.createGain(),t=audio.currentTime;osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(end,t+duration);amp.gain.setValueAtTime(gain,t);amp.gain.exponentialRampToValueAtTime(.001,t+duration);osc.connect(amp).connect(audio.destination);osc.start();osc.stop(t+duration);}catch{soundOn=false;$('sound-text').textContent='Ton aus';$('sound').setAttribute('aria-pressed','false');}}
function burst(x,y,z){if(reduced)return;for(let i=0;i<16;i++){const m=mesh(ball(.04),i%2?'#fff1a7':'#b5d888',scene,x,y,z);m.castShadow=false;puffs.push({m,vx:(rand()-.5)*3,vy:1+rand()*2,vz:(rand()-.5)*3,life:.7});}}
function updateUI(){
  /* Jakob 7.11.: Rucksack immer sichtbar, Saugtank nur, wenn man einen Sauger in der Hand hat */{const pack=document.querySelector('.pack-counter');if(pack){textIfChanged('pack-count',normalCount(state));textIfChanged('pack-max',' / '+normalCapacity(state));pack.style.setProperty('--bag-fill',Math.min(1,normalCount(state)/normalCapacity(state)));if(!pack.dataset.icon){pack.dataset.icon='1';pack.querySelector('.pack-icon').innerHTML=materialIcon('backpack1');}}document.querySelector('.leaf-counter').hidden=handMode(state);}textIfChanged('leaf-count',suctionCount(state));{const counter=document.querySelector('.leaf-counter'),fill=Math.min(1,suctionCount(state)/capacityFor(effectiveVacuum(state)));counter.style.setProperty('--bag-fill',fill);counter.classList.toggle('tank-full',fill>=1);}
  textIfChanged('bag-max',' / '+capacityFor(effectiveVacuum(state)));
  const caught=state.forestBlobs?.roster.length??(state.blob.status==='caught'?1:0);if(uiCache.caught!==caught){$('blob-count').innerHTML=String(caught);uiCache.caught=caught;}
  {const scale=comfortStamina(state);if(uiCache.staminaScale!==scale){uiCache.staminaScale=scale;const bar=$('stamina-fill').parentElement;uiCache.staminaBase??=bar.offsetWidth||0;if(uiCache.staminaBase)bar.style.width=Math.min(innerWidth*.62,uiCache.staminaBase*scale)+'px';}}const energy=Math.round(state.player.stamina);if(uiCache.energy!==energy){textIfChanged('stamina-number',energy+' %');$('stamina-fill').style.width=energy+'%';$('stamina-fill').style.background=energy<20?'#c59864':'#8ca96f';uiCache.energy=energy;}
  for(const event of state.events){/* Jakob 8.11.: Comic-Einblendungen („KRACH!“ usw.) im normalen Spiel aus. */
    if(event==='leaf' && state.time-lastLeafSound>.07){tone([440,494,554,659,740][state.total%5],.045,.007,'triangle',620);lastLeafSound=state.time;}
    if(event==='obstacle'){const target=state.obstacles.find(o=>o.clearedAt===state.time);if(target)burst(target.x,.6,target.z);tone(580,.25,.025,'sine',1000);}
    if(event==='lock')tone(220,.35,.035,'sine',660);
    if(event==='blueprint')tone(900,.3,.03,'sine',1400);
    if(event==='fish')tone(720,.22,.03,'sine',1200);
    if(event==='caught'){burst(state.player.x,1,state.player.z);tone(660,.3,.035,'sine',1100);}
    if(event==='unload-start')tone(210,.25,.015,'triangle',360);
    if(event==='unload')tone(300,.15,.025);
  }
}
// Neugestaltung: Rückenstapel mit Trägheit (Feder kippt gegen Anlaufen/Bremsen/Kurven und schwingt nach) und
// Wippen/Seitenschwanken im selben Schrittrhythmus wie Körper und Füße; obere Lagen schwingen weiter und verzögert.
let stackDyn=null;
function updateStackMotion(p,t,dt){
 const d=stackDyn??={x:p.x,z:p.z,vf:0,vs:0,lf:0,ls:0,wf:0,ws:0,walk:0},step=Math.max(dt,1/240),wx=(p.x-d.x)/step,wz=(p.z-d.z)/step;d.x=p.x;d.z=p.z;
 const jump=Math.hypot(wx,wz)>25,ca=Math.cos(p.angle),sa=Math.sin(p.angle),vf=jump?0:sa*wx+ca*wz,vs=jump?0:ca*wx-sa*wz,af=jump?0:(vf-d.vf)/step,as=jump?0:(vs-d.vs)/step;d.vf=vf;d.vs=vs;
 const clamp=v=>Math.max(-40,Math.min(40,v)),spring=(l,w,force)=>{w+=(-46*l-4.6*w-force)*step;l=Math.max(-.5,Math.min(.5,l+w*step));return [l,w];};
 [d.lf,d.wf]=spring(d.lf,d.wf,clamp(af)*.06);[d.ls,d.ws]=spring(d.ls,d.ws,clamp(as)*.06);{const pulls=state.pullingLeaves?.length??0;if(pulls<(d.pulls??0))d.wp=(d.wp??0)+.55;d.pulls=pulls;d.wp=(d.wp??0)+(-90*(d.p??0)-9*(d.wp??0))*step;d.p=Math.max(-.12,Math.min(.12,(d.p??0)+d.wp*step));}
 d.walk+=((p.moving&&!reduced?1:0)-d.walk)*Math.min(1,dt*6);
 const phase=t*(p.sprinting?18:12),amp=p.sprinting?1.35:1;
 stackMeshes.forEach((m,i)=>{
  if(reduced){m.position.set(0,i*.075,0);m.rotation.set(0,0,0);return;}
  const h=(i+1)/CONFIG.stackLayers,lag=i*.22,side=Math.sin(phase-lag)*.055*d.walk*amp*h,bounce=Math.abs(Math.sin(phase-lag*.6))*.04*d.walk*amp*(.4+h),idle=(1-d.walk)*Math.sin(t*2.2-i*.3)*.014*h;
  m.position.set(side+idle+d.ls*.5*h*h,i*.075*(1+(d.p??0)*h*1.6)+(i?bounce:0),d.lf*.5*h*h);
  m.rotation.set(d.lf*1.5*h+Math.cos(phase*2-lag)*.035*d.walk*h,Math.sin(phase-lag)*.05*d.walk*h,-d.ls*1.5*h-Math.sin(phase-lag)*.09*d.walk*amp*h);
 });
}
function render(timestamp){  requestAnimationFrame(render);const cpuStart=performance.now();const dt=previous?Math.min((timestamp-previous)/1000,.05):1/60;previous=timestamp;visualLab?.beforeFrame(timestamp,dt);
  const x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+stick.x;
  const z=(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)+stick.z;
  const now=Date.now();let productionChanged=updateCharging(state,now);productionChanged=matureBlobs(state,now)||productionChanged;productionChanged=advanceCrafting(state,now)||productionChanged;if(advancePress(state,now)){productionChanged=true;tone(460,.2,.022,'triangle',780);}if(productionChanged){persist();lastSave=now;}
  if(!visualLab?.active&&!homeLife.isOpen()&&!firstTips.isOpen()&&!story?.isOpen()&&!vacuumUI.isOpen()&&!testUI.isOpen()&&!areaUI.isOpen()&&!placementUI.isOpen()&&!craftingUI.isOpen()&&!settingsUI.isOpen())step(state,fusionPlaying(state)?{suction:false}:{x,z,aimX:stick.aimX,aimZ:stick.aimZ,analog:stick.id!==null,sprint:keys.has('ShiftLeft')||keys.has('ShiftRight')||touchSprint},dt);else {state.events=[];if(areaUI.isOpen()&&!state.testWorld.enabled)advanceStorageTransfers(state,dt);}
  updateCanopyTarget(state.player);livingView.update(state);craftingUI.update(now);areaUI.update(now);computerUI.update();updateUI();vacuumUI.update();testUI.update();sunnyView.update(state,areaUI.nearby,reduced,now);coastView.update(state);iceView.update(state);sceneryView.update(state);volcanoView.update(state);caveView.update(state);fishingView.update(state,camera);craftingView.update(state,now);marketView.update(state);blueprintView.update(state);hedgeView.update(state);homeView.update(state);homeSurroundings.update(state);if(inHome(state)||inNursery(state)||inCave(state)){sceneryView.root.visible=false;sunnyView.root.visible=iceView.root.visible=volcanoView.root.visible=coastView.root.visible=fishingView.root.visible=marketView.root.visible=blueprintView.root.visible=false;}
  if(now-lastSave>2000){persist();lastSave=now;}
  gameAudio.update(state,vacuumUI.isOpen()||testUI.isOpen()||areaUI.isOpen()||placementUI.isOpen()||craftingUI.isOpen()||settingsUI.isOpen());
  const p=state.player,t=state.time,b=state.blob;nozzle.scale.set(1+(state.suctionActive&&!reduced?Math.sin(t*45)*.007:0),1,1);
  character.visible=!state.buildReturn;{const noVac=Boolean(state.charging)||Boolean(state.intro&&!state.builtSites?.introVacuum);nozzle.visible=!noVac;character.userData.body.userData.hose.visible=!noVac;}character.position.set(p.x,p.y??0,p.z);character.rotation.y=p.angle;character.rotation.z=state.round?.waking?Math.PI/2:0;{const k=portalJumpScale(state);character.userData.baseScale??=character.scale.x;character.scale.setScalar(character.userData.baseScale*k);if(k<1)character.rotation.y+=state.time*18;}
  const body=character.userData.body;body.position.y=p.moving&&!reduced?Math.sin(t*(p.sprinting?18:12))*.035:Math.sin(t*2)*.012;
  character.userData.feet.forEach((f,i)=>{f.position.z=p.moving&&!reduced?Math.sin(t*(p.sprinting?18:12)+i*Math.PI)*.16:0;});
  characterPolish.update(state,reduced);updateStackMotion(p,t,dt);
  leafRenderer.update(state,t,reduced);
  const inTest=state.testWorld.enabled,indoors=inHome(state)||inNursery(state)||inCave(state);for(const object of forestScenery)object.visible=!inTest;for(const batch of leafRenderer.batches)batch.visible=!inTest&&!indoors;leafRenderer.returning.visible=leafRenderer.flying.visible=!inTest&&!indoors;leafRenderer.wind.visible=!inTest&&!indoors&&!insideBuilding(state);
  updateAirflow(p,t);if(!state.forestBlobs)updateBlob(b,t);updateDeliveries(t);challengeView.update(state,reduced);testWorldView.update(state);playerShadow.visible=!state.buildReturn;playerShadow.position.set(p.x,(groundAt(state,p.x,p.z)??-2)+.04,p.z);
  forestBlobView.update(state,nozzle,stack,(stackMeshes[stackLayerCount(suctionCount(state),capacityFor(effectiveVacuum(state)))-1]?.position.y??0),reduced);blobFxView??=new BlobFxView(scene);blobFxView.update(state);if(inHome(state)&&!state.forestBlobs?.snail)forestBlobView.root.visible=false;blob.visible=blobAura.visible=!inTest&&!state.forestBlobs;if(inTest||state.forestBlobs){blobShadow.visible=blobGlow.visible=false;blobLight.intensity=0;}for(const [id,item]of challengeView.items)item.root.visible=!inTest&&state.obstacles.some(o=>o.id===id);
  decor.forEach(m=>{const d=m.userData;m.position.set(d.x+Math.sin(t*.3+d.phase)*.3,.7+Math.sin(t*.8+d.phase)*.4,d.z);m.material.emissive.set('#aeb968');m.material.emissiveIntensity=.4;});
  for(let i=puffs.length-1;i>=0;i--){const f=puffs[i];f.life-=dt;f.m.position.x+=f.vx*dt;f.m.position.y+=f.vy*dt;f.m.position.z+=f.vz*dt;f.vy-=dt*4;f.m.scale.setScalar(Math.max(0,f.life/.7));if(f.life<=0){scene.remove(f.m);f.m.geometry.dispose();puffs.splice(i,1);}}
  const mobile=innerWidth/innerHeight<.8,follow=1;
  const camFocus=state.placementCamera||state.buildReturn?null:state.snailIntro&&state.time-state.snailIntro.at<3.6?{x:state.snailIntro.x,z:state.snailIntro.z,zoom:1.4}:story?.focus()??firstTips.focus()??coreFocus(state)??homeLife.focus(),camK=1-Math.exp(-dt*3.2);camShift.x+=((camFocus?camFocus.x-p.x:0)-camShift.x)*camK;camShift.z+=((camFocus?camFocus.z-p.z:0)-camShift.z)*camK;camShift.zoom+=((camFocus?.zoom??1)-camShift.zoom)*camK;
  const targetX=state.placementCamera?.x??(fusionPlaying(state)?nurseryBounds(state).x:state.buildReturn&&inHome(state)?-150:p.x*follow),targetZ=state.placementCamera?.z??(fusionPlaying(state)?nurseryBounds(state).z:state.buildReturn&&inHome(state)?-120:p.z*follow);camera.position.set(targetX+camShift.x,22+(p.y??0)*.6,targetZ+camShift.z+19);camera.lookAt(targetX+camShift.x,(p.y??0)*.6,targetZ+camShift.z-1.4);
  const targetZoom=state.buildReturn?(indoors?1:.65):(inCave(state)?roomOf(state).zoom:inNursery(state)?NURSERY_ROOM.zoom:homeCameraZoom(state))??(insideBuilding(state)?1.3:1);const nextZoom=camera.zoom+(targetZoom*camShift.zoom*preferences(state).zoom-camera.zoom)*(1-Math.exp(-dt*4));if(Math.abs(nextZoom-camera.zoom)>.00001){camera.zoom=nextZoom;camera.updateProjectionMatrix();}
  camera.updateMatrixWorld();goalsUI.update(camera,innerWidth,innerHeight);saleFlight?.update(state,camera,innerWidth,innerHeight);fishAim?.update();relicView?.update(state);comicFx?.update();homeLife.update(camera,innerWidth,innerHeight);firstTips.update();catchCard.update();missionBoard?.update();siteView?.update(state);storyNotes?.update(state);coreView?.update(state);story?.update(state,dt,firstTips.isOpen());siteUI?.update();butterflyView.update(state,camera,innerWidth,innerHeight);pickupFeedback.update(state,camera,innerWidth,innerHeight);placementUI.update(camera);craftingUI.position(camera,innerWidth,innerHeight);nurseryTouch.update(camera,innerWidth,innerHeight,now);areaUI.position(camera,innerWidth,innerHeight);groundRadarView.update(state,camera,reduced);
  const lightFrame=daylight.update(state.time+(state.daylightOffset??0),state.testWorld.enabled);if(worldPolish?.root)worldPolish.root.visible=!visualLab?.active&&!state.testWorld.enabled&&!state.home?.interior&&!state.nursery?.interior&&!inCave(state);worldPolish?.update(state.time);applyPolishLight(daylight,renderer,!visualLab?.active||visualLab.polished,lightFrame.night,lightFrame.phase);volcanoView?.updateLight(state,lightFrame.night,daylight);const sunlight=daylight.sun;sunlight.position.x+=p.x;sunlight.position.y+=p.y??0;sunlight.position.z+=p.z;sunlight.target.position.set(p.x,p.y??0,p.z);sunlight.target.updateMatrixWorld();if(!visualLab?.active&&state.forestBlobs)(portalView??=new PortalView(scene)).update(state,renderer,character);visualLab?.beginRender();renderer.render(scene,camera);visualLab?.afterFrame(timestamp,performance.now()-cpuStart);
}
document.addEventListener('dev-reset',()=>{resetGame();});
function resetGame(){const fresh=createState({vacuumId:'ground',area:'sunny',leafCount:13200});furnishHome(fresh);fresh.round=createRound();fresh.suctionEnabled=false;startIntro(fresh);bedStart(fresh);if(!resetSavedGame(fresh,gameStorage))return false;state=fresh;clearInput();location.reload();return true;}
function resetStick(){stick.x=stick.z=stick.aimX=stick.aimZ=0;stick.id=null;const j=$('joystick');j.classList.remove('active');j.style.left=j.style.top='';j.firstElementChild.style.transform='translate(0,0)';}
function clearInput(){keys.clear();resetStick();touchSprint=false;}
function bindControls(){
  addEventListener('keydown',e=>{if(homeLife?.isOpen()||vacuumUI?.isOpen()||testUI?.isOpen()||areaUI?.isOpen()||placementUI?.isOpen()||craftingUI?.isOpen()||settingsUI?.isOpen())return;if(e.target.matches?.('input,select,textarea'))return;if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);}});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();previous=0;});
  const canvas=$('world');$('joystick').style.setProperty('--stick-size',JOYSTICK.radius*2+'px');canvas.addEventListener('pointerdown',e=>{if(homeLife?.isOpen()||stick.id!==null||vacuumUI.isOpen()||testUI.isOpen()||areaUI?.isOpen()||placementUI?.isOpen()||craftingUI?.isOpen()||settingsUI?.isOpen())return;canvas.focus({preventScroll:true});stick.id=e.pointerId;stick.startX=e.clientX;stick.startY=e.clientY;canvas.setPointerCapture(e.pointerId);const j=$('joystick');j.classList.add('active');j.style.left=e.clientX-JOYSTICK.radius+'px';j.style.top=e.clientY-JOYSTICK.radius+'px';j.firstElementChild.style.transform='translate(0,0)';});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId!==stick.id)return;const result=joystickInput(e.clientX-stick.startX,e.clientY-stick.startY);Object.assign(stick,{x:result.x,z:result.z,aimX:result.aimX,aimZ:result.aimZ});$('joystick').firstElementChild.style.transform=`translate(${result.knobX}px,${result.knobZ}px)`;});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,e=>{if(e.pointerId===stick.id)resetStick();});
  $('sprint').addEventListener('pointerdown',e=>{e.preventDefault();touchSprint=true;$('sprint').setPointerCapture(e.pointerId);});for(const event of ['pointerup','pointercancel','lostpointercapture'])$('sprint').addEventListener(event,()=>touchSprint=false);
  $('reset').addEventListener('click',()=>{vacuumUI.close();document.getElementById('test-open').click();document.querySelector('[data-reset-open]').click();});
  $('sound').addEventListener('click',()=>{soundOn=preferences(state).sound=!preferences(state).sound;gameAudio.start();persist();$('sound').setAttribute('aria-pressed',String(soundOn));$('sound-text').textContent=soundOn?'Ton an':'Ton aus';if(soundOn)tone(520,.12);if(!vacuumUI.isOpen())$('world').focus({preventScroll:true});});
}
try{init();}catch(error){console.error(error);$('loading')?.remove();$('error').hidden=false;$('error-text').textContent='Bitte öffne das Spiel in einem aktuellen Browser mit aktiviertem WebGL. '+error.message;}

