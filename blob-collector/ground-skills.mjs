// Values are cumulative: buying rank III means +30%, not 10% * 20% * 30%.
export const GROUND_BRANCHES=[
  {id:'width',name:'Saugbreite',glyph:'width',ranks:3,labels:['+25 % Breite','+50 % Breite','+75 % Breite'],descriptions:['25 % breiter als die Grundbreite.','50 % breiter als die Grundbreite.','75 % breiter als die Grundbreite.'],mods:[{widthBonus:.25},{widthBonus:.25},{widthBonus:.25}]},
  {id:'light',name:'Leichterer Sauger',glyph:'shoe',ranks:3,labels:['Leichterer Sauger I','Leichterer Sauger II','Leichterer Sauger III'],descriptions:['10 % mehr Bewegungsgeschwindigkeit beim Saugen.','20 % mehr Bewegungsgeschwindigkeit beim Saugen.','30 % mehr Bewegungsgeschwindigkeit beim Saugen.'],mods:[{moveBonus:.1},{moveBonus:.1},{moveBonus:.1}]},
  {id:'energy',name:'Energieeffizienz',glyph:'battery',ranks:3,labels:['−10 % Akku','−20 % Akku','−30 % Akku'],descriptions:['10 % weniger Akkuverbrauch.','20 % weniger Akkuverbrauch.','30 % weniger Akkuverbrauch.'],mods:[{energySaving:.1},{energySaving:.1},{energySaving:.1}]},
  {id:'depth',name:'Grabtiefe',glyph:'depth',ranks:2,labels:['Grabtiefe I','Grabtiefe II'],descriptions:['Erreicht die erste tiefere Bodenschicht.','Erreicht auch die tiefste Bodenschicht im Test.'],mods:[{digDepth:1},{digDepth:1}]},
  {id:'tank',name:'Tankausbau',glyph:'gem',ranks:2,labels:['Tank +250','Tank +500'],descriptions:['250 Plätze mehr im Saugtank dieses Saugers.','Insgesamt 500 Plätze mehr im Saugtank dieses Saugers.'],mods:[{ground_tank:1},{ground_tank:1}]},
  {id:'bonus',name:'Bonusfunde',glyph:'gem',ranks:3,labels:['50 % doppelt','Immer doppelt','20 % selten'],descriptions:['Ausgegrabene Funde werden mit 50 % Chance verdoppelt.','Ausgegrabene Funde werden garantiert verdoppelt.','Weiterhin doppelte Funde; zusätzlich 20 % Chance auf die seltene Variante.'],mods:[{doubleChance:.5},{doubleChance:.5},{rareChance:.2}]}
];
const roman=['I','II','III'];
// Rows run from the three entry upgrades toward the detector. Every visible
// connection is a prerequisite; redundant ancestors need no second line.
const layout=[
  ['width1',15,84,[]],['light1',50,84,[]],['energy1',85,84,[]],
  ['width2',15,66,['width1']],['depth1',50,66,['width1','light1']],['light2',85,66,['light1','energy1']],
  ['width3',10,48,['width2','depth1']],['bonus1',36,48,['depth1']],['depth2',63,48,['depth1','width2','light2']],['energy2',90,48,['energy1','light2'],['light2']],
  ['bonus2',15,30,['bonus1','depth2']],['light3',50,30,['light2','energy2'],['energy2']],['energy3',85,30,['energy2','depth2']],
  ['tank1',50,22,['depth1']],['tank2',75,20,['tank1','depth2']],
  ['bonus3',25,15,['bonus2','energy3']]
];
const upgrades=layout.map(([id,x,y,requires,connections])=>{const branch=GROUND_BRANCHES.find(b=>id.startsWith(b.id)),rank=Number(id.at(-1));return {id,name:branch.name+' '+roman[rank-1],description:branch.descriptions[rank-1],label:branch.labels[rank-1],glyph:branch.glyph,rank,cost:rank,requires,connections,position:{x,y},mods:branch.mods[rank-1]};});
export const GROUND_NODES=[...upgrades,{id:'detector',name:'Bodendetektor',description:'Alle 20 Sekunden läuft eine Welle 20 m weit. Ein Kreis auf dem Boden zeigt, wo etwas vergraben liegt. Die genaue Stelle findest du selbst.',label:'Bodendetektor',glyph:'radar',cost:3,requires:['depth2','bonus1'],connections:['depth2','bonus1'],position:{x:65,y:5},mods:{detector:1}}];
export const GROUND_TEST_POINTS=GROUND_NODES.reduce((sum,n)=>sum+n.cost,0);
export function groundPosition(node){return node.position;}
export function buriedReward(mode,doubleRoll,rareRoll){return {quantity:doubleRoll<mode.doubleChance?2:1,rare:rareRoll<mode.rareChance};}
export const BURIED_FINDS=[
  {id:'treasure',kind:'acorn',name:'Eichel',x:-3.8,z:1.2,depth:0},
  {id:'acorn',kind:'acorn',name:'Eichel',x:1.5,z:2.8,depth:0},
  {id:'pebble',kind:'stone',name:'Kiesel',x:-1.6,z:-.7,depth:0},
  {id:'root',kind:'root',name:'Wurzel',x:3.5,z:-2.4,depth:1},
  {id:'amber',kind:'amber',name:'Bernstein',x:-6.2,z:-1,depth:1},
  {id:'relic',kind:'relic',name:'Relikt',x:5.4,z:-3.7,depth:2},
  {id:'crystal',kind:'crystal',name:'Kristall',x:.2,z:-5.2,depth:2}
].map(o=>({...o,tool:'ground',solid:false,seconds:1.2}));
// Jakob 2.11.: tiefe Waldfunde wachsen nach wie in den anderen Welten, weil späte Rezepte sie brauchen.
for(const f of BURIED_FINDS)if(f.depth>0&&!f.blueprint&&f.kind!=='amber')f.renewable=true;
