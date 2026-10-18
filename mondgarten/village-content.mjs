import {HIVES,HONEY_PRODUCTS} from './honey-content.mjs';
// Fixed building plots, crops, recipes and automation. Change content here.
export const BEDS=[
  {id:'moon',name:'Mondblumenbeet',crop:'moonbloom',x:4,z:0,columns:19,rows:17,spacing:.78,cost:0,upgrade:1100,pad:{x:4,z:10.3}},
  {id:'lavender',name:'Lavendelbeet',crop:'lavender',x:-17.5,z:-14,columns:17,rows:15,spacing:.75,cost:1600,upgrade:850,pad:{x:-16,z:-4.3}},
  {id:'coral',requiresBed:3,name:'Korallenbeet',crop:'coral',x:18,z:25,columns:17,rows:13,spacing:.8,cost:6000,upgrade:2600,pad:{x:13,z:15.5}},
  {id:'mushroom',requiresBed:4,name:'Glühpilzbeet',crop:'mushroom',x:23,z:-18,columns:13,rows:15,spacing:.8,cost:4000,upgrade:1800,pad:{x:19,z:-8.5}},
  {id:'fruit',requiresBed:1,name:'Sternenobstgarten',crop:'starfruit',x:-23,z:26.3,columns:5,rows:4,spacing:2,pickSeconds:1.2,pickUnits:6,cost:2600,upgrade:1100,pad:{x:-20,z:16.4}},
  {id:'nebula',requiresBed:2,name:'Kristallhöhle',crop:'crystal',x:1,z:-26.5,columns:9,rows:4,spacing:1.4,mineHits:3,mineSeconds:.45,pickUnits:48,cost:9000,upgrade:4200,pad:{x:1.2,z:-19}},
  {id:'sun',name:'Sonnenherzbeet',crop:'sunbloom',x:-30.4,z:-20,columns:8,rows:12,spacing:.68,cost:12000,upgrade:5800,pad:{x:-28,z:-13}}
];
export const SEEDS=BEDS.map((b,i)=>({crop:b.crop,name:b.name.replace('beet','samen'),source:["start","shop","find","shop","find","shop","find"][i],cost:[0,260,0,750,0,1300,0][i],foundRound:[1,11,46,35,24,58,67][i],pad:i===1?{x:-7.7,z:-4.5}:i===5?{x:2,z:-16}:{x:b.pad.x+3.1,z:b.pad.z}}));
export const PRODUCTS={
  ...HONEY_PRODUCTS,
  giftbox:{name:'Mondgarten-Geschenkbox',plural:'Geschenkboxen',icon:'▣',color:'#bda1d3',value:100},
  honeyapple:{name:"Honigapfel",plural:"Honigäpfel",icon:"⬡",color:"#e8ba79",value:60},
  bouquet:{name:'Mondstrauß',plural:'Mondsträuße',icon:'❀',color:'#b79ad7',value:10},
  tea:{name:'Sternentee',plural:'Sternentees',icon:'♨',color:'#a4b982',value:24},
  oil:{name:'Blütenduftöl',plural:'Duftöle',icon:'♧',color:'#ddbc83',value:45},
  elixir:{name:'Mondelixier',plural:'Mondelixiere',icon:'◇',color:'#a796d8',value:160}
};
export const WORKSHOPS=[
  {id:'bouquet',name:'Blumenbinderei',model:'bouquet',product:'bouquet',inputs:{moonbloom:6},seconds:15,valueMultiplier:2,cost:900,x:0,z:12,pad:{x:0,z:15},requires:null,description:'6 Mondblüten → 1 Mondstrauß. 15 Sekunden Grundzeit; der Strauß ist mindestens doppelt so viel wert wie die verwendeten Blumen. Links an der Werkstatt Zutaten ablegen, rechts Produkte abholen.'},
  {id:'tea',name:'Sternenteeküche',model:'tea',product:'tea',inputs:{lavender:8},seconds:16,valueMultiplier:2,cost:1600,x:8,z:12,pad:{x:8,z:15},requires:'bouquet',description:'8 Lavendelbündel → 1 Sternentee. Links an der Werkstatt Zutaten ablegen, rechts Produkte abholen.'},
  {id:'oil',name:'Duftöldestille',model:'oil',product:'oil',inputs:{coral:10},seconds:20,valueMultiplier:2,cost:2400,x:17,z:10,pad:{x:17,z:13},requires:'tea',description:'10 Korallenblüten → 1 Blütenduftöl.'},
  {id:'elixir',name:'Mondalchemie',model:'elixir',product:'elixir',inputs:{tea:1,oil:1,mushroom:6},seconds:26,valueMultiplier:2,cost:4200,x:26,z:9,pad:{x:26,z:12},requires:'oil',description:'1 Sternentee + 1 Duftöl + 6 Glühpilze → 1 Mondelixier.'},
  {id:'gifts',name:'Geschenkwerkstatt',model:'gifts',product:'giftbox',inputs:{lavender:8,bouquet:1,moonHoney:1},alternatives:HIVES.slice(1).map(h=>({lavender:8,bouquet:1,[h.honey]:1})),seconds:180,minimumSeconds:180,valueMultiplier:5,cost:2600,x:16,z:-1,pad:{x:17,z:3},requires:'tea',optional:true,description:'8 Lavendel + 1 Mondstrauß + 1 Honig beliebiger Sorte → 1 Geschenkbox. Mindestens 3 Minuten Herstellung, +400 % auf den tatsächlichen Zutatenwert.'}
];
export const VILLAGE={
  farm:{cost:2400,x:-30,z:-7,pad:{x:-28,z:-3}},
  woodcock:{cost:8500,x:-25,z:1,pad:{x:-25,z:4}},
  bus:{cost:600000000,x:-29,z:10,pad:{x:-28,z:15}},
  warehouse:{x:-11,z:0,radius:1.8,pad:{x:-7,z:3},baseCapacity:600,cost:400},
  snail:{cost:1400,growth:1.55,max:12,upgrade:950,speed:1.05,capacity:24,capacityPerLevel:4,harvestSeconds:.8,playerSpace:8,pad:{x:-16,z:5},upgradePad:{x:-16,z:9}},
  partner:{cost:1800,requires:'tea',x:-18,z:0,pad:{x:-19,z:3.6},capacity:64,speed:4.1,stages:['Fundament für Schnecki','Schneckis Haus: Wände','Schneckis Haus: Dach & Einzug'],materials:[{bouquet:24},{tea:20},{oil:15}],scrap:[0,0,6]},
  sprinkler:{cost:4200,pad:{x:15,z:-8.5},x:12,z:-12},
  tools:{reach:{x:-11.5,z:20},bag:{x:-6,z:20},speed:{x:-11.5,z:26},value:{x:-6,z:26}},
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

WORKSHOPS[0].specialty='Kurze Bindearbeit: Blumen werden sichtbare Sträuße.';
WORKSHOPS[1].specialty='Teeküche: Lavendel oder Obst aufgießen; später Honigäpfel.';
WORKSHOPS[2].specialty='Destille: Blüten und Obst zu wertvollem Duftöl veredeln.';
WORKSHOPS[3].specialty='Alchemie: fertige Waren zu einem größeren Schatz verbinden.';
WORKSHOPS[4].specialty='Geschenke: Lavendel, Strauß und Honig gemeinsam verpacken.';
