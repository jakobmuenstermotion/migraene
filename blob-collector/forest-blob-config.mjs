// Provisional test values. Sizes belong to each blob; five ranks belong to the building.
export const BLOB_TEST={maxWild:2,spawnSeconds:[600,660],captureSeconds:.65,catchSeconds:1.1,growthSeconds:15,feed:{moss:{leaf:20},wood:{wood:5}},flee:{moss:{notice:2,speed:.9},forest:{notice:4,speed:1.7},sand:{notice:2.3,speed:.8},tide:{notice:3.5,speed:1.25},snow:{notice:4.5,speed:1},crystal:{notice:3.2,speed:1},ash:{notice:5.5,speed:1.6},lava:{notice:9,speed:0}},sizes:['','Klein','Mittel','Groß','Riesig'],worker:{speed:[0,1.6,1.9,2.3,2.6],capacity:[0,12,30,70,100],pickSeconds:[0,.65,.45,.25,.2],searchRadius:18,returnRadius:.8},stationSlots:[0,8,12,18,26,36]};
const WALD=['leaf','wood','stone','moss','mushroom'],KUESTE=['sand','shell','seagrass','driftwood','coral'],BERG=['snow','frostwood','frostflower','frostmoss'],VULKAN=['desertsand','clay','coloredearth','cactusfibre','desertflower'];
// Interne IDs forest und tree bleiben wegen alter Spielstände; angezeigt wird Blattblob und Waldblob (Gebietsblob).
export const BLOB_SPECIES={
 snail:{name:'Schneckenblob',color:'#c9d98a',dark:'#7f9a4e',materials:[],job:'follow'},
 moss:{name:'Moosblob',color:'#4f8a4a',dark:'#2f5f33',materials:['stone','moss','mushroom']},forest:{name:'Blattblob',color:'#b6e34f',dark:'#7fa52c',materials:['leaf','wood']},tree:{name:'Waldblob',color:'#2fa86a',dark:'#1b6e45',materials:WALD,region:'wald'},
 sand:{name:'Sandblob',color:'#f5c95a',dark:'#b98f2a',materials:['sand','shell']},tide:{name:'Gezeitenblob',color:'#2fc4c0',dark:'#16807e',materials:['seagrass','driftwood','coral']},coastal:{name:'Küstenblob',color:'#ff8f7a',dark:'#c25a48',materials:KUESTE,region:'kueste'},
 snow:{name:'Schneeblob',color:'#aab8ff',dark:'#6f7fd0',materials:['snow','frostflower']},crystal:{name:'Kristallblob',color:'#55d8ff',dark:'#1f93bd',materials:['frostwood','frostmoss']},mountain:{name:'Bergblob',color:'#6a7fd0',dark:'#3f4f98',materials:BERG,region:'berg'},
 ash:{name:'Ascheblob',color:'#6a6664',dark:'#3a3735',materials:['desertsand','cactusfibre']},lava:{name:'Lavablob',color:'#ff6a1a',dark:'#b23c10',materials:['clay','coloredearth','desertflower']},volcanic:{name:'Vulkanblob',color:'#c9302a',dark:'#7a1712',materials:VULKAN,region:'vulkan'},
 storer:{name:'Lagerblob',color:'#b98550',dark:'#7d5530',materials:[],job:'storage',text:'Beliefert Werkstätten aus dem Lager und bringt Produkte zurück.'},
 treasure:{name:'Schatzblob',color:'#f2c21f',dark:'#a8820c',materials:[],job:'treasure',text:'Gräbt vergrabene Funde aus und lagert sie ein.'},
 piler:{name:'Häufchenblob',color:'#a8a04a',dark:'#6f6a28',materials:[],job:'pile',text:'Schiebt lose Materialien im Radius zu sortierten Haufen zusammen.'},
 helper:{name:'Helferblob',color:'#4f8fe8',dark:'#2a5ea8',materials:[],job:'helper',text:'Beschleunigt alle Aufträge einer Werkstatt.'},
 portal:{name:'Portalblob',color:'#8a5cf6',dark:'#4a2aa8',materials:[],job:'portal',text:'Verbindet zwei Orte: Wer durch seinen Ring läuft, kommt am anderen Ende heraus.'},
 seller:{name:'Verkaufsblob',color:'#c765d8',dark:'#843c94',materials:[],job:'sale',text:'Verkauft freigegebene Waren am Stand.'}
};
export const BLOB_FUSIONS={'forest+moss':'tree','sand+tide':'coastal','crystal+snow':'mountain','ash+lava':'volcanic','coastal+tree':'storer','mountain+tree':'piler','tree+volcanic':'treasure','coastal+mountain':'portal','coastal+volcanic':'helper','mountain+volcanic':'seller'};
export const fusionSpecies=(a,b)=>BLOB_FUSIONS[[a,b].sort().join('+')]??null;
export function blobName(b){return BLOB_SPECIES[b.species??(b.genes.moss&&b.genes.wood?'tree':b.genes.wood?'forest':'moss')].name;}
export function blobBranch(b){return b.genes.moss&&b.genes.wood?'mixed':b.genes.moss?'moss':'wood';}
// Compatibility with earlier saved prototypes: no companion/passive gameplay remains.
export function specialName(){return '';}
export function companionEffects(){return {regrowth:0,capacity:0,bonus:0,production:0,pulse:false,key:'none'};}

// Jakob 31.10.: Wald-, Küsten-, Berg- und Vulkanblobs samt ihren Urarten sammeln nur in ihrem eigenen Gebiet.
export const GROUP_NAMES={wald:'Wald',kueste:'Küste',berg:'Eistal',vulkan:'Vulkan',spezial:'Spezial'};
const GROUP_AREAS={wald:['sunny','steinbach','mooswald','pilzhain'],kueste:['coast'],berg:['ice'],vulkan:['volcano']};
const SPECIES_GROUP={moss:'wald',forest:'wald',tree:'wald',sand:'kueste',tide:'kueste',coastal:'kueste',snow:'berg',crystal:'berg',mountain:'berg',ash:'vulkan',lava:'vulkan',volcanic:'vulkan'};
export const blobGroup=species=>SPECIES_GROUP[species]??'spezial';
export const blobAreas=species=>GROUP_AREAS[SPECIES_GROUP[species]]??[];
export const blobDefaultArea=species=>blobAreas(species)[0]??'sunny';

// Unbenannte Blobs tragen einen festen Kosenamen aus ihrer Nummer.
const BLOB_NAMES=['Pip','Mochi','Knubbel','Wobbel','Flöckchen','Bommel','Schlabber','Tilda','Momo','Krümel','Puddi','Nugget','Lotte','Gummi','Wackel','Fritzi','Bobo','Mimi','Tofu','Zottel','Plopp','Hanni','Quabbel','Kiki','Dotti','Rudi','Flummi','Nori','Schnuffi','Pudding','Mops','Luna','Wuschel','Keks','Bibi','Toni'];
export const blobTitle=b=>b.name||BLOB_NAMES[(Number(String(b.id).slice(1))||0)%BLOB_NAMES.length];
