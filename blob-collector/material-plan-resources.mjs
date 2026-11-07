import {validResourcePoint} from './resource-world.mjs';
import {sunnyHeight,SUNNY} from './sunny-area.mjs';
import {coastRegion,coastGap,coastShore,coastCollision,COAST_PALMS,windLower,windUpper,WIND_POOL} from './coast-area.mjs';

// Authored, stable sites; the normal resource save path remembers depletion.
const forestSites={
 resinlump:[[-15,10],[-24,1],[-30,-7],[-18,-14],[-6,18],[17,28],[22,41],[-20,29]],
 // Neugestaltung (Jakob): glänzende Steine und Strandglas erst auf der unteren Windterrasse hinter den Wurzeln (Grabtiefe II).
 rarestone:[[63,-38],[67,-38.5],[72,-39.5],[75,-42],[73,-46],[69,-44],[66,-46],[62,-44]]
};
const beachSites=[[61,-38.5],[65,-40.5],[70,-41],[74,-38.8],[76,-45.5],[71,-48],[67,-50],[63,-47]];
// Felsgruppen und Gärten der Terrasse (coast-polish.mjs), dort keine Fundstellen.
// Seegras wächst am Rand des Tümpels auf der unteren Terrasse (WIND_POOL, gezeichnet in coast-polish.mjs).
const terraceProps=[[WIND_POOL.x,WIND_POOL.z,2.1],[65,-38,2.1],[69,-38,1.3],[72,-39,1.3],[76,-43,1.5],[72,-50,1.9],[64,-52,1.7],[68,-50,1.6],[74,-45,1.5],[71,-44,1.4],[66,-48,1.2],[74,-40,.9],[63,-39,.8],[72,-44,.6],[67,-39,.6]];
const onLowerTerrace=(x,z)=>windLower(x,z)&&z< -36.6&&!windUpper(x,z,1.2)&&windLower(x,z,-1.2)&&!terraceProps.some(([px,pz,r])=>Math.hypot(x-px,z-pz)<r+.45);
function findSite(x,z,kind){
 for(let i=0;i<120;i++){
  const a=i*2.399,d=i===0?0:.25+Math.sqrt(i)*.25,px=x+Math.sin(a)*d,pz=z+Math.cos(a)*d;
  const valid=(kind==='beachglass'||kind==='rarestone')?onLowerTerrace(px,pz)
   :kind==='coast'
   ?coastRegion(px,pz)&&!coastGap(px,pz)&&px<coastShore(pz)-1&&!coastCollision(px,sunnyHeight(px,pz),pz,.3)
   :validResourcePoint(px,pz,.25);
  if(valid)return {x:px,z:pz};
 }
 throw Error('No accessible material site: '+kind);
}
export function createPlanResources(){
 const out=[];
 for(const [kind,sites] of Object.entries({...forestSites,beachglass:beachSites}))
  for(const [index,[x,z]] of sites.entries()){
   const p=findSite(x,z,kind),y=sunnyHeight(p.x,p.z)+.1;
   out.push({id:'plan_'+kind+'_'+index,kind,...p,y,homeX:p.x,homeY:y,homeZ:p.z,status:'ground',progress:0,respawnAt:0,angle:index*2.399});
  }
 // Small, repeatable finds on both plateaus; access remains controlled by the
 // roots and the upper anchor rather than by inventory flags.
 for(const [kind,sites] of Object.entries({
  // Neugestaltung: vier zusätzliche Glanzsteinstellen unten, damit nach den Wurzeln genug Linsen möglich sind.
  rarestone:[[61,-40],[70,-47],[51,-47],[54,-51],[75.5,-40],[61.5,-46.5],[69.5,-51],[73.5,-43]],
  beachglass:[[68,-42],[65,-49],[49,-45]],
  seagrass:Array.from({length:7},(_,i)=>{const a=i/7*Math.PI*2+.4;return [WIND_POOL.x+Math.cos(a)*(WIND_POOL.rx+.28),WIND_POOL.z+Math.sin(a)*(WIND_POOL.rz+.28)];})
 }))for(const [index,[sx,sz]] of sites.entries()){
  const {x,z}=kind==='rarestone'&&index>=4?findSite(sx,sz,kind):{x:sx,z:sz},y=sunnyHeight(x,z)+.1;
  out.push({id:'wind_'+kind+'_'+index,kind,x,z,y,homeX:x,homeY:y,homeZ:z,status:'ground',progress:0,respawnAt:0,angle:index*2.399});
 }
 return out;
}
export function createLayerFinds(){
 const sites=[
  ['amber',1,false,[[-16,-8],[-23,-13],[14,21]]],
  ['petrifiedwood',2,false,[[-28,7],[17,36],[-18,22]]],
  /* vergrabenes Strandglas bleibt am Strand (Jakob) */['beachglass',0,true,[[58,4],[65,10],[72,-8]]],
  ['rareshell',1,true,[[60,15],[69,-14],[72,3]]],
  ['nacre',2,true,[[55,-10],[66,18],[73,-16]]]
 ];
 return sites.flatMap(([kind,depth,coast,points])=>points.map(([x,z],i)=>{
  const p=findSite(x,z,coast?'coast':kind),y=sunnyHeight(p.x,p.z);
  return {id:'layer_'+kind+'_'+i,kind,tool:'ground',...p,y,depth,size:1,seconds:1.2,progress:0,cleared:false,renewable:true};
 }));
}
export function createHeightFinds(){
 const out=[];
 for(const [kind,rank,indices] of [['seedpod',1,[3,8,15]],['glowfruit',2,[7,10]]])
  for(const [i,index] of indices.entries()){
   const [x,z]=SUNNY.trees[index],a=i*2.3,px=x+Math.sin(a)*1.1,pz=z+Math.cos(a)*1.1,y=sunnyHeight(px,pz)+(rank===1?2.8:4.1);
   out.push({id:'height_'+kind+'_'+i,kind,hanging:true,heightRank:rank,x:px,z:pz,y,homeX:px,homeY:y,homeZ:pz,status:'ground',progress:0,respawnAt:0,angle:a});
  }
 for(const [kind,rank,indices] of [['palmfruit',0,[0,1,2]],['windshell',1,[2,3]],['shimmershell',2,[3,4]]])
  for(const [i,index] of indices.entries()){
   const [x,z]=COAST_PALMS[index],a=i*2.3,px=x+Math.sin(a)*.8,pz=z+Math.cos(a)*.8,y=sunnyHeight(px,pz)+(rank===0?1.8:rank===1?2.8:4.1);
   out.push({id:'height_'+kind+'_'+i,kind,hanging:true,heightRank:rank,x:px,z:pz,y,homeX:px,homeY:y,homeZ:pz,status:'ground',progress:0,respawnAt:0,angle:a});
  }
 return out;
}
