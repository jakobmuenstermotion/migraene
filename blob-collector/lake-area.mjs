// A single shared shoreline for terrain, collision, placement and fishing.
export const LAKE={x:-8,z:23,rx:4.7,rz:3.5,water:-.05};
export function lakeRadius(x,z){const dx=(x-LAKE.x)/LAKE.rx,dz=(z-LAKE.z)/LAKE.rz,a=Math.atan2(dz,dx);return Math.hypot(dx,dz)/(1+.055*Math.sin(a*3)+.035*Math.cos(a*5));}
export function lakeHeight(x,z,h){const r=lakeRadius(x,z),floor=LAKE.water-.06-.7*Math.max(0,1-r*r),t=Math.max(0,Math.min(1,(1.2-r)/.18));return h+(floor-h)*t*t*(3-2*t);}
