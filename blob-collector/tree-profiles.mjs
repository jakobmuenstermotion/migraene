export function treeRole(index,region='sunny'){if(region==='pilzhain')return index%4?'fungal':'old';if(region==='mooswald')return index%3?'moss':'broadleaf';return ['broadleaf','broadleaf','old','moss','broadleaf','old'][index%6];}
export const FALLEN_LOGS=[{x:-24,z:13,angle:.8},{x:20,z:15,angle:2.1},{x:55,z:35,angle:.4},{x:-61,z:8,angle:1.3},{x:-8,z:-60,angle:2.5}];
