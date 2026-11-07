import {CRAFT_RECIPES} from './crafting-config.mjs';
import {PRESS} from './material-press.mjs';

// Stable progression order, independent of the player's changing inventory.
const rawTier={sand:1,shell:1,seagrass:1,beachglass:1,rarestone:1,driftwood:2,coral:3,ice:3,snow:3,frostwood:3,frostflower:3,frostmoss:3,icecrystal:3,ironore:3,copperore:3,clay:4,desertsand:4,desertglass:4,coloredearth:4,desertcrystal:4,cactusfibre:4};
export function sortMachineRecipes(recipes){
 const catalogue=[...Object.values(CRAFT_RECIPES),...Object.values(PRESS.recipes).map(r=>({output:r.id,inputs:r.inputs??{[r.input]:r.cost}}))],memo=new Map();
 function material(k,visiting=new Set()){
  if(memo.has(k))return memo.get(k);
  if(visiting.has(k))return [rawTier[k]??0,0];
  const producers=catalogue.filter(r=>r.output===k);
  if(!producers.length)return [rawTier[k]??0,0];
  const seen=new Set(visiting).add(k),scores=producers.map(r=>score(r,seen));
  scores.sort(compare);const result=[scores[0][0],scores[0][1]+1];memo.set(k,result);return result;
 }
 function score(r,seen){const parts=Object.keys(r.inputs??{}).map(k=>material(k,seen));return [Math.max(0,...parts.map(p=>p[0])),Math.max(0,...parts.map(p=>p[1])),parts.length,r.seconds??0,r.coins??0,Object.values(r.inputs??{}).reduce((a,b)=>a+b,0)];}
 function compare(a,b){for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;}
 return recipes.map((r,i)=>({r,i,score:score(r,new Set())})).sort((a,b)=>compare(a.score,b.score)||a.i-b.i).map(x=>x.r);
}
