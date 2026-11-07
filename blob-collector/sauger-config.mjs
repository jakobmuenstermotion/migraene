import {FLOWERS,FLOWER_ITEMS} from './flower-config.mjs';
// Prototype tuning: upgrade arrays include the unupgraded value at index 0.
export const SAUGER={
 battery:{capacity:100,drain:{ground:.47,fan:.93,focus:1.2,power:1.6,vortex:2.4}/* Jakob 1.11.: Akkuladung 25 % weniger */},
 fan:{angle:[25,50,75,90,120,150],radius:[2,2.5,3,3.5,4],bonus:[0,.15,.3],capacity:[1,1.15,1.3,1.5]},
 focus:{radius:[2.5,3,3.75,4.5,5.25,6]/* Neugestaltung (Jakob): vorher 2,5/3,5/5/6,5/8/10 */,width:[.4,.6,.8]/* Jakob 2.11.: schmaler, dritte Stufe wurde zum Tankausbau */,height:[2.3,3.5,5],anchor:[0,4,7,9,12],anchorAimSeconds:1,slow:.5,slowTail:2},
 // Jakob 7.11.: Start deutlich schwächer (überhitzt nach 3 s, 1,5/s), dafür Sparsam-Stufen: Akkuverbrauch beim Abbau ×1,6 → ×0,8 → ×0,35. Testwerte.
 power:{heatSeconds:[3,7,12,18],coolSeconds:[8,6,4,2],mining:[1.5,2.5,3.5,5],miningDrain:[1.6,.8,.35],size:[1,2,3]},
 vortex:{diameter:[3,4,5,6,7,8],transport:[0,.15,.3,.5],efficiency:[0,.25,.3,.75],regrowth:[0,.15,.3,.5],flightDiameter:10,flightSpeed:2,hover:1.1},
 material:{wood:{name:'Holz',icon:'▰',value:20/* Jakob 7.11.: 0,2 Münzen */,color:'#9a6641'},leaf:{name:'Blätter',icon:'♧',value:1,color:'#c5a45a'},stone:{name:'Steine',icon:'◆',value:3,color:'#a7b3af'},acorn:{name:'Eicheln',icon:'♠',value:2,color:'#bc8757'},fruit:{name:'Früchte',icon:'●',value:4,color:'#ebae62'},moss:{name:'Moos',icon:'♣',value:2,color:'#78935b'},mushroom:{name:'Pilze',icon:'♧',value:3,color:'#b68895'},sand:{name:'Sand',icon:'▴',value:1,color:'#dfc58e'},shell:{name:'Muscheln',icon:'◒',value:2,color:'#ead5c4'},seagrass:{name:'Seegras',icon:'≋',value:3,color:'#659f8c'},goldleaf:{name:'Goldenes Blatt',icon:'✦',value:1000,color:'#ffde62'},worm:{name:'Wurm',icon:'∿',value:50,color:'#d9a68a'},waldcoin:{name:'Alter Waldtaler',icon:'◉',value:500,color:'#bba46a'},rarewaldcoin:{name:'Glänzender Waldtaler',icon:'◉',value:500,color:'#d2c28a'},rareworm:{name:'Seltener Wurm',icon:'∿',value:50,color:'#e7bb91'}},
 test:{gap:{minX:13,maxX:15,minZ:-7,maxZ:7},bounds:{minX:-11.4,maxX:25,minZ:-8,maxZ:8},depositUnits:120,depositRegen:1.5}
};

for(const [id,f]of Object.entries(FLOWERS))SAUGER.material[id]={name:f.name,icon:'✿',color:f.color,value:f.value};

for(const [id,f]of Object.entries(FLOWER_ITEMS))SAUGER.material[id]={...f,icon:'✿'};

SAUGER.material.driftwood={name:'Treibholz',value:12,color:'#baab8c',icon:'▱'};SAUGER.material.coral={name:'Korallenstücke',value:20,color:'#d99790',icon:'♧'};
SAUGER.material.resinlump={name:'Harzklumpen',value:8,color:'#d49a4c',icon:'◆'};
SAUGER.material.rarestone={name:'Glänzender Stein',value:10,color:'#a9c5ba',icon:'◆'};
SAUGER.material.beachglass={name:'Strandglas',value:8,color:'#83bfb2',icon:'◆'};
SAUGER.material.amber={name:'Bernstein',value:20,color:'#d69d50',icon:'◆'};
for(const [id,name,color,value] of [
 ['seedpod','Samenstand','#b89b67',8],['glowfruit','Leuchtende Waldfrucht','#f2cc71',40],
 ['palmfruit','Palmfrucht','#bf925f',8],['windshell','Windmuschel','#d9cbc2',20],
 ['shimmershell','Schimmermuschel','#bfc4dc',40],['petrifiedwood','Versteinertes Holz','#93877b',20],
 ['rareshell','Seltene Muschel','#ddb9bd',20],['nacre','Perlmutt','#d8d8c9',35]
]) SAUGER.material[id]={name,color,value,icon:'◆'};

// Vulkan (Jakob 30.10., Testwerte): die bisherigen Wüsten-IDs bleiben intern, Namen und Bilder sind vulkanisch.
for(const [id,name,color,value] of [
 ['desertsand','Vulkanasche','#8d8a88',1],['clay','Lavagestein','#3f3534',4],['coloredearth','Schwefel','#f0d23a',6],['cactusfibre','Lavafasern','#c98a4a',5],
 ['desertcrystal','Glutkristalle','#e0603a',30],['copperore','Kupfererz','#b0683c',12],['desertflower','Glutblüte','#ea6a35',8],['cactusfruit','Feuerfrucht','#c9402e',10],
 ['suncapsule','Glutkapsel','#f0a23c',45],['paintedstone','Bimsstein','#b5ada2',12],['fossilshell','Aschefossil','#8f8679',30],['sunshard','Magmascherbe','#e8552c',60]
]) SAUGER.material[id]={name,color,value,icon:'◆'};
SAUGER.material.rarepebble={name:'Seltener Kiesel',value:6,color:'#aab5a5',icon:'◆'};
// Neugestaltung Eistal: Weltmaterialien und Funde (Testwerte). Eis, Eiskristalle und Eisenerz kommen aus Kraftsauger-Vorkommen.
for(const [id,name,color,value] of [
 ['snow','Schnee','#eef5f7',1],['frostwood','Frostholz','#9fb2c0',12],['frostflower','Frostblumen','#c3e8e5',6],['frostmoss','Frostmoos','#9fc3b8',3],
 ['ice','Eis','#a9d8e3',3],['icecrystal','Eiskristalle','#a4dcdf',25],['ironore','Eisenerz','#8d8c86',10],
 ['pinecone','Tannenzapfen','#8a6142',8],['cinderpod','Aschenzapfen','#6b4a3c',8],['icebell','Eisglocke','#cfeef4',25],['starcone','Sternzapfen','#d9c48a',45],
 ['frostcone','Frostzapfen','#c8e2ea',12],['iceheart','Eisherz','#8fd0e4',30],['frostrelic','Frostrelikt','#b9c9e6',60],['frozenseed','Gefrorener Samen','#a8d8c8',15],['frozenpearl','Gefrorene Perle','#dff2fb',35],['blueicestone','Blauer Eisstein','#6fb4e4',50],['starshard','Sternsplitter','#fff1a8',1800],['luckycap','Glückspilz','#e8667a',400]
]) SAUGER.material[id]={name,color,value,icon:'◆'};
