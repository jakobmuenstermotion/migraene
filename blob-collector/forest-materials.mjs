import {gorgeBanks,GORGE_LEDGES} from './gorge-shape.mjs';
import {createFlowerSites} from './flower-sites.mjs';
import {FLOWERS,meadowAt} from './flower-config.mjs';
import {validResourcePoint} from './resource-world.mjs';
import {woodlandAt} from './woodland-regions.mjs';
import {makeResourceClusters} from './resource-world.mjs';
import {createCoastMaterials,createLaterCoastMaterials} from './coast-area.mjs';
import {SUNNY,sunnyLeafPoint,sunnyHeight,sunnyCollision,createSunnyWood} from './sunny-area.mjs';
import {woodlandResourcePoint} from './woodland-regions.mjs';
import {createPlanResources,createHeightFinds} from './material-plan-resources.mjs';
import {createIceMaterials} from './ice-area.mjs';
import {createVolcanoMaterials} from './volcano-area.mjs';
export function createForestMaterials(){let seed=27651;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},out=[];for(const kind of ['wood','stone','moss','mushroom']){const data=makeResourceClusters(kind,kind==='wood'?SUNNY.woodCount:72);for(const [i,p]of data.points.entries()){const y=sunnyHeight(p.x,p.z)+.1;out.push({...p,spawnRegion:woodlandAt(p.x,p.z)?.id??'sunny',id:kind+i,kind,y,homeX:p.x,homeZ:p.z,homeY:y,status:'ground',progress:0,respawnAt:0,angle:random()*Math.PI*2});}}/* legacy sampler disabled: stable resource IDs are generated above */for(const index of [3,7,8,10,11,15,20]){const t=SUNNY.trees[index];if(!t)continue;for(let j=0;j<7;j++){const a=j*2.399,x=t[0]+Math.sin(a)*1.35*t[2],z=t[1]+Math.cos(a)*1.35*t[2],y=sunnyHeight(t[0],t[1])+(2.4+(j%3)*.23)*t[2];out.push({id:'treefruit'+index+'_'+j,kind:'fruit',hanging:true,x,z,y,homeX:x,homeZ:z,homeY:y,status:'ground',progress:0,respawnAt:0,angle:a});}}/* Neugestaltung: 30 Fernsauger-Holzstücke auf Felsabsätzen an den zwei Engstellen (GORGE_LEDGES), IDs unverändert. */for(let i=0;i<30;i++){const l=GORGE_LEDGES[Math.floor(i/3)],k=i%3,x=l.x+(k-1)*.17+Math.sin(i*2.3)*.04,z=l.z+(k===1?-.08:.06),y=sunnyHeight(l.x,l.far-.4)-.28;out.push({id:'gorgewood'+i,kind:'wood',focusOnly:true,x,y,z,homeX:x,homeY:y,homeZ:z,status:'ground',progress:0,respawnAt:0,angle:i*1.7});}out.push(...createFlowerSites());return out.concat(createCoastMaterials(sunnyHeight),createLaterCoastMaterials(sunnyHeight),createPlanResources(),createHeightFinds(),createIceMaterials(sunnyHeight),createVolcanoMaterials(sunnyHeight));}
