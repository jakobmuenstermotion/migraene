import {generateFieldCells} from './content.mjs';
export const FIELD_EXPANSION_STEPS=8;
// Append strips without moving or renumbering existing plants and saved cuts.
export function expandedFieldCells(bed,level=0){
 const cells=generateFieldCells([bed]);
 let left=0,right=0,top=0,bottom=0;
 for(let step=0;step<Math.min(FIELD_EXPANSION_STEPS,level);step++){
  const side=step%4;
  if(side===0)right++;else if(side===1)bottom++;else if(side===2)left++;else top++;
  const col=side===0?bed.columns-1+right:-left,row=side===1?bed.rows-1+bottom:-top;
  if(side%2===0)for(let r=-top;r<bed.rows+bottom;r++)cells.push({x:bed.x+(col-(bed.columns-1)/2)*bed.spacing,z:bed.z+(r-(bed.rows-1)/2)*bed.spacing});
  else for(let c=-left;c<bed.columns+right;c++)cells.push({x:bed.x+(c-(bed.columns-1)/2)*bed.spacing,z:bed.z+(row-(bed.rows-1)/2)*bed.spacing});
 }
 return cells;
}

export function fieldExpansionPreview(bed,level=0){
 if(level>=FIELD_EXPANSION_STEPS)return null;
 const before=expandedFieldCells(bed,level),after=expandedFieldCells(bed,level+1),added=after.slice(before.length);
 const xs=added.map(c=>c.x),zs=added.map(c=>c.z),x=(Math.min(...xs)+Math.max(...xs))/2,z=(Math.min(...zs)+Math.max(...zs))/2;
 // A small visible border keeps outer strips reachable at the world edge.
 const width=Math.max(...xs)-Math.min(...xs)+bed.spacing+.3,depth=Math.max(...zs)-Math.min(...zs)+bed.spacing+.3;
 const clamp=n=>Math.max(-34,Math.min(34,n));
 return{x:clamp(x),z:clamp(z),area:{x,z,width,depth},added:added.length};
}
export function isInsideBuildPad(pad,position,padding=0,radius=1.15){
 if(pad.area)return Math.abs(position.x-pad.area.x)<=pad.area.width/2+padding&&Math.abs(position.z-pad.area.z)<=pad.area.depth/2+padding;
 return Math.hypot(position.x-pad.x,position.z-pad.z)<radius+padding;
}
export function buildPadDistance(pad,position){
 if(!pad.area)return Math.hypot(position.x-pad.x,position.z-pad.z);
 return Math.hypot(Math.max(0,Math.abs(position.x-pad.area.x)-pad.area.width/2),Math.max(0,Math.abs(position.z-pad.area.z)-pad.area.depth/2));
}
