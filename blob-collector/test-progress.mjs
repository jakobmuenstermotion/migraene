import {addMaterial,addNormalMaterial,capacityFor} from './inventory.mjs';
import {BUILDINGS} from './living-config.mjs';
import {WORKSHOPS,CRAFT_RECIPES,FURNITURE} from './crafting-config.mjs';
import {VACUUM_BUILD_COSTS,UPGRADE_COSTS} from './factory-config.mjs';
import {SKILL_TREES,effectiveVacuum} from './vacuum-skills.mjs';
import {factoryState} from './factory.mjs';
import {craftState} from './crafting.mjs';
import {HOME_EXPANSIONS,buyHomeExpansion} from './home-expansion.mjs';
import {SUNNY} from './sunny-area.mjs';
import {buildingBuilt} from './homebase-build.mjs';
// Testlabor: das Spiel in Etappen durchspielen. „Material“ legt genau das Nötige bereit, „Erledigen“ macht die Etappe samt allem davor fertig.
export const TEST_STAGES=[
 {id:'press',name:'Materialpresse',ops:[['building','press']]},
 {id:'vacuumshop',name:'Saugerwerkstatt',ops:[['workshop','vacuumshop']]},
 {id:'woodshop',name:'Holzwerkstatt',ops:[['workshop','woodshop']]},
 {id:'nursery',name:'Blobstation',ops:[['building','nursery']]},
 {id:'focus',name:'Fernsauger, Anker I → Steinbach',ops:[['vacuum','focus'],['upgrade','focus','anchor1']],go:{x:1.7,z:-28,angle:Math.PI}},
 {id:'moss',name:'Steinwerkstatt, Grabtiefe I → Mooswald',ops:[['workshop','stoneshop'],['upgrade','ground','depth1'],['route','routeRoots']],go:{x:28.6,z:24.1,angle:.8}},
 {id:'fan',name:'Fächersauger → Küste',ops:[['vacuum','fan'],['route','routeLog']],go:{x:37.05,z:-2.9,angle:Math.PI/2}},
 {id:'makers',name:'Natur, Tüftler, Nähmaschine',ops:[['workshop','natureshop'],['workshop','tinkershop'],['sewing']]},
 {id:'power',name:'Kraftsauger',ops:[['vacuum','power']]},
 {id:'wind',name:'Grabtiefe II → Windterrasse',ops:[['upgrade','ground','depth2'],['route','routeWindRoots']],go:{x:58,z:-37,angle:0}},
 {id:'cave',name:'Hindernisse I → Höhle',ops:[['upgrade','power','size1'],['route','routeCave']],go:{x:50,z:-16.7,angle:Math.PI}},
 {id:'forge',name:'Schmiede',ops:[['workshop','forge']]},
 {id:'ice',name:'Hindernisse I → Eistal',ops:[['upgrade','power','size1'],['route','routeIceWall']],go:{x:51.5,z:-37.4,angle:-Math.PI/2}},
 {id:'tree',name:'Anker IV → Riesenbaum',ops:[['upgrade','focus','anchor4']],go:{x:-42.5,z:1,angle:Math.PI}},
 {id:'volcano',name:'Hindernisse II → Riff, Vulkan',ops:[['upgrade','power','size2'],['route','routeReef'],['route','routeVolcano']],go:{x:-60,z:20,angle:0}},
 {id:'shortcuts',name:'Abkürzungen Vulkan, Eistal',ops:[['route','routeVolcanoShortcut'],['route','routeIceStairs']]},
 {id:'vortex',name:'Wirbelsauger',ops:[['vacuum','vortex']]},
 {id:'house',name:'Hausanbau, beide Stufen',ops:[['home',1],['home',2]]}
];
const prereqs=(vac,id,out=new Set())=>{const n=SKILL_TREES[vac].nodes.find(x=>x.id===id);if(!n||out.has(id))return out;out.add(id);for(const r of [n.requires??[]].flat())prereqs(vac,r,out);return out;};
const isUnlocked=(s,vac,id)=>s.progression[vac].unlocked.includes(id);
function opDone(s,[op,a,b]){const c=craftState(s);if(op==='building')return buildingBuilt(s,a);if(op==='workshop')return Boolean(c.workshops[a]?.owned&&s.placements?.[a]);if(op==='sewing')return c.sewingBuilt===true||(c.loose.sewingmachine??0)>0||Object.keys(s.placements??{}).some(k=>k.startsWith('sewingmachine_'));if(op==='vacuum')return factoryState(s).owned.includes(a);if(op==='upgrade')return isUnlocked(s,a,b);if(op==='route')return s.obstacles.find(o=>o.id===a)?.cleared===true;if(op==='home')return (s.home?.expansion|0)>=a;return false;}
export const stageDone=(s,stage)=>stage.ops.every(o=>opDone(s,o));
function opNeeds(s,[op,a,b]){if(opDone(s,[op,a,b]))return [];if(op==='building')return [[BUILDINGS[a].cost,BUILDINGS[a].coins]];if(op==='workshop')return [[WORKSHOPS[a].cost,WORKSHOPS[a].coins]];if(op==='sewing')return [[CRAFT_RECIPES.sewing.inputs,0]];if(op==='vacuum')return [[VACUUM_BUILD_COSTS[a].materials,VACUUM_BUILD_COSTS[a].coins]];if(op==='upgrade')return [...prereqs(a,b)].filter(id=>!isUnlocked(s,a,id)).map(id=>[UPGRADE_COSTS[a]?.[id]?.materials??{},UPGRADE_COSTS[a]?.[id]?.coins??0]);if(op==='route'){const o=s.obstacles.find(o=>o.id===a);return o?.build?[[o.build.cost,o.build.coins??0]]:[];}if(op==='home'){const e=HOME_EXPANSIONS[a-1];return e?[[e.cost,e.coins]]:[];}return [];}
export function stageNeeds(s,stage){const materials={};let coins=0;for(const op of stage.ops)for(const [m,c]of opNeeds(s,op)){coins+=c??0;for(const [k,n]of Object.entries(m??{}))materials[k]=(materials[k]??0)+n;}return {materials,coins};}
export function giveMaterial(s,kind,n,target='bag'){if(target==='storage'){addMaterial(s,kind,n,'storage');return n;}const before=s.inventory.bag[kind]??0;if(target==='normal')addNormalMaterial(s,kind,n);else addMaterial(s,kind,n,'bag',capacityFor(effectiveVacuum(s)));const got=(s.inventory.bag[kind]??0)-before;if(got<n)addMaterial(s,kind,n-got,'storage');return n;}
export function giveStage(s,stage){const {materials,coins}=stageNeeds(s,stage);for(const [k,n]of Object.entries(materials))giveMaterial(s,k,n);s.inventory.coins+=coins;return {materials,coins};}
export function placeBuilding(s,id){s.buildings??={};s.placements??={};s.buildings[id]=true;s.placements[id]??={...(id==='press'?SUNNY.press:SUNNY.blobStation),rotation:0};s.layoutRevision=(s.layoutRevision??0)+1;}
export function placeWorkshop(s,id){const c=craftState(s),spec=WORKSHOPS[id];s.placements??={};c.workshops[id].owned=true;s.placements[id]??={x:spec.x,z:spec.z,rotation:0};s.layoutRevision=(s.layoutRevision??0)+1;}
export function unlockVacuum(s,id){const f=factoryState(s);if(!f.owned.includes(id))f.owned.push(id);s.skillRevision=(s.skillRevision??0)+1;}
export function lockVacuum(s,id){if(id==='ground')return;const f=factoryState(s);f.owned=f.owned.filter(v=>v!==id);s.skillRevision=(s.skillRevision??0)+1;}
export function unlockUpgrade(s,vac,id){for(const n of prereqs(vac,id))if(!isUnlocked(s,vac,n))s.progression[vac].unlocked.push(n);s.skillRevision=(s.skillRevision??0)+1;}
export function setRoute(s,id,open){const o=s.obstacles.find(o=>o.id===id);if(!o)return false;o.cleared=open;o.clearedAt=open?s.time:undefined;if(!open)o.progress=0;s.layoutRevision=(s.layoutRevision??0)+1;return true;}
function doOp(s,op){if(opDone(s,op))return;const [kind,a,b]=op;if(kind==='building')placeBuilding(s,a);if(kind==='workshop')placeWorkshop(s,a);if(kind==='sewing'){const c=craftState(s);c.sewingBuilt=true;c.loose.sewingmachine=(c.loose.sewingmachine??0)+1;}if(kind==='vacuum')unlockVacuum(s,a);if(kind==='upgrade')unlockUpgrade(s,a,b);if(kind==='route')setRoute(s,a,true);if(kind==='home'){const e=HOME_EXPANSIONS[a-1];if(e){for(const [k,n]of Object.entries(e.cost))giveMaterial(s,k,n);s.inventory.coins+=e.coins;buyHomeExpansion(s);}}}
export function finishStage(s,id){for(const stage of TEST_STAGES){for(const op of stage.ops)doOp(s,op);if(stage.id===id)break;}}
// Werkstätten und Presse fertig: laufende Aufträge enden jetzt.
export function finishJobs(s,now=Date.now()){for(const w of Object.values(craftState(s).workshops))for(const slot of ['job','job2','job3'])if(w[slot])w[slot].endsAt=now;for(const slot of ['job','job2','job3'])if(s.press?.[slot]?.endsAt)s.press[slot].endsAt=now;}
export function allFurniture(s,n=1){const c=craftState(s);for(const id of Object.keys(FURNITURE))if(!FURNITURE[id].station||id==='sewingmachine')c.loose[id]=(c.loose[id]??0)+n;}
