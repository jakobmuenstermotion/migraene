import * as T from './vendor/three.module.js';
import {SUNNY,baseSunnyHeight} from './sunny-area.mjs';
import {gorgeWarpZ} from './gorge-shape.mjs';
import {iceRegion} from './ice-area.mjs';
import {volcanoRegion} from './volcano-area.mjs';
// Warp the bank rows with the ravine instead of cutting a rectangular slot.
export function sunnyTerrainGeometry(){
 const xs=[...new Set([...Array.from({length:281},(_,i)=>-56+i*112/280),...SUNNY.gaps.flatMap(g=>[g.minX,g.maxX])])].sort((a,b)=>a-b),zs=[...new Set([...Array.from({length:151},(_,i)=>-48+i*.8),...SUNNY.gaps.flatMap(g=>[g.minZ,g.maxZ])])].sort((a,b)=>a-b),positions=[],indices=[];
 // The sacred refuge has its own fine cliff/cap mesh; a coarse grass grid
 // underneath it would otherwise poke through the steep rim as green spikes.
 for(const z of zs)for(const x of xs){const worldZ=gorgeWarpZ(x,z);positions.push(x,baseSunnyHeight(x,worldZ),worldZ);}
 for(let j=0;j<zs.length-1;j++)for(let i=0;i<xs.length-1;i++){if(zs[j]>=-31&&zs[j+1]<=-29)continue;
  // The coastal mesh owns the far-eastern gorge mouth. Leaving the old
  // forest grid here produces a thin vertical spike through the waterfall.
  if(xs[i]>=54&&zs[j]<-22&&zs[j+1]>-38)continue;
  // Neugestaltung: Das Eistal hat ein eigenes Schneegelände (ice-view.mjs).
  if(iceRegion((xs[i]+xs[i+1])/2,gorgeWarpZ(xs[i],(zs[j]+zs[j+1])/2),1.6)||volcanoRegion((xs[i]+xs[i+1])/2,gorgeWarpZ(xs[i],(zs[j]+zs[j+1])/2),1.6))continue;
  const a=j*xs.length+i,b=a+xs.length;indices.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setIndex(indices);return g;
}
