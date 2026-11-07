// Shared by terrain, collision and scenery; the crossing stays narrow at x=1.7.
export const GORGE={minX:-56,maxX:56,referenceFar:-31,referenceNear:-29};
function bankSample(x){const d=x-1.7,center=-30+.8*Math.sin(d*.24)+.3*Math.sin(d*.67),half=1+2.6*(1-Math.exp(-((d/4.4)**2)))+.08*Math.sin(d*.8);/* Neugestaltung (Jakob): zwei Engstellen für das Fernsauger-Holz */const narrow=(u,w)=>Math.exp(-((u/w)**4));return {center,half:Math.max(.95,half-2.5*narrow(d+13.7,2.9)-2.31*narrow(d+36.7,2.9))};}
const bankSamples=Array.from({length:281},(_,i)=>bankSample(-56+i*112/280));
export function gorgeBanks(x){const position=Math.max(0,Math.min(280,(x+56)/.4)),i=Math.min(279,Math.floor(position)),t=position-i,a=bankSamples[i],b=bankSamples[i+1],center=a.center+(b.center-a.center)*t,half=a.half+(b.half-a.half)*t;return {center,far:center-half,near:center+half,half};}
export function gorgeDepth(x){const base=4.2+.018*Math.abs(x-1.7)+.22*Math.sin((x-1.7)*.41),t=Math.max(0,Math.min(1,(x-38)/18));return base+(2.8-base)*t*t*(3-2*t);}
export function gorgeWarpZ(x,z){const b=gorgeBanks(x);if(z<=-38||z>=-22)return z;if(z<=-31)return -38+(z+38)/7*(b.far+38);if(z>=-29)return b.near+(z+29)/7*(-22-b.near);return b.far+(z+31)/2*(b.near-b.far);}


// Neugestaltung (Jakob): Fernsauger-Holz liegt an den zwei Engstellen auf einem schmalen Felsabsatz
// direkt an der gegenüberliegenden Wand. Engstelle Mitte (x≈-12): Startreichweite; West hinten (x≈-35, vom Nordufer aus nicht erreichbar): Reichweite I.
// Je Eintrag drei Holzstücke; reach = Abstand zur begehbaren Uferkante.
export const GORGE_LEDGES=[-12.9,-12.45,-12,-11.55,-11.1,-35.9,-35.45,-35,-34.55,-34.1].map(x=>{const b=gorgeBanks(x),z=b.far+.35;return {x,z,far:b.far,reach:b.near-z};});