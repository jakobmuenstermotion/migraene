export function rootContactPoint(o,p){
 const r=o.gateRotation??0,c=Math.cos(r),s=Math.sin(r),dx=p.x-o.gateX,dz=p.z-o.gateZ;
 const x=Math.max(-(o.gateWidth??2)+.2,Math.min((o.gateWidth??2)-.2,c*dx-s*dz)),z=Math.sign(s*dx+c*dz||1)*((o.gateDepth??.3)+.08);
 return {x:o.gateX+c*x+s*z,z:o.gateZ-s*x+c*z,y:p.y};
}
// Jakob 10.11.: Runde Sperren (z. B. Blätterhaufen zum Strand) – Saugen zählt am Rand, der zur Figur zeigt, nicht in der Mitte.
// Sonst ist der Haufen mit kurzer Saugerreichweite unerreichbar, weil die Sperre die Figur weiter weg hält.
export function edgeContactPoint(o,p){const dx=p.x-o.gateX,dz=p.z-o.gateZ,d=Math.hypot(dx,dz)||1,r=Math.max(0,(o.gateRadius??0)-.3);return {x:o.gateX+dx/d*r,z:o.gateZ+dz/d*r,y:o.y??p.y};}
