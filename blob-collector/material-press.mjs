import {softCoins,cheaper} from './coin-curve.mjs';
import {helperSpeed} from './special-blobs.mjs';
import {FLOWERS,FLOWER_ITEMS,flowerItemKind} from './flower-config.mjs';
import {completeGoal} from './goal-state.mjs';
import {addNormalMaterial} from './inventory.mjs';
import {CLOTHING} from './living-config.mjs';
import {buildingBuilt} from './homebase-build.mjs';
import {storeOutput,collectOutputs,restoreOutputs} from './production-output.mjs';
import {recordPickup} from './pickup-feedback.mjs';
import {workshopPose,sunnyHeight} from './sunny-area.mjs';
import {GAME_BALANCE} from './game-balance.mjs';
import {companionEffects} from './forest-blob-config.mjs';
import {capacityFor,addMaterial,removeMaterial,reservedBagSlots} from './inventory.mjs';
import {effectiveVacuum} from './vacuum-skills.mjs';
import {payConstruction} from './construction-stock.mjs';
import {PLANNED_ACCESSORIES} from './accessory-plan.mjs';
import {pickPriority,addPriority,priorityList,runsRecipe,compactJobs,JOB_SLOTS} from './workshop-upgrades.mjs';
export const PRESS={recipes:{paper:{id:'paper',name:'Papier',input:'leaf',cost:100,seconds:3},essence:{id:'essence',name:'Blütenessenz',input:'flowers',kinds:Object.keys(FLOWER_ITEMS),cost:50,seconds:6},sandstone:{id:'sandstone',name:'Sandsteinblock',input:'sand',cost:100,seconds:6},shelllime:{id:'shelllime',name:'Muschelkalk',input:'shell',cost:20,seconds:5}},upgrades:{speed:{name:'Pressgeschwindigkeit',values:[1,.85,.7]},batch:{name:'Chargengröße',values:[1,3,5,7]},efficiency:{name:'Materialeffizienz',values:[1,.95,.9]},parallel:{name:'Zwei Aufträge',values:[0,1,2]},night:{name:'Nachtschicht',values:[0,1]}}};
export const PRODUCT_NAMES={reinforcedpanel:'Verstärkte Platte',driftbead:'Treibholzperle',gear:'Zahnrad',driftwood:'Treibholz',essence:'Blütenessenz',flowers:'Blumen (gemischt)',rope:'Seil',backpack1:'Tankstufe I',backpack2:'Tankstufe II',backpack3:'Tankstufe III',backpack4:'Tankstufe IV',backpack5:'Tankstufe V',waldcoin:'Alter Waldtaler',rarewaldcoin:'Glänzender Waldtaler',goldleaf:'Goldenes Blatt',root:'Wurzel',amber:'Bernstein',relic:'Waldrelikt',crystal:'Kristall',rareacorn:'Seltene Eichel',rarestone:'Glänzender Stein',rareroot:'Seltene Wurzel',rareamber:'Seltener Bernstein',rarerelic:'Seltenes Relikt',rarecrystal:'Seltener Kristall',rareworm:'Seltener Wurm',optical:'Optisches Modul',lens:'Geschliffene Linse',energycore:'Energiekern',ceramic:'Keramikteile',ice:'Eis',frostessence:'Frostessenz',coolingmodule:'Kühlmodul',coral:'Korallenstücke',icecrystal:'Eiskristalle',frostflower:'Frostblumen',desertcrystal:'Glutkristalle',worm:'Würmer',sandstone:'Sandsteinblock',shelllime:'Muschelkalk',beam:'Holzbalken',woodpanel:'Holzplatten',composite:'Verbundplatten',stoneslab:'Steinplatten',stonebrick:'Steinziegel',sandtile:'Sandsteinfliesen',fibre:'Naturfasern',resin:'Pflanzenharz',extract:'Pilzextrakt',fabric:'Seegrasgewebe',mechanical:'Mechanische Bauteile',filtermodule:'Filtermodul',glassblank:'Glasrohling',board:'Holzbretter',stoneblock:'Steinblöcke',sand:'Sand',shell:'Muscheln',seagrass:'Seegras',leaf:'Blätter',wood:'Holz',paper:'Papier',briquette:'Holzbriketts',moss:'Moos',mushroom:'Pilze',stone:'Steine',acorn:'Eicheln',fruit:'Früchte'};
Object.assign(PRODUCT_NAMES,{smokedfish:'Räucherfisch',fishsoup:'Fischsuppe',glitterbait:'Glitzerköder',starshard:'Sternsplitter',luckycap:'Glückspilz',frozenseed:'Gefrorener Samen',frozenpearl:'Gefrorene Perle',blueicestone:'Blauer Eisstein',snow:'Schnee',snowblock:'Schneeblock',frostwood:'Frostholz',frostboard:'Frostbrett',frostcone:'Frostzapfen',iceheart:'Eisherz',frostrelic:'Frostrelikt',iceplate:'Eisplatte',ironore:'Eisenerz',copperore:'Kupfererz',ironbar:'Eisenbarren',copperbar:'Kupferbarren',clay:'Lavagestein',desertsand:'Vulkanasche',coloredearth:'Schwefel',desertglass:'Obsidian',colorceramic:'Farbkeramik',beachglass:'Strandglas',polishedglass:'Polierglas',resinlump:'Harzklumpen',frostmoss:'Frostmoos',cactusfibre:'Lavafasern',warmfibre:'Warmfaser',desertfabric:'Feuerfestes Gewebe',wire:'Leitung'});
Object.assign(PRODUCT_NAMES,{seedpod:'Samenstand',glowfruit:'Leuchtende Waldfrucht',palmfruit:'Palmfrucht',windshell:'Windmuschel',shimmershell:'Schimmermuschel',petrifiedwood:'Versteinertes Holz',rareshell:'Seltene Muschel',nacre:'Perlmutt'});
Object.assign(PRODUCT_NAMES,{frozenseed:'Gefrorener Samen',pinecone:'Tannenzapfen',cinderpod:'Aschenzapfen',icebell:'Eisglocke',frozenpearl:'Gefrorene Perle',blueicestone:'Blauer Eisstein',starcone:'Sternzapfen',paintedstone:'Bimsstein',cactusfruit:'Feuerfrucht',desertflower:'Glutblüte',sunshard:'Magmascherbe',fossilshell:'Aschefossil',suncapsule:'Glutkapsel'});
for(const [id,[name]] of Object.entries(PLANNED_ACCESSORIES))PRODUCT_NAMES[id]=name;
PRODUCT_NAMES.blobflowerwreath='Blumenkranz · Blob';
PRESS.recipes.desertglass={id:'desertglass',name:'Obsidian',input:'desertsand',cost:100,seconds:7};
PRESS.recipes.snowblock={id:'snowblock',name:'Schneeblock',input:'snow',cost:100,seconds:6};
// Neugestaltung (Jakob 29.10.): Holzkohle für die Schmiede, erstes Pressenrezept mit zwei Zutaten (inputs).
PRESS.recipes.charcoal={id:'charcoal',name:'Holzkohle',input:'wood',inputs:{wood:5,leaf:200},cost:205,seconds:4};
Object.assign(PRODUCT_NAMES,{charcoal:'Holzkohle',ironfitting:'Eisenbeschläge',springsteel:'Federstahl',frostglass:'Frostglas',frostbeam:'Frostbalken',driftboard:'Treibholzbrett',icequader:'Eisquader',mosaictile:'Mosaikfliesen',upholstery:'Polsterstoff',clockwork:'Uhrwerk',pump:'Pumpe',crystalball:'Kristallkugel',frostcasket:'Frostholz-Schatulle',shellbox:'Muschel-Schmuckkästchen',icesculpture:'Eisskulptur',wintertea:'Wintertee',scentcandle:'Duftkerze',prismlens:'Prismenlinse',obsidianlens:'Obsidianlinse',findercrystal:'Spürkristall',windrotor:'Flügelrad',frostloop:'Frostkreislauf',embercoil:'Glutspule',vortexchamber:'Wirbelkammer',stormcore:'Sturmkern'});
// Jakob 1.11.: 10 besondere Blumen werden zum Blütenstein, Holzkohle erst, wenn die Schmiede steht.
PRESS.recipes.flowerstone={id:'flowerstone',name:'Blütenstein',input:'rareflower',cost:10,seconds:5,sale:50};
Object.assign(PRODUCT_NAMES,{flowerstone:'Blütenstein',flowerwood:'Blütenleim'});
PRESS.recipes.charcoal.needs='forge';
export const pressRecipeOpen=(s,id)=>!PRESS.recipes[id]?.needs||Boolean(s.crafting?.workshops?.[PRESS.recipes[id].needs]?.owned);
const pressInputs=r=>r.inputs??null;
export function recountStorage(s){s.stored=Object.values(s.inventory.storage).reduce((sum,n)=>sum+n,0);}
export function pressCapacity(s){return [1000,1500,2000,2500][Math.max(0,Math.min(3,s.press.upgrades.batch|0))];}
export function pressOccupied(s){return Object.values(s.press.buffers??{}).reduce((a,n)=>a+n,0)+JOB_SLOTS.reduce((a,k)=>a+(s.press[k]?.consumed??0),0);}
export function depositPress(s,kind,amount=Infinity){kind=flowerItemKind(kind);
 if(!buildingBuilt(s,'press')||!Object.values(PRESS.recipes).some(r=>(r.kinds??(r.inputs?Object.keys(r.inputs):[r.input])).includes(kind))||!(amount===Infinity||Number.isSafeInteger(amount)&&amount>0))return 0;
 const n=Math.max(0,Math.min(amount,s.inventory.bag[kind]??0,pressCapacity(s)-pressOccupied(s)));
 if(!n||!removeMaterial(s,kind,n))return 0;s.press.buffers[kind]=(s.press.buffers[kind]??0)+n;return n;
}
export function withdrawPress(s,kind,amount=Infinity){if(!buildingBuilt(s,'press'))return 0;const n=addNormalMaterial(s,kind,Math.min(amount,s.press.buffers[kind]??0));s.press.buffers[kind]=(s.press.buffers[kind]??0)-n;return n;}
export function selectPressRecipe(s,id,now=Date.now()){if(!buildingBuilt(s,'press')||!PRESS.recipes[id]||!pressRecipeOpen(s,id))return false;if(s.press.upgrades.parallel>0)pickPriority(s.press,id,s.press.upgrades.parallel+1);else s.press.preferred=id;nextJob(s,now);return true;}
export function pressRecipe(s,id){const r=PRESS.recipes[id];if(!r)return null;const u=s.press.upgrades,cost=Math.ceil(r.cost*PRESS.upgrades.efficiency.values[u.efficiency]),seconds=r.seconds*GAME_BALANCE.productionMultiplier*(s.productionTimeScale??1)*PRESS.upgrades.speed.values[u.speed]/helperSpeed(s,'press'),multi=pressInputs(r)?Object.fromEntries(Object.entries(r.inputs).map(([k,n])=>[k,Math.ceil(n*PRESS.upgrades.efficiency.values[u.efficiency])])):null,available=multi?Math.min(...Object.entries(multi).map(([k,n])=>Math.floor((s.press.buffers?.[k]??0)/n)))*Object.values(multi).reduce((a,b)=>a+b,0):(r.kinds??[r.input]).reduce((n,k)=>n+(s.press.buffers?.[k]??0),0),max=1,capacity=pressCapacity(s,r.input),inJob=s.press.job?.input===r.input?s.press.job.consumed:0;const multiCost=multi?Object.values(multi).reduce((a,b)=>a+b,0):cost;return {...r,inputs:multi??undefined,cost:multiCost,seconds,available,max,possible:Math.floor(available/multiCost),capacity,occupied:pressOccupied(s),free:Math.max(0,capacity-pressOccupied(s)),bag:multi?Math.min(...Object.entries(multi).map(([k,n])=>Math.floor((s.inventory.bag[k]??0)/n)))*multiCost:(r.kinds??[r.input]).reduce((n,k)=>n+(s.inventory.bag[k]??0),0)};}
// Ein niedrigerer Vorrang startet nur, wenn danach jeder höhere noch einmal laufen kann; kann der höhere ohnehin nicht laufen, darf der niedrigere die Reste nutzen.
function leavesRoomFor(s,r,firstId){const first=pressRecipe(s,firstId);if(!first||first.possible<1)return true;const a=first.inputs??{[first.input]:first.cost},b=r.inputs??{[r.input]:r.cost};return Object.entries(a).every(([k,n])=>!(k in b)||(s.press.buffers[k]??0)-b[k]>=n);}
function nextJob(s,now){const p=s.press,slots=JOB_SLOTS.slice(0,(p.upgrades.parallel|0)+1),order=priorityList(p);let started=false;for(const [rank,id]of order.entries()){const slot=slots.find(k=>!p[k]);if(!slot)break;if(runsRecipe(p,id))continue;const r=pressRecipe(s,id);if(!r)continue;const quantity=Math.min(r.max,r.possible);if(quantity<1)continue;if(order.slice(0,rank).some(h=>!leavesRoomFor(s,r,h)))continue;const consumed=r.cost*quantity;const ingredients={};if(r.inputs){for(const [k,n]of Object.entries(r.inputs)){s.press.buffers[k]-=n*quantity;ingredients[k]=n*quantity;}}else{let remaining=consumed;for(const k of r.kinds??[r.input]){const n=Math.min(remaining,s.press.buffers[k]??0);if(n){s.press.buffers[k]-=n;ingredients[k]=n;remaining-=n;}}}completeGoal(s,ingredients,0,r.name);p[slot]={id:++p.serial,recipe:id,quantity,input:r.input,consumed,ingredients,startedAt:now,endsAt:now+r.seconds*1000,duration:r.seconds*1000};started=true;}return started;}
export function fillPress(s,id,amount=Infinity,now=Date.now()){if(!buildingBuilt(s,'press')||!s.press||!(amount===Infinity||Number.isSafeInteger(amount)&&amount>0))return 0;const r=pressRecipe(s,id);if(!r)return 0;const n=Math.min(amount,r.bag,r.free);if(!n)return 0;s.press.buffers??={leaf:0,wood:0};if(r.inputs){/* mehrere Zutaten: jeweils so viel, wie in den freien Platz passt, im Rezeptverhältnis */if(r.free<r.cost)return 0;const sets=Math.max(1,Math.floor(n/r.cost));for(const [k,need]of Object.entries(r.inputs)){const take=Math.min(need*sets,s.inventory.bag[k]??0);if(take&&removeMaterial(s,k,take))s.press.buffers[k]=(s.press.buffers[k]??0)+take;}}else{let left=n;for(const k of r.kinds??[r.input]){const take=Math.min(left,s.inventory.bag[k]??0);if(take&&removeMaterial(s,k,take)){s.press.buffers[k]=(s.press.buffers[k]??0)+take;left-=take;}}};addPriority(s.press,id,(s.press.upgrades.parallel|0)+1);nextJob(s,now);return n;}
// Compatibility for the separate test sheet: supplying always uses the backpack.
export function startPress(s,id,quantity=1,now=Date.now()){const r=s.press&&pressRecipe(s,id);if(!r||!Number.isSafeInteger(quantity)||quantity<1||quantity>r.max||r.bag<r.cost*quantity||r.free<r.cost*quantity)return false;return fillPress(s,id,r.cost*quantity,now)>0;}
export function advancePress(s,now=Date.now(),pickup=true){if(!s.press||!buildingBuilt(s,'press'))return false;let changed=nextJob(s,now),loops=0;while(loops++<200){const p=s.press,slot=JOB_SLOTS.filter(k=>p[k]&&now>=p[k].endsAt).sort((a,b)=>p[a].endsAt-p[b].endsAt)[0];if(!slot)break;const j=p[slot];storeOutput(p,j.recipe,j.quantity);p[slot]=null;compactJobs(p);changed=true;nextJob(s,j.endsAt);}if(pickup&&collectOutputs(s,s.press,'press',now))changed=true;return changed;}
export function pressNightShift(s,now=Date.now()){const p=s.press;if(!p||!buildingBuilt(s,'press')||!(p.upgrades.night>0))return 0;let made=0,guard=0;nextJob(s,now);while(JOB_SLOTS.some(k=>p[k])&&guard++<5000){for(const k of JOB_SLOTS){const j=p[k];if(j){storeOutput(p,j.recipe,j.quantity);made+=j.quantity;}p[k]=null;}nextJob(s,now);}return made;}
export function pressProgress(s,now=Date.now()){const j=s.press?.job;return j?Math.max(0,Math.min(1,1-(j.endsAt-now)/j.duration)):0;}
export function setPressUpgrade(s,id,rank){const spec=PRESS.upgrades[id];if(!spec||!Number.isInteger(rank)||rank<0||rank>=spec.values.length)return false;s.press.upgrades[id]=rank;return true;}
export const PRESS_UPGRADE_COSTS={
 speed:[{materials:{board:2,paper:2},coins:50},{materials:{gear:2,composite:2},coins:500}],
 efficiency:[{materials:{board:2,essence:1},coins:75},{materials:{filtermodule:2,resin:2},coins:600}],
 batch:[{materials:{board:4,leaf:100},coins:50},{materials:{beam:2,composite:2},coins:500}],
 parallel:[{materials:{beam:2,gear:2},coins:500}]
};
export function buyPressUpgrade(s,id,rank){
 const entry=PRESS_UPGRADE_COSTS[id]?.[rank-1];
 if(!entry||!buildingBuilt(s,'press')||(s.press.upgrades[id]??0)!==rank-1||(id==='parallel'||id==='night')&&s.press.upgrades.batch<1)return false;
 if(!payConstruction(s,entry.materials,entry.coins))return false;
 s.press.upgrades[id]=rank;
 return true;
}
export function resetProduction(s){if(!JOB_SLOTS.some(k=>s.press?.[k]))return false;s.press.buffers??={leaf:0,wood:0};for(const j of JOB_SLOTS.map(k=>s.press[k]))if(j)for(const [k,n]of Object.entries(j.ingredients??{[j.input]:j.consumed}))s.press.buffers[k]=(s.press.buffers[k]??0)+n;s.press.job=null;s.press.job2=null;s.press.job3=null;return true;}


for(const [id,a]of Object.entries(CLOTHING))PRODUCT_NAMES[id]=a.name;

for(const [id,f]of Object.entries(FLOWERS))PRODUCT_NAMES[id]=f.name;

for(const [id,f]of Object.entries(FLOWER_ITEMS))PRODUCT_NAMES[id]=f.name;

// Bonus variants use the same stable inventory keys as saved finds.
Object.assign(PRODUCT_NAMES,{rarebeachglass:'Schimmerndes Strandglas',rarerareshell:'Schillernde Muschel',rarepetrifiedwood:'Seltenes versteinertes Holz',rarenacre:'Schillerndes Perlmutt',rarepebble:'Seltener Kiesel'});
for(const k of ['seedpod','glowfruit','palmfruit','windshell','shimmershell','frozenseed','pinecone','cinderpod','icebell','frozenpearl','blueicestone','starcone','paintedstone','cactusfruit','desertflower','sunshard','fossilshell','suncapsule'])PRODUCT_NAMES['rare'+k]??='Besonderer Fund · '+PRODUCT_NAMES[k];

// Jakob 1.11.: auch die Pressen-Verbesserungen günstiger.
for(const l of Object.values(PRESS_UPGRADE_COSTS))for(const c of l){c.coins=softCoins(c.coins);cheaper(c.materials);}
// Jakob 1.11.: wie bei den Werkstätten früh erreichbar, drei Lagerstufen und zwei Auftragsstufen (Testwerte).
PRESS_UPGRADE_COSTS.batch=[{materials:{board:3,leaf:60},coins:25},{materials:{board:4,rope:2},coins:100},{materials:{beam:3,rope:2},coins:250}];
PRESS_UPGRADE_COSTS.parallel=[{materials:{board:4,paper:3},coins:100},{materials:{beam:3,mechanical:2},coins:350}];
PRESS_UPGRADE_COSTS.night=[{materials:{beam:2,rope:3},coins:150}];
// Jakob 3.11.: wie die Werkstätten ×0,7 Münzen.
for(const l of Object.values(PRESS_UPGRADE_COSTS))for(const c of l)c.coins=Math.max(5,Math.round(c.coins*.7/5)*5);
// Jakob 3.11.: erste Pressenstufen mit anderen Zutaten.
PRESS_UPGRADE_COSTS.speed[0].materials={board:2,stone:10};PRESS_UPGRADE_COSTS.efficiency[0].materials={essence:1,moss:10};

// Jakob 3.11.: Namen der Herdgerichte.
import {FOOD_NAMES} from './cooking.mjs';
Object.assign(PRODUCT_NAMES,FOOD_NAMES);

PRODUCT_NAMES.stonesocket='Steinsockel';
// Jakob 3.11.: Vorrat I kostet 1.000 Blätter, die übrigen Pressenstufen brauchen mehr Steinsachen (Testwerte).
PRESS_UPGRADE_COSTS.batch[0].materials={board:3,leaf:1000};
PRESS_UPGRADE_COSTS.batch[1].materials={stoneslab:3,rope:2};
PRESS_UPGRADE_COSTS.batch[2].materials={stonesocket:2,beam:2};
PRESS_UPGRADE_COSTS.parallel[0].materials={stoneslab:2,paper:3};
PRESS_UPGRADE_COSTS.parallel[1].materials={stonebrick:3,mechanical:2};
PRESS_UPGRADE_COSTS.efficiency[1].materials={filtermodule:2,stonebrick:2};
PRESS_UPGRADE_COSTS.night[0].materials={stonesocket:1,rope:3};

PRODUCT_NAMES.normalbag1='Rucksack 1.500';PRODUCT_NAMES.normalbag2='Rucksack 2.000';
