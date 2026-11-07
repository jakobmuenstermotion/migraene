import {softCoins,cheaper} from './coin-curve.mjs';
import {helperSpeed} from './special-blobs.mjs';
import {canBuildWithStock,payConstruction} from './construction-stock.mjs';
import {placeableType} from './crafting-config.mjs';
import {GAME_BALANCE} from './game-balance.mjs';

// Two test-price stages per branch, as agreed in the material plan.
// Neugestaltung (Jakob 29.10.): späte Stufen nutzen die neuen Zwischenprodukte (Uhrwerk, Beschläge, Frostbalken,
// Eisquader, Mosaikfliesen, Polsterstoff); die Leitung aus der Wüste ist nicht mehr nötig.
export const WORKSHOP_UPGRADE_COSTS={
 woodshop:{speed:[[{woodpanel:2,board:2},100],[{clockwork:1,beam:2},700]],efficiency:[[{resin:2,board:2},150],[{filtermodule:2,reinforcedpanel:2},800]],batch:[[{board:4,rope:2},100],[{frostbeam:2,composite:2,ironfitting:2},700]]},
 stoneshop:{speed:[[{board:2,stoneslab:2},150],[{gear:2,stonebrick:2},900]],efficiency:[[{resin:2,stoneslab:2},200],[{mosaictile:2,filtermodule:2},1000]],batch:[[{stoneslab:4,board:2},150],[{icequader:2,stonebrick:2},900]]},
 natureshop:{speed:[[{board:2,fibre:2},200],[{gear:2,fabric:2},1000]],efficiency:[[{resin:2,essence:2},250],[{upholstery:2,extract:2},1100]],batch:[[{fibre:4,rope:2},200],[{composite:2,fabric:2},1000]]},
 tinkershop:{speed:[[{mechanical:2,board:2},300],[{clockwork:2,optical:1},1500]],efficiency:[[{filtermodule:2,resin:2},350],[{optical:2,filtermodule:2},1600]],batch:[[{beam:2,mechanical:2},300],[{reinforcedpanel:2,gear:2,ironfitting:2},1500]]},
 // Neugestaltung: Schmiede. Effizienz spart wie überall Zutaten, nicht Brennstoff.
 forge:{speed:[[{stonebrick:2,ironbar:2},400],[{clockwork:1,springsteel:2},1500]],efficiency:[[{ironfitting:2,stoneslab:2},450],[{frostglass:2,springsteel:1},1600]],batch:[[{beam:2,ironfitting:2},400],[{frostbeam:2,icequader:2},1500]]},
 sewingmachine:{speed:[[{fibre:2,rope:1},100],[{gear:2,fabric:2},800]],efficiency:[[{fibre:2,resin:1},150],[{filtermodule:2,fabric:2},900]],batch:[[{board:2,rope:2},100],[{beam:2,fabric:2},800]]}
};
// Neugestaltung (Jakob 30.10.): zweiter gleichzeitiger Auftrag. Voraussetzung Vorrat 1, damit beide Rezepte Platz haben.
const PARALLEL_COSTS={woodshop:[{beam:4,gear:2},600],stoneshop:[{stonebrick:4,gear:2},700],natureshop:[{fabric:4,gear:2},800],tinkershop:[{mechanical:4,gear:3},900],forge:[{ironfitting:3,gear:2},900],sewingmachine:[{fabric:2,gear:2},600]};
for(const [id,cost] of Object.entries(PARALLEL_COSTS))WORKSHOP_UPGRADE_COSTS[id].parallel=[cost];
// Vorrang: zuerst Angetipptes ist 1, das nächste 2. Tippen auf 2 tauscht, Tippen auf 1 nimmt es heraus (2 rückt auf), ein drittes ersetzt 2.
// Jakob 1.11.: bis zu drei Aufträge. Tippen auf 2 oder 3 rückt eins hoch, ein weiteres Rezept ersetzt den letzten Platz.
export const JOB_SLOTS=['job','job2','job3'];
const RANKS=['preferred','second','third'];
export const priorityList=o=>RANKS.map(k=>o[k]).filter(Boolean);
const writePriority=(o,list)=>RANKS.forEach((k,i)=>{if(i===0||o[k]!==undefined||list[i])o[k]=list[i]??null;});
export function pickPriority(owner,id,slots=2){const list=priorityList(owner),i=list.indexOf(id);if(i===0)list.shift();else if(i>0)[list[i-1],list[i]]=[list[i],list[i-1]];else if(list.length<slots)list.push(id);else list[slots-1]=id;writePriority(owner,list);}
export function addPriority(owner,id,slots=1){const list=priorityList(owner);if(list.includes(id))return;if(list.length<slots)list.push(id);else list[slots-1]=id;writePriority(owner,list);}
export const dropPriority=(owner,id)=>writePriority(owner,priorityList(owner).filter(k=>k!==id));
export const runsRecipe=(owner,id)=>JOB_SLOTS.some(k=>owner[k]?.recipe===id);
export function compactJobs(owner){const jobs=JOB_SLOTS.map(k=>owner[k]).filter(Boolean);JOB_SLOTS.forEach((k,i)=>{owner[k]=jobs[i]??null;});}
export function workshopUpgrades(w){w.upgrades??={speed:0,efficiency:0,batch:0,parallel:0,night:0};w.upgrades.parallel??=0;w.upgrades.night??=0;return w.upgrades;}
export function upgradeCost(id,kind,rank){return WORKSHOP_UPGRADE_COSTS[placeableType(id)]?.[kind]?.[rank-1]??null;}
export function buyWorkshopUpgrade(s,id,kind,rank){
 const w=s.crafting?.workshops?.[id],cost=upgradeCost(id,kind,rank);
 if(!w||!s.placements?.[id]||!cost||(kind==='parallel'||kind==='night')&&/^(sewingmachine|stove)/.test(id)||workshopUpgrades(w)[kind]!==rank-1||(kind==='parallel'||kind==='night')&&w.upgrades.batch<1||!canBuildWithStock(s,cost[0],cost[1]))return false;
 if(!payConstruction(s,cost[0],cost[1]))return false;
 w.upgrades[kind]=rank;
 return true;
}
export function adjustedInputs(recipe,w){const factor=[1,.95,.9][workshopUpgrades(w).efficiency];return Object.fromEntries(Object.entries(recipe.inputs).map(([k,n])=>[k,Math.max(1,Math.ceil(n*factor))]));}
export function workshopDuration(recipe,w,s){return recipe.seconds*GAME_BALANCE.productionMultiplier*(s.productionTimeScale??1)*[1,.85,.7][workshopUpgrades(w).speed]/helperSpeed(s,Object.entries(s.crafting?.workshops??{}).find(([,o])=>o===w)?.[0]);}

for(const t of Object.values(WORKSHOP_UPGRADE_COSTS))for(const l of Object.values(t))for(const c of l){c[1]=softCoins(c[1]);cheaper(c[0]);}

// Jakob 1.11.: Lager und Aufträge früh erreichbar: drei Lagerstufen je +500, zwei Stufen je ein Auftrag mehr. Testwerte, nach der allgemeinen Preissenkung.
const EARLY={
 woodshop:{batch:[[{board:3,rope:1},50],[{board:6,beam:2},150],[{beam:4,woodpanel:2},300]],parallel:[[{beam:2,rope:2},150],[{beam:4,woodpanel:2},400]]},
 stoneshop:{batch:[[{stoneslab:3,board:2},60],[{stoneslab:6,stonebrick:2},150],[{stonebrick:5,beam:2},300]],parallel:[[{stonebrick:2,board:2},150],[{stonebrick:4,beam:2},400]]},
 natureshop:{batch:[[{fibre:3,rope:1},75],[{fibre:6,resin:2},175],[{fabric:3,resin:3},325]],parallel:[[{fibre:4,resin:2},175],[{fabric:3,extract:2},425]]},
 tinkershop:{batch:[[{board:3,mechanical:1},100],[{mechanical:3,beam:2},225],[{mechanical:4,gear:2},400]],parallel:[[{mechanical:2,filtermodule:1},225],[{gear:3,filtermodule:2},500]]},
 forge:{batch:[[{beam:2,stonebrick:2},125],[{stonebrick:4,ironbar:2},250],[{ironfitting:3,stonebrick:3},400]],parallel:[[{stonebrick:3,ironbar:1},250],[{ironfitting:3,gear:2},500]]},
 sewingmachine:{batch:[[{board:2,rope:1},50],[{fibre:3,rope:2},125],[{fabric:2,beam:2},275]],parallel:[[{fibre:2,rope:2},125],[{fabric:2,gear:1},350]]}
};
for(const [id,tree]of Object.entries(EARLY))Object.assign(WORKSHOP_UPGRADE_COSTS[id],tree);
// Jakob 1.11.: Nachtschicht: beim Schlafen läuft die Werkstatt weiter, bis ihr Vorrat aufgebraucht ist (Testwerte).
const NIGHT={woodshop:[{beam:4,rope:3},250],stoneshop:[{stonebrick:4,rope:2},250],natureshop:[{fabric:2,resin:4},300],tinkershop:[{mechanical:4,gear:2},400],forge:[{ironfitting:2,stonebrick:4},400],sewingmachine:[{fabric:2,rope:3},225]};
for(const [id,cost]of Object.entries(NIGHT))WORKSHOP_UPGRADE_COSTS[id].night=[cost];
// Jakob 3.11.: Münzen aller Werkstatt-Verbesserungen noch etwas niedriger (×0,7, auf 5 gerundet, mindestens 5). Testwerte.
export const WORKSHOP_COIN_CUT=.7;
for(const t of Object.values(WORKSHOP_UPGRADE_COSTS))for(const l of Object.values(t))for(const c of l)c[1]=Math.max(5,Math.round(c[1]*WORKSHOP_COIN_CUT/5)*5);
// Jakob 3.11.: frühe Werkstattstufen abwechslungsreicher (Rohstoffe statt immer Bretter/Platten). Testwerte.
const VARIETY={stoneshop:{speed:[{stoneslab:2,stone:10}],batch:[{stoneslab:3,moss:10}]},natureshop:{speed:[{fibre:2,mushroom:10}],batch:[{fibre:3,commonflower:15}]},tinkershop:{batch:[{mechanical:1,resin:2}]},sewingmachine:{batch:[{fibre:2,commonflower:10}]},woodshop:{batch:[{board:2,leaf:40}]}};
for(const [w,t]of Object.entries(VARIETY))for(const [k,l]of Object.entries(t))l.forEach((m,i)=>{if(WORKSHOP_UPGRADE_COSTS[w]?.[k]?.[i])WORKSHOP_UPGRADE_COSTS[w][k][i][0]=m;});

// Jakob 3.11.: Der Herd lässt sich wie die Nähmaschine verbessern (gleiche Testpreise).
WORKSHOP_UPGRADE_COSTS.stove=structuredClone(WORKSHOP_UPGRADE_COSTS.sewingmachine);

// Jakob 3.11.: Steinwerkstatt-Vorrat I braucht den neuen Steinsockel.
WORKSHOP_UPGRADE_COSTS.stoneshop.batch[0][0]={stonesocket:1,moss:10};
// Jakob 3.11. (wie bei der Presse, Testwerte): Vorrat I kostet viel vom Grundstoff der Werkstatt, die übrigen Stufen
// brauchen öfter Sachen aus anderen Werkstätten, vor allem Steinsachen. Münzen unverändert. Der Herd bekommt eigene Stufen.
const CROSS={
 woodshop:{batch:[{wood:100,stoneslab:2},{beam:2,stoneslab:3}],parallel:[{beam:2,stonesocket:1}],night:[{beam:3,stonebrick:2}],efficiency:[{resin:2,stoneslab:2}]},
 stoneshop:{batch:[{stone:100,board:2}],parallel:[{stonebrick:2,beam:1}],night:[{stonebrick:3,resin:2}],efficiency:[{resin:2,woodpanel:1}]},
 natureshop:{batch:[{moss:100,stonesocket:1},{fibre:4,stoneslab:2}],parallel:[{fibre:3,stonesocket:1}],night:[{fabric:2,stonebrick:2}]},
 tinkershop:{batch:[{board:10,stoneslab:10},{mechanical:2,stonesocket:2}],parallel:[{mechanical:2,stonebrick:2}],night:[{gear:2,stonesocket:2}]},
 forge:{batch:[{stone:60,beam:2},{stonesocket:2,ironbar:2}],parallel:[{stonesocket:2,ironbar:1}]},
 stove:{speed:[{stonesocket:1,rope:1}],efficiency:[{stoneslab:2,resin:1}],batch:[{mushroom:30,stoneslab:2},{stonebrick:2,beam:2},{stonesocket:2,beam:2}],parallel:[{stoneslab:3,rope:2},{stonebrick:3,gear:1}],night:[{stonesocket:1,rope:3}]}
};
for(const [w,t]of Object.entries(CROSS))for(const [k,l]of Object.entries(t))l.forEach((m,i)=>{if(WORKSHOP_UPGRADE_COSTS[w]?.[k]?.[i])WORKSHOP_UPGRADE_COSTS[w][k][i][0]=m;});
