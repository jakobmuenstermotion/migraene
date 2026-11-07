import {softCoins,cheaper} from './coin-curve.mjs';
// Construction values supplied in Jakob's 22 October planning table.
export const FACTORY_ID='vacuumshop';
export const VACUUM_BUILD_COSTS={
 ground:{materials:{},coins:0},
 focus:{materials:{board:5,rope:5},coins:150},
 fan:{materials:{board:8,stoneslab:8,paper:3},coins:2000},
 power:{materials:{stoneslab:8,fibre:8,resin:4,filtermodule:1},coins:10000},
 vortex:{materials:{fibre:8,shelllime:8,mechanical:6,filtermodule:2},coins:50000}
};
// Prices per individual stage. Effects and prerequisites stay in the existing trees.
const cost=(coins,materials)=>({coins,materials});
export const UPGRADE_COSTS={
 ground:{
 depth1:cost(250,{stoneslab:4}),depth2:cost(550,{stoneslab:8,sandstone:4,shelllime:3}),/* Neugestaltung (Jakob): Grabtiefe II braucht Strandprodukte aus der Presse */
 width1:cost(5,{leaf:100,wood:10}),width2:cost(450,{paper:2,board:4}),width3:cost(1100,{paper:4,stoneslab:6}),
 light1:cost(15,{board:1}),light2:cost(550,{board:8,mechanical:2}),light3:cost(1400,{mechanical:4,fabric:2}),
 energy1:cost(5,{paper:2,board:2}),energy2:cost(650,{filtermodule:2,fibre:4}),energy3:cost(1600,{filtermodule:4,fabric:2}),
 bonus1:cost(750,{stoneslab:4,resin:2}),bonus2:cost(2100,{extract:2,optical:2}),bonus3:cost(3000,{optical:2,lens:1}),detector:cost(5000,{optical:4,lens:2,energycore:1})},
 fan:{
 angle1:cost(300,{board:4}),angle2:cost(650,{stoneslab:4,board:2}),angle3:cost(1100,{mechanical:2,fibre:4}),angle4:cost(1800,{mechanical:4,fabric:2}),angle5:cost(3200,{optical:2,composite:2}),
 range1:cost(350,{board:4,stoneslab:2}),range2:cost(800,{mechanical:2,fibre:2}),range3:cost(1700,{mechanical:4,shelllime:2}),range4:cost(3200,{optical:2,lens:2}),
 bonus1:cost(950,{filtermodule:2,resin:2}),bonus2:cost(2600,{filtermodule:4,extract:2}),
 pack1:cost(500,{board:4,fibre:2}),pack2:cost(1100,{fabric:4,composite:2}),pack3:cost(2300,{composite:4,ceramic:2}),super:cost(6000,{filtermodule:4,optical:2,energycore:1})},
 focus:{
 range1:cost(250,{board:4}),range2:cost(600,{stoneslab:2,board:2}),range3:cost(1200,{mechanical:2,shelllime:2}),range4:cost(2200,{optical:2,fabric:2}),range5:cost(3800,{lens:2,optical:2}),
 beam1:cost(300,{board:4,paper:1}),beam2:cost(850,{mechanical:2,stoneslab:2}),beam3:cost(2000,{optical:2,lens:2}),
 height1:cost(650,{stoneslab:4,fibre:2}),height2:cost(1900,{mechanical:4,frostessence:2}),
 anchor1:cost(500,{board:8,rope:3}),anchor2:cost(1100,{mechanical:2,shelllime:2,rope:4}),anchor3:cost(2200,{mechanical:4,shelllime:4,fibre:2,rope:5}),anchor4:cost(4200,{coral:3,frostessence:2,optical:2}),super:cost(6500,{optical:4,extract:2,energycore:1})},
 power:{
 heat1:cost(550,{ice:4,mechanical:2}),heat2:cost(1300,{ice:8,fabric:2}),heat3:cost(2800,{frostessence:2,coolingmodule:2}),
 cool1:cost(600,{stoneslab:4,fibre:2}),cool2:cost(1400,{fabric:2,mechanical:2}),cool3:cost(3000,{coolingmodule:2,frostessence:2}),
 mine1:cost(700,{stoneslab:4,mechanical:2}),mine2:cost(1600,{stonebrick:4,ceramic:2}),mine3:cost(3500,{lens:2,coolingmodule:2}),
 size1:cost(650,{stoneslab:4,mechanical:2}),size2:cost(2600,{ceramic:4,optical:2}),
 push1:cost(450,{board:2,stoneslab:2}),push2:cost(1100,{extract:3,stoneslab:4}),push3:cost(3000,{frostessence:2,mechanical:4}),super:cost(7500,{ceramic:4,lens:4,energycore:1})},
 vortex:{
 diameter1:cost(850,{shelllime:4,fibre:4}),diameter2:cost(1500,{fabric:4,mechanical:2}),diameter3:cost(2500,{frostessence:2,optical:2}),diameter4:cost(4000,{ceramic:4,lens:2}),diameter5:cost(6500,{lens:4,icecrystal:2}),
 transport1:cost(900,{mechanical:2,filtermodule:2}),transport2:cost(2100,{fabric:4,filtermodule:4}),transport3:cost(4500,{optical:4,coolingmodule:2}),
 energy1:cost(1100,{filtermodule:4,shelllime:2}),energy2:cost(2400,{coolingmodule:2,frostessence:2}),energy3:cost(5500,{energycore:2,lens:2}),
 regrowth1:cost(1200,{fibre:4,extract:2}),regrowth2:cost(2800,{frostessence:2,extract:2}),regrowth3:cost(6000,{energycore:2,frostflower:4}),super:cost(12000,{energycore:3,lens:4,desertcrystal:4})}
};

// Confirmed early-stage test prices; materials and anchor progression unchanged.
for(const entries of Object.values(UPGRADE_COSTS))for(const [id,c]of Object.entries(entries)){if(id.startsWith('anchor'))continue;if(id.endsWith('1'))c.coins=Math.min(c.coins,50);if(id.endsWith('2'))c.coins=Math.min(c.coins,100);}

for(const entries of Object.values(UPGRADE_COSTS)){const branches=new Map();for(const id of Object.keys(entries)){const m=id.match(/^(.*?)(\d+)$/);if(m){const list=branches.get(m[1])??[];list.push(id);branches.set(m[1],list);}}for(const ids of branches.values()){ids.sort((a,b)=>Number(a.match(/\d+$/)[0])-Number(b.match(/\d+$/)[0]));if(ids.length<3)continue;const first=entries[ids[0]].coins,last=entries[ids.at(-1)].coins;ids.slice(1,-1).forEach((id,i)=>entries[id].coins=Math.round((first+(last-first)*(i+1)/(ids.length-1))/5)*5);}}
// Explicitly agreed early milestone after the interpolation.
UPGRADE_COSTS.ground.width2.coins=100;
// Test ingredient variety in reachable branches; do not alter anchor unlock gates.
Object.assign(UPGRADE_COSTS.ground.width2.materials,{essence:1});
Object.assign(UPGRADE_COSTS.ground.light2.materials,{beam:2});
Object.assign(UPGRADE_COSTS.fan.range2.materials,{beam:2,essence:2});
Object.assign(UPGRADE_COSTS.focus.beam2.materials,{essence:2});
Object.assign(UPGRADE_COSTS.power.push1.materials,{beam:1});

UPGRADE_COSTS.ground.light2.materials.board=4;
delete UPGRADE_COSTS.power.push1.materials.board;

UPGRADE_COSTS.ground.width1={coins:10,materials:{leaf:500,wood:10}};

// Jakob 31.10.: gemeinsame Münzkurve
for(const c of Object.values(VACUUM_BUILD_COSTS))c.coins=softCoins(c.coins);for(const l of Object.values(UPGRADE_COSTS))for(const c of Object.values(l))c.coins=softCoins(c.coins);

// Jakob 1.11.: Materialkosten runter, Anker I fest, neuer Blütenleim aus Holz und Blumen als frühe Zutat.
for(const c of Object.values(VACUUM_BUILD_COSTS))cheaper(c.materials);for(const l of Object.values(UPGRADE_COSTS))for(const c of Object.values(l))cheaper(c.materials);
UPGRADE_COSTS.focus.anchor1={coins:50,materials:{board:4}};
UPGRADE_COSTS.ground.width1={coins:5,materials:{leaf:200,wood:5}};
UPGRADE_COSTS.ground.width2.materials={flowerwood:1,paper:1};UPGRADE_COSTS.focus.range1.materials={flowerwood:2};UPGRADE_COSTS.fan.angle1.materials={flowerwood:2,board:1};UPGRADE_COSTS.ground.light2.materials={flowerwood:2,board:2};

// Jakob 1.11.: späte Stufen mit eigenen Spätprodukten je Sauger statt immer Optikmodul, Linse und Energiekern (Testwerte). Sperren bleiben: Schubumkehr III und Anker III brauchen nichts aus dem Vulkan.
for(const [vacuum,list]of Object.entries({
 ground:{bonus3:{findercrystal:1,optical:1},detector:{findercrystal:2,energycore:1}},
 fan:{angle5:{windrotor:1,composite:2},range4:{windrotor:1,prismlens:1},pack3:{composite:3,upholstery:2},super:{filtermodule:3,windrotor:2,nacre:2}},
 focus:{range5:{prismlens:2,springsteel:1},beam3:{prismlens:1,optical:1},anchor4:{coral:2,frostessence:2,prismlens:1},super:{prismlens:2,clockwork:1,starcone:1}},
 power:{heat3:{frostloop:1,frostessence:1},cool3:{frostloop:1,icequader:1},mine3:{embercoil:2,obsidianlens:1},super:{embercoil:2,colorceramic:2,sunshard:1}},
 vortex:{diameter3:{windrotor:1,frostessence:2},diameter4:{vortexchamber:1,ceramic:2},diameter5:{vortexchamber:2,obsidianlens:1,icecrystal:2},transport3:{frostloop:1,clockwork:2},energy3:{stormcore:1,energycore:1},regrowth3:{stormcore:1,desertflower:3},super:{stormcore:2,sunshard:1,desertcrystal:3}}
}))for(const [id,materials]of Object.entries(list))UPGRADE_COSTS[vacuum][id].materials=materials;

// Jakob 2.11. (Testwerte): Tankausbau je Sauger braucht einen besonderen Fund, nach dem man gezielt sucht; späte Sauger aus dem Eistal. Hindernisse II öffnet jetzt Riff und Vulkan.
Object.assign(UPGRADE_COSTS.ground,{tank1:{coins:300,materials:{rareshell:2,board:4}},tank2:{coins:650,materials:{nacre:1,rareshell:1,fabric:2}}});
UPGRADE_COSTS.focus.tank1={coins:400,materials:{rareshell:2,fibre:3}};UPGRADE_COSTS.focus.tank2={coins:800,materials:{nacre:1,windshell:1,rope:3}};delete UPGRADE_COSTS.focus.beam3;
for(const id of ['push1','push2','push3'])delete UPGRADE_COSTS.power[id];
UPGRADE_COSTS.power.size2={coins:730,materials:{frostessence:2,mechanical:3}};UPGRADE_COSTS.power.tank1={coins:600,materials:{frozenpearl:1,stoneslab:4}};UPGRADE_COSTS.power.tank2={coins:1100,materials:{blueicestone:1,ironfitting:2}};
UPGRADE_COSTS.vortex.tank1={coins:900,materials:{iceheart:2,fabric:3}};UPGRADE_COSTS.vortex.tank2={coins:1500,materials:{frostrelic:1,blueicestone:1,upholstery:2}};
// Die höchsten und tiefsten Funde stecken vereinzelt in späten Stufen.
Object.assign(UPGRADE_COSTS.focus.range5.materials,{shimmershell:1});Object.assign(UPGRADE_COSTS.fan.pack3.materials,{petrifiedwood:1});Object.assign(UPGRADE_COSTS.ground.light3.materials,{glowfruit:1});Object.assign(UPGRADE_COSTS.vortex.regrowth3.materials,{suncapsule:1});Object.assign(UPGRADE_COSTS.power.heat3.materials,{frostrelic:1});Object.assign(UPGRADE_COSTS.fan.super.materials,{shimmershell:1});

// Jakob 2.11.: Abschlussstufen von Boden- und Fernsauger schon mit der Küste, aufwendig, aber ohne Linsen.
Object.assign(UPGRADE_COSTS.ground.detector,{coins:900,materials:{rareshell:2,shelllime:4,fabric:3,mechanical:2}});Object.assign(UPGRADE_COSTS.focus.super,{coins:800,materials:{palmfruit:2,fabric:3,mechanical:3,shelllime:2}});
Object.assign(UPGRADE_COSTS.focus.range5.materials,{starcone:1});
// Jakob 3.11.: Bei späteren Stufen sollen eher die Materialien knapp sein als die Münzen. Ab 150 M wird der Teil
// über 150 halbiert, die Materialmengen steigen um die Hälfte (aufgerundet). Testwerte.
for(const tree of Object.values(UPGRADE_COSTS))for(const c of Object.values(tree))if(c.coins>=150){c.coins=Math.round((150+(c.coins-150)*.5)/5)*5;for(const k of Object.keys(c.materials))c.materials[k]=Math.ceil(c.materials[k]*1.5);}
// Jakob 3.11.: frühe Stufen (unter 150 M) ein Viertel günstiger, Materialien bleiben.
for(const tree of Object.values(UPGRADE_COSTS))for(const c of Object.values(tree))if(c.coins<150)c.coins=Math.max(5,Math.round(c.coins*.75/5)*5);
// Jakob 3.11.: Der Fächersauger braucht einen Bernstein aus Grabtiefe I im Wald.
VACUUM_BUILD_COSTS.fan.materials.amber=1;
// Jakob 3.11.: Kristall aus Grabtiefe II bekommt eine Verwendung.
UPGRADE_COSTS.ground.bonus2.materials.crystal=1;
// Jakob 3.11.: frühe Stufen brauchten fast alle Steinplatten, Bretter und Fasern. Mehr Abwechslung mit Rohstoffen und Funden,
// Münzen unverändert (Testwerte).
const VARIETY={ground:{depth1:{stoneslab:2,worm:4},bonus1:{waldcoin:1,resin:2}},fan:{range1:{woodpanel:1,moss:15},pack1:{fibre:2,mushroom:10}},
 focus:{beam1:{essence:1,paper:2,stone:10},height1:{rope:2,resin:2}},power:{cool1:{fabric:2,shelllime:3},mine1:{sandstone:3,mechanical:2},size1:{stonebrick:3,mechanical:2}}};
for(const [v,t]of Object.entries(VARIETY))for(const [id,m]of Object.entries(t))if(UPGRADE_COSTS[v]?.[id])UPGRADE_COSTS[v][id].materials=m;
// Jakob 3.11.: Steinsockel beim Bodensauger spät (Saugbreite III) und beim Fernsauger früh (Saugweite II), Testwerte.
UPGRADE_COSTS.ground.width3.materials={paper:5,stonesocket:3};
UPGRADE_COSTS.focus.range2.materials={stonesocket:2,board:1};

// Jakob 7.11.: Korallenfilter beim Wirbelsauger (Transport II statt 5 Filtermodulen, zusätzlich bei Nachwachsen II). Münzen gleich.
UPGRADE_COSTS.vortex.transport2.materials={fabric:5,coralfilter:2};UPGRADE_COSTS.vortex.regrowth2.materials={...UPGRADE_COSTS.vortex.regrowth2.materials,coralfilter:1};
