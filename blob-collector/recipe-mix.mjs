import {UPGRADE_COSTS,VACUUM_BUILD_COSTS} from './factory-config.mjs';
import {WORKSHOP_UPGRADE_COSTS} from './workshop-upgrades.mjs';
import {PRESS_UPGRADE_COSTS} from './material-press.mjs';
import {STATION_UPGRADES} from './station-upgrades.mjs';
import {MARKET_UPGRADES} from './market.mjs';
import {HOME_EXPANSIONS} from './home-expansion.mjs';
import {CRAFT_RECIPES} from './crafting-config.mjs';
// Jakob 4.11.: Bretter, Fasern, Seile und Gewebe tauchten fast überall auf, Balken, Holzplatten, Extrakt, Blütenleim und
// Verbundplatten kaum. Dieser Durchgang tauscht in Verbesserungen und Ausbauten einen Teil der häufigen Zutaten gegen
// gleichwertige seltene derselben Spielphase. Testwerte; feste Wünsche von Jakob (Grabtiefe II, Vorrat I, Nähmaschine,
// Steinsockel-Stellen, Anker, Fächersauger-Bau) bleiben unberührt.
const KEEP=new Set(['F:chair','B:focus','B:power','B:vortex','S:ground.depth2','S:focus.anchor1','S:focus.anchor2','S:focus.anchor3','S:focus.anchor4','S:ground.width3','S:focus.range2','B:fan','B:ground','P:batch1','P:night1']);
const coast=m=>['fabric','shelllime','sandstone','composite','seagrass','shell','driftwood','rareshell','nacre','beachglass','polishedglass'].some(k=>m[k]);
// Regeln: jede wievielte passende Stelle getauscht wird, und wie.
const RULES=[
 {from:'board',min:2,every:2,swap:(m,n)=>{m.beam=(m.beam??0)+Math.ceil(n/2);}},
 {from:'board',min:3,every:2,swap:(m,n)=>{m.woodpanel=(m.woodpanel??0)+Math.max(1,Math.round(n/3));}},
 {from:'rope',min:2,every:2,swap:(m,n)=>{m.flowerwood=(m.flowerwood??0)+n;}},
 {from:'fibre',min:3,every:2,mid:true,swap:(m,n)=>{m.extract=(m.extract??0)+Math.max(2,Math.round(n*.6));}},
 {from:'fabric',min:2,every:2,swap:(m,n)=>{m.composite=(m.composite??0)+n;}},
 {from:'mechanical',min:2,every:3,coast:true,swap:(m,n)=>{m.reinforcedpanel=(m.reinforcedpanel??0)+Math.max(1,n-1);}},
 {from:'mechanical',min:3,every:3,mid:true,swap:(m,n)=>{m.gear=(m.gear??0)+n-1;}}
];
export const MIX_LOG=[];
function entries(){const out=[];
 for(const [v,t]of Object.entries(UPGRADE_COSTS))for(const [id,c]of Object.entries(t))out.push(['S:'+v+'.'+id,c.materials,c.coins]);
 for(const [v,c]of Object.entries(VACUUM_BUILD_COSTS))out.push(['B:'+v,c.materials,c.coins]);
 for(const [w,t]of Object.entries(WORKSHOP_UPGRADE_COSTS)){if(w==='sewingmachine')continue;for(const [k,l]of Object.entries(t))l.forEach((c,i)=>{if(!(k==='batch'&&i===0))out.push(['W:'+w+'.'+k+(i+1),c[0],c[1]]);});}
 for(const [k,l]of Object.entries(PRESS_UPGRADE_COSTS))l.forEach((c,i)=>out.push(['P:'+k+(i+1),c.materials,c.coins]));
 STATION_UPGRADES.forEach(u=>out.push(['ST:'+u.level,u.cost,u.coins]));
 (MARKET_UPGRADES??[]).forEach((u,i)=>out.push(['M:'+i,u.cost??u.materials,u.coins]));
 (HOME_EXPANSIONS??[]).forEach((u,i)=>out.push(['H:'+i,u.cost??u.materials,u.coins]));
 // Möbel dürfen mitgemischt werden (nur Bretter, Seile, Fasern, Gewebe), Zwischenprodukte nicht, damit die Ketten gleich bleiben.
 for(const [id,r]of Object.entries(CRAFT_RECIPES))if(r.furniture&&!r.retired&&id!=='sewing'&&r.output!=='sewingmachine')out.push(['F:'+id,r.inputs,0]);
 return out.filter(([id,m])=>m&&!KEEP.has(id));}
for(const rule of RULES){let seen=0;for(const [id,m,coins]of entries()){const n=m[rule.from];if(!(n>=rule.min))continue;if(rule.mid&&!(coins>=150))continue;if(rule.coast&&!coast(m))continue;if(++seen%rule.every)continue;const before=JSON.stringify(m);delete m[rule.from];rule.swap(m,n);MIX_LOG.push([id,before,JSON.stringify(m)]);}}
