/**
 * MONDGARTEN CONTENT CATALOG
 * Change crops, palettes, prices and field layouts here; the simulation and
 * rendering know only IDs and the reusable shapes below. No UI code needed.
 */
export const COLLECTIBLES = {
  moonbloom: {
    name:'Mondblüte', plural:'Mondblüten', action:'pflücken',
    model:'blossom', bundle:'bale', color:'#ba9ce9', accent:'#e3d1fb',
    stem:'#75934f', wrap:'#a3cb9c', tie:'#ecce88',
    value:1, regrowSeconds:38, height:1.08, width:.62, rareChance:.035,
    collectSound:660, sparkles:'#dfccfa'
  },
  lavender: {
    name:'Sternenlavendel', plural:'Lavendelbündel', action:'schneiden',
    model:'sprig', bundle:'bale', color:'#9270d1', accent:'#d3b6f4',
    stem:'#6f985a', wrap:'#b9d899', tie:'#ead49c',
    value:1.8, regrowSeconds:43, height:1.25, width:.58, rareChance:.04,
    collectSound:740, sparkles:'#d4b7f3'
  },
  coral: {
    name:'Korallenblüte', plural:'Korallenblüten', action:'pflücken',
    model:'blossom', bundle:'bale', color:'#ed9a98', accent:'#ffc8a3',
    stem:'#74945c', wrap:'#b7d19b', tie:'#f2d9a4',
    value:6, regrowSeconds:46, height:1.13, width:.67, rareChance:.045,
    collectSound:780, sparkles:'#ffd1b0'
  },
  crystal: {
    name:'Sternenkristall', plural:'Sternenkristalle', action:'sammeln',
    model:'crystal', bundle:'crate', color:'#73d5c8', accent:'#c1f7de',
    stem:'#7eac9b', wrap:'#c8a477', tie:'#f3d69c',
    value:8, regrowSeconds:48, height:1.3, width:.67, rareChance:.05,
    collectSound:1040, sparkles:'#c0fff1'
  },
  mushroom: {
    name:'Glühpilz', plural:'Glühpilze', action:'sammeln',
    model:'mushroom', bundle:'crate', color:'#b9d47c', accent:'#f0f3b9',
    stem:'#f1dbab', wrap:'#a1b889', tie:'#efd9a0',
    value:4.5, regrowSeconds:51, height:1.12, width:.76, rareChance:.05,
    collectSound:560, sparkles:'#f5f9ba'
  },
  starfruit: {
    name:'Sternenfrucht', plural:'Sternenfrüchte', action:'pflücken',
    model:'orchard', bundle:'crate', color:'#88a9e2', accent:'#d2e4ff',
    stem:'#7aa29d', wrap:'#c6a48a', tie:'#eee0b5',
    value:3, regrowSeconds:54, height:1.15, width:.68, rareChance:.06,
    collectSound:920, sparkles:'#deeeff'
  },
  sunbloom: {
    name:'Sonnenblüte', plural:'Sonnenblüten', action:'pflücken',
    model:'blossom', bundle:'bale', color:'#f2c76e', accent:'#ffe9ad',
    stem:'#87964b', wrap:'#acbc87', tie:'#fff0bd',
    value:10, regrowSeconds:58, height:1.35, width:.73, rareChance:.065,
    collectSound:860, sparkles:'#fff1a8'
  },
  nebula: {
    name:'Nebelknospe', plural:'Nebelknospen', action:'pflücken',
    model:'sprig', bundle:'bale', color:'#cb9dcc', accent:'#f3c9e5',
    stem:'#83a48b', wrap:'#b8c6a0', tie:'#f4d5b8',
    value:8, regrowSeconds:62, height:1.28, width:.67, rareChance:.07,
    collectSound:1100, sparkles:'#ffd8f2'
  }
};

export const GARDENS = [
  {id:'moonmeadow',name:'Mondwiese',sub:'Ein kleines Stück Glück',cost:0,crop:'moonbloom',palette:{ground:'#9fc477',edge:'#74964f',path:'#e6d4ae',soil:'#b8a180',water:'#a5d3ce'},color:'#b6cf8c',dark:'#73965a',flower:'#c6a9e7'},
  {id:'lavendergrove',name:'Lavendelhain',sub:'Wo die Abendluft nach Sternen duftet',cost:1800,crop:'lavender',palette:{ground:'#aec48a',edge:'#7b9b65',path:'#ead8bd',soil:'#b0a07f',water:'#b2d4cb'},color:'#b19cd8',dark:'#83739d',flower:'#d7bcf5'},
  {id:'coralgarden',name:'Korallengarten',sub:'Ein Garten wie ein Sonnenuntergang',cost:18000,crop:'coral',palette:{ground:'#c1ce95',edge:'#8d9e66',path:'#f1dfc1',soil:'#b8a27f',water:'#b0d8cd'},color:'#dda791',dark:'#aa8174',flower:'#fac3ad'},
  {id:'crystalgrove',name:'Kristalllichtung',sub:'Hier funkelt sogar der Boden',cost:180000,crop:'crystal',palette:{ground:'#a3c5a3',edge:'#719e8b',path:'#d8e5d0',soil:'#98b5a7',water:'#a1d6de'},color:'#8fd9c9',dark:'#5c9c98',flower:'#bdf1e5'},
  {id:'mushroomforest',name:'Glühpilzwald',sub:'Ein leises Leuchten unter den Bäumen',cost:2200000,crop:'mushroom',palette:{ground:'#a8b782',edge:'#7a8c65',path:'#dad0b2',soil:'#ac9d7d',water:'#95bbb0'},color:'#c0ce8c',dark:'#7a926a',flower:'#e3eeb1'},
  {id:'starsea',name:'Sternenmeer',sub:'Zwischen zwei leisen Gezeiten',cost:32000000,crop:'starfruit',palette:{ground:'#a1bfb7',edge:'#72948d',path:'#dce3d1',soil:'#a2b1a4',water:'#8cc9d4'},color:'#a7c4e6',dark:'#7892ba',flower:'#cee5ff'},
  {id:'sunfield',name:'Sonnenblüte',sub:'Am goldenen Rand des Universums',cost:600000000,crop:'sunbloom',palette:{ground:'#bbc88b',edge:'#909d61',path:'#efe0b6',soil:'#c2a97c',water:'#abd3c1'},color:'#e5cc83',dark:'#ac9a62',flower:'#ffedb0'},
  {id:'nebulaheart',name:'Nebelherz',sub:'Hinter jedem Ende ein neuer Anfang',cost:14000000000,crop:'nebula',palette:{ground:'#b7bc9e',edge:'#8e927c',path:'#e9d8d2',soil:'#b4a18f',water:'#c5cedf'},color:'#d6add1',dark:'#a47eaa',flower:'#f7d2eb'}
];

export const WORLD = {
  halfSize:35,
  bank:{x:-9,z:8,radius:3.3},
  spawn:{x:0,z:8},
  // Blocks are dense crop beds. Add/remove rectangles or change spacing here.
  fields:[
    {x:6,z:0,columns:27,rows:23,spacing:.78},
    {x:-14,z:-15,columns:21,rows:19,spacing:.8},
    {x:18,z:23,columns:21,rows:15,spacing:.8}
  ],
  stack:{maxVisible:26,layerHeight:.31,width:.95,depth:.64},
  camera:{height:31,distance:22,view:27,follow:.065},
  harvest:{cooldown:.14,baseBatch:7},
  selling:{unitsPerSecond:28,minimumDuration:.55},
  materials:{roughness:.82},
  currency:{name:'Sternenstaub',symbol:'✧'}
};

export function getCrop(gardenIndex=0){const garden=GARDENS[gardenIndex]??GARDENS[0];return COLLECTIBLES[garden.crop];}
export function generateFieldCells(fields=WORLD.fields){
  return fields.flatMap((f,fieldIndex)=>Array.from({length:f.rows*f.columns},(_,i)=>({
    x:f.x+(i%f.columns-(f.columns-1)/2)*f.spacing,
    z:f.z+(Math.floor(i/f.columns)-(f.rows-1)/2)*f.spacing,
    field:fieldIndex,index:i
  })));
}
export function stackLevels(amount,bagCapacity,config=WORLD.stack){return !Number.isFinite(amount)||!Number.isFinite(bagCapacity)||amount<=0||bagCapacity<=0?0:Math.min(1,amount/bagCapacity)*config.maxVisible;}
export function stackLayers(amount,bagCapacity,config=WORLD.stack){return Math.ceil(stackLevels(amount,bagCapacity,config));}
export function stackHeight(amount,bagCapacity,config=WORLD.stack){return stackLevels(amount,bagCapacity,config)*config.layerHeight;}
export function validateContent(){
  const supportedModels=new Set(['blossom','sprig','crystal','mushroom','fruit','orchard']);
  for(const [id,c]of Object.entries(COLLECTIBLES)){
    if(!supportedModels.has(c.model))throw new Error(`Unknown model on ${id}`);
    if(!['bale','crate'].includes(c.bundle))throw new Error(`Unknown bundle on ${id}`);
    for(const k of ['value','regrowSeconds','height','width'])if(!Number.isFinite(c[k])||c[k]<=0)throw new Error(`Invalid ${k} on ${id}`);
  }
  for(const g of GARDENS)if(!COLLECTIBLES[g.crop])throw new Error(`Unknown crop ${g.crop}`);
  for(const f of WORLD.fields)if(f.columns<1||f.rows<1||f.spacing<=0)throw new Error('Invalid field layout');
  return true;
}
