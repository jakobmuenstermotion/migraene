import {BUTTERFLIES} from './butterflies.mjs';
import {FISH} from './fishing.mjs';
import {BLOB_SPECIES} from './forest-blob-config.mjs';
import {buildingBuilt} from './homebase-build.mjs';
import {factoryState} from './factory.mjs';
import {craftState} from './crafting.mjs';
import {blobHearts} from './blob-friends.mjs';
import {comfortStats} from './comfort.mjs';
import {roundCoins} from './game-balance.mjs';
// Pinnwand am Haus (Jakob 3.11., alle Zahlen Testwerte): Aufgaben mit Münzbelohnung. Die ersten schafft man schnell,
// die letzten erst spät. Es hängen immer höchstens fünf offene Zettel; eingelöste machen Platz für die nächsten.
const n=x=>Math.max(0,Number(x)||0);
const got=(s,k)=>n(s.stats?.[k]);
const roster=s=>s.forestBlobs?.roster??[];
const fishKinds=s=>Object.values(s.fishing?.book??{}).filter(b=>b.caught>0).length;
const flyKinds=s=>Object.values(s.butterflies?.book??{}).filter(b=>b.caught>0).length;
const flyCaught=s=>Object.values(s.butterflies?.book??{}).reduce((a,b)=>a+n(b.caught),0);
const areas=s=>s.forestBlobs?.unlocked??[];
const plans=s=>Object.keys(craftState(s).blueprints??{}).length;
const BASE_BLOBS=['moss','forest','sand','tide','snow','crystal','ash','lava'];
export const MISSIONS=[
 {id:'leaf5000',title:'Sauge 5.000 Blätter ein',goal:5000,reward:60,now:s=>got(s,'leaf')},
 {id:'wood100',title:'Sauge 100 Holz ein',goal:100,reward:50,now:s=>got(s,'wood')},
 {id:'firstblob',title:'Fange deinen ersten Blob',goal:1,reward:90,now:s=>roster(s).length},
 {id:'firstfish',title:'Fange deinen ersten Fisch',goal:1,reward:60,now:s=>fishKinds(s)},
 {id:'firstplan',title:'Finde einen Bauplan',goal:1,reward:30,now:s=>plans(s)},
 {id:'fly3',title:'Fange 3 Schmetterlinge',goal:3,reward:80,now:s=>flyCaught(s)},
 {id:'pet',title:'Ein Blob mit zwei Herzen',goal:2,reward:70,now:s=>Math.max(0,...roster(s).map(blobHearts))},
 {id:'fuse',title:'Fusioniere einen Blob',goal:1,reward:150,now:s=>got(s,'fusions')},
 {id:'stone300',title:'Sauge 300 Steine ein',goal:300,reward:120,now:s=>got(s,'stone')},
 {id:'furniture5',title:'Stelle 5 verschiedene Möbel auf',goal:5,reward:200,now:s=>comfortStats(s).kinds},
 {id:'fish5',title:'Fange 5 verschiedene Fische',goal:5,reward:200,now:s=>fishKinds(s)},
 {id:'coast',title:'Erreiche die Sonnenküste',goal:1,reward:250,now:s=>+areas(s).includes('coast')},
 {id:'leaf25k',title:'Sauge 25.000 Blätter ein',goal:25000,reward:300,now:s=>got(s,'leaf')},
 {id:'wood1000',title:'Sauge 1.000 Holz ein',goal:1000,reward:300,now:s=>got(s,'wood')},
 {id:'plans5',title:'Finde 5 Baupläne',goal:5,reward:350,now:s=>plans(s)},
 {id:'blobkinds',title:'Fange jeden der 8 Grundblobs einmal',goal:BASE_BLOBS.length,reward:600,now:s=>BASE_BLOBS.filter(k=>(s.forestBlobs?.seen??[]).includes(k)).length},
 {id:'fly10',title:'Finde 10 Schmetterlingsarten',goal:10,reward:400,now:s=>flyKinds(s)},
 {id:'ice',title:'Erreiche das Eistal',goal:1,reward:600,now:s=>+areas(s).includes('ice')},
 {id:'hearts5',title:'Ein Blob mit fünf Herzen',goal:5,reward:700,now:s=>Math.max(0,...roster(s).map(blobHearts))},
 {id:'volcano',title:'Erreiche den Vulkan',goal:1,reward:900,now:s=>+areas(s).includes('volcano')},
 {id:'giant',title:'Ziehe einen riesigen Blob groß',goal:1,reward:1100,now:s=>+roster(s).some(b=>b.stage>=4)},
 {id:'leaf100k',title:'Sauge 100.000 Blätter ein',goal:100000,reward:1500,now:s=>got(s,'leaf')},
 {id:'allvac',title:'Besitze alle fünf Sauger',goal:5,reward:1800,now:s=>factoryState(s).owned.length},
 {id:'blobsall',title:'Hab alle Blobarten einmal gehabt',get goal(){return Object.keys(BLOB_SPECIES).length},reward:1500,now:s=>new Set([...(s.forestBlobs?.seen??[]),...roster(s).map(b=>b.species),...(s.forestBlobs?.snail?['snail']:[])].filter(k=>BLOB_SPECIES[k])).size},
 {id:'flyall',title:'Finde alle Schmetterlingsarten',get goal(){return Object.keys(BUTTERFLIES).length},reward:2000,now:s=>flyKinds(s)},
 {id:'fishall',title:'Fange alle Fischarten',get goal(){return Object.keys(FISH).length},reward:2500,now:s=>fishKinds(s)}
];
export const BOARD_SIZE=5;
const claimed=s=>(s.missions??={claimed:[]}).claimed;
export const missionProgress=(s,m)=>Math.min(m.goal,m.now(s));
export function boardMissions(s){const done=claimed(s);return MISSIONS.filter(m=>!done.includes(m.id)).slice(0,BOARD_SIZE);}
export const readyCount=s=>boardMissions(s).filter(m=>missionProgress(s,m)>=m.goal).length;
export function claimMission(s,id){const m=boardMissions(s).find(m=>m.id===id);if(!m||missionProgress(s,m)<m.goal)return false;claimed(s).push(id);s.inventory.coins=roundCoins(s.inventory.coins+m.reward);s.events?.push('caught');return true;}
// Eingesaugte Mengen zählen (nur was der Sauger aufnimmt).
export function countCollect(s,kind,qty){if(!['leaf','wood','stone'].includes(kind)||!(qty>0))return;const st=s.stats??={};st[kind]=n(st[kind])+qty;}
export const missionSnapshot=s=>({claimed:[...claimed(s)],stats:{...(s.stats??{})}});
export function restoreMissions(s,data){const ids=new Set(MISSIONS.map(m=>m.id));s.missions={claimed:(Array.isArray(data?.claimed)?data.claimed:[]).filter(id=>ids.has(id))};s.stats={};for(const k of ['leaf','wood','stone','fusions'])if(n(data?.stats?.[k]))s.stats[k]=n(data.stats[k]);}
