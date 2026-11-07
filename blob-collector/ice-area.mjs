// Eistal (Neugestaltung, Jakob 29.10.): erhöhtes Schneetal westlich der Windklippen, zwischen Schlucht und Steinbach.
// Zugang über einen schmalen Frostpass vom Westrand der unteren Windterrasse; eine große Eiswand sperrt ihn
// (Kraftsauger mit Hindernisse I). Gemeinsame Quelle für Gelände, Kollision, Funde und Darstellung.
// Jakob 29.10. (zweiter Durchgang): deutlich größer und in drei Zonen gegliedert – vorne der Frostwald
// (Frostholz, Tannenzapfen, Frostmoos), in der Mitte der gefrorene Eissee (Eis, Schneefeld, Frostblumenwiese),
// hinten ein Hang hinauf zum Gipfel (Eiskristalle, Eisenerz, Eisglocken, Sternzapfen).
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const hash=(a,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
export const ICE={id:'ice',name:'Eistal',x:40,z:-66,rx:15,rz:10.5,floor:2.6,top:7.4};
// Drei weich verbundene Zonen; die erste entspricht dem bisherigen Tal (Pass und Eiswand unverändert).
export const ICE_ZONES=[
 {id:'forest',name:'Frostwald',x:33.4,z:-48.5,rx:10,rz:11.2,seed:.6},
 {id:'lake',name:'Eissee',x:42.5,z:-66.5,rx:15,rz:10.2,seed:1.9},
 {id:'summit',name:'Gipfelhang',x:39,z:-86.5,rx:13.5,rz:10.2,seed:3.1}
];
// Passmittellinie von der unteren Windterrasse (Osten) bis in das Tal (Westen).
export const ICE_PASS=[[54.6,-37.3],[50.5,-37.45],[47,-37.9],[44.2,-39.2],[42,-41.6],[40.4,-43.6]];
// Abkürzung (Jakob 31.10.): vom Steinbach im Westen hinauf in den Frostwald, Holztreppe aus Materialien (route-build.mjs).
export const ICE_WEST_PASS=[[15.5,-52],[19,-50.5],[22.5,-49.5],[26.5,-49]];
export const ICE_POND={x:43.5,z:-66,rx:7.6,rz:5};
// Gefrorener Bach: Abfluss vom Eissee durch den Frostwald bis zum vereisten Fall an der Südkante.
export const ICE_STREAM=[[41.2,-61.4],[38.8,-58.2],[36.6,-54.6],[37.2,-50.6],[35.6,-46.6],[34,-42.6],[33.4,-39.6],[33.8,-37.4]];
// Zufluss: vom Gipfel als Eisfall über die Westflanke in den See.
export const ICE_INFLOW=[[30.6,-91],[30.8,-86.5],[31.4,-82],[32.6,-77.6],[34.8,-73.8],[38.8,-69.6]];
// Freier Wanderweg vom Pass durch den Wald, am See vorbei und die Rampe hinauf (keine Bäume/Felsen darauf).
export const ICE_TRAIL=[[40.4,-43.6],[37.6,-46.8],[33.8,-51],[33,-55.5],[35.2,-59.5],[34,-63],[33.4,-67.5],[35.6,-72],[38.6,-76],[39.2,-81],[39,-86],[38.6,-91]];
// Mittellinie der flachen Rampe auf den Gipfelhang; daneben ist die Flanke steil und felsig.
const rampX=z=>38.9+.5*Math.sin(z*.4);
export const ICE_GATES=[{id:'routeIceWall',kind:'icewall',tool:'power',name:'Frostpass · Eiswand',x:48.75,z:-37.8,gateX:47.9,gateZ:-37.8,gateWidth:2.45,gateDepth:.55,gateRotation:Math.PI/2,depth:0,size:2,seconds:6},
 {id:'routeIceStairs',kind:'cliff',tool:'build',/* Jakob 7.11.: nur vom Eistal aus baubar */buildSide:s=>s.player.x>20.7,build:{name:'Holztreppe ins Eistal',cost:{frostbeam:6,rope:6,icequader:4}},name:'Steinbach · Steilwand',x:20.4,z:-50.2,gateX:20.2,gateZ:-50.2,gateWidth:2.45,gateDepth:.55,gateRotation:Math.PI/2,depth:0,size:1,seconds:6}];
// Große Vorkommen, nur der Kraftsauger baut sie ab (Abbauleistung, Überhitzung wie im Testlabor).
export const ICE_DEPOSITS=[
 {id:'icedeposit0',kind:'ice',x:36.4,z:-63.2,r:1.15,max:30,regen:18},
 {id:'icedeposit1',kind:'ice',x:51.6,z:-61.6,r:1.25,max:30,regen:18},
 {id:'icedeposit2',kind:'ice',x:48.6,z:-72.6,r:1.1,max:30,regen:18},
 {id:'icecrystaldeposit0',kind:'icecrystal',x:33.4,z:-89.4,r:.95,max:8,regen:60},
 {id:'icecrystaldeposit1',kind:'icecrystal',x:46.4,z:-90.2,r:.9,max:8,regen:60},
 // Jakob 7.11.: Eisenerz war knapp (Bedarf ≈740): drei Vorkommen mehr, je 20 statt 15, Testwerte.
 {id:'irondeposit0',kind:'ironore',x:29.4,z:-79.8,r:.95,max:20,regen:40},
 {id:'irondeposit1',kind:'ironore',x:48.8,z:-80.6,r:.95,max:20,regen:40},
 {id:'irondeposit2',kind:'ironore',x:40,z:-79,r:.95,max:20,regen:40},
 {id:'irondeposit3',kind:'ironore',x:55,z:-70,r:.95,max:20,regen:40},
 {id:'irondeposit4',kind:'ironore',x:38,z:-60,r:.95,max:20,regen:40}
];
// Schneebedeckte Felsen: [x,z,Radius,Höhe]; die größeren kollidieren.
export const ICE_ROCKS=[
 [26.6,-43.4,1,.9],[41.2,-49.6,1.2,1.1],[29.6,-56.2,.9,.8],[27.2,-54.2,1.3,1.3],[36.4,-39.8,.8,.7],[28.6,-39.6,.7,.55],[24,-45.4,1.1,1.2],[39.8,-55.2,.8,.7],
 [31.6,-61,1.1,1],[54.2,-67.6,1.3,1.2],[55.6,-62.4,.9,.8],[47.4,-58.6,.8,.7],[29.6,-70.2,1,1.1],[52,-73.4,1.1,1],
 [27.6,-84,1.5,1.6],[45.2,-85.4,1.4,1.5],[31.2,-93.6,1.2,1.3],[49.4,-91.2,1.3,1.2],[43,-95.4,1,1],[26.6,-89.8,1.1,1.1],[35.2,-78.6,.9,.8],[43.2,-78.4,1,.9]
];
// Flache, verschneite Steinplatten (Kulisse, keine Kollision): [x,z,Radius]; einige tragen die Kristallvorkommen.
export const ICE_SLABS=[[33.4,-89.4,1.75],[46.4,-90.2,1.65],[30.2,-46.8,1.2],[38.6,-53,1],[50.6,-64.4,1.3],[29.8,-66.4,1.1],[44.6,-76,1.2],[36,-84,1.3],[25.8,-56.4,1.1],[54.2,-70.6,1]];
function lineDistance(points,x,z){let best=Infinity,u=0,acc=0,total=0;for(let i=0;i<points.length-1;i++)total+=Math.hypot(points[i+1][0]-points[i][0],points[i+1][1]-points[i][1]);for(let i=0;i<points.length-1;i++){const [ax,az]=points[i],[bx,bz]=points[i+1],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2)),d=Math.hypot(x-ax-dx*t,z-az-dz*t);if(d<best){best=d;u=(acc+t*Math.sqrt(l2))/total;}acc+=Math.sqrt(l2);}return {d:best,u};}
const passInfo=(x,z)=>lineDistance(ICE_PASS,x,z);
export function iceTrailDistance(x,z){return lineDistance(ICE_TRAIL,x,z).d;}
export function iceContour(a,seed=.6){return 1+.05*Math.sin(a*3+seed)+.03*Math.sin(a*7+1.3+seed)+.02*Math.cos(a*11+seed*2);}
const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
export function iceZoneRadius(zone,x,z){const dx=(x-zone.x)/zone.rx,dz=(z-zone.z)/zone.rz;return Math.hypot(dx,dz)/iceContour(Math.atan2(dz,dx),zone.seed);}
// 1 = Rand des begehbaren Tals; weiche Vereinigung der drei Zonen.
export function iceValleyRadius(x,z){let r=Infinity;for(const zone of ICE_ZONES)r=smin(r,iceZoneRadius(zone,x,z),.32);return r;}
export function iceZoneAt(x,z){let best=null,r=Infinity;for(const zone of ICE_ZONES){const v=iceZoneRadius(zone,x,z);if(v<r){r=v;best=zone;}}return best;}
export function icePassWidth(u){return 1.75+.5*smooth((u-.82)/.18)+.35*smooth((.12-u)/.12)+.12*Math.sin(u*19);}
const WEST_WIDTH=1.9,westInfo=(x,z)=>lineDistance(ICE_WEST_PASS,x,z);
export function iceRegion(x,z,margin=0){if(x<13||x>62||z>-33.5||z<-100)return false;if(x>=18&&iceValleyRadius(x,z)<1+margin/10.2)return true;if(westInfo(x,z).d<WEST_WIDTH+margin)return true;if(x<18)return false;const p=passInfo(x,z);return p.d<icePassWidth(p.u)+margin;}
export function inIcePass(x,z){const p=passInfo(x,z);return (p.d<icePassWidth(p.u)+.4||westInfo(x,z).d<WEST_WIDTH+.4)&&iceValleyRadius(x,z)>.92;}
export function streamDistance(x,z){return Math.min(lineDistance(ICE_STREAM,x,z).d,lineDistance(ICE_INFLOW,x,z).d);}
export function icePondRadius(x,z){const a=Math.atan2((z-ICE_POND.z)/ICE_POND.rz,(x-ICE_POND.x)/ICE_POND.rx);return Math.hypot((x-ICE_POND.x)/ICE_POND.rx,(z-ICE_POND.z)/ICE_POND.rz)/(1+.07*Math.sin(a*3+1)+.05*Math.sin(a*5+.4));}
// Gipfelhang: in der Mitte eine lange flache Rampe, an den Seiten eine kurze steile Felsflanke.
export function iceRise(x,z){const off=Math.abs(x-rampX(z)),w=10.5-6.8*smooth((off-3)/4.5),top=ICE.top-ICE.floor+.35*Math.sin(x*.37+1)*smooth((-z-86)/4);return top*smooth((-z-73.6)/w);}
export function iceFloorHeight(x,z){
 const drift=.22*Math.sin(x*.31+z*.17)*Math.sin(z*.23-x*.11)+.12*Math.sin(x*.9+z*.6)*Math.cos(z*.7),pond=icePondRadius(x,z),stream=streamDistance(x,z);
 let h=ICE.floor+drift+iceRise(x,z);
 // Weiche Schneewehen am sanft ansteigenden Talrand.
 h+=.9*smooth((iceValleyRadius(x,z)-.8)/.2);
 h-=.32*smooth((1.15-stream)/1.15)*(pond>1.25?1:0);
 if(pond<1.3){const t=smooth((1.3-pond)/.3);h=h*(1-t)+(ICE.floor-.22)*t;}
 return h;
}
// Höhe der unteren Windterrasse, an die der Pass im Osten anschließt (gleiche Rampe wie coast-area).
const terraceRamp=z=>-.6+Math.max(0,Math.min(8,-z-32))*.34;
export function iceHeight(x,z){
 const valley=iceValleyRadius(x,z),p=passInfo(x,z),west=westInfo(x,z);
 const valleyH=iceFloorHeight(x,z);
 // Westtreppe: von der Höhe des Steinbachs gleichmäßig auf den Talboden (ohne dessen sanften Randanstieg).
 if(west.d<WEST_WIDTH+1.2&&west.d<p.d){const u=smooth((x-20.2)/4.1),/* Bodenhöhe des Steinbachs wie woodlandHeight; kein Import wegen Kreisabhängigkeit über coast-area */brook=.35+.35*Math.sin(x*.15)*Math.cos(z*.1)+.9*Math.exp(-((x+12)**2+(z+65)**2)/65),westH=brook*(1-u)+(valleyH-.9*smooth((valley-.8)/.2))*u;if(valley>=1)return westH;const w=smooth((valley-.84)/.16)*(1-smooth((west.d-WEST_WIDTH)/1.2));return valleyH*(1-w)+westH*w;}
 // Pass: steigt von der Terrassenrampe im Osten auf die Talhöhe; leicht gewölbter Querschnitt.
 const edgeU=1-smooth((p.u-.02)/.95),east=terraceRamp(z),base=east*edgeU+valleyH*(1-edgeU),cross=-.12*Math.min(1,p.d/icePassWidth(p.u))**2;
 const passH=base+cross+.06*Math.sin(x*1.3+z);
 if(valley>=1)return passH;const w=smooth((valley-.84)/.16)*(1-smooth((p.d-icePassWidth(p.u))/1.2));return valleyH*(1-w)+passH*w;
}
// Verschneite Tannen [x,z,Größe], deterministisch je Zone: dichter Frostwald vorne, wenige am See, lockere Gruppen am Gipfel.
// Weg, Bäche, See, Felsen und Vorkommen bleiben frei.
export const ICE_TREES=(()=>{const out=[],density={forest:.78,lake:.1,summit:.24};
 for(let gz=-36;gz>=-99;gz-=1.1)for(let gx=20;gx<=60;gx+=1.1){const i=out.length,h1=hash(gx,gz),h2=hash(gz,gx*.7),x=gx+(h1-.5)*.9,z=gz+(h2-.5)*.9,zone=iceZoneAt(x,z);
  if(!zone||iceValleyRadius(x,z)>.95||hash(gx*1.3,gz*.7)>density[zone.id])continue;
  if(inIcePass(x,z)||lineDistance(ICE_PASS,x,z).d<3||lineDistance(ICE_WEST_PASS,x,z).d<3.2||iceTrailDistance(x,z)<1.5||streamDistance(x,z)<1.2||icePondRadius(x,z)<1.3||out.some(([tx,tz])=>Math.hypot(tx-x,tz-z)<1.95))continue;
  if(ICE_ROCKS.some(([rx,rz,r])=>Math.hypot(rx-x,rz-z)<r+1.1)||ICE_DEPOSITS.some(d=>Math.hypot(d.x-x,d.z-z)<d.r+1.8)||ICE_SLABS.some(([sx,sz,r])=>Math.hypot(sx-x,sz-z)<r+.6))continue;
  // Hang zwischen See und Gipfel bleibt als freie Felsflanke sichtbar.
  if(zone.id==='summit'&&z>-80)continue;
  out.push([Math.round(x*100)/100,Math.round(z*100)/100,Math.round((.62+.36*hash(i,gx))*100)/100]);}
 return out;})();
export function iceCollision(x,y,z,radius=.35){
 if(!iceRegion(x,z,1.5))return false;
 for(const [tx,tz,s] of ICE_TREES)if(Math.hypot(tx-x,tz-z)<.32*s+radius&&y<iceHeight(tx,tz)+4)return true;
 for(const [rx,rz,r,h] of ICE_ROCKS)if(r>=.9&&Math.hypot(rx-x,rz-z)<r*.78+radius&&y<iceHeight(rx,rz)+h)return true;
 for(const d of ICE_DEPOSITS)if(Math.hypot(d.x-x,d.z-z)<d.r*.72+radius&&y<iceHeight(d.x,d.z)+1.6)return true;
 return false;
}
// Fundstellen; stabile IDs. Abstand zu Bach, Teich, Felsen, Bäumen und Vorkommen.
function free(x,z,r=.45){if(!iceRegion(x,z,-.5)||inIcePass(x,z))return false;if(icePondRadius(x,z)<1.15||streamDistance(x,z)<.7)return false;for(const [tx,tz,s] of ICE_TREES)if(Math.hypot(tx-x,tz-z)<.45*s+r)return false;for(const [rx,rz,rr] of ICE_ROCKS)if(Math.hypot(rx-x,rz-z)<rr+r)return false;for(const d of ICE_DEPOSITS)if(Math.hypot(d.x-x,d.z-z)<d.r+r+.2)return false;return true;}
function place(x,z,r=.45,tries=0,taken=null){for(let i=0;i<160;i++){const a=i*2.399,d=i===0?0:.2+Math.sqrt(i)*.2,px=x+Math.sin(a)*d,pz=z+Math.cos(a)*d;if(free(px,pz,r)&&!(taken&&taken.some(p=>Math.hypot(p.x-px,p.z-pz)<r*1.6)))return {x:px,z:pz};}if(tries<4)return place(x+(ICE.x-x)*.25,z+(ICE.z-z)*.25,r,tries+1,taken);throw Error('No ice site near '+x+','+z);}
const inZone=id=>([x,z])=>iceZoneAt(x,z)?.id===id;
// Wo welches Material wächst (wie die Blumenwiese auf der Lichtung).
export const ICE_BEDS={
 // Schneefeld: offene Fläche am Ostufer des Sees.
 snow:[[49.5,-58.8],[53.8,-58.4],[55.4,-64.8],[57,-69.4],[52.8,-76.2],[56.4,-73.6],[47.6,-77.6]],
 // Frostblumenwiese: geschützte Bucht am Westufer.
 frostflower:[[29.2,-63.4],[31.4,-66],[27.6,-67.6],[30.6,-69.4],[33,-64.6]],
 // Frostmoos an den Waldfelsen.
 frostmoss:ICE_ROCKS.filter(inZone('forest')).map(([x,z,r])=>[x,z,r])
};
export function createIceMaterials(height){
 const out=[],taken=[],push=(id,kind,p,extra={})=>{taken.push(p);const y=height(p.x,p.z)+(extra.lift??.06);out.push({id,kind,x:p.x,z:p.z,y,homeX:p.x,homeZ:p.z,homeY:y,status:'ground',progress:0,respawnAt:0,angle:out.length*2.399,...Object.fromEntries(Object.entries(extra).filter(([k])=>k!=='lift'))});};
 const forest=ICE_TREES.filter(inZone('forest')),summit=ICE_TREES.filter(inZone('summit')).sort((a,b)=>a[1]-b[1]);
 // Schnee liegt als Schneedecke darüber (createIceSnowCells).
 // Frostholz: abgebrochene, bereifte Äste unter den Tannen des Frostwalds (Jakob: ähnlich reichlich wie Holz).
 for(let i=0;i<110;i++){const [tx,tz,s]=forest[(i*7)%forest.length],a=i*1.9+.7,r=(1.05+(i%4)*.22)*s;push('frostwood'+i,'frostwood',place(tx+Math.sin(a)*r,tz+Math.cos(a)*r,.3,0,taken));}
 for(let i=0;i<30;i++){const n=ICE_BEDS.frostflower[i%5],a=i*2.6,r=.3+(i%6)*.2;push('frostflower'+i,'frostflower',place(n[0]+Math.sin(a)*r,n[1]+Math.cos(a)*r,.24,0,taken));}
 for(let i=0;i<22;i++){const [rx,rz,rr]=ICE_BEDS.frostmoss[i%ICE_BEDS.frostmoss.length],a=i*2.2+1;push('frostmoss'+i,'frostmoss',place(rx+Math.sin(a)*(rr+.5),rz+Math.cos(a)*(rr+.5),.26,0,taken));}
 // Höhenfunde in den Tannen: Tannenzapfen im Frostwald (Höhensog 0), Eisglocke (I) und Sternzapfen (II) am Gipfel.
 const hang=(kind,rank,trees,count)=>{for(let i=0;i<count;i++){const [tx,tz,s]=trees[Math.floor((i+.5)*trees.length/count)],a=i*2.3+rank,x=tx+Math.sin(a)*.75*s,z=tz+Math.cos(a)*.75*s,y=height(tx,tz)+(rank===0?1.8:rank===1?2.8:4.1)*s;out.push({id:'height_'+kind+'_'+i,kind,hanging:true,heightRank:rank,x,z,y,homeX:x,homeY:y,homeZ:z,status:'ground',progress:0,respawnAt:0,angle:a});}};
 hang('pinecone',0,forest,6);hang('icebell',1,summit.filter((_,i)=>i%2===0),3);hang('starcone',2,summit.filter((_,i)=>i%2===1),3);/* Jakob 7.11.: eine Sternzapfen-Stelle mehr */
 return [...out,...createIceSnowCells(height)];
}
// Schneedecke (Jakob: wie damals die Sandschicht am Strand): das Tal ist mit 1,6-m-Zellen zu je 4×5 Teilflächen
// belegt (gleiche Aufteilung wie SAND_LAYER/sandPoint). Saugen nimmt genau die Teilflächen unter der Düse; darunter
// kommt gefrorener Erdboden zum Vorschein. Jede Aufnahme startet die Nachwachszeit der Zelle neu; bis dahin rieselt
// die Schneise in der Darstellung langsam wieder weiß, dann ist die Zelle wieder voll.
export const ICE_SNOW_LAYER={cell:1.6,units:20,regen:[150,300],minX:21,minZ:-99.4,width:25,height:39};
export function createIceSnowCells(height){const L=ICE_SNOW_LAYER,out=[];
 for(let j=0;j<L.height;j++)for(let i=0;i<L.width;i++){const x=L.minX+(i+.5)*L.cell,z=L.minZ+(j+.5)*L.cell;
  if(!iceRegion(x,z)||inIcePass(x,z)||icePondRadius(x,z)<1.12||streamDistance(x,z)<.8)continue;
  const y=height(x,z)+.03;out.push({id:'icesnowcell_'+i+'_'+j,kind:'snow',x,y,z,homeX:x,homeY:y,homeZ:z,sandCell:true,snowLayer:true,snowI:i,snowJ:j,sandIndex:j*L.width+i,sandLeft:L.units,sandMask:0,status:'ground',progress:0,respawnAt:0,harvestAt:0});}
 return out;}
// Vergrabene Funde (Bodensauger): Frostzapfen T0 im Wald, Eisherz T1 am See, Frostrelikt T2 am Gipfel; nachwachsend.
export function createIceFinds(height){
 return [['frostcone',0,[[30.5,-50.5],[36,-44.8],[27.5,-45.8],[33.4,-57]]],['iceheart',1,[[33,-60.2],[53.2,-65.4],[46,-75.2]]],['frostrelic',2,[[38.6,-93.4],[29.6,-87]]],['frozenseed',0,[[29,-48],[34.5,-52.5],[25.5,-52]]],['frozenpearl',1,[[50,-70],[38,-68]]],['blueicestone',2,[[34,-90],[42,-89]]]]
  .flatMap(([kind,depth,points])=>points.map(([x,z],i)=>{const p=place(x,z,.4);return {id:'layer_'+kind+'_'+i,kind,tool:'ground',...p,y:height(p.x,p.z),depth,size:1,seconds:1.2,progress:0,cleared:false,renewable:true};}));
}
export function createIceDeposits(){return ICE_DEPOSITS.map(d=>({...d,units:d.max,budget:0}));}
