import {activateFeedback,queueFeedback,skipFeedback} from './day-feedback.mjs';
import {normalizePlan} from './funding.mjs';
import {BEDS} from './village-content.mjs';
import {COLLECTIBLES} from './content.mjs';
import {ECONOMY} from './economy.mjs';
// Regular day rewards and explicitly purchased, uniquely identified catch-up seeds.
export const SEED_ROUNDS=Object.freeze([1,5,12,20,30,40,50]);
export const JOURNEY={rounds:77,freshSeconds:300,slowSeconds:480,restSeconds:540,yieldGrowth:ECONOMY.roundYieldGrowth};
export function freshJourney(){return{schema:1,rhythmVersion:3,asleep:false,sleepMissed:false,sleepWarning:0,round:1,pending:0,receipts:[],elapsed:0,growthTime:0,goalCost:ECONOMY.dayBase,light:0,plan:null,preview:true,closed:false,rewardKind:'seed',rewards:[],seedCatchups:[]};}
const finite=(x,f=0,max=1e9)=>Number.isFinite(x)&&x>=0?Math.min(x,max):f;
export function normalizeJourney(raw){const j=freshJourney();if(!raw||raw.schema!==1)return j;j.round=Math.max(0,Math.floor(finite(raw.round,1,10000)));j.pending=Math.floor(finite(raw.pending,0,10000-j.round));j.receipts=Array.isArray(raw.receipts)?[...new Set(raw.receipts.filter(x=>typeof x==='string'&&/^[A-Za-z0-9:_-]{1,120}$/.test(x)))].slice(-10000):[];j.elapsed=finite(raw.elapsed,0,1e9);if(raw.rhythmVersion!==3){j.elapsed=Math.min(j.elapsed,8*60);j.sleepWarning=0;}j.asleep=raw.asleep===true;j.sleepMissed=j.asleep&&raw.sleepMissed===true;j.sleepWarning=raw.rhythmVersion===3?Math.floor(finite(raw.sleepWarning,0,2)):0;j.plan=normalizePlan(raw.plan,j.round);j.growthTime=finite(raw.growthTime);j.preview=raw.preview!==false;j.closed=raw.closed===true||j.asleep;j.goalCost=finite(raw.goalCost,0,1e100)||null;j.light=finite(raw.light,j.closed?1:Math.max(0,(j.elapsed-210)/390)*.78,1);j.rewardKind=raw.rewardKind==='rest'?'rest':raw.rewardKind==='water'?'water':'seed';const used=new Set();j.rewards=Array.isArray(raw.rewards)?raw.rewards.filter(r=>r&&Number.isInteger(r.round)&&r.round>=1&&r.round<=j.round&&['water','seed'].includes(r.kind)&&!used.has(r.round)&&used.add(r.round)).slice(0,77).map(r=>({id:'garden-day:'+r.round,round:r.round,kind:r.kind})):[];
 const catchups=new Set();j.seedCatchups=Array.isArray(raw.seedCatchups)?raw.seedCatchups.filter(r=>{const match=typeof r?.id==='string'&&/^garden-seed:([1-7])$/.exec(r.id);return match&&r.kind==='seed'&&Number.isInteger(r.round)&&r.round<=j.round&&r.round>=SEED_ROUNDS[Number(match[1])-1]&&!catchups.has(r.id)&&catchups.add(r.id);}).slice(0,Math.max(0,7-j.rewards.filter(r=>r.kind==='seed').length)).map(r=>({id:r.id,round:r.round,kind:'seed'})):[];
 return j;}
export function grantRound(s,receipt){const j=s.journey;if(typeof receipt!=='string'||!/^[A-Za-z0-9:_-]{1,120}$/.test(receipt)||j.receipts.includes(receipt)||j.round+j.pending>=10000)return false;j.receipts.push(receipt);j.pending++;return true;}
export function startRound(s){const j=s.journey;if(!j.closed||!j.pending||j.round>=10000)return false;skipFeedback(s);j.round++;activateFeedback(s);j.pending--;j.elapsed=0;j.light=0;j.asleep=false;j.sleepMissed=false;j.sleepWarning=0;j.closed=false;j.plan=null;j.goalCost=null;j.goalCost=dayPrice(s);j.rewardKind=nextRewardKind(s);return true;}
export function rewardCount(s,kind){return(s.journey.rewards??[]).filter(r=>r.kind===kind).length+(kind==='seed'?(s.journey.seedCatchups??[]).length:0);}
export function seedsDue(round){return SEED_ROUNDS.filter(day=>day<=round).length;}
export function nextRewardKind(s){return rewardCount(s,'seed')<seedsDue(s.journey.round)?'seed':rewardCount(s,'water')<70?'water':'rest';}
export function seedCatchupAvailable(s){const j=s.journey,reserved=!j.closed&&j.rewardKind==='seed'?1:0;return Math.max(0,seedsDue(j.round)-rewardCount(s,'seed')-reserved);}
export function seedCatchupPrice(s){return Math.ceil(dayPrice(s)*.35);}
export function buyCatchupSeed(s){
 if(seedCatchupAvailable(s)<1)return false;
 const price=seedCatchupPrice(s);if(!Number.isFinite(s.coins)||s.coins<price)return false;
 const slot=rewardCount(s,'seed')+1;s.coins-=price;s.journey.seedCatchups??=[];
 s.journey.seedCatchups.push({id:'garden-seed:'+slot,round:s.journey.round,kind:'seed'});return true;
}

export function closeDay(s){const j=s.journey,kind=j.rewardKind;if(j.closed)return false;if(kind==='rest'){if(rewardCount(s,'water')<70||rewardCount(s,'seed')<7)return false;j.closed=true;queueFeedback(s);return true;}if(rewardCount(s,kind)>=(kind==='seed'?seedsDue(j.round):70))return false;j.rewards.push({id:'garden-day:'+j.round,round:j.round,kind});j.closed=true;queueFeedback(s);return true;}
// Regrowth and harvesting are separate: ripe plants remain harvestable after minute nine.
export function harvestingAllowed(s){return (s.journey?.round??1)>0&&!s.journey?.asleep;}
export function growthFactor(s){
 if(!harvestingAllowed(s))return 0;
 const t=s.journey?.elapsed??0;
 if(t<=JOURNEY.freshSeconds)return 1;
 if(t<JOURNEY.slowSeconds)return 1-.9*(t-JOURNEY.freshSeconds)/(JOURNEY.slowSeconds-JOURNEY.freshSeconds);
 if(t<JOURNEY.restSeconds)return .1*(JOURNEY.restSeconds-t)/(JOURNEY.restSeconds-JOURNEY.slowSeconds);
 return 0;
}
function growthArea(t){
 const full=JOURNEY.freshSeconds,slow=JOURNEY.slowSeconds-full,tail=JOURNEY.restSeconds-JOURNEY.slowSeconds;
 if(t<=full)return t;
 const u=Math.min(slow,t-full),base=full+u-.9*u*u/(2*slow);
 if(t<=JOURNEY.slowSeconds)return base;
 const v=Math.min(tail,t-JOURNEY.slowSeconds);return base+.1*v-.1*v*v/(2*tail);
}
export function tickJourney(s,dt){if(s.journey.asleep)return 0;const j=s.journey,before=j.elapsed;j.elapsed+=Math.max(0,dt);const growth=harvestingAllowed(s)?growthArea(j.elapsed)-growthArea(before):0;j.growthTime+=growth;return growth;}
export function roundYield(s){return Math.pow(JOURNEY.yieldGrowth,Math.min(77,s.journey?.round??1)-1);}
export function dayPrice(s){if(s.journey.goalCost>0)return s.journey.goalCost;return Math.ceil(ECONOMY.dayBase*Math.min(Math.pow(ECONOMY.dayGrowth,Math.min(76,s.journey.round-1)),Math.max(1,...BEDS.map((b,i)=>s.village.beds[i]?COLLECTIBLES[b.crop].value*Math.pow(ECONOMY.bedUpgrade,s.village.beds[i]-1):0))*Math.pow(ECONOMY.valueUpgrade,s.tools.value))*roundYield(s));}
// Availability widens without prescribing purchases. All branches reach their cap by 77.
export function buildRule(id){
  if(id==='bus')return{start:77,stride:1,max:1};
  if(id==='endDay')return{start:1,stride:1,max:10001};
  if(id.startsWith('tool:'))return{start:['reach','bag'].includes(id.slice(5))?1:2,stride:5,max:16};
  if(id.startsWith('bed:'))return{start:[1,12,25,36,47,59,68][Number(id.slice(4))],stride:Number(id.slice(4))===6?2:3,max:5};
  if(id.startsWith('seed:'))return{start:[1,11,24,35,46,58,67][Number(id.slice(5))],stride:1,max:1};
  if(id.startsWith('workshop:'))return{start:({bouquet:3,tea:15,oil:29,elixir:43})[id.slice(9)],stride:5,max:7};
  return({farm:{start:18,stride:1,max:1},woodcock:{start:32,stride:1,max:1},snail:{start:7,stride:6,max:12},snailLevel:{start:10,stride:7,max:10},partner:{start:21,stride:9,max:3},warehouse:{start:4,stride:6,max:12},sprinkler:{start:18,stride:7,max:9}})[id];
}
export function pacePad(s,p){const r=buildRule(p.id),round=s.journey?.round??1,next=r.start+Math.max(0,p.level-(p.id==='warehouse'||p.id==='bed:0'?1:0))*r.stride;
  const firstLevel=p.id==='warehouse'||p.id==='bed:0'?1:0,canAdvance=p.level>firstLevel&&(['tool','workshop','snail','warehouse','sprinkler','bed'].includes(p.kind)),lookahead=canAdvance?Math.min(3,r.stride-1):0,available=Math.max(r.start,next-lookahead);
  const cap=p.level>=r.max,waiting=round<available;return{...p,max:p.max||cap,visible:round>=r.start,locked:p.locked||waiting,reason:p.locked?p.reason:waiting?'Ab Gartenrunde '+available+' weiter ausbaubar.':p.reason,requiredRound:next,availableRound:available,optional:round<next&&!waiting&&!p.locked&&!cap,description:p.description??'',cost:Math.ceil(p.cost*Math.pow(ECONOMY.costGrowth,Math.max(0,next-1)))};
}

