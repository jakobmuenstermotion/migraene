import {HONEY_PRODUCTS} from './honey-content.mjs';
// Fixed building plots, crops, recipes and automation. Change content here.
export const BEDS=[
  {id:'moon',name:'Mondblumenbeet',crop:'moonbloom',x:4,z:0,columns:19,rows:17,spacing:.78,cost:0,upgrade:1100,pad:{x:4,z:9}},
  {id:'lavender',name:'Lavendelbeet',crop:'lavender',x:-17,z:-14,columns:17,rows:15,spacing:.8,cost:1600,upgrade:850,pad:{x:-16,z:-3}},
  {id:'coral',requiresBed:3,name:'Korallenbeet',crop:'coral',x:18,z:24,columns:17,rows:13,spacing:.8,cost:6000,upgrade:2600,pad:{x:13,z:17}},
  {id:'mushroom',requiresBed:4,name:'Glühpilzbeet',crop:'mushroom',x:23,z:-18,columns:13,rows:15,spacing:.8,cost:4000,upgrade:1800,pad:{x:19,z:-9}},
  {id:'fruit',requiresBed:1,name:'Sternenobstgarten',crop:'starfruit',x:-23,z:26,columns:5,rows:4,spacing:2.2,pickSeconds:1.2,pickUnits:6,cost:2600,upgrade:1100,pad:{x:-20,z:17}},
  {id:'nebula',requiresBed:2,name:'Kristallhöhle',crop:'crystal',x:0,z:-29,columns:9,rows:4,spacing:1.7,mineHits:3,mineSeconds:.45,pickUnits:48,cost:9000,upgrade:4200,pad:{x:0,z:-22}},
  {id:'sun',name:'Sonnenherzbeet',crop:'sunbloom',x:-29,z:-20,columns:8,rows:12,spacing:.8,cost:12000,upgrade:5800,pad:{x:-28,z:-13}}
];
export const SEEDS=BEDS.map((b,i)=>({crop:b.crop,name:b.name.replace('beet','samen'),source:["start","shop","find","shop","find","shop","find"][i],cost:[0,260,0,750,0,1300,0][i],foundRound:[1,11,46,35,24,58,67][i],pad:{x:b.pad.x+3.1,z:b.pad.z}}));
export const PRODUCTS={
  ...HONEY_PRODUCTS,
  honeyapple:{name:"Honigapfel",plural:"Honigäpfel",icon:"⬡",color:"#e8ba79",value:60},
  bouquet:{name:'Mondstrauß',plural:'Mondsträuße',icon:'❀',color:'#b79ad7',value:10},
  tea:{name:'Sternentee',plural:'Sternentees',icon:'♨',color:'#a4b982',value:24},
  oil:{name:'Blütenduftöl',plural:'Duftöle',icon:'♧',color:'#ddbc83',value:45},
  elixir:{name:'Mondelixier',plural:'Mondelixiere',icon:'◇',color:'#a796d8',value:160}
};
export const WORKSHOPS=[
  {id:'bouquet',name:'Blumenbinderei',model:'bouquet',product:'bouquet',inputs:{moonbloom:6},seconds:12,cost:900,x:0,z:12,pad:{x:0,z:15},requires:null,description:'6 Mondblüten → 1 Mondstrauß. Links an der Werkstatt Zutaten ablegen, rechts Produkte abholen.'},
  {id:'tea',name:'Sternenteeküche',model:'tea',product:'tea',inputs:{lavender:8},seconds:16,cost:1600,x:8,z:12,pad:{x:8,z:15},requires:'bouquet',description:'8 Lavendelbündel → 1 Sternentee. Links an der Werkstatt Zutaten ablegen, rechts Produkte abholen.'},
  {id:'oil',name:'Duftöldestille',model:'oil',product:'oil',inputs:{coral:10},seconds:20,cost:2400,x:17,z:10,pad:{x:17,z:13},requires:'tea',description:'10 Korallenblüten → 1 Blütenduftöl.'},
  {id:'elixir',name:'Mondalchemie',model:'elixir',product:'elixir',inputs:{tea:1,oil:1,mushroom:6},seconds:26,cost:4200,x:26,z:9,pad:{x:26,z:12},requires:'oil',description:'1 Sternentee + 1 Duftöl + 6 Glühpilze → 1 Mondelixier.'}
];
export const VILLAGE={
  farm:{cost:2400,x:-28,z:-7,pad:{x:-28,z:-3}},
  woodcock:{cost:8500,x:-25,z:1,pad:{x:-25,z:4}},
  bus:{cost:600000000,x:-29,z:10,pad:{x:-28,z:15}},
  warehouse:{x:-14,z:-7,radius:1.8,pad:{x:-10.5,z:-7},baseCapacity:600,cost:400},
  snail:{cost:1400,growth:1.55,max:12,upgrade:950,speed:1.05,capacity:24,capacityPerLevel:4,harvestSeconds:.8,playerSpace:8,pad:{x:-16,z:5},upgradePad:{x:-16,z:9}},
  partner:{cost:1800,requires:'tea',x:-18,z:0,pad:{x:-19,z:3},capacity:64,speed:4.1,stages:['Fundament für Schnecki','Schneckis Haus: Wände','Schneckis Haus: Dach & Einzug'],materials:[{bouquet:4},{tea:4},{oil:3}]},
  sprinkler:{cost:4200,pad:{x:12,z:-9},x:12,z:-12},
  tools:{reach:{x:-13,z:20},bag:{x:-6,z:20},speed:{x:-13,z:26},value:{x:-6,z:26}},
  buying:{dwellSeconds:.8,paymentSeconds:3.8,radius:1.15},
  offline:{maxSeconds:3600,efficiency:1/300,careEfficiency:.025},
  manualBonus:1.25
};
// Later crops feed the existing workshops, keeping every bed useful to helpers.
WORKSHOPS[0].alternatives=[{sunbloom:4}];
WORKSHOPS[0].description+=' Später alternativ: 4 Sonnenblüten.';
WORKSHOPS[1].alternatives=[{starfruit:6}];
WORKSHOPS[1].description+=' Später alternativ: 6 Sternenfrüchte.';
WORKSHOPS[2].alternatives=[{nebula:4},{starfruit:8}];
WORKSHOPS[2].description+=' Alternativ: 8 Sternenfrüchte. Alte Nebelknospen bleiben verwendbar.';


WORKSHOPS[3].alternatives=[{tea:1,oil:1,crystal:4}];
WORKSHOPS[3].description+=' Alternativ mit 4 Sternenkristallen statt Glühpilzen.';

WORKSHOPS[1].description+=' Ab Level 52 auch: 2 Honig + 4 Sternenfrüchte → 1 Honigapfel.';
