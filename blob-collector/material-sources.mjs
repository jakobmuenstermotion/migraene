import {CRAFT_RECIPES,WORKSHOPS} from './crafting-config.mjs';
import {PRESS,PRODUCT_NAMES} from './material-press.mjs';
import {COLLECTION_AREAS,resourceArea} from './blob-workers.mjs';
import {FISH} from './fishing.mjs';
// „Wo finde ich das“ am Sammelziel: liest die echten Orte aus der laufenden Welt, damit der Hinweis nie veraltet.
const AREA_ORDER=['sunny','steinbach','mooswald','pilzhain','coast','ice','volcano'];
const FIXED={leaf:'Liegt unter allen Bäumen, in jedem Waldgebiet',sand:'Am Strand der Sonnenküste',snow:'Schneedecke im Eistal, mit dem Filter Schnee'};
const ROMAN=['','I','II','III','IV'];
const onTerrace=o=>resourceArea(o.x,o.z)==='coast'&&o.z<-36;
const areaList=spots=>{const found=new Set(spots.filter(o=>!onTerrace(o)).map(o=>resourceArea(o.x,o.z))),names=AREA_ORDER.filter(a=>found.has(a)).map(a=>COLLECTION_AREAS[a].name);if(spots.some(onTerrace))names.push('Windterrasse hinter den Wurzeln (Grabtiefe II)');return names.join(', ');};
const inputsText=inputs=>Object.entries(inputs).map(([k,n])=>n+' '+(PRODUCT_NAMES[k]??k)).join(' + ');
export function materialSources(s,kind){
 const lines=[];
 if(FIXED[kind])lines.push(FIXED[kind]);
 const items=(s.resources??[]).filter(r=>r.kind===kind&&!r.sandCell),free=items.filter(r=>!r.hanging),high=items.filter(r=>r.hanging);
 if(free.length)lines.push('Liegt in: '+areaList(free));
 for(const rank of new Set(high.map(r=>r.heightRank))){const here=high.filter(r=>r.heightRank===rank);lines.push('Hängt in Bäumen: '+areaList(here)+(rank?' · Fernsauger Höhensog '+ROMAN[rank]:' · Fernsauger'));}
 const buried=(s.obstacles??[]).filter(o=>o.tool==='ground'&&!o.route&&o.kind===kind);
 for(const depth of new Set(buried.map(o=>o.depth??0))){const here=buried.filter(o=>(o.depth??0)===depth);lines.push('Vergraben: '+areaList(here)+' · Bodensauger'+(depth?' Grabtiefe '+ROMAN[depth]:''));}
 const big=(s.iceDeposits??[]).filter(d=>d.kind===kind);
 if(big.length)lines.push('Große Vorkommen: '+areaList(big)+' · Kraftsauger');
 for(const r of Object.values(CRAFT_RECIPES))if(r.output===kind&&!r.retired)lines.push((WORKSHOPS[r.workshop]?.name??'Werkstatt')+': '+inputsText(r.inputs));
 for(const r of Object.values(PRESS.recipes))if(r.id===kind)lines.push('Materialpresse: '+(r.inputs?inputsText(r.inputs):r.cost+' '+(r.input==='flowers'?'Blumen':PRODUCT_NAMES[r.input]??r.input)));
 if(FISH[kind])lines.push('Angeln: an '+({river:'Flüssen',sea:'der Küste',lake:'Seen'}[FISH[kind].water]??'Gewässern'));
 return lines.length?lines:['Noch kein Fundort bekannt'];
}
