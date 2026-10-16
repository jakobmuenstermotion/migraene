import {PRODUCTS} from './village-content.mjs';
import {freshFeedback,normalizeFeedback} from './day-feedback.mjs';
import {GARDENS,getCrop,WORLD} from './content.mjs';
import {freshVillage,normalizeVillage,offlineVillage} from './village.mjs';
import {credit} from './money.mjs';
import {freshJourney,normalizeJourney} from './journey.mjs';
export const SAVE_KEY = 'mondgarten.save.v1';
export const BIOMES = GARDENS.map((g,i)=>({...g,value:getCrop(i).value,kind:i}));
export const TOOLS = [
  {id:'reach',name:'Mondsichel',icon:'☽',desc:'Mehr Blüten mit jedem Schwung ernten.',base:550,growth:1.55},
  {id:'bag',name:'Größerer Korb',icon:'♧',desc:'Mehr Platz auf deinem Erntestapel.',base:650,growth:1.55},
  {id:'speed',name:'Wolkenschuhe',icon:'〰',desc:'Schneller zwischen Beeten, Lager und Verkauf laufen.',base:800,growth:1.55},
  {id:'value',name:'Blütenzauber',icon:'✳',desc:'Jede Stufe erhöht den Wert von Ernte und Produkten um 12 %.',base:1000,growth:1.55}
];
export const PERMANENTS = [
  {id:'bloom',name:'Ewige Blüte',icon:'✳',desc:'Pro Stufe 25 % mehr Erntewert, auf jeder Reise.'},
  {id:'pocket',name:'Unendliche Weite',icon:'♧',desc:'Pro Stufe 40 % mehr Platz in eurer Tasche.'},
  {id:'spirit',name:'Sternengeist',icon:'✦',desc:'Pro Stufe 30 % mehr Helferertrag, auch offline.'}
];
export function freshState(){return {v:2,feedback:freshFeedback(),journey:freshJourney(),coins:0,stars:0,totalStars:0,prestiges:0,biome:0,unlocked:0,bag:0,bagValue:0,productCargo:{items:{},values:{}},cargo:{},village:freshVillage(),tools:{reach:0,bag:0,speed:0,value:0},helpers:0,helperLevel:0,permanent:{bloom:0,pocket:0,spirit:0},stats:{harvested:0,earned:0,upgrades:0,helpers:0,missions:0,playSeconds:0,runEarned:0,runHarvested:0},mission:{index:0,base:0},achievements:[],names:['Du','Schnecki'],sound:false,reducedMotion:false,tutorial:0,savedAt:Date.now(),lastDaily:0,dailyStreak:0};}
const validNumber=(n,fallback=0,max=1e280)=>typeof n==='number'&&Number.isFinite(n)&&n>=0?Math.min(n,max):fallback;
export function normalize(raw){
  if(!raw||![1,2].includes(raw.v))throw new Error('Dieser Spielstand gehört nicht zu Mondgarten.');
  const s=freshState();
  for(const k of ['coins','stars','totalStars','bag','bagValue'])s[k]=validNumber(raw[k]);
  for(const k of ['prestiges','helpers','helperLevel','dailyStreak'])s[k]=Math.floor(validNumber(raw[k],0,1000000));
  for(const k of ['biome','unlocked'])s[k]=Math.floor(validNumber(raw[k],0,7));
  s.biome=Math.min(s.biome,s.unlocked);
  for(const group of ['tools','permanent'])for(const k of Object.keys(s[group]))s[group][k]=Math.floor(validNumber(raw[group]?.[k],0,1000));
  for(const k of Object.keys(s.stats))s.stats[k]=validNumber(raw.stats?.[k]);
  s.mission.index=Math.floor(validNumber(raw.mission?.index,0,10000));s.mission.base=validNumber(raw.mission?.base);
  s.achievements=Array.isArray(raw.achievements)?[...new Set(raw.achievements.filter(v=>typeof v==='string'&&ACHIEVEMENTS.some(a=>a.id===v)))]:[];
  if(Array.isArray(raw.names))s.names=s.names.map((fallback,i)=>typeof raw.names[i]==='string'?raw.names[i].trim().slice(0,24)||fallback:fallback);
  s.sound=raw.sound===true;s.reducedMotion=raw.reducedMotion===true;s.tutorial=Math.floor(validNumber(raw.tutorial,0,3));
  s.savedAt=validNumber(raw.savedAt,Date.now(),Date.now());s.lastDaily=validNumber(raw.lastDaily,0,Date.now());
  s.bag=Math.min(s.bag,capacity(s));if(s.bag===0)s.bagValue=0;
  s.productCargo={items:{},values:{}};for(const id of Object.keys(PRODUCTS)){const count=Math.floor(validNumber(raw.productCargo?.items?.[id],0,100000));if(count){s.productCargo.items[id]=count;s.productCargo.values[id]=validNumber(raw.productCargo?.values?.[id]);}}s.village=normalizeVillage(raw.village,raw);s.journey=normalizeJourney(raw.journey);if(!raw.journey){s.journey.round=Math.min(77,Math.max(1,1+Math.floor(s.stats.upgrades/2)));}if(s.names[1]==='Dein Lieblingsmensch')s.names[1]='Schnecki';
  if(raw.cargo&&typeof raw.cargo==='object'){for(const id of ['moonbloom','lavender','coral','crystal','mushroom','starfruit','sunbloom','nebula']){const e=raw.cargo[id];if(e?.count>0)s.cargo[id]={count:validNumber(e.count),value:validNumber(e.value)};}}
  const count=Object.values(s.cargo).reduce((a,e)=>a+e.count,0),value=Object.values(s.cargo).reduce((a,e)=>a+e.value,0);
  if(s.bag===0)s.cargo={};else if(!count||Math.abs(count-s.bag)>1e-6||Math.abs(value-s.bagValue)>1e-5)s.cargo={[getCrop(s.biome)===getCrop(0)?'moonbloom':GARDENS[s.biome].crop]:{count:s.bag,value:s.bagValue}};
  s.feedback=normalizeFeedback(raw.feedback,s.journey.round);
  return s;
}
export function format(n){if(n<1000)return Math.floor(n).toLocaleString('de-DE');const units=[[1e15,' Brd.'],[1e12,' Bio.'],[1e9,' Mrd.'],[1e6,' Mio.'],[1e3,' Tsd.']];if(n>=1e18)return n.toExponential(2).replace('.',',');for(const [v,u]of units)if(n>=v)return (n/v).toLocaleString('de-DE',{maximumFractionDigits:1})+u;return '0';}
export function price(t,s){return Math.ceil(Math.min(1e280,t.base*Math.pow(t.growth,s.tools[t.id])));}
export function capacity(s){const l=s.tools.bag;return Math.floor((80+40*l+8*l*l)*(1+.4*s.permanent.pocket));}
export function reach(s){return 63+Math.min(155,s.tools.reach*6);}
export function moveSpeed(s){return 142+Math.min(190,s.tools.speed*10);}
export function harvestRate(s){return WORLD.harvest.cooldown/Math.min(3,1+s.tools.reach*.07);}
export function harvestBatch(s){return WORLD.harvest.baseBatch+Math.floor(s.tools.reach/2);}
export function yieldValue(s){return BIOMES[s.biome].value*Math.pow(1.22,s.tools.value)*(1+s.totalStars*.16)*(1+s.permanent.bloom*.25);}
export function helperPrice(s){return Math.ceil(Math.min(1e280,550*Math.pow(1.85,s.helpers)));}
export function helperUpgradePrice(s){return Math.ceil(Math.min(1e280,350*Math.pow(1.65,s.helperLevel)));}
export function helperIncome(s){return s.helpers*BIOMES[s.unlocked].value*2.2*Math.pow(1.24,s.helperLevel)*(1+.3*s.permanent.spirit)*(1+s.totalStars*.16)*(1+.25*s.permanent.bloom);}
export function permanentPrice(s,id){return 1+s.permanent[id]*2;}
export const earn=credit;
export function sellBag(s){const value=s.bagValue;if(value<=0)return 0;earn(s,value);s.bag=0;s.bagValue=0;s.cargo={};return value;}
export function buyTool(s,id){const t=TOOLS.find(x=>x.id===id);if(!t||s.tools[id]>=1000||s.coins<price(t,s))return false;s.coins-=price(t,s);s.tools[id]++;s.stats.upgrades++;return true;}
export function buyHelper(s){const p=helperPrice(s);if(s.coins<p)return false;s.coins-=p;s.helpers++;s.stats.helpers++;s.stats.upgrades++;return true;}
export function buyHelperUpgrade(s){const p=helperUpgradePrice(s);if(!s.helpers||s.coins<p)return false;s.coins-=p;s.helperLevel++;s.stats.upgrades++;return true;}
export function buyPermanent(s,id){if(!PERMANENTS.some(p=>p.id===id))return false;const p=permanentPrice(s,id);if(s.stars<p)return false;s.stars-=p;s.permanent[id]++;return true;}
export function unlockBiome(s,index){if(index!==s.unlocked+1||index>7||s.coins<BIOMES[index].cost)return false;s.coins-=BIOMES[index].cost;s.unlocked=index;s.biome=index;return true;}
export function prestigeRequirement(s){return 50000*Math.pow(s.prestiges+1,2);}
export function prestigeReward(s){return Math.floor(Math.sqrt(s.stats.runEarned/50000));}
export function prestige(s){if(s.stats.runEarned<prestigeRequirement(s))return false;const stars=prestigeReward(s);s.stars+=stars;s.totalStars+=stars;s.prestiges++;s.coins=0;s.bag=0;s.bagValue=0;s.biome=0;s.unlocked=0;s.helpers=0;s.helperLevel=0;for(const k of Object.keys(s.tools))s.tools[k]=0;s.stats.runEarned=0;s.stats.runHarvested=0;s.tutorial=3;return stars;}
export function offlineEarnings(s,now=Date.now()){const seconds=Math.max(0,Math.min(8*3600,(now-s.savedAt)/1000));s.savedAt=now;if(seconds<30)return{seconds:0,amount:0,produced:0};const result=offlineVillage(s,seconds);return{seconds,...result};}
export function dailyGift(s,now=Date.now()){const today=new Date(now).toLocaleDateString('en-CA'),last=new Date(s.lastDaily).toLocaleDateString('en-CA');if(today===last)return 0;const previous=new Date(now);previous.setDate(previous.getDate()-1);s.dailyStreak=previous.toLocaleDateString('en-CA')===last?Math.min(7,s.dailyStreak+1):1;s.lastDaily=now;const gift=Math.max(80,BIOMES[s.unlocked].value*80)*(1+.25*(s.dailyStreak-1));earn(s,gift);return gift;}
export function missionInfo(s){const i=s.mission.index,cycle=Math.floor(i/3),kind=['harvested','earned','upgrades'][i%3];const target=kind==='harvested'?Math.floor(40*Math.pow(1.36,Math.min(cycle,100))):kind==='earned'?Math.floor(180*Math.pow(2.3,Math.min(cycle,100))):Math.min(8,1+Math.floor(cycle/3));const progress=Math.max(0,s.stats[kind]-s.mission.base);const reward=Math.floor(60*Math.pow(1.8,Math.min(cycle,100))*(kind==='upgrades'?2:1));const title=kind==='harvested'?['Ein erster kleiner Schatz','Blüten für zwei','Ein Korb voller Sternenlicht','Alles blüht für euch'][cycle%4]:kind==='earned'?'Ein Funkeln auf der Bank':'Platz für neue Möglichkeiten';const desc=kind==='harvested'?`Sammelt ${format(target)} Pflanzen mit eurer Sichel.`:kind==='earned'?`Verdient ${format(target)} Sternenstaub.`:`Kauft ${target} ${target===1?'Verbesserung':'Verbesserungen'} in der Werkstatt.`;return {kind,target,progress,reward,title,desc,done:progress>=target};}
export function claimMission(s){const m=missionInfo(s);if(!m.done)return 0;earn(s,m.reward);s.stats.missions++;s.mission.index++;s.mission.base=s.stats[missionInfo(s).kind];return m.reward;}
export const ACHIEVEMENTS=[
  {id:'first',name:'Hallo, kleines Universum',desc:'Die erste Pflanze geerntet.',test:s=>s.stats.harvested>=1},
  {id:'hundred',name:'Ein Arm voller Blumen',desc:'100 Pflanzen gesammelt.',test:s=>s.stats.harvested>=100},
  {id:'thousand',name:'Grüne Daumen, große Träume',desc:'1.000 Pflanzen gesammelt.',test:s=>s.stats.harvested>=1000},
  {id:'tenk',name:'Ein Meer aus Blüten',desc:'10.000 Pflanzen gesammelt.',test:s=>s.stats.harvested>=10000},
  {id:'upgrade',name:'Ein bisschen mehr Magie',desc:'Die erste Verbesserung gekauft.',test:s=>s.stats.upgrades>=1},
  {id:'helper',name:'Kleine Schnecke, große Hilfe',desc:'Eine Ernteschnecke einziehen lassen.',test:s=>s.village.snails>=1},
  {id:'garden',name:'Hinter dem Gartenzaun',desc:'Ein zweites Beet angelegt.',test:s=>s.village.beds[1]>0},
  {id:'crystal',name:'Ein Garten wird ein Zuhause',desc:'Den Lieblingsmenschen freigeschaltet.',test:s=>s.village.partner},
  {id:'million',name:'Sternenstaubmillionäre',desc:'Insgesamt eine Million Sternenstaub verdient.',test:s=>s.stats.earned>=1e6},
  {id:'travel',name:'Ein bisschen Gartenmagie',desc:'100 Produkte hergestellt.',test:s=>s.village.produced>=100},
  {id:'heart',name:'Alles wächst zusammen',desc:'Die Mondalchemie gebaut.',test:s=>s.village.workshops.elixir.level>0},
  {id:'together',name:'Noch ein kleines Weilchen',desc:'Eine Stunde zusammen im Garten verbracht.',test:s=>s.stats.playSeconds>=3600}
];
export function checkAchievements(s){const found=[];for(const a of ACHIEVEMENTS)if(!s.achievements.includes(a.id)&&a.test(s)){s.achievements.push(a.id);found.push(a);}return found;}


