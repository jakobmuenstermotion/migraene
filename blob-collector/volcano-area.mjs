// Vulkan (Neugestaltung, Jakob 30.10.): letztes Gebiet südlich vom Pilzhain, läuft an der Südwestgrenze der Blumenwiese
// entlang. Zugang durch einen Felsrutsch am Südrand des Pilzhains (Kraftsauger, Hindernisgröße II). Später lässt sich eine
// Basaltwand zur Blumenwiese aus Materialien durchbrechen (route-build.mjs, Jakob 31.10.) als Abkürzung.
// Drei Zonen: Aschehang, Lavafelder, Kraterrand. Gemeinsame Quelle für Gelände, Kollision, Funde und Darstellung.
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
const hash=(a,b=0)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
const smin=(a,b,k)=>{const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
export const VOLCANO_ZONES=[
 {id:'ash',name:'Aschehang',x:-64,z:37,rx:13,rz:11,seed:.8},
 {id:'lava',name:'Lavafelder',x:-50,z:55,rx:15,rz:11,seed:2.1},
 {id:'crater',name:'Kraterrand',x:-36,z:74,rx:14,rz:11,seed:3.4},
 // Vulkankern (Endgame, Jakob 6.11.): rechts (östlich) neben dem Magmasee, vom Kraterrand durch den Lavafluss getrennt.
 {id:'core',name:'Vulkankern',x:-6,z:79,rx:16,rz:12.5,seed:4.7}
];
export const CORE_ZONE=VOLCANO_ZONES[3];
export const VOLCANO_NORTH_PASS=[[-60,18.5],[-60.4,23],[-61.4,27],[-62.5,30.5]];
export const VOLCANO_EAST_PASS=[[-24,50],[-30,51],[-34,52.4],[-37.5,54]];
export const VOLCANO_TRAIL=[[-62.5,30.5],[-63,37],[-60,44],[-54,50],[-50,56],[-47,62],[-42,68],[-38,69.6]];
// Dritter Lauf = Lavafluss zwischen Kraterrand und Vulkankern (Endgame, Jakob 6.11.): läuft von Süd nach Nord östlich des Magmasees
// und sperrt den Kern, bis er mit Eiswasser gelöscht (erstarrt) ist.
export const VOLCANO_RIVER=[[-24.5,58],[-23,64],[-21.8,70],[-21.4,76],[-21.8,82],[-23,88],[-24,96]];
export const VOLCANO_FLAGS={petrified:false};
export const CORE_DOOR={x:-21.4,z:76};
export const VOLCANO_LAVA=[[[-37,70.8],[-40,66],[-45,62],[-52,61],[-58,57],[-63.5,52]],[[-52,61],[-47.5,52.5],[-43,49]],VOLCANO_RIVER];
export const VOLCANO_LAKE={x:-35.5,z:76,rx:7,rz:4.8};
export const VOLCANO_SPRINGS=[[-44.5,47.5],[-57,48.5],[-37.5,59.5]];
// Der Kegel steht jetzt so weit im Norden, dass sein Fuß (r 22) erst bei z=92 beginnt: Vorher lag der begehbare Kraterrand innerhalb des Kegels, und man sah von unten durch seine Hülle.
// Jakob 6.11.: Der Berg steht rechts (Osten) hinter dem Vulkankern statt unten im Bild, wo man von der Kamera aus durch ihn hindurchsah.
// Jakob 6.11.: Der Berg steht mitten im Vulkankern, Krater oben, die vier Anlagen rundherum am Fuß. Eigenes Modell in core-view (own).
export const VOLCANO_PEAK={x:-6,z:79,r:7,h:11,y:5.2,own:true,foot:6.2};
export const VOLCANO_GATES=[
 {id:'routeVolcano',kind:'stone',tool:'power',rockGate:3,name:'Vulkan · Felsrutsch',x:-60.5,z:23.4,gateX:-60.5,gateZ:23.4,gateWidth:2.5,gateDepth:.6,gateRadius:1.5,depth:0,size:3,seconds:4},
 {id:'routeVolcanoShortcut',kind:'lavawall',tool:'build',build:{name:'Durchgang zur Blumenwiese',cost:{clay:30,stoneslab:10,beam:6}},name:'Blumenwiese · Basaltwand',x:-30.4,z:51.1,gateX:-30.4,gateZ:51.1,gateWidth:2.45,gateDepth:.55,gateRotation:Math.PI/2,depth:0,size:1,seconds:6}
];
export const VOLCANO_DEPOSITS=[
 {id:'desertcrystaldeposit0',kind:'desertcrystal',volcano:true,x:-45.5,z:75,r:.95,max:8,regen:60},
 {id:'desertcrystaldeposit1',kind:'desertcrystal',volcano:true,x:-25.5,z:70,r:.9,max:8,regen:60},
 {id:'copperdeposit0',kind:'copperore',volcano:true,x:-43,z:69,r:.95,max:15,regen:40},
 {id:'copperdeposit1',kind:'copperore',volcano:true,x:-28,z:66,r:.95,max:15,regen:40}
];
export const VOLCANO_ROCKS=[[-73,33,1.5,1.5],[-56,31,1.1,1],[-70,42,1.2,1.2],[-67,28.5,.9,.8],[-55,41,1,.9],[-60,51,.8,.7],[-60,60,1.3,1.2],[-39,47,.9,.8],[-48,46.5,1.1,1],[-44,57,.8,.7],[-38,62,1,.9],[-54,64.5,1.2,1.2],[-46,80,1.3,1.4],[-26,80,1.4,1.5],[-23,74,1,1],[-33,67,.8,.7],[-48,71,.9,.9],[-36,84,1.2,1.2]];
function lineDistance(points,x,z){let best=Infinity,u=0,acc=0,total=0;for(let i=0;i<points.length-1;i++)total+=Math.hypot(points[i+1][0]-points[i][0],points[i+1][1]-points[i][1]);for(let i=0;i<points.length-1;i++){const [ax,az]=points[i],[bx,bz]=points[i+1],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/l2)),d=Math.hypot(x-ax-dx*t,z-az-dz*t);if(d<best){best=d;u=(acc+t*Math.sqrt(l2))/total;}acc+=Math.sqrt(l2);}return {d:best,u};}
export function volcanoContour(a,seed=.6){return 1+.05*Math.sin(a*3+seed)+.03*Math.sin(a*7+1.3+seed)+.02*Math.cos(a*11+seed*2);}
function zoneRadius(zone,x,z){const dx=(x-zone.x)/zone.rx,dz=(z-zone.z)/zone.rz;return Math.hypot(dx,dz)/volcanoContour(Math.atan2(dz,dx),zone.seed);}
export function volcanoValleyRadius(x,z){let r=Infinity;for(const zone of VOLCANO_ZONES)r=smin(r,zoneRadius(zone,x,z),.32);return r;}
export function volcanoZoneAt(x,z){let best=null,r=Infinity;for(const zone of VOLCANO_ZONES){const v=zoneRadius(zone,x,z);if(v<r){r=v;best=zone;}}return best;}
const PASS_WIDTH=1.9;
export function inVolcanoPass(x,z){return (lineDistance(VOLCANO_NORTH_PASS,x,z).d<PASS_WIDTH+.4||lineDistance(VOLCANO_EAST_PASS,x,z).d<PASS_WIDTH+.4)&&volcanoValleyRadius(x,z)>.92;}
export function volcanoRegion(x,z,margin=0){if(x<-90||x>10||z<16||z>92)return false;if(volcanoValleyRadius(x,z)<1+margin/11)return true;return lineDistance(VOLCANO_NORTH_PASS,x,z).d<PASS_WIDTH+margin||lineDistance(VOLCANO_EAST_PASS,x,z).d<PASS_WIDTH+margin;}
export const volcanoTrailDistance=(x,z)=>Math.min(lineDistance(VOLCANO_TRAIL,x,z).d,lineDistance(VOLCANO_EAST_PASS,x,z).d);
export function lavaDistance(x,z){return Math.min(...VOLCANO_LAVA.map(l=>lineDistance(l,x,z).d));}
export const lavaWidth=(x,z)=>.85+.3*Math.sin(x*.5+z*.4);
// Lava ist nur dort überschreitbar, wo der Weg über erstarrten Basalt führt.
export function onLava(x,z,radius=0){const d=Math.min(...VOLCANO_LAVA.filter(l=>!(l===VOLCANO_RIVER&&VOLCANO_FLAGS.petrified)).map(l=>lineDistance(l,x,z).d));return d<lavaWidth(x,z)+radius&&lineDistance(VOLCANO_TRAIL,x,z).d>1.7;}
export function lakeRadius(x,z){const L=VOLCANO_LAKE,a=Math.atan2((z-L.z)/L.rz,(x-L.x)/L.rx);return Math.hypot((x-L.x)/L.rx,(z-L.z)/L.rz)/(1+.07*Math.sin(a*3+1)+.05*Math.sin(a*5+.4));}
export const VOLCANO_FLOOR=1;
export function volcanoFloorHeight(x,z){
 let h=2.72+(VOLCANO_FLOOR-2.72)*smooth((z-29)/20)+(5.4-VOLCANO_FLOOR)*smooth((z-59)/13);
 h+=.16*Math.sin(x*.31+z*.17)*Math.sin(z*.23-x*.11)*smooth((z-28)/4)+.07*Math.sin(x*.9+z*.6)*Math.cos(z*.7)*smooth((z-28)/4);
 h+=.9*smooth((volcanoValleyRadius(x,z)-.8)/.2);
 const lava=lavaDistance(x,z);h-=.22*smooth((lavaWidth(x,z)+.7-lava)/.9)*smooth((lineDistance(VOLCANO_TRAIL,x,z).d-1.2)/.8);
 const lake=lakeRadius(x,z);if(lake<1.45){h+=.5*smooth((lake-1)/.2)*smooth((1.45-lake)/.25);if(lake<1.15){const t=smooth((1.15-lake)/.15);h=h*(1-t)+4.7*t;}}
 return h;
}
export function volcanoHeight(x,z){
 const valley=volcanoValleyRadius(x,z),v=volcanoFloorHeight(x,z),north=lineDistance(VOLCANO_NORTH_PASS,x,z),east=lineDistance(VOLCANO_EAST_PASS,x,z);
 // Der Talrand steigt sanft an, aber nicht vor den Pässen: dort läuft das Gelände stufenlos in den Pass aus.
 const u=smooth((east.u-.05)/.9),rimFree=v-.9*smooth((valley-.8)/.2),eastH=.05*(1-u)+rimFree*u;
 if(valley>=1)return north.d<east.d?2.72:eastH;
 const eastW=(1-smooth((east.d-PASS_WIDTH)/1.2))*smooth((valley-.84)/.16),northW=(1-smooth((north.d-PASS_WIDTH)/1.2))*smooth((valley-.84)/.16);
 const h=v*(1-eastW)+eastH*eastW;return h*(1-northW)+2.72*northW;
}
// Verkohlte Bäume [x,z,Größe]: am Aschehang, wenige weiter hinten. Weg, Lava, See, Felsen, Vorkommen bleiben frei.
export const VOLCANO_TREES=(()=>{const out=[],density={ash:.2,lava:.05,crater:.05};
 for(let gz=26;gz<=88;gz+=1.5)for(let gx=-84;gx<=-22;gx+=1.5){const i=out.length,x=gx+(hash(gx,gz)-.5)*1.2,z=gz+(hash(gz,gx*.7)-.5)*1.2,zone=volcanoZoneAt(x,z);
  if(!zone||volcanoValleyRadius(x,z)>.94||hash(gx*1.3,gz*.7)>density[zone.id])continue;
  if(inVolcanoPass(x,z)||lineDistance(VOLCANO_NORTH_PASS,x,z).d<3.2||lineDistance(VOLCANO_EAST_PASS,x,z).d<3.2||volcanoTrailDistance(x,z)<1.8||lavaDistance(x,z)<2||lakeRadius(x,z)<1.6||out.some(([tx,tz])=>Math.hypot(tx-x,tz-z)<2.2))continue;
  if(VOLCANO_ROCKS.some(([rx,rz,r])=>Math.hypot(rx-x,rz-z)<r+1)||VOLCANO_DEPOSITS.some(d=>Math.hypot(d.x-x,d.z-z)<d.r+1.8)||VOLCANO_SPRINGS.some(([sx,sz])=>Math.hypot(sx-x,sz-z)<2.4))continue;
  out.push([Math.round(x*100)/100,Math.round(z*100)/100,Math.round((.7+.45*hash(i,gx))*100)/100]);}
 return out;})();
export function volcanoCollision(x,y,z,radius=.35){
 // Der Lavafluss reicht über den Talrand hinaus, damit man ihn nicht umgehen kann (bis er erstarrt ist).
 if(!VOLCANO_FLAGS.petrified&&x<-14&&x>-32&&z>54&&z<100&&lineDistance(VOLCANO_RIVER,x,z).d<lavaWidth(x,z)+radius*.6)return true;
 if(!volcanoRegion(x,z,1.5))return false;
 if(Math.hypot(x-VOLCANO_PEAK.x,z-VOLCANO_PEAK.z)<VOLCANO_PEAK.foot+radius)return true;
 if(onLava(x,z,radius*.6)||lakeRadius(x,z)<1.02+radius/6)return true;
 for(const [tx,tz,s] of VOLCANO_TREES)if(Math.hypot(tx-x,tz-z)<.28*s+radius)return true;
 for(const [rx,rz,r] of VOLCANO_ROCKS)if(r>=.9&&Math.hypot(rx-x,rz-z)<r*.78+radius)return true;
 for(const d of VOLCANO_DEPOSITS)if(Math.hypot(d.x-x,d.z-z)<d.r*.72+radius)return true;
 return false;
}
function free(x,z,r=.4){if(!volcanoRegion(x,z,-.5)||inVolcanoPass(x,z))return false;if(onLava(x,z,r+.25)||lakeRadius(x,z)<1.5)return false;for(const [tx,tz,s] of VOLCANO_TREES)if(Math.hypot(tx-x,tz-z)<.4*s+r)return false;for(const [rx,rz,rr] of VOLCANO_ROCKS)if(Math.hypot(rx-x,rz-z)<rr+r)return false;for(const d of VOLCANO_DEPOSITS)if(Math.hypot(d.x-x,d.z-z)<d.r+r+.2)return false;return true;}
function place(x,z,r=.4,taken=null){for(let i=0;i<1200;i++){const a=i*2.399,d=i===0?0:.2+Math.sqrt(i)*.28,px=x+Math.sin(a)*d,pz=z+Math.cos(a)*d;if(free(px,pz,r)&&!(taken&&taken.some(p=>Math.hypot(p.x-px,p.z-pz)<r*1.5)))return {x:px,z:pz};}throw Error('No volcano site near '+x+','+z);}
// Asche (interne ID desertsand): große Flocken, die wie Laub am Boden liegen. Gesaugte Flocken regnen später wieder herab.
export const ASH_FLAKES=480;
// Zufall ohne Gittermuster, dazu ein Feld für lockere Verwehungen: mal dichter, mal fast leer (Jakob 31.10.).
const ashRandom=n=>{let h=Math.imul(n^0x9e3779b9,0x85ebca6b);h^=h>>>13;h=Math.imul(h,0xc2b2ae35);h^=h>>>16;return (h>>>0)/4294967296;};
const ashDrift=(x,z)=>Math.max(.04,.5+.34*Math.sin(x*.31+Math.sin(z*.23)*1.7)+.26*Math.sin(z*.47+x*.19+1.1));
export function createVolcanoMaterials(height){
 const out=[],taken=[],push=(id,kind,p,extra={})=>{taken.push(p);const y=height(p.x,p.z)+.04;out.push({id,kind,x:p.x,z:p.z,y,homeX:p.x,homeZ:p.z,homeY:y,status:'ground',progress:0,respawnAt:0,angle:out.length*2.399,...extra});};
 const [ash,lava,crater]=VOLCANO_ZONES,split=[[ash,300],[lava,120],[crater,60]];let k=0,seed=1;
 const ashSpot=zone=>{let x=zone.x,z=zone.z;for(let t=0;t<12;t++){const a=ashRandom(seed++)*Math.PI*2,r=Math.sqrt(ashRandom(seed++))*.93;x=zone.x+Math.sin(a)*zone.rx*r;z=zone.z+Math.cos(a)*zone.rz*r;if(ashRandom(seed++)<ashDrift(x,z))break;}return [x,z];};
 for(const [zone,n] of split)for(let i=0;i<n;i++){const [x,z]=ashSpot(zone);push('ashflake'+k++,'desertsand',place(x,z,.14,null));}
 // Jakob 31.10.: natürliche Grüppchen statt Spiralen. Lavagestein bricht von den Felsen, Schwefel wächst an heißen Quellen, Lavafasern an der Lavakante, Glutblüten im Windschatten.
 let w=7;const rnd=()=>ashRandom(w++),cluster=(prefix,kind,total,anchors,spread,minGroup,maxGroup,r=.26)=>{let i=0,g=0;while(i<total){const [cx,cz,cr=0]=anchors[g++%anchors.length],n=Math.min(total-i,minGroup+Math.floor(rnd()*(maxGroup-minGroup+1))),ga=rnd()*Math.PI*2,gd=cr+.5+rnd()*.8;for(let j=0;j<n;j++){const a=ga+(rnd()-.5)*2.4,d=gd+(rnd()-.3)*spread;push(prefix+i++,kind,place(cx+Math.sin(a)*d,cz+Math.cos(a)*d,r,taken));}}};
 cluster('volcanoclay','clay',60,VOLCANO_ROCKS,1.2,2,5);
 cluster('volcanoearth','coloredearth',30,VOLCANO_SPRINGS,1.6,3,6);
 {let i=0,g=0;while(i<40){const line=VOLCANO_LAVA[g%2],seg=Math.floor(rnd()*(line.length-1)),[ax,az]=line[seg],[bx,bz]=line[seg+1],t0=rnd(),side=rnd()<.5?1:-1,dx=bx-ax,dz=bz-az,l=Math.hypot(dx,dz),n=Math.min(40-i,2+Math.floor(rnd()*3));g++;for(let j=0;j<n;j++){const t=t0+(j-1)*.05+(rnd()-.5)*.04,off=2.1+rnd()*.9;push('volcanofibre'+i++,'cactusfibre',place(ax+dx*t-dz/l*side*off,az+dz*t+dx/l*side*off,.24,taken));}}}
 cluster('volcanoflower','desertflower',14,[[-46,80,1.3],[-26,80,1.4],[-36,84,1.2],[-48,71,.9],[-60,60,1.3]],.9,2,3);
 const hang=(kind,rank,trees,count)=>{for(let i=0;i<count&&trees.length;i++){const [tx,tz,s]=trees[Math.floor((i+.5)*trees.length/count)],a=i*2.3+rank,x=tx+Math.sin(a)*.5*s,z=tz+Math.cos(a)*.5*s,y=height(tx,tz)+(rank===0?1.7:rank===1?2.4:3.2)*s;out.push({id:'height_'+kind+'_'+i,kind,hanging:true,heightRank:rank,x,z,y,homeX:x,homeY:y,homeZ:z,status:'ground',progress:0,respawnAt:0,angle:a});}};
 hang('cinderpod',0,VOLCANO_TREES,5);hang('cactusfruit',1,VOLCANO_TREES,6);hang('suncapsule',2,VOLCANO_TREES.filter((_,i)=>i%2),3);
 return out;
}
// Vergrabene Funde (Bodensauger): Bimsstein T0 am Hang, Aschefossil T1 in den Lavafeldern, Magmascherbe T2 am Krater.
export function createVolcanoFinds(height){
 return [['paintedstone',0,[[-68,35],[-60,38],[-63,46],[-72,41]]],['fossilshell',1,[[-44,52],[-56,55],[-40,56]]],['sunshard',2,[[-30,70],[-42,78]]]]
  .flatMap(([kind,depth,points])=>points.map(([x,z],i)=>{const p=place(x,z,.4);return {id:'layer_'+kind+'_'+i,kind,tool:'ground',...p,y:height(p.x,p.z),depth,size:1,seconds:1.2,progress:0,cleared:false,renewable:true};}));
}
// Ascheregen (Jakob 30.10.): alle fliegenden Flocken sind echte Sammelflocken. Liegende Flocken außerhalb des Bildes
// lösen sich langsam auf, regnen dann rund um die Figur herab und bleiben dort wie Laub liegen, bis man sie einsaugt.
// Reicht der ferne Vorrat nicht, kommen auch nähere Flocken dran, damit immer welche in der Luft sind.
const ASH_RAIN=12,ASH_RAIN_RADIUS=12,ASH_SOURCE_DISTANCE=10,ASH_FADE=2.5;
export function updateAshRain(s,dt){const p=s.player;if(s.area!=='sunny'||s.testWorld?.enabled||s.home?.interior||!volcanoRegion(p.x,p.z,2))return;
 if(s.ashRain?.source!==s.resources)s.ashRain={source:s.resources,list:s.resources.filter(r=>r.kind==='desertsand'&&!r.ephemeral),cursor:0,budget:0,seed:0,fading:[]};const R=s.ashRain,list=R.list;if(!list.length)return;R.budget=Math.min(4,R.budget+dt*ASH_RAIN);
 while(R.budget>=1){R.budget--;let flake=null;for(const reach of [ASH_SOURCE_DISTANCE,4])for(let i=0;i<list.length&&!flake;i++){const r=list[R.cursor=(R.cursor+1)%list.length];if(r.status==='ground'&&!r.reacting&&!r.ashFadeAt&&Math.hypot(r.x-p.x,r.z-p.z)>reach)flake=r;}if(!flake)break;flake.ashFadeAt=s.time;R.fading.push(flake);}
 for(let f=R.fading.length-1;f>=0;f--){const flake=R.fading[f];if(s.time<flake.ashFadeAt+ASH_FADE&&flake.status==='ground')continue;R.fading.splice(f,1);const ready=flake.status==='ground';flake.ashFadeAt=0;if(!ready)continue;
  for(let k=0;k<12;k++){const a=ashRandom(++R.seed*3)*Math.PI*2,d=Math.sqrt(ashRandom(R.seed*3+1))*ASH_RAIN_RADIUS,x=p.x+Math.sin(a)*d,z=p.z+Math.cos(a)*d;if(ashRandom(R.seed*3+2)>ashDrift(x,z)||!volcanoRegion(x,z,-.3)||inVolcanoPass(x,z)||onLava(x,z,.45)||lakeRadius(x,z)<1.3||volcanoCollision(x,0,z,.2))continue;const y=volcanoHeight(x,z)+.04;Object.assign(flake,{x,z,y,homeX:x,homeZ:z,homeY:y,status:'returning',progress:0,roll:0,angle:ashRandom(R.seed*7)*6.28});break;}}
}
export function createVolcanoDeposits(){return VOLCANO_DEPOSITS.map(d=>({...d,units:d.max,budget:0}));}
