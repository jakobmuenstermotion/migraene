import {credit} from './money.mjs';
export const OUTDOOR_TOOLS=[
 {id:'detector',name:'Metalldetektor',cost:1800,description:'Entdeckt vergrabene Kleinfunde und zwei einmalige Schneckenhäuser. Ausrüsten und auf das Signal achten.'},
 {id:'rod',name:'Angel',cost:2400,description:'Am Gartensee angeln. Den Marker mit dem Angelknopf im grünen Bereich halten.'},
];
export const COMPOST_WORKSHOP={name:'Düngerwerkstatt',round:12,cost:2000,x:14,z:-19,pad:{x:14,z:-22},output:{x:15.8,z:-17.5}};
export const LAKE={x:-30,z:25,shore:{x:-30,z:22.5}};
export const BURIED_SHELLS=[{id:'shell-garden',species:'garden',name:'Gartenschneckenhaus',x:-30,z:-10},{id:'shell-dew',species:'dew',name:'Tauschneckenhaus',x:-25,z:-11}];
export const FISH=[{id:'silver',name:'Silberflosse',color:'#c5dce2',value:12},{id:'perch',name:'Sonnenbarsch',color:'#e7bf70',value:16},{id:'carp',name:'Mondkarpfen',color:'#baa3d6',value:22},{id:'blue',name:'Sternenforelle',color:'#85becb',value:30}];
export const FERTILIZER_SECONDS=180,FERTILIZER_RADIUS=2.2;
const flowers=['moonbloom','lavender','coral','sunbloom'];
const num=(v,f=0,max=1e100)=>Number.isFinite(v)&&v>=0?Math.min(v,max):f;
const active=s=>!s.journey.asleep&&s.journey.round>0;
export function freshOutdoors(){return{owned:[],equipped:null,harvestMode:'scythe',composterBuilt:false,clock:0,treasures:0,treasureValue:0,findWait:90,site:null,dug:[],dig:0,fish:{},fishValues:{},compost:{remaining:0,portions:0,ready:0},fertilizer:0,patches:[],fishing:null};}
export function normalizeOutdoors(raw){
 const o=freshOutdoors();o.owned=OUTDOOR_TOOLS.filter(t=>Array.isArray(raw?.owned)&&raw.owned.includes(t.id)).map(t=>t.id);o.equipped=o.owned.includes(raw?.equipped)?raw.equipped:null;
 o.composterBuilt=raw?.composterBuilt===true||raw?.owned?.includes?.('sprayer')===true;
 o.treasures=Math.floor(num(raw?.treasures,0,1000));o.treasureValue=o.treasures?num(raw?.treasureValue):0;
 o.clock=num(raw?.clock);o.findWait=num(raw?.findWait,90,180);o.dug=BURIED_SHELLS.filter(p=>raw?.dug?.includes?.(p.id)).map(p=>p.id);
 if(raw?.site&&Number.isFinite(raw.site.x)&&Number.isFinite(raw.site.z)&&Math.abs(raw.site.x)<=34&&Math.abs(raw.site.z)<=34)o.site={id:'treasure',x:raw.site.x,z:raw.site.z,value:num(raw.site.value)};
 for(const f of FISH){o.fish[f.id]=Math.floor(num(raw?.fish?.[f.id],0,1000));o.fishValues[f.id]=o.fish[f.id]?num(raw?.fishValues?.[f.id]):0;}
 o.harvestMode=(raw?.harvestMode==='fertilizer'||raw?.equipped==='sprayer')&&num(raw?.fertilizer)>0?'fertilizer':'scythe';if(o.harvestMode==='fertilizer')o.equipped=null;
 o.fertilizer=Math.floor(num(raw?.fertilizer,0,99));o.compost.remaining=num(raw?.compost?.remaining,0,60);o.compost.portions=o.compost.remaining?3:0;o.compost.ready=Math.floor(num(raw?.compost?.ready,0,24));
 o.patches=(Array.isArray(raw?.patches)?raw.patches:[]).slice(-20).filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&Math.abs(p.x)<=34&&Math.abs(p.z)<=34&&Number.isInteger(p.bed)&&p.bed>=0&&p.bed<7&&Number.isFinite(p.until)&&p.until>o.clock&&p.until<=o.clock+FERTILIZER_SECONDS).map(p=>({x:p.x,z:p.z,bed:p.bed,until:p.until}));
 return o;
}
export function buyOutdoorTool(s,id){const t=OUTDOOR_TOOLS.find(t=>t.id===id);if(!t||!active(s)||!s.village.boutiques.built.includes('style')||s.outdoors.owned.includes(id)||s.coins<t.cost)return false;s.coins-=t.cost;if(s.journey.plan)s.journey.plan.spent+=t.cost;s.outdoors.owned.push(id);return true;}
export function equipOutdoorTool(s,id){if(id!==null&&!s.outdoors.owned.includes(id))return false;s.outdoors.equipped=id;s.outdoors.harvestMode='scythe';s.outdoors.dig=0;s.outdoors.fishing=null;return true;}
export function setHarvestMode(s,mode){
 if(!active(s)||!['scythe','fertilizer'].includes(mode)||mode==='fertilizer'&&s.outdoors.fertilizer<=0)return false;
 s.outdoors.harvestMode=mode;s.outdoors.equipped=null;s.outdoors.dig=0;s.outdoors.fishing=null;return true;
}
export function collectFertilizer(s,player){const o=s.outdoors;if(!active(s)||!o.composterBuilt||Math.hypot(player.x-COMPOST_WORKSHOP.output.x,player.z-COMPOST_WORKSHOP.output.z)>1.3)return 0;const n=Math.min(o.compost.ready,Math.max(0,99-o.fertilizer));o.compost.ready-=n;o.fertilizer+=n;return n;}
export function fertilized(s,c){return !!s.outdoors?.patches.some(p=>p.until>s.outdoors.clock&&p.bed===c.bed&&Math.hypot(p.x-c.x,p.z-c.z)<=FERTILIZER_RADIUS);}
export function fertilizerValue(s,c){return fertilized(s,c)?1.2:1;}
export function sprayFertilizer(s,cells,player){const o=s.outdoors;if(!active(s)||o.harvestMode!=='fertilizer'||o.fertilizer<=0||o.patches.length>=20)return false;
 const cell=cells.filter(c=>flowers.includes(c.crop)&&Math.hypot(c.x-player.x,c.z-player.z)<1.5).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))[0];if(!cell)return false;
 o.fertilizer--;if(o.fertilizer===0)o.harvestMode='scythe';o.patches.push({x:player.x,z:player.z,bed:cell.bed,until:o.clock+FERTILIZER_SECONDS});return true;
}
export function startCompost(s,recipe='flowers'){
 const o=s.outdoors;if(!active(s)||!o.composterBuilt||o.compost.remaining>0||o.compost.ready>21||!['flowers','fish'].includes(recipe))return false;
 const counts=recipe==='fish'?o.fish:s.village.raw,values=recipe==='fish'?o.fishValues:s.village.rawValues,ids=recipe==='fish'?FISH.map(f=>f.id):flowers,needed=recipe==='fish'?2:12;
 if(ids.reduce((n,id)=>n+(counts[id]??0),0)<needed)return false;
 let left=needed;for(const id of ids){const before=counts[id]??0,n=Math.min(left,before);if(!n)continue;counts[id]-=n;values[id]=(values[id]??0)*(1-n/before);left-=n;}
 o.compost={remaining:60,portions:3,ready:o.compost.ready};return true;
}
export function detectorTarget(s,player){if(s.outdoors.equipped!=='detector')return null;return [...(s.village.farm.built?BURIED_SHELLS.filter(p=>!s.outdoors.dug.includes(p.id)):[]),...(s.outdoors.site?[s.outdoors.site]:[])].filter(p=>Math.hypot(p.x-player.x,p.z-player.z)<6).sort((a,b)=>Math.hypot(a.x-player.x,a.z-player.z)-Math.hypot(b.x-player.x,b.z-player.z))[0]??null;}
export function advanceOutdoors(s,cells,player,dt,growthDelta=0,time=0,valueForBed=()=>1,random=Math.random){
 const o=s.outdoors,events=[];if(!active(s)||dt<=0)return events;
 // Apply only the portion of this frame for which the patch was active.
 for(const c of cells){if(c.readyAt<=time||!flowers.includes(c.crop))continue;let extra=0;for(const p of o.patches)if(p.bed===c.bed&&Math.hypot(p.x-c.x,p.z-c.z)<=FERTILIZER_RADIUS)extra=Math.max(extra,Math.min(dt,Math.max(0,p.until-o.clock))/dt);if(extra)c.readyAt=Math.max(time,c.readyAt-Math.max(0,growthDelta)*extra);}
 o.clock+=dt;o.patches=o.patches.filter(p=>p.until>o.clock);
 if(o.compost.remaining>0){o.compost.remaining=Math.max(0,o.compost.remaining-dt);if(o.compost.remaining===0){o.compost.ready+=o.compost.portions;o.compost.portions=0;events.push({kind:'compost'});}}
 if(o.equipped!=='detector'){o.dig=0;return events;}
 o.findWait=Math.max(0,o.findWait-dt);
 if(!o.site&&o.findWait===0){const choices=cells.filter(c=>flowers.includes(c.crop)&&Math.hypot(c.x-player.x,c.z-player.z)<12);if(choices.length){const c=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];o.site={id:'treasure',x:c.x,z:c.z,value:Math.max(1,valueForBed(c.bed))*8};}}
 const target=detectorTarget(s,player);
 if(!target||player.moving||Math.hypot(target.x-player.x,target.z-player.z)>.9){o.dig=0;return events;}
 if(target.species&&Object.values(s.village.farm.shells).reduce((a,b)=>a+b,0)>=30){o.dig=0;return events;}
 o.dig+=dt;if(o.dig<2)return events;o.dig=0;
 if(target.species){o.dug.push(target.id);const f=s.village.farm;f.shells[target.species]=(f.shells[target.species]??0)+1;if(!f.discovered.includes(target.species))f.discovered.push(target.species);events.push({kind:'buriedShell',...target});}
 else{events.push({kind:'treasure',...target});o.site=null;o.findWait=90+random()*90;o.treasureValue=(o.treasureValue??0)+target.value;o.treasures=(o.treasures??0)+1;}
 return events;
}
export function sellOutdoorGoods(s){const o=s.outdoors;let count=o.treasures??0,value=o.treasureValue??0;o.treasures=0;o.treasureValue=0;for(const f of FISH){count+=o.fish[f.id]??0;value+=o.fishValues[f.id]??0;o.fish[f.id]=0;o.fishValues[f.id]=0;}credit(s,value);return{count,value};}
export function startFishing(s,player,valueMultiplier=1,random=Math.random){const o=s.outdoors;if(!active(s)||o.equipped!=='rod'||Math.hypot(player.x-LAKE.shore.x,player.z-LAKE.shore.z)>3||o.fishing||Object.values(o.fish).reduce((a,b)=>a+b,0)>=100)return false;o.fishing={phase:'waiting',wait:2+random()*3,elapsed:0,marker:.35,target:.5,progress:.15,valueMultiplier:num(valueMultiplier,1)};return true;}
export function advanceFishing(s,dt,holding=false,random=Math.random){const f=s.outdoors.fishing;if(!f||!active(s)||dt<=0)return null;
 if(f.phase==='waiting'){f.wait-=dt;if(f.wait<=0)f.phase='catch';return null;}
 f.elapsed+=dt;f.marker=Math.max(0,Math.min(1,f.marker+(holding?.65:-.4)*dt));f.target=.5+Math.sin(f.elapsed*1.6)*.22;
 f.progress=Math.max(0,Math.min(1,f.progress+(Math.abs(f.marker-f.target)<.18?.32:-.15)*dt));
 if(f.progress>=1){const fish=FISH[Math.min(3,Math.floor(random()*4))];s.outdoors.fish[fish.id]=(s.outdoors.fish[fish.id]??0)+1;s.outdoors.fishValues[fish.id]=(s.outdoors.fishValues[fish.id]??0)+fish.value*f.valueMultiplier;s.outdoors.fishing=null;return{kind:'fish',fish};}
 if(f.elapsed>=18||f.progress<=0){s.outdoors.fishing=null;return{kind:'escaped'};}return null;
}
