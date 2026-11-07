export function rootContactPoint(o,p){
 const r=o.gateRotation??0,c=Math.cos(r),s=Math.sin(r),dx=p.x-o.gateX,dz=p.z-o.gateZ;
 const x=Math.max(-(o.gateWidth??2)+.2,Math.min((o.gateWidth??2)-.2,c*dx-s*dz)),z=Math.sign(s*dx+c*dz||1)*((o.gateDepth??.3)+.08);
 return {x:o.gateX+c*x+s*z,z:o.gateZ-s*x+c*z,y:p.y};
}
