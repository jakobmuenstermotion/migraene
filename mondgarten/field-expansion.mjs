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
