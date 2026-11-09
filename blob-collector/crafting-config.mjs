import {STOVE_RECIPES,FOOD_NAMES} from './cooking.mjs';
import {CLOTHING,EQUIPMENT_UPGRADES} from './living-config.mjs';
import {PLANNED_ACCESSORIES} from './accessory-plan.mjs';
import {softCoins,cheaper} from './coin-curve.mjs';
// Gameplay values live here so agreed recipes can be revised without changing UI.
export const WORKSHOPS={sewingmachine:{name:'Nähmaschine',w:2.2,d:1.4,height:1.8,color:'#83a9a1',recipes:[],indoor:true,station:true},
 woodshop:{name:'Holzwerkstatt',w:3.8,d:3.8,height:3.4,color:'#b48759',x:9,z:-3,cost:{wood:30,essence:2},coins:75,recipes:['reinforcedpanel','driftbead','belllamp','snail','swing','rope','sewing','torch','stool','table','woodbench','planter','boards','beams','panels','composites','chair','bench','pavilion']},
 stoneshop:{name:'Steinwerkstatt',w:3.8,d:3.8,height:3.3,color:'#91a5a4',x:10,z:3,cost:{board:12,stone:25},coins:350,recipes:['glassblank','slabs','bricks','tiles']},
 natureshop:{name:'Naturwerkstatt',w:3.8,d:3.8,height:3.3,color:'#91ac75',x:17,z:-6,cost:{board:8,moss:20,stoneslab:6},coins:500,recipes:['fibres','resin','extract','fabric','rug','mobile']},
 tinkershop:{name:'Tüftlerwerkstatt',w:3.8,d:3.8,height:3.4,color:'#c49b6c',x:20,z:0,cost:{board:12,stoneslab:8,fibre:8},coins:800,recipes:['gear','lantern','mechanics','filters','aquarium']},
 vacuumshop:{name:'Saugerwerkstatt',w:4.4,d:4.2,height:3.6,color:'#76988d',x:14,z:4,cost:{paper:5,essence:3},coins:50,recipes:[],factory:true}
};
export const FURNITURE={bellflowerlamp:{name:'Glockenblumenlampe',w:1.4,d:1.2,height:2.6,shape:'belllamp',color:'#a7a4d8',light:true},snailsculpture:{name:'Schneckenskulptur',w:1.5,d:1.1,height:1.2,shape:'snail',color:'#bfa275'},forestswing:{name:'Waldschaukel',w:2.7,d:2,height:3,shape:'swing',color:'#bd9867'},sewingmachine:{name:'Nähmaschine mit Tisch',w:2.2,d:1.4,height:1.8,shape:'sewing',color:'#83a9a1',station:true},woodtorch:{name:'Holzfackel',w:.65,d:.65,height:1.9,shape:'torch',color:'#deab63',light:true},woodlantern:{name:'Waldlaterne',w:1.3,d:1.3,height:2.5,shape:'lamp',color:'#d2b678',light:true},bed:{name:'Gemütliches Bett',w:2,d:2.9,height:1.7,shape:'bed',color:'#83aa9b'},desk:{name:'Holzschreibtisch',w:2.5,d:1,height:1.1,shape:'desk',color:'#c9a573'},wardrobe:{name:'Kleiderschrank',w:1,d:2.4,height:2.5,shape:'wardrobe',color:'#b99a70'},woodstool:{name:'Waldhocker',w:.8,d:.8,height:.8,shape:'stool',color:'#c99d69'},woodtable:{name:'Kleiner Holztisch',w:1.6,d:1.6,height:1.2,shape:'table',color:'#c99d69'},woodbench:{name:'Einfache Holzbank',w:2.3,d:1.1,height:1.5,shape:'bench',color:'#b99163'},leafplanter:{name:'Blattkübel',w:.9,d:.9,height:1.2,shape:'planter',color:'#a98c5f'},shelf:{name:'Bücherregal',w:.65,d:2.7,height:2.2,shape:'shelf',color:'#b99a70'},
 beachchair:{name:'Strandstuhl',w:1.2,d:1.6,height:1.7,shape:'chair',color:'#e9c285'},
 hanginglamp:{name:'Hängelampe',w:1.3,d:1.3,height:2.5,shape:'lamp',color:'#edcb8a'},
 shelltable:{name:'Muscheltisch',w:1.8,d:1.8,height:1.2,shape:'table',color:'#e9cbb9'},
 coastlantern:{name:'Küstenlaterne',w:.9,d:.9,height:2.2,shape:'lamp',color:'#9bbeb5'},
 beachbench:{name:'Strandbank',w:2.3,d:1.1,height:1.5,shape:'bench',color:'#c9a379'},
 seagrassrug:{name:'Seegrasteppich',w:2.6,d:1.8,height:.1,shape:'rug',color:'#8ea986',floor:true},
 shellmobile:{name:'Muschelmobile',w:1.3,d:1.3,height:2.5,shape:'mobile',color:'#e1d8c4'},
 aquarium:{name:'Kleines Aquarium',w:1.9,d:1.1,height:1.5,shape:'aquarium',color:'#89b8bc'},
 beachpavilion:{name:'Strandpavillon',w:3.8,d:3.8,height:3.8,shape:'pavilion',color:'#e5c9a3'}
};
// Times and new buffer capacities are provisional test values; quantities and
// building costs come from Jakob's 22 October planning table.
export const CRAFT_RECIPES={reinforcedpanel:{workshop:'woodshop',name:'Verstärkte Platte',inputs:{woodpanel:2,shelllime:1},output:'reinforcedpanel',quantity:1,seconds:8},driftbead:{workshop:'woodshop',name:'Treibholzperle',inputs:{driftwood:4},output:'driftbead',quantity:1,seconds:5},glassblank:{workshop:'stoneshop',name:'Glasrohling',inputs:{sandstone:2},output:'glassblank',quantity:1,seconds:7},gear:{workshop:'tinkershop',name:'Zahnrad',inputs:{mechanical:1,resin:1},output:'gear',quantity:1,seconds:7},belllamp:{workshop:'woodshop',name:'Glockenblumenlampe',inputs:{beam:2,essence:3,paper:2},output:'bellflowerlamp',region:'sunny',quantity:1,seconds:9,furniture:true},snail:{workshop:'woodshop',name:'Schneckenskulptur',inputs:{wood:15,essence:1},output:'snailsculpture',region:'sunny',quantity:1,seconds:8,furniture:true},swing:{workshop:'woodshop',name:'Waldschaukel',inputs:{beam:4,rope:3,board:2},output:'forestswing',region:'sunny',quantity:1,seconds:12,furniture:true},rope:{workshop:'woodshop',name:'Seil',inputs:{paper:10},output:'rope',quantity:1,seconds:4},sewing:{workshop:'woodshop',name:'Nähmaschine mit Tisch',inputs:{board:5,wood:10},output:'sewingmachine',quantity:1,seconds:3,furniture:true,starter:true},
 stool:{workshop:'woodshop',name:'Waldhocker',inputs:{wood:8},output:'woodstool',quantity:1,seconds:3,furniture:true,starter:true},
 table:{workshop:'woodshop',name:'Kleiner Holztisch',inputs:{wood:12,paper:1},output:'woodtable',quantity:1,seconds:5,furniture:true,starter:true},
 woodbench:{workshop:'woodshop',name:'Einfache Holzbank',inputs:{wood:15,essence:1},output:'woodbench',quantity:1,seconds:5,furniture:true,starter:true},
 planter:{workshop:'woodshop',name:'Blattkübel',inputs:{wood:5,leaf:30},output:'leafplanter',quantity:1,seconds:3,furniture:true,starter:true},
 torch:{workshop:'woodshop',name:'Holzfackel',inputs:{wood:5,leaf:20},output:'woodtorch',quantity:1,seconds:6,furniture:true,starter:true},
 lantern:{workshop:'tinkershop',name:'Waldlaterne',inputs:{beam:1,mechanical:1,essence:1},output:'woodlantern',quantity:1,seconds:9,furniture:true,starter:true},
 boards:{workshop:'woodshop',name:'Holzbretter',inputs:{wood:10},output:'board',quantity:1,seconds:5},
 // Neugestaltung Eistal (Materialplan): Frostbrett aus Frostholz.
 frostboards:{workshop:'woodshop',name:'Frostbrett',inputs:{frostwood:10},output:'frostboard',quantity:1,seconds:6},
 beams:{workshop:'woodshop',name:'Holzbalken',inputs:{wood:20},output:'beam',quantity:1,seconds:6},
 panels:{workshop:'woodshop',name:'Holzplatten',inputs:{board:4,essence:1},output:'woodpanel',quantity:1,seconds:6},
 composites:{workshop:'woodshop',name:'Verbundplatten',inputs:{board:3,seagrass:5},output:'composite',quantity:1,seconds:6},
 slabs:{workshop:'stoneshop',name:'Steinplatten',inputs:{stone:5},output:'stoneslab',quantity:1,seconds:5},// Jakob 29.10.: 5 statt 10 Steine
 bricks:{workshop:'stoneshop',name:'Steinziegel',inputs:{stone:12},output:'stonebrick',quantity:1,seconds:6},
 tiles:{workshop:'stoneshop',name:'Sandsteinfliesen',inputs:{sandstone:2,board:2},output:'sandtile',quantity:1,seconds:6},
 fibres:{workshop:'natureshop',name:'Naturfasern',inputs:{moss:10},output:'fibre',quantity:1,seconds:5},
 resin:{workshop:'natureshop',name:'Pflanzenharz',inputs:{wood:5,moss:5},output:'resin',quantity:1,seconds:6},
 extract:{workshop:'natureshop',name:'Pilzextrakt',inputs:{mushroom:8},output:'extract',quantity:1,seconds:6},
 fabric:{workshop:'natureshop',name:'Seegrasgewebe',inputs:{seagrass:12},output:'fabric',quantity:1,seconds:6},
 mechanics:{workshop:'tinkershop',name:'Mechanische Bauteile',inputs:{board:2,stoneslab:2},output:'mechanical',quantity:1,seconds:7},
 filters:{workshop:'tinkershop',name:'Filtermodul',inputs:{fibre:2,resin:1},output:'filtermodule',quantity:1,seconds:7},
 chair:{workshop:'woodshop',name:'Strandstuhl',inputs:{board:4,shelllime:1},output:'beachchair',quantity:1,seconds:8,furniture:true},
 bench:{workshop:'woodshop',name:'Strandbank',inputs:{board:2,beam:2,fibre:2},output:'beachbench',quantity:1,seconds:9,furniture:true},
 pavilion:{workshop:'woodshop',name:'Strandpavillon',inputs:{board:8,beam:4,composite:2},output:'beachpavilion',quantity:1,seconds:12,furniture:true},
 rug:{workshop:'natureshop',name:'Seegrasteppich',inputs:{fabric:2,fibre:2},output:'seagrassrug',quantity:1,seconds:8,furniture:true},
 mobile:{workshop:'natureshop',name:'Muschelmobile',inputs:{shell:8,fibre:2},output:'shellmobile',quantity:1,seconds:8,furniture:true},
 aquarium:{workshop:'tinkershop',name:'Kleines Aquarium',inputs:{board:4,glassblank:2,filtermodule:1},output:'aquarium',quantity:1,seconds:10,furniture:true}
};
// Planned late-game recipes remain visible, but their ingredients become
// obtainable only when the corresponding biome has actually been built.
const plannedRecipes={
 lens:{workshop:'stoneshop',name:'Geschliffene Linse',inputs:{rarestone:2,glassblank:1},output:'lens',seconds:8},
 iceplate:{workshop:'stoneshop',name:'Eisplatte',inputs:{ice:10},output:'iceplate',seconds:6},
 ironbar:{workshop:'stoneshop',name:'Eisenbarren',inputs:{ironore:5},output:'ironbar',seconds:8},
 copperbar:{workshop:'stoneshop',name:'Kupferbarren',inputs:{copperore:5},output:'copperbar',seconds:8},
 ceramic:{workshop:'stoneshop',name:'Keramikteil',inputs:{clay:5,shelllime:1},output:'ceramic',seconds:7},
 desertglass:{retired:true,workshop:'stoneshop',name:'Obsidian',inputs:{desertsand:100},output:'desertglass',seconds:7},
 colorceramic:{workshop:'stoneshop',name:'Farbkeramik',inputs:{ceramic:1,coloredearth:2},output:'colorceramic',seconds:7},
 polishedglass:{workshop:'stoneshop',name:'Polierglas',inputs:{beachglass:2,paper:3},output:'polishedglass',seconds:5},
 resinlumps:{workshop:'natureshop',name:'Pflanzenharz · aus Harzklumpen',inputs:{resinlump:5},output:'resin',seconds:6},
 warmfibre:{workshop:'natureshop',name:'Warmfaser',inputs:{frostmoss:6,fibre:2},output:'warmfibre',seconds:7},
 desertfabric:{workshop:'natureshop',name:'Feuerfestes Gewebe',inputs:{cactusfibre:8,fabric:1},output:'desertfabric',seconds:7},
 frostessence:{workshop:'natureshop',name:'Frostessenz',inputs:{frostflower:5,essence:1},output:'frostessence',seconds:8},
 optical:{workshop:'tinkershop',name:'Optisches Modul',inputs:{lens:1,mechanical:1},output:'optical',seconds:9},
 coolingmodule:{workshop:'tinkershop',name:'Kühlmodul',inputs:{iceplate:1,frostessence:1,mechanical:1},output:'coolingmodule',seconds:9},
 wire:{workshop:'tinkershop',name:'Leitung',inputs:{copperbar:1,resin:1},output:'wire',seconds:9},
 energycore:{workshop:'tinkershop',name:'Energiekern',inputs:{optical:1,coolingmodule:1,ironbar:1},output:'energycore',seconds:12}
};
for(const [id,recipe] of Object.entries(plannedRecipes)){
 CRAFT_RECIPES[id]={...recipe,quantity:1};
 if(!recipe.retired)WORKSHOPS[recipe.workshop].recipes.push(id);
}
// Eistal: Frostbrett steht direkt in CRAFT_RECIPES und muss deshalb eigens in die Holzwerkstatt (war vorher nicht herstellbar).
if(!WORKSHOPS.woodshop.recipes.includes('frostboards'))WORKSHOPS.woodshop.recipes.push('frostboards');

// Neugestaltung (Jakob 29.10., Testwerte): Schmiede mit Glut. Alles mit Hitze zieht aus der Steinwerkstatt hierher;
// bereits bezahlte alte Aufträge laufen dort noch einmal zu Ende (retired). Brennstoff verbrennt nur während eines
// Auftrags: Holzkohle aus der Presse hält am längsten, Holz und Blätter gehen auch, aber kürzer.
WORKSHOPS.forge={name:'Schmiede',w:3.8,d:3.8,height:3.6,color:'#a7694e',x:20,z:7,cost:{stoneslab:10,stonebrick:8,beam:4},coins:600,recipes:[],fuel:true};
// Brenndauer in Sekunden je Stück.
export const FORGE_FUEL={charcoal:300,wood:30,driftwood:24,leaf:.2};
for(const id of ['glassblank','ironbar','copperbar','ceramic','colorceramic']){CRAFT_RECIPES[id].retired=true;WORKSHOPS.stoneshop.recipes=WORKSHOPS.stoneshop.recipes.filter(r=>r!==id);}
// trade: Handelsware, verkauft sich mit Aufschlag (market.mjs). starter: Möbel ohne Bauplan.
const workshopAdditions={
 forge:{
  smeltiron:{name:'Eisenbarren',inputs:{ironore:5},output:'ironbar',seconds:6},
  smeltcopper:{name:'Kupferbarren',inputs:{copperore:5},output:'copperbar',seconds:6},
  meltglass:{name:'Glasrohling',inputs:{sandstone:2},output:'glassblank',seconds:7},
  fireceramic:{name:'Keramikteil',inputs:{clay:5,shelllime:1},output:'ceramic',seconds:8},
  firecolorceramic:{name:'Farbkeramik',inputs:{ceramic:1,coloredearth:2},output:'colorceramic',seconds:8},
  embercoil:{name:'Glutspule',inputs:{wire:2,desertcrystal:1,springsteel:1},output:'embercoil',seconds:11},
  fittings:{name:'Eisenbeschläge',inputs:{ironbar:1,board:1},output:'ironfitting',seconds:6},
  springsteel:{name:'Federstahl',inputs:{ironbar:2,charcoal:1},output:'springsteel',seconds:9},
  frostglass:{name:'Frostglas',inputs:{glassblank:1,icecrystal:2},output:'frostglass',seconds:8},
  crystalball:{name:'Kristallkugel',inputs:{icecrystal:2,glassblank:1,beam:1},output:'crystalball',seconds:10,trade:true},
  icelamp:{name:'Eislampe',inputs:{frostglass:1,icequader:1,icebell:1},output:'icelamp',seconds:9,furniture:true,starter:true}
 },
 woodshop:{
  frostbeams:{name:'Frostbalken',inputs:{frostboard:2,ironfitting:1},output:'frostbeam',seconds:8},
  driftboards:{name:'Treibholzbrett',inputs:{driftwood:10},output:'driftboard',seconds:6},
  frostcasket:{name:'Frostholz-Schatulle',inputs:{frostboard:2,amber:1,ironfitting:1},output:'frostcasket',seconds:10,trade:true},
  shellbox:{name:'Muschel-Schmuckkästchen',inputs:{board:2,shell:4,polishedglass:1},output:'shellbox',seconds:9,trade:true},
  shelltable:{name:'Muscheltisch',inputs:{driftboard:3,shell:4,shelllime:1},output:'shelltable',seconds:9,furniture:true}
 },
 stoneshop:{
  icequader:{name:'Eisquader',inputs:{snowblock:2,iceplate:1},output:'icequader',seconds:7},
  mosaic:{name:'Mosaikfliesen',inputs:{sandtile:2,beachglass:2},output:'mosaictile',seconds:8},
  icesculpture:{name:'Eisskulptur',inputs:{snowblock:4,iceplate:2,frostflower:2},output:'icesculpture',seconds:10,trade:true},
  prismlens:{name:'Prismenlinse',inputs:{frostglass:1,lens:1,icebell:1},output:'prismlens',seconds:11},
  obsidianlens:{name:'Obsidianlinse',inputs:{desertglass:1,lens:1,paintedstone:1},output:'obsidianlens',seconds:11}
 },
 natureshop:{
  upholstery:{name:'Polsterstoff',inputs:{fabric:2,warmfibre:2},output:'upholstery',seconds:8},
  wintertea:{name:'Wintertee',inputs:{frostflower:3,mushroom:2,paper:1},output:'wintertea',seconds:6,trade:true},
  scentcandle:{name:'Duftkerze',inputs:{resin:2,essence:1,fibre:2},output:'scentcandle',seconds:8,trade:true}
 },
 tinkershop:{
  clockwork:{name:'Uhrwerk',inputs:{gear:2,springsteel:1,polishedglass:1},output:'clockwork',seconds:10},
  pump:{name:'Pumpe',inputs:{filtermodule:1,ironbar:1,glassblank:1},output:'pump',seconds:9},
  findercrystal:{name:'Spürkristall',inputs:{iceheart:1,optical:1,polishedglass:1},output:'findercrystal',seconds:11},
  windrotor:{name:'Flügelrad',inputs:{clockwork:1,frostbeam:1,nacre:1},output:'windrotor',seconds:11},
  frostloop:{name:'Frostkreislauf',inputs:{pump:1,coolingmodule:1,frostglass:1},output:'frostloop',seconds:12},
  vortexchamber:{name:'Wirbelkammer',inputs:{pump:1,desertfabric:2,fossilshell:1},output:'vortexchamber',seconds:12},
  stormcore:{name:'Sturmkern',inputs:{energycore:1,vortexchamber:1,embercoil:1,starcone:1},output:'stormcore',seconds:14},
  hanginglamp:{name:'Hängelampe',inputs:{glassblank:1,rope:2,shelllime:1},output:'hanginglamp',seconds:9,furniture:true},
  coastlantern:{name:'Küstenlaterne',inputs:{driftboard:1,glassblank:1,polishedglass:1},output:'coastlantern',seconds:9,furniture:true},
  bigaquarium:{name:'Großes Aquarium',inputs:{beam:6,frostglass:4,pump:1,shelllime:2},output:'bigaquarium',seconds:14,furniture:true,starter:true}
 }
};
for(const [workshop,list] of Object.entries(workshopAdditions))for(const [id,r] of Object.entries(list)){CRAFT_RECIPES[id]={workshop,quantity:1,...r};WORKSHOPS[workshop].recipes.push(id);}
Object.assign(FURNITURE,{
 icelamp:{name:'Eislampe',w:.8,d:.8,height:1.9,shape:'icelamp',color:'#9fd8ef',light:true},
 bigaquarium:{name:'Großes Aquarium',w:3.2,d:1.3,height:1.9,shape:'bigaquarium',color:'#7fb8c4',fishTank:8}
});
FURNITURE.aquarium.fishTank=2;
// Neugestaltung (Jakob 29.10.: „noch ein paar mehr Möbel und Dinge zum Hinstellen“, Testwerte). Ohne Bauplan (starter);
// die Vitrinen geben den Sammlerfunden (Relikte, Kristall, Wurzel, Eisfunde) eine Verwendung.
Object.assign(FURNITURE,{
 armchair:{name:'Gemütlicher Sessel',w:1.2,d:1.1,height:1.3,shape:'armchair',color:'#b77b66'},
 sofa:{name:'Großes Sofa',w:2.6,d:1.1,height:1.3,shape:'sofa',color:'#7fa38e'},
 rockingchair:{name:'Schaukelstuhl',w:1,d:1.4,height:1.5,shape:'rockingchair',color:'#b88a5a'},
 fireplace:{name:'Kamin',w:2.2,d:1,height:2.6,shape:'fireplace',color:'#9b958a',light:true},
 floorlamp:{name:'Stehlampe',w:.7,d:.7,height:2.1,shape:'floorlamp',color:'#e9cd84',light:true},
 curiocabinet:{name:'Fundvitrine',w:1.4,d:.7,height:2.1,shape:'curio',color:'#a57e55'},
 frostcabinet:{name:'Eisvitrine',w:1.4,d:.7,height:2.1,shape:'curio',color:'#8f8eaa'},
 birdhouse:{name:'Vogelhäuschen',w:.8,d:.8,height:2,shape:'birdhouse',color:'#c49a62'},
 fountain:{name:'Gartenbrunnen',w:1.8,d:1.8,height:1.6,shape:'fountain',color:'#a3ada6'},
 easel:{name:'Staffelei mit Bild',w:1,d:.9,height:1.9,shape:'easel',color:'#b08b5c'},
 herbshelf:{name:'Kräuterregal',w:1.6,d:.6,height:1.8,shape:'herbshelf',color:'#9e7b52'},
 roundrug:{name:'Runder Teppich',w:2.2,d:2.2,height:.1,shape:'roundrug',color:'#c58f7a',floor:true}
});
const decorRecipes={
 woodshop:{
  armchair:{name:'Gemütlicher Sessel',inputs:{beam:2,upholstery:2,board:2},output:'armchair',seconds:10},
  sofa:{name:'Großes Sofa',inputs:{beam:4,upholstery:4,board:4},output:'sofa',seconds:12},
  rockingchair:{name:'Schaukelstuhl',inputs:{beam:3,board:4,fabric:1},output:'rockingchair',seconds:10},
  curiocabinet:{name:'Fundvitrine',inputs:{beam:2,glassblank:2,relic:1,crystal:1,root:1},output:'curiocabinet',seconds:12},
  frostcabinet:{name:'Eisvitrine',inputs:{frostbeam:2,frostglass:2,frostrelic:1,iceheart:1,frostcone:1},output:'frostcabinet',seconds:12},
  birdhouse:{name:'Vogelhäuschen',inputs:{board:4,wood:4,rope:1},output:'birdhouse',seconds:8},
  easel:{name:'Staffelei mit Bild',inputs:{board:3,paper:4,essence:1},output:'easel',seconds:8}
 },
 forge:{fireplace:{name:'Kamin',inputs:{stonebrick:12,stoneslab:4,ironfitting:2},output:'fireplace',seconds:12}},
 stoneshop:{fountain:{name:'Gartenbrunnen',inputs:{stonebrick:8,stoneslab:6,pump:1},output:'fountain',seconds:12}},
 tinkershop:{floorlamp:{name:'Stehlampe',inputs:{beam:1,glassblank:1,ironfitting:1,fibre:2},output:'floorlamp',seconds:9}},
 natureshop:{
  herbshelf:{name:'Kräuterregal',inputs:{board:4,mushroom:10,commonflower:20,moss:10},output:'herbshelf',seconds:9},
  roundrug:{name:'Runder Teppich',inputs:{warmfibre:4,fibre:4},output:'roundrug',seconds:8}
 }
};
for(const [workshop,list] of Object.entries(decorRecipes))for(const [id,r] of Object.entries(list)){CRAFT_RECIPES[id]={workshop,quantity:1,furniture:true,starter:true,...r};WORKSHOPS[workshop].recipes.push(id);}
export const BLUEPRINTS=[
 {id:'bellflowerlamp',x:12,z:45,tool:'ground',depth:0,buried:true},
 {id:'snailsculpture',x:-17,z:13,tool:'ground',depth:0,buried:true},
 {id:'forestswing',x:19,z:25,tool:'ground',depth:0,buried:true},
 {id:'beachchair',x:57,z:5,tool:'ground',depth:0,buried:true},
 {id:'hanginglamp',x:55,z:-14,tool:'focus',height:2},
 {id:'shelltable',x:72,z:9,tool:'focus'},
 {id:'coastlantern',x:60,z:-36,tool:'focus'},
 {id:'beachbench',x:59,z:11,tool:'ground',depth:2,buried:true},
 {id:'seagrassrug',x:72,z:22,tool:'ground',depth:0,buried:true},
 {id:'shellmobile',x:68,z:8,tool:'focus'},
 {id:'aquarium',x:68,z:-20.8,tool:'focus'},
 {id:'beachpavilion',x:52,z:-18,tool:'focus'}
];
export const BUILDING_SPECS={press:{w:3.3,d:4.3,front:2.5,height:4.1},nursery:{name:'Blob-Aufzuchtstation',w:6.4,d:5.5,height:3.4}};
export function placeableType(id){return WORKSHOPS[id]?id:id?.split('_')[0];}
export function placeableSpec(id){const type=placeableType(id);return BUILDING_SPECS[type]??WORKSHOPS[type]??FURNITURE[type];}

for(let i=0;i<EQUIPMENT_UPGRADES.backpack.length;i++){const a=EQUIPMENT_UPGRADES.backpack[i],id='backpack'+(i+1);a.cost={...a.cost,rope:i+1};CRAFT_RECIPES[id]={workshop:'sewingmachine',name:'Rucksack · Stufe '+(i+1),inputs:a.cost,output:id,quantity:1,seconds:8+i*2,coins:a.coins,backpack:i+1,retired:true};}
// Jakob 6.11.: Saugtank-Stufen nur noch über die Sauger-Upgrades, nicht mehr an der Nähmaschine.
for(const [id,a]of Object.entries(CLOTHING)){a.workshop='sewingmachine';CRAFT_RECIPES[id]={workshop:a.workshop,name:a.name,inputs:a.cost,output:id,quantity:1,seconds:a.seconds,coins:a.coins,clothing:true};WORKSHOPS[a.workshop].recipes.push(id);}
for(const [id,[name,wearer,,,cost,coins]] of Object.entries(PLANNED_ACCESSORIES))if(wearer==='blob'){CRAFT_RECIPES[id]={workshop:'sewingmachine',name,inputs:cost,output:id,quantity:1,seconds:8,coins,blobAccessory:true};WORKSHOPS.sewingmachine.recipes.push(id);}
CRAFT_RECIPES.blobflowerwreath={workshop:'sewingmachine',name:'Blumenkranz · Blob',inputs:{rareflower:3,fibre:1},output:'blobflowerwreath',quantity:1,seconds:8,coins:100,blobAccessory:true};WORKSHOPS.sewingmachine.recipes.push('blobflowerwreath');

export function workshopSpec(id){return WORKSHOPS[id]??(FURNITURE[placeableType(id)]?.station?WORKSHOPS[placeableType(id)]:null);}

// Jakob 31.10.: Seile bleiben im Rezept gleich, bringen beim Verkauf aber nur die Hälfte.
CRAFT_RECIPES.rope.saleFactor=.5;
// Fische bekommen eine Verwendung, dazu ein stärkerer Köder.
Object.assign(CRAFT_RECIPES,{smokedfish:{workshop:'forge',name:'Räucherfisch',inputs:{bachflosse:2,charcoal:1},output:'smokedfish',seconds:6,quantity:1,trade:true},fishsoup:{workshop:'natureshop',name:'Fischsuppe',inputs:{seebluemchen:1,sonnenfisch:1,mushroom:5},output:'fishsoup',seconds:7,quantity:1,trade:true},glitterbait:{workshop:'natureshop',name:'Glitzerköder',inputs:{worm:2,essence:1},output:'glitterbait',seconds:4,quantity:1}});
WORKSHOPS.forge.recipes.push('smokedfish');WORKSHOPS.natureshop.recipes.push('fishsoup','glitterbait');

// Jakob 31.10.: neue Möbel, Rezepte Testwerte. Lampen mit lightRange leuchten nachts weit nach draußen.
Object.assign(FURNITURE,{
 picforest:{name:'Waldbild',w:1.5,d:.16,height:2.4,shape:'picture',wall:true,color:'#6fa35a',scene:'forest'},piccoast:{name:'Strandbild',w:1.5,d:.16,height:2.4,shape:'picture',wall:true,color:'#7fc9d8',scene:'coast'},picice:{name:'Eistalbild',w:1.5,d:.16,height:2.4,shape:'picture',wall:true,color:'#cfe6f5',scene:'ice'},picvolcano:{name:'Vulkanbild',w:1.5,d:.16,height:2.4,shape:'picture',wall:true,color:'#8a5040',scene:'volcano'},
 fencewood:{name:'Holzzaun',w:2.4,d:.3,height:1.1,shape:'fence',color:'#a98559'},fencestone:{name:'Steinmäuerchen',w:2.4,d:.5,height:.9,shape:'stonewall',color:'#9aa097'},fencefrost:{name:'Frostzaun',w:2.4,d:.3,height:1.1,shape:'fence',color:'#b9d2e2',frost:true},
 gardenlamp:{name:'Große Gartenlaterne',w:.9,d:.9,height:3,shape:'bigLamp',color:'#5c4a38',light:true,lightRange:16},streetlamp:{name:'Laternenmast',w:.9,d:.9,height:4.6,shape:'bigLamp',color:'#3f4a4e',light:true,lightRange:26,tall:true},lavalamp:{name:'Lavalampe',w:.8,d:.8,height:1.5,shape:'lavalamp',color:'#ff7a2e',light:true,lightRange:9},cavelamp:{name:'Grottenkristall',w:.9,d:.9,height:1.5,shape:'cavelamp',color:'#6fe3ee',light:true,lightRange:11},
 basaltbench:{name:'Basaltbank',w:2.3,d:1,height:1,shape:'stonebench',color:'#4a403c'},icebench:{name:'Eisbank',w:2.3,d:1,height:1,shape:'stonebench',color:'#bfe3f2'},snowman:{name:'Schneemann',w:1.2,d:1.2,height:2.2,shape:'snowman',color:'#f4f8fc'},
 snailcoast:{name:'Küstenschnecke',w:2.8,d:1.8,height:2.8,shape:'snail',theme:'coast',color:'#f0c9a8'},snailice:{name:'Eisschnecke',w:2.8,d:1.8,height:2.8,shape:'snail',theme:'ice',color:'#bfe6f5'},snaillava:{name:'Lavaschnecke',w:2.8,d:1.8,height:2.8,shape:'snail',theme:'lava',color:'#4a3532'}
});
Object.assign(FURNITURE.snailsculpture,{name:'Waldschnecke',w:2.8,d:1.8,height:2.8,theme:'forest'});
for(const id of ['hanginglamp','coastlantern'])FURNITURE[id].light=true;
for(const [id,workshop,name,inputs,seconds]of [['picforest','woodshop','Waldbild',{board:2,paper:3,essence:1},6],['piccoast','woodshop','Strandbild',{board:2,paper:3,shell:4},6],['picice','woodshop','Eistalbild',{frostboard:1,paper:3,frostflower:2},6],['picvolcano','woodshop','Vulkanbild',{board:2,paper:3,coloredearth:2},6],['fencewood','woodshop','Holzzaun',{board:2,beam:1},4],['fencestone','stoneshop','Steinmäuerchen',{stonebrick:4},4],['fencefrost','woodshop','Frostzaun',{frostboard:2},4],['gardenlamp','tinkershop','Große Gartenlaterne',{beam:2,glassblank:1,ironfitting:1},8],['streetlamp','forge','Laternenmast',{ironbar:3,glassblank:2,ironfitting:2},10],['lavalamp','tinkershop','Lavalampe',{glassblank:1,clay:4,cactusfibre:2},8],['basaltbench','stoneshop','Basaltbank',{clay:12,stoneslab:4},8],['icebench','stoneshop','Eisbank',{icequader:4,frostboard:2},8],['snowman','natureshop','Schneemann',{snowblock:2,wood:2,moss:2},6]]){CRAFT_RECIPES[id]={workshop,name,inputs,output:id,quantity:1,seconds,furniture:true,starter:true};WORKSHOPS[workshop].recipes.push(id);}
// Vier Schneckenskulpturen werden gefunden, nicht gebaut.
CRAFT_RECIPES.snail.retired=true;WORKSHOPS.woodshop.recipes=WORKSHOPS.woodshop.recipes.filter(id=>id!=='snail');
for(const p of BLUEPRINTS)if(p.id==='snailsculpture')Object.assign(p,{x:-17,z:13,gift:true,buried:false});
BLUEPRINTS.push({id:'snailcoast',x:69,z:9.7,tool:'ground',depth:0,gift:true},{id:'snailice',x:34,z:-70,tool:'ground',depth:0,gift:true},{id:'snaillava',x:-49.75,z:49.55,tool:'ground',depth:0,gift:true});
export const SNAIL_SCULPTURES=['snailsculpture','snailcoast','snailice','snaillava'];

// Gartenteich (Jakob 31.10., Testrezept): draußen, nimmt Fische auf wie ein Aquarium.
FURNITURE.pond={name:'Gartenteich',w:4.4,d:3.2,height:.7,shape:'pond',color:'#4f9fb0',fishTank:12,outdoor:true};
CRAFT_RECIPES.pond={workshop:'stoneshop',name:'Gartenteich',inputs:{stoneslab:16,moss:10,seagrass:6},output:'pond',quantity:1,seconds:8,furniture:true,starter:true};WORKSHOPS.stoneshop.recipes.push('pond');

// ===== Jakob 1.11. (Testwerte): alles günstiger, einfache Möbel fast geschenkt, Teppiche an der Nähmaschine, neue Teppiche,
// Schnecken wieder über Baupläne, Blütenleim, Schmetterlingsvitrine, Schreibtisch als normales Möbel.
Object.assign(FURNITURE,{
 flowerrug:{name:'Blümchenteppich',w:2.5,d:2.5,height:.1,shape:'patternrug',pattern:'flowers',color:'#f4e6c8',floor:true},
 blobrug:{name:'Blobteppich',w:3,d:2,height:.1,shape:'patternrug',pattern:'blobs',color:'#bfe3cf',floor:true},
 butterflycase:{name:'Schmetterlingsvitrine',w:1.9,d:.16,height:2.4,shape:'butterflycase',wall:true,color:'#8a6543',fishTank:10}
});
for(const [id,workshop,name,inputs,seconds]of [['flowerrug','sewingmachine','Blümchenteppich',{fibre:2,commonflower:6},5],['blobrug','sewingmachine','Blobteppich',{fibre:3,paper:1},5],['butterflycase','woodshop','Schmetterlingsvitrine',{board:2,glassblank:1},6],['desk','woodshop','Holzschreibtisch',{board:2,beam:1},5]]){CRAFT_RECIPES[id]={workshop,name,inputs,output:id,quantity:1,seconds,furniture:true,starter:true};WORKSHOPS[workshop].recipes.push(id);}
CRAFT_RECIPES.flowerwood={workshop:'woodshop',name:'Blütenleim',inputs:{wood:4,commonflower:10},output:'flowerwood',quantity:1,seconds:5};WORKSHOPS.woodshop.recipes.push('flowerwood');
for(const id of ['rug','roundrug']){WORKSHOPS[CRAFT_RECIPES[id].workshop].recipes=WORKSHOPS[CRAFT_RECIPES[id].workshop].recipes.filter(r=>r!==id);CRAFT_RECIPES[id].workshop='sewingmachine';WORKSHOPS.sewingmachine.recipes.push(id);}
for(const r of Object.values(CRAFT_RECIPES))if(r.furniture||r.blobAccessory){cheaper(r.inputs);}
for(const r of Object.values(CRAFT_RECIPES))if(r.blobAccessory&&r.coins)r.coins=softCoins(r.coins);
for(const w of Object.values(WORKSHOPS))if(w.cost){cheaper(w.cost,.5);w.coins=softCoins(w.coins);}
WORKSHOPS.stoneshop.cost={board:4,stone:8};WORKSHOPS.stoneshop.coins=60;
const SIMPLE={fencewood:{board:1},fencestone:{stonebrick:1},fencefrost:{frostboard:1},stool:{wood:3},table:{wood:5},woodbench:{wood:6},planter:{wood:2,leaf:10},torch:{wood:2,leaf:10},snowman:{snowblock:1,wood:1},basaltbench:{clay:4},seagrassrug:null,rug:{fabric:1,fibre:1},roundrug:{fibre:3}};
for(const [id,inputs]of Object.entries(SIMPLE))if(inputs&&CRAFT_RECIPES[id])CRAFT_RECIPES[id].inputs=inputs;
CRAFT_RECIPES.rope.inputs={paper:5};
// Schnecken: Bauplan finden, herstellen, aufstellen. Die vierte aufgestellte ruft Schnecki.
delete CRAFT_RECIPES.snail.retired;CRAFT_RECIPES.snail.inputs={wood:10,essence:1};WORKSHOPS.woodshop.recipes.push('snail');
for(const [id,name,inputs]of [['snailcoast','Küstenschnecke',{shell:10,sandstone:2}],['snailice','Eisschnecke',{iceplate:2,snowblock:1}],['snaillava','Lavaschnecke',{clay:10,coloredearth:2}]]){CRAFT_RECIPES[id]={workshop:'stoneshop',name,inputs,output:id,region:'sunny',quantity:1,seconds:8,furniture:true};WORKSHOPS.stoneshop.recipes.push(id);}
const MARKERS={bellflowerlamp:'glitter',snailsculpture:'spiral',forestswing:'stump',beachchair:'cairn',beachbench:'crack',seagrassrug:'ring',snailcoast:'spiral',snailice:'spiral',snaillava:'spiral'};
for(const p of BLUEPRINTS){if(SNAIL_SCULPTURES.includes(p.id)){delete p.gift;p.buried=true;}if(MARKERS[p.id])p.marker=MARKERS[p.id];}
// Der Verkaufsstand ist am Computer versetzbar.
BUILDING_SPECS.market={name:'Verkaufsstand',w:3,d:2.1,height:3};

// Jakob 3.11.: Werkstätten brauchen anderthalbmal so viel Material zum Bauen, Münzen bleiben.
for(const w of Object.values(WORKSHOPS))if(w.cost)for(const k of Object.keys(w.cost))w.cost[k]=Math.ceil(w.cost[k]*1.5);

// Jakob 3.11.: Wandfisch. Den Bauplan gibt es nicht in der Erde: Er springt selten an Waldsee oder Fluss statt eines Fischs aus dem Wasser.
FURNITURE.fishtrophy={name:'Wandfisch',w:1.4,d:.16,height:2.4,shape:'fishtrophy',wall:true,color:'#7a5a3a'};
CRAFT_RECIPES.fishtrophy={workshop:'woodshop',name:'Wandfisch',inputs:{board:2,resin:1,hecht:1},output:'fishtrophy',region:'sunny',quantity:1,seconds:6,furniture:true};WORKSHOPS.woodshop.recipes.push('fishtrophy');

// Jakob 3.11.: Herd als Möbel mit eigener Kochstelle wie die Nähmaschine (Testwerte).
WORKSHOPS.stove={name:'Herd',w:1.6,d:1.1,height:1.6,color:'#c96f4a',recipes:[],indoor:true,station:true};
// Jakob 7.11.: Ladestation als Gebäude im Haus (charger-building.mjs), frei aufstellbar, nicht einpackbar.
FURNITURE.charger={name:'Ladestation',w:1.2,d:1.1,height:2.1,shape:'charger',color:'#55716a',indoor:true,charger:true};
FURNITURE.stove={name:'Herd',w:1.6,d:1.1,height:1.6,shape:'stove',color:'#c96f4a',station:true};
CRAFT_RECIPES.stovebuild={workshop:'stoneshop',name:'Herd',inputs:{stoneslab:4,stonebrick:1,board:2},output:'stove',quantity:1,seconds:8,furniture:true,starter:true};WORKSHOPS.stoneshop.recipes.push('stovebuild');
for(const [id,r]of Object.entries(STOVE_RECIPES)){CRAFT_RECIPES[id]={workshop:'stove',name:FOOD_NAMES[id],inputs:{...r.inputs},output:id,quantity:1,seconds:r.seconds};WORKSHOPS.stove.recipes.push(id);}

// Jakob 3.11.: mehr versteckte Baupläne, auch für Kleidung. Diese Möbel und Anhänger gibt es erst, wenn der Plan gefunden ist.
const HIDDEN=[
 {id:'rockingchair',x:-30,z:26.6,marker:'stump'},{id:'goldleafpin',x:24,z:-18.4,marker:'ring'},{id:'flowerwreath',x:-6,z:49.6,marker:'glitter'},
 {id:'birdhouse',x:9.9,z:-39.7,marker:'cairn'},{id:'picforest',x:.5,z:-33.4,marker:'cairn'},
 {id:'easel',x:53.7,z:31.3,marker:'crack',depth:1},{id:'herbshelf',x:53.1,z:48.1,marker:'stump',depth:1},
 {id:'fountain',x:-56.3,z:19.6,marker:'ring',depth:1},{id:'amberpendant',x:-46.5,z:5.1,marker:'crack'}];
for(const h of HIDDEN){BLUEPRINTS.push({tool:'ground',depth:0,buried:true,...h});const r=Object.values(CRAFT_RECIPES).find(r=>r.output===h.id&&r.furniture);if(r){delete r.starter;r.region='sunny';}}
export const CLOTHING_BLUEPRINTS=new Set(HIDDEN.map(h=>h.id).filter(id=>CRAFT_RECIPES[id]&&!CRAFT_RECIPES[id].furniture));

// Jakob 6.11.: Coolen Bauplan in der Strandhöhle verstecken: Grottenkristall (leuchtende Kristalllampe, Testrezept), tief vergraben (Grabtiefe II).
{const c={x:-217,z:-125};CRAFT_RECIPES.cavelamp={workshop:'tinkershop',name:'Grottenkristall',inputs:{polishedglass:2,optical:1,shelllime:2},output:'cavelamp',quantity:1,seconds:12,furniture:true,region:'sunny'};WORKSHOPS.tinkershop.recipes.push('cavelamp');BLUEPRINTS.push({id:'cavelamp',x:c.x,z:c.z,tool:'ground',depth:2,buried:true,marker:'glitter'});}
// Jakob 3.11.: Steinplatte wieder 10 Stein. Neu aus Stein und Brettern: Steinsockel, gebraucht für Herd, Steinwerkstatt-Vorrat I und Blobstation Stufe 2 (Testwerte).
for(const r of Object.values(CRAFT_RECIPES))if(r.output==='stoneslab'&&r.workshop==='stoneshop')r.inputs={stone:10};
CRAFT_RECIPES.stonesocket={workshop:'stoneshop',name:'Steinsockel',inputs:{stone:8,board:2},output:'stonesocket',quantity:1,seconds:6};WORKSHOPS.stoneshop.recipes.push('stonesocket');
CRAFT_RECIPES.stovebuild.inputs={stoneslab:3,stonesocket:1,board:1};
// Jakob 4.11.: Essen und Trinken gehören an den Herd: Wintertee, Fischsuppe und Räucherfisch ziehen von Natur-Werkstatt und Schmiede um.
// Bezahlte Aufträge in den alten Werkstätten laufen noch fertig (Rezept bleibt bekannt).
for(const id of ['wintertea','fishsoup','smokedfish']){const r=CRAFT_RECIPES[id];if(!r)continue;WORKSHOPS[r.workshop].recipes=WORKSHOPS[r.workshop].recipes.filter(x=>x!==id);r.workshop='stove';WORKSHOPS.stove.recipes.push(id);}

// Jakob 5.11.: Nähmaschine: normaler Rucksack 1.500 und 2.000 (zusätzlich zu den Tankstufen).
/* Jakob 9.11.: feste Preise (Rucksäcke, Kopflampe) ca. 10 % günstiger: 350→320→290, 1200→1100→1000, 600→540→490. */
for(const [n,name,inputs,coins,seconds] of [[1,'Rucksack · 1.500 Plätze',{fibre:12,rope:4,woodpanel:2},290,60],[2,'Rucksack · 2.000 Plätze',{fabric:8,rope:6,composite:3},1000,90]]){CRAFT_RECIPES['normalbag'+n]={workshop:'sewingmachine',name,inputs,output:'normalbag'+n,quantity:1,seconds,coins,normalBag:n};WORKSHOPS.sewingmachine.recipes.push('normalbag'+n);}

// Jakob 6.11.: Kopflampe (Naehmaschine, spaete Anleitung, Testrezept). Kein Kleidungsplatz: wird zusammen mit jedem Hut getragen und leuchtet automatisch, sobald es dunkel wird.
CRAFT_RECIPES.headlamp={workshop:'sewingmachine',name:'Kopflampe',inputs:{fabric:2,polishedglass:2,ironfitting:1,mechanical:2},output:'headlamp',quantity:1,seconds:12,coins:490,headlamp:true};WORKSHOPS.sewingmachine.recipes.push('headlamp');

// Jakob 7.11.: Gebietsmöbel. Jedes Gebiet hat mindestens 5 passende Möbel mit dem Gebiet im Namen und mindestens eine Lampe.
// Neu: Wald-Lagerfeuer, Vulkan-Feuerschale, Vulkanzaun (Testrezepte). Wirkung: area-furniture.mjs.
Object.assign(FURNITURE,{campfire:{name:'Wald-Lagerfeuer',w:1.5,d:1.5,height:1.3,shape:'campfire',color:'#7a5634',light:true,lightRange:12},
 firebowl:{name:'Vulkan-Feuerschale',w:1.3,d:1.3,height:1.4,shape:'campfire',color:'#3a2c28',lava:true,light:true,lightRange:12},
 fencebasalt:{name:'Vulkanzaun',w:2.4,d:.5,height:1,shape:'basaltwall',color:'#3d3532'}});
for(const [id,workshop,inputs,seconds]of [['campfire','woodshop',{wood:8,stone:6},6],['firebowl','stoneshop',{clay:6,coloredearth:2},8],['fencebasalt','stoneshop',{clay:3},4]]){CRAFT_RECIPES[id]={workshop,name:FURNITURE[id].name,inputs,output:id,quantity:1,seconds,furniture:true,starter:true};WORKSHOPS[workshop].recipes.push(id);}
for(const [id,name] of Object.entries({fencewood:'Waldzaun',woodbench:'Waldbank',coastlantern:'Strandlaterne',snailcoast:'Strandschnecke',shelltable:'Strand-Muscheltisch',fencefrost:'Eiszaun',snowman:'Eis-Schneemann',lavalamp:'Vulkanlampe',basaltbench:'Vulkanbank',snaillava:'Vulkanschnecke'})){if(!FURNITURE[id])continue;FURNITURE[id].name=name;for(const r of Object.values(CRAFT_RECIPES))if(r.output===id&&r.furniture)r.name=name;}

// Jakob 7.11.: Korallen (jetzt in der Höhle) bekommen eigene Verwendungen: zwei Strandmöbel, Testrezepte.
Object.assign(FURNITURE,{corallamp:{name:'Strand-Korallenlampe',w:.9,d:.9,height:1.7,shape:'corallamp',color:'#f08a7a',light:true,lightRange:10},
 coralvase:{name:'Strand-Korallenvase',w:.9,d:.9,height:1.3,shape:'coralvase',color:'#e9d6b4'}});
for(const [id,workshop,inputs,seconds]of [['corallamp','tinkershop',{coral:6,glassblank:1,shelllime:1},8],['coralvase','stoneshop',{coral:4,sandstone:1},6]]){CRAFT_RECIPES[id]={workshop,name:FURNITURE[id].name,inputs,output:id,quantity:1,seconds,furniture:true,starter:true};WORKSHOPS[workshop].recipes.push(id);}

// Jakob 7.11.: späteres Bauteil aus Korallen: Korallenfilter (Tüftlerwerkstatt), gebraucht beim Wirbelsauger und im Vulkankern.
CRAFT_RECIPES.coralfilter={workshop:'tinkershop',name:'Korallenfilter',inputs:{coral:4,filtermodule:1,shelllime:2},output:'coralfilter',quantity:1,seconds:20};WORKSHOPS.tinkershop.recipes.push('coralfilter');

// Jakob 7.11.: Nähmaschine und Herd sind Werkstätten im Haus: eigenes Zeichen im Namen, nur einmal baubar.
for(const id of ['sewing','stovebuild'])if(CRAFT_RECIPES[id]&&!CRAFT_RECIPES[id].name.startsWith('⚒'))CRAFT_RECIPES[id].name='⚒ '+CRAFT_RECIPES[id].name;
