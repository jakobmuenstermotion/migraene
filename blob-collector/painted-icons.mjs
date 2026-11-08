import {FLOWERS} from './flower-config.mjs';
// Neugestaltung (Jakob 29.10.: „lieber gemalt“): stilisierte, gemalte Inventarbilder. Jede Fläche bekommt einen
// weichen Verlauf (Licht oben links), eine dunklere Kontur in ihrer eigenen Farbe und Glanzlichter. Die Motive
// folgen den Dingen, die man in der Welt einsaugt (Farben und Formen der Weltmodelle).
const hex=c=>{const v=c.replace('#','');return [0,2,4].map(i=>parseInt(v.slice(i,i+2),16));};
const out=v=>'#'+v.map(x=>Math.round(Math.max(0,Math.min(255,x))).toString(16).padStart(2,'0')).join('');
// a>0 hellt warm auf, a<0 dunkelt kühl ab.
export function tint(c,a){const v=hex(c),t=a>0?[255,247,226]:[40,36,58],k=Math.abs(a);return out(v.map((x,i)=>x+(t[i]-x)*k));}
// Dasselbe Bild steckt oft mehrfach im Menü, auch in versteckten Teilen. Zeigt url(#id) auf eine versteckte Kopie, bleibt die Fläche weiß.
// Jakob 8.11.: Statt gemeinsamer Sammel-Defs bekommt jede Kopie eigene, eindeutige IDs. So kann weder eine versteckte Kopie noch ein fehlendes <mask> (Blatt) ein Icon durchsichtig machen.
let liftSeq=0;
export function liftDefs(html){if(typeof document==='undefined'||!document.body||!html.includes('<defs>'))return html;const ids=new Set();for(const d of html.matchAll(/<defs>([\s\S]*?)<\/defs>/g))for(const m of d[1].matchAll(/\bid="([^"]+)"/g))ids.add(m[1]);if(!ids.size)return html;const sfx='-u'+(++liftSeq).toString(36);return html.replace(/\bid="([^"]+)"|url\(#([^)]+)\)|href="#([^"]+)"/g,(all,a,b,c)=>a!==undefined?(ids.has(a)?`id="${a}${sfx}"`:all):b!==undefined?(ids.has(b)?`url(#${b}${sfx})`:all):(ids.has(c)?all.replace(c,c+sfx):all));}
export function painter(id,{inline=false}={}){
 const defs=[];let n=0;const gid=()=>`pi-${id}-${n++}`;
 const rad=c=>{const g=gid();defs.push(`<radialGradient id="${g}" cx=".34" cy=".28" r=".9"><stop offset="0" stop-color="${tint(c,.42)}"/><stop offset=".45" stop-color="${c}"/><stop offset="1" stop-color="${tint(c,-.34)}"/></radialGradient>`);return `url(#${g})`;};
 const lin=(c,a=.3,b=-.3,x2=0,y2=1)=>{const g=gid();defs.push(`<linearGradient id="${g}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${tint(c,a)}"/><stop offset="1" stop-color="${tint(c,b)}"/></linearGradient>`);return `url(#${g})`;};
 const edge=(c,w=1.7)=>`stroke="${tint(c,-.55)}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
 const P={
  // gefüllte, gemalte Fläche
  s:(d,c,w)=>`<path d="${d}" fill="${rad(c)}" ${edge(c,w)}/>`,
  // flache Fläche mit linearem Verlauf (für Kanten von Blöcken)
  f:(d,c,a,b,w)=>`<path d="${d}" fill="${lin(c,a,b)}" ${edge(c,w)}/>`,
  e:(cx,cy,rx,ry,c,w,rot=0)=>`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${rad(c)}" ${edge(c,w)}${rot?` transform="rotate(${rot} ${cx} ${cy})"`:''}/>`,
  // Linie / Detailstrich
  l:(d,c,w=2,o=1)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${o}"/>`,
  // Glanzlicht
  g:(d,w=2.6,o=.75)=>`<path d="${d}" fill="none" stroke="#fffdf3" stroke-width="${w}" stroke-linecap="round" opacity="${o}"/>`,
  dot:(x,y,r,c,o=1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}" opacity="${o}"/>`,
  spark:(x,y,r=4,c='#fff6c8')=>`<path d="M${x} ${y-r}Q${x+r*.18} ${y-r*.18} ${x+r} ${y}Q${x+r*.18} ${y+r*.18} ${x} ${y+r}Q${x-r*.18} ${y+r*.18} ${x-r} ${y}Q${x-r*.18} ${y-r*.18} ${x} ${y-r}z" fill="${c}"/>`,
  rot:(a,x,y,body)=>`<g transform="rotate(${a} ${x} ${y})">${body}</g>`,
  at:(x,y,s,body)=>`<g transform="translate(${x} ${y}) scale(${s})">${body}</g>`
 };
 return {P,done:body=>{const html=`<defs>${defs.join('')}</defs>${body}`;return inline?html:liftDefs(html);}};
}
// --- Wiederkehrende Motive ---
const cube=(P,side,top,lines='')=>P.f('M9 25L32 14l23 11-23 11z',top,.35,-.05,1.5)+P.f('M9 25l23 11v21L9 46z',side,.05,-.2,1.5)+P.f('M32 36l23-11v21L32 57z',side,-.15,-.42,1.5)+lines+P.g('M14 25l18-8',2,.6);
const slab=(P,side,top)=>P.f('M6 32l26-12 26 12-26 12z',top,.35,-.05)+P.f('M6 32l26 12v7L6 39z',side,0,-.25)+P.f('M32 44l26-12v7L32 51z',side,-.2,-.45)+P.g('M12 32l18-8',2,.6);
const gem=(P,c,light)=>P.s('M19 11h26l12 16-25 30L7 27z',c)+P.f('M19 11l8 16H7z',light,.2,-.1,1.2)+P.f('M45 11l-8 16h20z',c,-.15,-.35,1.2)+P.f('M27 27h10l-5 30z',light,.1,-.2,1.2)+P.l('M7 27h50',tint(c,-.5),1.4)+P.g('M22 15l4 7',2.4,.9)+P.spark(51,9,4);
const bottle=(P,liquid,cork='#b48a58')=>P.s('M25 18h14v8q12 5 12 17 0 14-19 14T13 43q0-12 12-17z','#e9efe2')+P.s('M14 35q5 3 18 3t18-3q1 4 1 8 0 14-19 14T13 43q0-4 1-8z',liquid,1.2)+P.e(32,35.5,17.4,3,tint(liquid,.3),1)+P.dot(24,46,1.6,tint(liquid,.5),.8)+P.dot(37,50,1.2,tint(liquid,.5),.8)+P.s('M24 8h16v10H24z',cork)+P.l('M24 18h16',tint(cork,-.4),2)+P.g('M20 32q-2 6 0 12',3,.85)+P.g('M27 23v3',2,.7);
const plank=(P,top,side,y=0)=>P.f(`M6 ${30+y}l36-14 16 8-36 14z`,top,.3,-.05)+P.f(`M6 ${30+y}l16 8v7L6 ${37+y}z`,side,.1,-.3)+P.f(`M22 ${38+y}l36-14v7L22 ${45+y}z`,side,-.15,-.4)+P.l(`M13 ${30+y}l28-11M18 ${33+y}l28-11`,tint(side,-.15),1.2,.7)+P.g(`M10 ${30+y}l24-9`,2,.55);
const coil=(P,c)=>P.e(32,44,22,10,c,1.8)+P.e(32,44,13,5.6,tint(c,-.25),1.2)+P.e(32,36,20,9,c,1.8)+P.e(32,36,11,4.6,tint(c,-.3),1.2)+P.e(32,28,18,8,c,1.8)+P.e(32,28,9,3.6,tint(c,-.35),1.2)+P.l('M13 27q-3 13 5 20M50 29q4 10-2 17',tint(c,-.4),1.4,.6)+P.l('M48 33q9 6 8 16',c,5)+P.g('M20 24q8-4 18-2',2,.7);
const pebble=(P,c,spots)=>P.s('M9 40q-2-15 13-20 12-5 23 1 12 6 10 19-3 13-24 13Q11 53 9 40z',c)+(spots??'')+P.g('M17 30q7-7 17-6',3,.7);
const sheaf=(P,c,band)=>P.l('M14 46L46 16M18 50L50 20M12 40L42 12M22 52L52 26M16 44L48 14',tint(c,-.35),5.5)+P.l('M14 46L46 16M18 50L50 20M12 40L42 12M22 52L52 26M16 44L48 14',c,3.6)+P.l('M15 44L45 16M20 49L49 21',tint(c,.4),1.2,.8)+P.s('M27 25l10 10-5 5-10-10z',band,1.4);
const cloth=(P,c,stripe)=>P.f('M8 40l24-12 24 12-24 12z',c,.1,-.3)+P.f('M8 32l24-12 24 12-24 12z',tint(c,.1),.15,-.2)+P.f('M8 24l24-12 24 12-24 12z',c,.3,-.05)+P.l('M20 18l24 12M14 21l24 12',stripe,2.4,.9)+P.l('M8 32v8M56 32v8M8 24v8M56 24v8',tint(c,-.5),1.6)+P.g('M14 24l16-8',2,.6);
const box=(P,c,face)=>P.f('M10 22l22-10 22 10-22 10z',c,.35,0)+P.f('M10 22l22 10v24L10 46z',c,0,-.25)+P.f('M32 32l22-10v24L32 56z',c,-.2,-.45)+P.f('M15 28l13 6v15l-13-6z',face,.15,-.15,1.2)+P.g('M15 22l16-7',2,.6);
const ingot=(P,c)=>P.f('M14 28l22-10 18 8-22 10z',c,.45,.05)+P.f('M6 40l8-12 18 8-6 14z',c,0,-.25)+P.f('M26 50l6-14 22-10 6 12-22 12z',c,-.15,-.42)+P.g('M19 27l15-6',2.4,.85);
const backpack=(P,c,flap)=>P.l('M23 16q0-10 9-10t9 10',tint(c,-.4),4)+P.s('M13 22q19-9 38 0l3 30q-22 8-44 0z',c)+P.s('M15 22q17-8 34 0l-1 12q-16 5-32 0z',flap,1.4)+P.s('M20 40h24v10H20z',tint(c,.12),1.2)+P.dot(32,31,2.4,'#e7c46e')+P.l('M18 26v22M46 26v22',tint(c,-.3),1.4,.6)+P.g('M18 25q8-4 16-4',2.4,.7);
// --- Motive ---
const D={
 goldleaf:P=>P.s('M32 6l4 10 9-5-2 11 12-1-7 9 8 6-12 2 2 10-10-6-4 9-4-9-10 6 2-10-12-2 8-6-7-9 12 1-2-11 9 5z','#f6c93e')+P.l('M32 14v38M32 34l10-8M32 34l-10-8M32 41l12-2M32 41l-12-2','#c4901c',1.6,.8)+P.l('M32 50v10','#a37a26',2.6)+P.g('M23 19l4 6',2.6,.9)+P.spark(52,10,5)+P.spark(11,13,3.4)+P.spark(54,46,3),
 wood:P=>P.s('M7 41L39 19q7-4 11 1 4 6-2 10L16 52q-6 3-9-2-3-5 0-9z','#9a6a42')+P.s('M30 25l6-14q2-4 5-2 3 2 1 5l-5 14z','#8a5d3a',1.4)+P.e(12,46.5,6,7.6,'#e0bd83',1.5,-34)+P.l('M10 44q2-3 5 0t-1 5','#b48b55',1.2)+P.l('M21 39l20-13M24 44l19-12','#6e4a2c',1.3,.6)+P.g('M20 35l20-13',2.2,.5),
 driftwood:P=>P.s('M6 40L38 21q8-5 13 0 4 5-3 10L15 51q-6 2-9-2-3-5 0-9z','#c8b693')+P.s('M30 26q2-9 9-14 3-1 3 2-6 6-7 14z','#b9a782',1.3)+P.e(11,45,6,7,'#e5dbc0',1.4,-32)+P.l('M17 41q10-4 20-12M20 46q10-4 21-13M28 36l-4-2','#93876b',1.3,.8)+P.g('M18 36l18-11',2.2,.6),
 stone:P=>pebble(P,'#a3aca4',P.dot(40,40,1.6,'#7b857d',.7)+P.dot(26,44,1.2,'#7b857d',.7)+P.dot(45,32,1,'#7b857d',.6)),
 rarepebble:P=>pebble(P,'#a9b5b0',P.l('M18 42q12 4 26-4','#dfe7df',2,.6))+P.spark(49,15,4),
 rarestone:P=>P.s('M8 42q-1-12 12-17 12-5 24 0 12 5 10 17-4 10-23 10Q9 52 8 42z','#8c9d97')+P.s('M20 30l5-16 6 15z','#bdeedd',1.3)+P.s('M30 30l7-20 6 19z','#d1f6e8',1.3)+P.s('M40 31l5-12 4 12z','#a8e3cf',1.2)+P.g('M33 14l-2 8',2,.9)+P.g('M14 38q6-5 14-5',2.6,.55)+P.spark(52,12,4),
 moss:P=>P.s('M6 46q-2-12 10-14 0-12 13-11 6-8 16-3 12 0 13 12 9 4 4 15-25 9-56 1z','#7fa35f')+P.e(22,34,8,6,'#93b56a',1.2)+P.e(40,30,9,7,'#8aad62',1.2)+P.e(31,42,10,6,'#6f9552',1.2)+P.dot(20,32,1.4,'#c9dd94')+P.dot(42,27,1.4,'#c9dd94')+P.dot(33,40,1.3,'#c9dd94')+P.g('M15 31q4-4 9-3',2.2,.6),
 mushroom:P=>P.s('M25 34q-3 14-4 20 11 5 22 0-1-6-4-20z','#ecdcb4')+P.s('M5 34Q6 9 32 9t27 25q-27 8-54 0z','#b58699')+P.e(20,22,4,3,'#f3dcca',1)+P.e(36,16,5,3.4,'#f3dcca',1)+P.e(47,28,3,2.4,'#f3dcca',1)+P.e(29,29,3,2,'#f3dcca',1)+P.l('M27 37h10','#c9b58f',1.3,.7)+P.g('M13 23q6-9 15-11',2.6,.7),
 acorn:P=>P.s('M15 30q0 26 17 27 17-1 17-27z','#c08f56')+P.s('M9 30q1-20 23-20t23 20q-23 9-46 0z','#8c6b47')+P.l('M15 22l8 8M25 16l9 10M37 15l7 10M47 21l3 7M13 27l7-8M28 30l8-12','#6e5236',1.2,.6)+P.l('M32 10l3-8','#6c5236',3)+P.g('M21 38q0 8 5 12',2.6,.6),
 fruit:P=>P.s('M32 19C12 6 3 28 14 46q11 15 18 7 15 9 22-12 6-27-22-22z','#e59a5a')+P.s('M33 19l2-11q12-7 18 1-6 11-20 10','#7da16a',1.4)+P.l('M34 20q1-6 5-9','#5d7d4b',1.4)+P.g('M14 28q-3 9 2 15',3,.75),
 glowfruit:P=>P.dot(32,34,25,'#ffe38a',.28)+P.s('M32 19C12 6 3 28 14 46q11 15 18 7 15 9 22-12 6-27-22-22z','#f2c965')+P.s('M33 19l2-11q12-7 18 1-6 11-20 10','#8aa76c',1.4)+P.g('M14 28q-3 9 2 15',3,.85)+P.spark(51,13,4.5)+P.spark(10,12,3.4),
 palmfruit:P=>P.e(32,36,20,21,'#a97a50')+P.l('M21 21q-6 16 1 30M32 16q-4 20 2 40M44 21q5 15-2 30','#7b5535',1.4,.6)+P.e(26,22,2.4,2,'#5c3f28',1)+P.e(34,20,2.4,2,'#5c3f28',1)+P.e(31,27,2.4,2,'#5c3f28',1)+P.g('M17 32q0-8 6-13',3,.6),
 seedpod:P=>P.l('M31 56V32m0 10q-12-1-16-11','#75865b',3)+P.e(32,22,13,17,'#b89b6c')+P.l('M26 13q6 9 11 18M24 22q8-4 15-6M26 32q5-7 11-11','#8e7650',1.3,.7)+P.g('M25 12q-4 6-3 13',2.6,.7),
 worm:P=>P.l('M10 46C2 34 12 25 24 28s25-1 22-13q-4-8-13-5','#b5746f',12)+P.l('M10 46C2 34 12 25 24 28s25-1 22-13q-4-8-13-5','#eeaf9f',8)+P.l('M14 37l2 3M22 28v4M32 27v4M41 22l3 2M45 14l3-1','#c98a80',1.3)+P.e(32,10,6,5.4,'#e8a796',1.4)+P.dot(31,9,1.2,'#493f3b')+P.g('M8 40q0-6 5-9',2.4,.6),
 waldcoin:P=>P.e(32,33,23,23,'#a28654',1.8)+P.e(32,31,19,19,'#d9bd7c',1.4)+P.s('M32 16q15 9 0 28-15-19 0-28z','#7c925e',1.3)+P.l('M32 20v22M32 28l-5-4M32 34l5-5','#56683f',1.3)+P.g('M18 22q5-7 13-8',2.6,.8)+P.l('M13 44q8 8 20 8','#8a6f42',1.2,.6),
 flowers:P=>P.l('M23 56L28 32M32 56V30M41 56L36 32','#668a53',2.6)+P.e(24,26,8,7,'#e9b2cc',1.3)+P.e(40,27,8,7,'#c8b4e6',1.3)+P.e(32,19,8,7,'#f6e09a',1.3)+P.dot(24,26,2.6,'#f2cc6a')+P.dot(40,27,2.6,'#f2cc6a')+P.dot(32,19,2.6,'#e6a64a')+P.s('M22 46q10 6 20 0l-2 6q-8 3-16 0z','#c7a46e',1.2),
 sand:P=>P.s('M4 48q4-9 15-12 6-15 14-19 8 4 13 16 12 4 15 15-29 11-57 0z','#e2bd80')+P.l('M18 44q7-6 14-3M33 32q6 2 10 9','#c49a60',1.3,.7)+[[20,40],[30,46],[40,42],[27,34],[46,47],[14,47],[36,37]].map(([x,y],i)=>P.dot(x,y,1.1,i%2?'#b48b55':'#f5dcab')).join('')+P.g('M24 27q5-6 9-8',2.4,.6),
 shell:P=>P.s('M8 38C-1 17 17 5 32 10c15-5 33 7 24 28L39 52H25z','#f3d6bc')+P.l('M32 12v38M19 14l9 35M45 14l-9 35M10 26l15 23M54 26L39 49','#d39b86',1.6,.85)+P.s('M24 50h16v7H24z','#f6e2c4',1.3)+P.g('M15 20q6-7 13-8',2.6,.7),
 rareshell:P=>P.s('M8 38C-1 17 17 5 32 10c15-5 33 7 24 28L39 52H25z','#e5b6bf')+P.l('M32 12v38M19 14l9 35M45 14l-9 35','#c48795',1.6,.85)+P.s('M24 50h16v7H24z','#f3d4d6',1.3)+P.g('M15 20q6-7 13-8',2.6,.7),
 windshell:P=>P.s('M10 40C2 18 18 6 32 10c14-5 31 8 22 30L38 54H24z','#e6dccd')+P.l('M31 12v38M16 16l12 32m20-32L36 48','#a3b4ad',1.5)+P.l('M4 8q6-3 12 0M2 15q5-2 9 0','#91b4af',2.2),
 shimmershell:P=>P.s('M9 40C1 17 19 5 32 10c14-5 31 8 22 30L38 54H24z','#cdcbe6')+P.l('M31 12v38M16 16l12 32m20-32L36 48','#a7a4cf',1.5)+P.g('M16 20q6-7 13-8',2.6,.85)+P.spark(52,8,4.5,'#fff1f8'),
 nacre:P=>P.s('M10 40q-4-18 14-26 18-6 28 8 8 14-6 24-24 6-36-6z','#dfe8e3')+P.l('M18 34q10-10 26-6M20 42q12-6 24 0','#b9cfd6',1.6,.8)+P.g('M18 26q6-7 14-8',2.8,.9)+P.spark(50,12,4,'#ffffff'),
 seagrass:P=>P.s('M14 56Q0 30 20 10q-10 22 4 40z','#5f9a80',1.3)+P.s('M28 56Q16 26 38 6q-10 26 0 46z','#76ab8c',1.3)+P.s('M40 56q-3-26 15-34-8 16-6 32z','#68a184',1.3)+P.l('M17 46q-6-14 0-28M31 44q-4-18 4-32','#a9d2b4',1.2,.7),
 coral:P=>P.l('M30 56V22m0 16L14 27V13m16 18l17-9V8m-17 7l-8-7m25 17l9 7','#b86f6f',10)+P.l('M30 56V22m0 16L14 27V13m16 18l17-9V8m-17 7l-8-7m25 17l9 7','#e39c93',6.5)+P.l('M28 50V26M13 25V16M46 20V11','#ffd2c2',1.6,.8)+P.s('M18 54q12-5 26 0v4H18z','#c98a7e',1.2),
 resinlump:P=>P.s('M11 46l1-17 12-14 15 2 12 14-1 17-17 12z','#c27d2c')+P.s('M13 29l11-14 15 2 4 15-14 11-17-3z','#edb149',1.4)+P.s('M18 43l6-5 10 7-3 7-10-2z','#8e5f36',1.2)+P.g('M18 28l7-9 9 1',3,.85)+P.dot(40,39,3.2,'#f9d47b')+P.spark(48,12,3,'#fff4c2'),
 amber:P=>P.s('M14 40l2-18 16-11 16 8 3 19-15 14z','#dca25c')+P.s('M27 31q6-6 10 0-4 6-10 0z','#8a5d2f',1)+P.g('M19 23l11-7',3,.85)+P.spark(50,12,4),
 beachglass:P=>P.s('M8 40l10-18 22-6 14 12-6 20-26 6z','#86c4b7')+P.s('M20 34l10-10 12 2 2 10-12 8z','#b7e2d6',1.2)+P.g('M14 34l7-11',3,.85)+P.dot(46,26,1.6,'#e8faf2'),
 petrifiedwood:P=>P.s('M7 40L39 20q8-4 12 1 3 6-3 10L16 51q-6 3-9-2-3-5 0-9z','#9a9184')+P.e(12,45.5,6,7.4,'#c9bba3',1.4,-34)+P.l('M10 43q2-3 5 0t-1 5','#8a8070',1.2)+P.l('M20 39l20-13M24 44l19-12','#776f63',1.3,.7)+P.g('M20 35l20-13',2.2,.5),
 // Eistal
 snow:P=>P.e(32,52,24,4,'#b7c8e2',0)+P.e(20,42,11,10,'#f4f8ff')+P.e(43,42,11,10,'#eef4ff')+P.e(31,47,11,9,'#f7faff')+P.e(32,27,10,9.5,'#ffffff')+P.g('M15 37q3-4 8-4M38 37q3-4 8-4M26 22q3-4 8-4',2.4,.9)+P.spark(50,16,4,'#bdeefc'),
 frostwood:P=>P.s('M6 42L38 22q8-5 13 1 4 6-3 10L16 53q-6 3-9-2-3-5-1-9z','#77728f')+P.e(11,47,6.2,7.8,'#ecdcc6',1.5,-34)+P.l('M9 45q2-3 5 0t-1 5','#c9b393',1.2)+P.s('M14 37L40 20q6-3 9 0l-2 4L17 42q-3 0-3-5z','#f7faff',1.2)+P.l('M23 45l18-11M27 49l17-11','#58546f',1.3,.6)+P.spark(52,12,4,'#bdeefc'),
 frostflower:P=>P.l('M32 58V30','#4f8f86',3)+P.s('M31 48q-12 0-16-9 11-2 16 9z','#5fa08f',1.2)+P.s('M33 44q11-1 15-10-11-1-15 10z','#5fa08f',1.2)+[0,60,120,180,240,300].map(a=>P.rot(a,32,24,P.s('M32 24q-5-8 0-17 5 9 0 17z',a%120?'#a9e2f7':'#7fcdf0',1.2))).join('')+P.e(32,24,5,5,'#3f9fcf',1.2)+P.dot(31,23,1.6,'#ffffff')+P.spark(52,10,3.6,'#ffffff'),
 frostmoss:P=>P.e(32,51,25,4,'#b7c8e2',0)+P.s('M6 46q-2-12 10-14 0-12 13-11 6-8 16-3 12 0 13 12 9 4 4 15-25 9-56 1z','#4f8f72')+P.e(22,35,8,6,'#64a585',1.2)+P.e(41,31,9,7,'#5a9c7c',1.2)+P.e(31,43,10,6,'#3f7d64',1.2)+[[18,32],[25,38],[40,27],[46,35],[31,41],[14,43]].map(([x,y])=>P.spark(x,y,2.4,'#f4fbff')).join(''),
 ice:P=>P.s('M8 40l9-20 20-8 18 12-2 20-22 9z','#86c3df')+P.f('M17 20l20-8 18 12-21 7z','#cdeefa',.3,0,1.3)+P.l('M34 31l-6 24M34 31l19-7','#5f9fc0',1.3,.8)+P.g('M14 34l6-12',3,.9)+P.spark(52,10,3.6,'#ffffff'),
 icecrystal:P=>P.s('M27 56l-4-34 7-14 7 14-3 34z','#a7e3ee')+P.s('M15 56l-3-22 6-8 6 10-1 20z','#8fd6e6',1.3)+P.s('M40 56l1-24 7-9 5 11-5 22z','#bdeaf3',1.3)+P.l('M30 8v48M18 26v30M48 23l-3 33','#ffffff',1.3,.7)+P.g('M26 22l2-9',2.4,.9)+P.spark(53,10,4,'#ffffff'),
 ironore:P=>P.s('M7 42q-1-14 13-20 13-6 25 0 12 6 11 19-4 12-24 12Q9 54 7 42z','#6e706d')+P.s('M17 30l6-5 6 4-3 7z','#c06e3b',1.2)+P.s('M35 26l7-3 4 6-6 4z','#b5622f',1.2)+P.s('M28 41l6-3 5 5-6 4z','#c97842',1.2)+P.dot(43,40,1.6,'#d9d2c4')+P.g('M15 34q5-7 13-9',2.6,.5),
 copperore:P=>P.s('M7 42q-1-14 13-20 13-6 25 0 12 6 11 19-4 12-24 12Q9 54 7 42z','#75685e')+P.s('M17 30l6-5 6 4-3 7z','#d98b55',1.2)+P.s('M35 26l7-3 4 6-6 4z','#e3a36b',1.2)+P.s('M28 41l6-3 5 5-6 4z','#c97842',1.2)+P.g('M15 34q5-7 13-9',2.6,.5),
 cinderpod:P=>P.e(32,36,14,20,'#4a3530')+[18,26,34,42,50].map((y,i)=>P.l(`M${20+i%2*2} ${y}q12 ${5-i} 24 0`,'#ff8a3c',3)).join('')+P.dot(26,30,2,'#ffc25c')+P.dot(38,44,2,'#ffc25c'),
 pinecone:P=>P.e(32,36,14,20,'#8a5c38')+[18,26,34,42,50].map((y,i)=>P.l(`M${20+i%2*2} ${y}q12 ${5-i} 24 0`,'#c58d58',3)).join('')+P.l('M32 6v10','#5f4630',3.4)+P.g('M23 26q-2 8 1 16',2.4,.5),
 icebell:P=>P.s('M32 9q-14 4-14 22v11l-6 6h40l-6-6V31q0-18-14-22z','#cfeef4')+P.e(32,52,5,5,'#7fb8c8',1.3)+P.l('M32 3v7','#c8a96c',3.6)+P.g('M24 21q3-7 8-8',3,.95)+P.spark(52,14,3.6,'#ffffff'),
 starcone:P=>P.s('M32 6l7 19 20 3-15 12 5 19-17-11-17 11 5-19L5 28l20-3z','#e3bf6c')+P.s('M32 17l3 11 10 2-8 6 3 10-8-6-8 6 3-10-8-6 10-2z','#fff0b5',1.2)+P.spark(54,8,4),
 smokedfish:P=>P.s('M8 34Q22 16 44 26l12-8v28l-12-8Q22 50 8 34z','#b5763e')+P.g('M18 30q10 4 20 0',2.4,.6)+P.s('M16 29a2 2 0 1 0 .1 0z','#2a1e14',1),
 fishsoup:P=>P.s('M8 28h48q0 24-24 24T8 28z','#c9a26a')+P.s('M12 28h40q-20 8-40 0z','#f2d58a',1.2)+P.g('M24 18q-3-5 0-9M36 18q-3-5 0-9',2.4,.7),
 glitterbait:P=>P.s('M16 50Q6 34 22 26t26-10q6 8-2 16T26 40q-4 6-10 10z','#e88fb0')+P.spark(46,14,5)+P.spark(16,22,3),
 starshard:P=>P.s('m32 6 8 18 18 4-13 13 3 18-16-9-16 9 3-18L6 28l18-4z','#ffe68a',1.2)+P.spark(52,10,4),
 luckycap:P=>P.s('M10 34a22 20 0 0 1 44 0z','#e8667a')+P.s('M24 34h16v18H24z','#fbf0d8',1.1)+P.g('M20 24h.1M32 18h.1M44 26h.1',5,.9),
 frostcone:P=>P.s('M19 8h26L32 59z','#b7dce8')+P.s('M24 11h16L32 44z','#e8f7fb',1.2)+P.s('M16 6h32v5H16z','#f7fdff',1.3)+P.g('M25 15l4 16',2.4,.8),
 iceheart:P=>P.s('M32 56L9 30q-6-14 8-19 10-3 15 7 5-10 15-7 14 5 8 19z','#7fc6de')+P.l('M32 22v22M24 30l8 6 8-6','#b9e6f2',1.4,.8)+P.g('M16 20q4-5 9-1',3,.9)+P.spark(52,10,3.6,'#ffffff'),
 frostrelic:P=>P.e(32,37,22,17,'#8a93a3')+P.e(32,34,18,13,'#a8b2c1',1.4)+P.l('M32 23v22M22 34h20M25 27l14 14M39 27L25 41','#8fd2e6',2.2)+P.e(32,34,4,4,'#d7f3fb',1.2)+P.g('M17 30q4-7 11-8',2.4,.7),
 frozenseed:P=>P.e(32,34,15,19,'#b9e3ee')+P.e(32,36,7,10,'#7a9a6a',1.2)+P.g('M23 25q2-6 6-8',2.6,.9)+P.spark(50,12,3.6,'#ffffff'),
 frozenpearl:P=>P.e(32,36,17,17,'#e8f4fb')+P.g('M22 28q4-6 10-6',3,.95)+P.spark(51,12,4,'#ffffff'),
 blueicestone:P=>gem(P,'#6fb6d8','#d6f1fb'),paintedstone:P=>pebble(P,'#b5ada2',P.e(24,34,2.5,2,'#8d857a',1)+P.e(38,40,3,2,'#8d857a',1)+P.e(30,44,2,1.6,'#8d857a',1)),cactusfruit:P=>P.s('M32 16C16 14 12 34 18 46q8 11 14 8 6 3 14-8 6-12 0-30z','#c9402e')+P.s('M26 16l6-9 6 9z','#7fa35f',1.2)+P.dot(25,32,1.4,'#f7c6d3')+P.dot(38,38,1.4,'#f7c6d3')+P.g('M20 28q0-6 4-9',2.6,.7),
 desertflower:P=>P.l('M32 58V32','#7fa35f',3)+[0,72,144,216,288].map(a=>P.rot(a,32,26,P.s('M32 26q-6-9 0-18 6 9 0 18z','#f0a05a',1.2))).join('')+P.e(32,26,5,5,'#f7d36b',1.2),sunshard:P=>gem(P,'#c8421f','#ff9d4f'),fossilshell:P=>P.e(32,34,20,20,'#8f8679')+P.l('M32 34m-4 0a4 4 0 1 1 8 0a9 9 0 1 1-17 0a13 13 0 1 1 26 0','#988a6c',2),suncapsule:P=>P.e(32,36,14,19,'#e9b45a')+P.s('M26 12h12v6H26z','#b48a58',1.2)+P.g('M24 27q1-6 5-9',2.6,.8),
 // Produkte
 board:P=>plank(P,'#e4bd81','#b98e57',8)+plank(P,'#ebc98f','#c19660',-2),
 frostboard:P=>plank(P,'#dbe4f0','#8f8eaa',8)+plank(P,'#e8eff8','#9b9ab5',-2)+P.l('M14 26q10-6 22-8','#ffffff',3,.8),
 woodpanel:P=>slab(P,'#be9365','#e5c491')+P.l('M14 32l18-8M20 35l18-8M26 38l18-8','#c5a579',1.4,.8),
 reinforcedpanel:P=>slab(P,'#ae8251','#e2c092')+P.l('M14 28l26 12M24 23l26 12','#8b9e99',3.4)+P.dot(18,29,1.6,'#eef0e4')+P.dot(46,37,1.6,'#eef0e4'),
 composite:P=>slab(P,'#6f8c66','#8fae84')+P.l('M14 32l18-8M20 35l18-8M26 38l18-8','#dfcc94',2.4,.9),
 beam:P=>P.f('M6 25L46 7l13 9-40 19z','#d9ad6c',.32,-.02)+P.f('M19 35l40-19v17L19 53z','#a6743f',.08,-.3)+P.f('M6 25l13 10v18L6 43z','#e9c88f',.15,-.1)+P.e(12.6,39,4.6,6.6,'#f0d6a4',1.1)+P.e(12.6,39,2.5,3.8,'#d9b47a',.8)+P.dot(12.6,39,1,'#a87f49')+P.l('M25 39l29-14M25 45l30-14M27 50l20-9','#7f5a30',1.3,.75)+P.l('M15 27l26-12M22 29l26-12','#b98a50',1,.7)+P.g('M12 25l28-13',2.4,.65),
 flowerstone:P=>P.s('M16 40l-4-14 12-14 18-2 12 14-2 16-14 10-14-2z','#b79ce0')+P.s('M32 22q6-8 8 2 8-2 3 6 6 4-3 6-1 8-7 2-7 5-7-3-8-2-2-7 7-3-1-7z','#efd6ff',1.2)+P.e(32,31,3.4,3.4,'#ffd978',1)+P.g('M20 22l8-8',2.6,.8)+P.spark(52,12,3.6)+P.spark(12,46,2.6),
 flowerwood:P=>P.s('M14 26h36l-4 30q-14 5-28 0z','#c79a5e')+P.e(32,26,18,6,'#8a6236',1.4)+P.e(32,26,14,4.2,'#f0c04c',1)+P.s('M22 26q2 12 6 12t4-12z','#f0c04c',.9)+P.l('M44 8L34 26','#8a6543',4)+P.e(45,7,4,5,'#f0c04c',1,35)+[0,72,144,216,288].map(a=>P.rot(a,27,47,P.e(27,43.8,2,2.7,'#f2a7c3',.6))).join('')+P.dot(27,47,1.4,'#fff3c8')+P.g('M18 31q0 10 2 18',2.4,.55),
 paper:P=>P.f('M14 16l32-5 7 39-33 6z','#e3d3a6',.1,-.2)+P.f('M10 12l33-5 7 39-33 6z','#fff6da',.3,-.05)+P.l('M17 20l20-3M18 28l20-3M19 36l18-3','#cbb98d',1.6)+P.g('M15 14l7-1',2,.6),
 briquette:P=>cube(P,'#7f532f','#b07c46',P.l('M14 30l16 8M14 36l16 8M14 42l16 8','#5f3d22',1.2,.7)+P.l('M15 25l17-8M22 28l17-8','#d3a66a',1.3,.8)),
 rope:P=>coil(P,'#c39a5f'),wire:P=>coil(P,'#c07f55'),
 stoneblock:P=>cube(P,'#8f9d95','#cbd1c3',P.dot(20,40,1.4,'#6f7d76')+P.dot(43,41,1.2,'#6f7d76')),stonebrick:P=>cube(P,'#9caba2','#c9d2c1',P.l('M9 36l23 11 23-11M20 30v12M44 30v12M32 47v10','#6f857c',1.4,.8)),sandstone:P=>cube(P,'#c8ad77','#efd8a4',P.l('M12 33l20 10M34 41l18-9','#ae9361',1.2,.6)),snowblock:P=>cube(P,'#bcd5ea','#ffffff',P.l('M12 32l20 9','#ffffff',1.6,.8)),
 stoneslab:P=>slab(P,'#7d918b','#c2ccbd'),sandtile:P=>slab(P,'#b89a6d','#ecce98')+P.l('M18 27l26 12M18 37l26-12','#c9a874',1.3,.8),
 iceplate:P=>slab(P,'#6fb0cf','#d4f0fb')+P.l('M20 30l10 3 8-6','#ffffff',1.6,.9)+P.spark(52,14,3.4,'#ffffff'),
 clay:P=>P.s('M8 44q-3-14 10-20 8-10 20-5 14 2 17 15 2 13-11 18-22 6-36-8z','#3f3534')+P.e(22,36,3.4,2.6,'#ff8a2a',1)+P.e(38,30,2.6,2,'#ffb24d',1)+P.e(42,44,3,2.2,'#ff8a2a',1)+P.e(28,46,2,1.5,'#231c1c',1)+P.e(32,26,2,1.5,'#231c1c',1)+P.g('M16 32q4-6 10-8',2.4,.4),
 coloredearth:P=>gem(P,'#ecc92f','#fff6a6'),
 ceramic:P=>P.s('M22 8h20l-1 9q15 12 10 29-4 10-19 10T13 46Q8 29 23 17z','#c9937c')+P.l('M15 32h34M14 40h36','#f0c4a0',3)+P.e(32,9,11,3.4,'#876e5b',1.3)+P.g('M19 24q-3 8-1 14',2.8,.7),
 colorceramic:P=>P.s('M22 8h20l-1 9q15 12 10 29-4 10-19 10T13 46Q8 29 23 17z','#b97572')+P.l('M15 32h34','#efb3a0',3)+P.l('M17 40q15 6 30 0','#7fa3a6',3)+P.e(32,9,11,3.4,'#8f5a57',1.3)+P.g('M19 24q-3 8-1 14',2.8,.7),
 glassblank:P=>P.s('M11 18l31-10 12 37-31 10z','#b4d8cf')+P.g('M17 22l18-6M20 32l7-2',3,.9)+P.l('M23 54l31-10','#7fa79c',1.4,.6),
 lens:P=>P.e(32,30,21,21,'#b49362',1.8)+P.e(32,30,16,16,'#bfe3df',1.3)+P.g('M22 24q4-6 10-7',3.4,.95)+P.l('M47 45l9 11','#8a6d45',5),
 polishedglass:P=>gem(P,'#93cfc3','#f2fff0'),desertglass:P=>gem(P,'#3b3540','#a99fc0'),crystal:P=>gem(P,'#80bdc4','#d2f0e4'),desertcrystal:P=>gem(P,'#e0603a','#ffd29a'),
 ironbar:P=>ingot(P,'#8c9b9e'),copperbar:P=>ingot(P,'#c07b4e'),
 gear:P=>P.s('M27 5h10l2 7 7 3 6-4 7 8-4 6 3 7 7 2v10l-7 2-3 7 4 6-7 8-6-4-7 3-2 7H27l-2-7-7-3-6 4-7-8 4-6-3-7-7-2V27l7-2 3-7-4-6 7-8 6 4 7-3z','#c49c62')+P.e(32,32,10,10,'#e3c992',1.3)+P.e(32,32,4,4,'#607e78',1.2)+P.g('M18 18q5-5 11-6',2.6,.7),
 mechanical:P=>P.s('M22 9h10l2 6 6 3 5-3 6 7-3 5 2 6 6 2v9l-6 2-2 6 3 5-6 7-5-3-6 3-2 6H22l-2-6-6-3-5 3-6-7 3-5-2-6-6-2v-9l6-2 2-6-3-5 6-7 5 3 6-3z','#bc9a61')+P.e(27,32,8,8,'#7e9691',1.3)+P.s('M42 40l14-14 4 4-14 14z','#8fa5a0',1.3)+P.e(27,32,3,3,'#e8d8ae',1)+P.g('M14 20q4-5 9-6',2.4,.7),
 filtermodule:P=>box(P,'#718e82','#e2dfbd')+P.l('M18 31v13M22 33v13M26 35v13','#92a397',1.3)+P.l('M37 34l13-6M37 40l13-6M37 46l13-6','#5b7468',1.4,.8),
 coolingmodule:P=>box(P,'#8fb8bd','#dff0ee')+P.l('M14 20l20 9M18 17l20 9M22 15l20 9','#ffffff',2.2,.9)+P.l('M17 32l8 4M17 38l8 4','#7fb0b8',1.6),
 optical:P=>box(P,'#a8936c','#d7c49a')+P.e(21.5,41,5.6,6.4,'#79b0b5',1.3)+P.g('M19 38l2-2',2,.95)+P.l('M37 36l13-6','#8a7550',1.6,.8),
 energycore:P=>P.s('M19 10h26l12 22-12 22H19L7 32z','#a4b1a0')+P.s('M24 18h16l8 14-8 14H24l-8-14z','#e8cd78',1.3)+P.l('M35 20l-9 14h10l-6 12','#fff6c2',3.4)+P.g('M15 26l6-11',2.4,.6)+P.spark(54,10,3.6),
 essence:P=>bottle(P,'#d99ac5')+P.dot(32,48,3,'#f6d893',.9),resin:P=>bottle(P,'#d8a45c'),extract:P=>bottle(P,'#b887ab'),frostessence:P=>bottle(P,'#78d0e6','#9fb6c8')+P.spark(52,12,3.4,'#ffffff'),
 fibre:P=>sheaf(P,'#cdc48c','#86946b'),warmfibre:P=>sheaf(P,'#a7cbbf','#5f8f86'),cactusfibre:P=>sheaf(P,'#e0a860','#a8682f'),
 fabric:P=>cloth(P,'#82ac99','#efe1b6'),desertfabric:P=>cloth(P,'#d6a06a','#f6e3b8'),
 shelllime:P=>P.s('M7 42l7-15 15-5 12 8 14 1 5 15-18 12-23-3z','#d8d0b2')+P.s('M15 28l14-5 12 8-15 11-13-6z','#fff3d5',1.3)+P.s('M24 29q-5-9 3-11 7 0 7 8-3 6-10 3z','#f3dcb9',1.2)+P.l('M26 21l1 8M30 20l-1 9','#c6ae87',1.2)+P.dot(30,49,1.8,'#a49d86'),
 driftbead:P=>P.e(32,33,19,22,'#ae9370')+P.e(32,33,11,15,'#dbc49b',1.3)+P.e(32,33,4.4,6,'#685945',1.2)+P.l('M19 22q10-7 25-4M17 42q12 8 28-1','#8f7856',1.3,.7)+P.g('M20 26q2-6 7-8',2.6,.6),
 root:P=>P.l('M32 6v26l-13 17m13-17l15 18m-15-7v14M32 21l-14-8','#8a6440',9)+P.l('M32 6v26l-13 17m13-17l15 18m-15-7v14M32 21l-14-8','#c29468',5.5)+P.l('M31 9v20','#efcd9a',1.6,.8),
 relic:P=>P.s('M11 25l21-14 21 14v22L32 58 11 47z','#b9a373')+P.f('M11 25l21-14 21 14-21 12z','#d7c493',.3,0,1.3)+P.l('M24 30v14l8-6 8 6V30','#f0dca7',3)+P.g('M17 25l14-9',2.4,.7),
 backpack1:P=>backpack(P,'#8ca86f','#6f8c57'),backpack2:P=>backpack(P,'#b38654','#8f6a40'),backpack3:P=>backpack(P,'#6f9aa6','#567e8a'),backpack4:P=>backpack(P,'#b66f5d','#8f5447'),backpack5:P=>backpack(P,'#c7a24f','#9d7d36'),
 // Bedienelemente
 bag:P=>backpack(P,'#89a88a','#6f8f72'),
 storage:P=>P.s('M7 26L31 8l25 18v30H7z','#b58d60')+P.s('M2 26L31 4l30 22-4 3L31 10 6 29z','#789e85',1.4)+P.l('M13 33h36M13 41h36M13 49h36','#e6c592',3),
 home:P=>P.s('M9 28L32 10l23 18v28H9z','#e3c896')+P.s('M3 28Q32-6 61 28l-4 2Q32 4 7 30z','#6e987b',1.4)+P.s('M26 56V37h12v19','#ac875c',1.3)+P.s('M13 34h9v9h-9zM42 34h9v9h-9z','#fff0be',1.2),
 press:P=>P.s('M10 10h44v10H10z','#769487')+P.s('M15 20h7v35h-7zM42 20h7v35h-7z','#769487',1.3)+P.s('M26 20h12v15H26z','#c5ac75',1.3)+P.s('M20 35h24v9H20z','#d8bf86',1.3)+P.s('M8 54h48v6H8z','#a88f5c',1.3)
};
// Neugestaltung 29.10.: Schmiede, neue Zwischenprodukte und Handelsware.
Object.assign(D,{
 charcoal:P=>P.s('M8 46l6-14 14-5 9 9-4 14-18 3z','#3a3434')+P.s('M30 40l8-15 15-2 7 11-6 13-16 2z','#2f2a2a')+P.s('M20 52l10-8 12 4-2 9-14 2z','#433c3b',1.2)+P.dot(22,40,1.8,'#f08a3c')+P.dot(46,32,1.6,'#ffb85c')+P.dot(34,50,1.4,'#f08a3c')+P.g('M14 34l6-3M36 26l7-2',2,.35),
 ironfitting:P=>P.s('M10 16h14v30h28v12H10z','#6f777c')+P.dot(17,24,2.4,'#c9cfd2')+P.dot(17,38,2.4,'#c9cfd2')+P.dot(32,52,2.4,'#c9cfd2')+P.dot(46,52,2.4,'#c9cfd2')+P.g('M13 19v24',2.2,.6),
 springsteel:P=>P.l('M20 12q24 0 24 6t-24 6 24 6-24 6 24 6-24 6 24 6-24 6','#5f6c78',6)+P.l('M20 12q24 0 24 6t-24 6 24 6-24 6 24 6-24 6 24 6-24 6','#a9b7c2',3)+P.l('M18 12h6M18 54h6','#4c5762',4)+P.g('M24 16q12 1 16 2',1.8,.8),
 frostglass:P=>P.s('M12 14l30-6 10 40-30 8z','#a9dcef')+P.l('M22 22l6 6M28 18l-2 10M34 30l8-4M24 40l6-2 2 6','#ffffff',1.6,.9)+P.g('M18 18l8-2',3,.9)+P.spark(52,10,3.6,'#ffffff'),
 frostbeam:P=>P.f('M5 26L42 9l17 12-37 18z','#e7eef8',.3,-.05)+P.f('M5 26l17 13v18L5 44z','#b7b6cc',.1,-.15)+P.f('M22 39l37-18v18L22 57z','#8f8eaa',0,-.35)+P.s('M30 37l6-3v19l-6 3z','#6f777c',1)+P.l('M12 24l24-11','#ffffff',3,.9),
 driftboard:P=>plank(P,'#ddd2b8','#b3a688',8)+plank(P,'#e6dcc4','#bdb193',-2),
 icequader:P=>cube(P,'#a9cfe3','#f2f8fd',P.l('M14 32l14 7M36 44l14-7','#ffffff',1.6,.8)+P.l('M20 36l4 10','#86b6cf',1.2,.7)),
 mosaictile:P=>slab(P,'#b89a6d','#ecce98')+[[22,28,'#7fc4b6'],[30,24,'#e8a3a3'],[38,28,'#9bb7e0'],[30,32,'#f0d27a'],[22,36,'#e8a3a3'],[38,36,'#7fc4b6'],[46,32,'#f0d27a']].map(([x,y,c])=>P.s(`M${x} ${y-3}l4 3-4 3-4-3z`,c,.8)).join(''),
 upholstery:P=>cloth(P,'#6fa79a','#f1e4c0')+P.dot(22,22,1.6,'#e8d6a8')+P.dot(32,18,1.6,'#e8d6a8')+P.dot(42,22,1.6,'#e8d6a8')+P.dot(32,26,1.6,'#e8d6a8'),
 clockwork:P=>D.gear(P)+P.e(32,32,9,9,'#f4ecd4',1.2)+P.l('M32 32v-6M32 32l4 3','#5a4a33',1.8)+P.dot(32,32,1.4,'#5a4a33'),
 pump:P=>box(P,'#7f9c9a','#cfe6e4')+P.l('M44 30h10v-16','#8a949a',5)+P.l('M44 30h10v-16','#c9d0d4',2)+P.e(54,12,5,3,'#6f777c',1.2)+P.e(21,41,5,5,'#c49b6c',1.2)+P.dot(21,41,1.6,'#6f5536'),
 crystalball:P=>P.s('M20 50h24l4 8H16z','#8a6a4a')+P.s('M24 46h16v5H24z','#a8845c',1.2)+P.e(32,28,17,17,'#b9e3f2')+P.e(30,30,8,8,'#d9f3fb',.8)+P.g('M22 20q4-6 10-6',3.4,.95)+P.spark(52,10,4,'#ffffff')+P.spark(13,14,2.6,'#ffffff'),
 frostcasket:P=>P.f('M10 30h44v24H10z','#9b9ab5',.15,-.3)+P.s('M8 22q24-12 48 0v10H8z','#c9c8dc')+P.l('M8 30h48','#6f777c',3)+P.s('M28 32h8v10h-8z','#e0c07a',1.2)+P.e(32,24,4,3,'#dca25c',1)+P.l('M14 26q8-6 14-6','#ffffff',2,.8),
 shellbox:P=>P.f('M10 32h44v22H10z','#c49a62',.15,-.3)+P.s('M8 24q24-10 48 0v10H8z','#e3bf84')+P.at(18,6,.44,D.shell(P))+P.s('M29 34h6v8h-6z','#e8d6a8',1)+P.g('M14 28q6-4 12-4',2,.6),
 icesculpture:P=>P.s('M12 48h40v10H12z','#e9f2fb')+P.s('M24 46q-6-14 4-24 6-6 2-14 12 6 8 18-2 8 8 20z','#a9dcef')+P.s('M30 22q8-2 12 4-6 2-12-4z','#d4f0fb',1)+P.l('M28 30q2 8 6 12','#ffffff',1.6,.8)+P.spark(50,12,3.6,'#ffffff'),
 wintertea:P=>P.l('M24 14q-3-5 0-9M32 13q-3-5 0-9M40 14q-3-5 0-9','#d9e2ea',2.4,.8)+P.s('M14 24h36v14q0 14-18 14T14 38z','#f2ece0')+P.e(32,24,18,4,'#c78a5a',1.2)+P.l('M50 28q8 0 8 6t-8 6','#d8d0c0',4)+P.at(22,30,.3,D.frostflower(P))+P.e(32,56,22,3,'#d8cdb6',1),
 scentcandle:P=>P.dot(32,16,8,'#ffd27a',.35)+P.s('M32 6q6 8 0 14-6-6 0-14z','#f3a54a',1)+P.s('M32 10q3 4 0 8-3-4 0-8z','#ffe9a0',.8)+P.s('M20 24h24v30q-12 5-24 0z','#e9d7ef')+P.e(32,24,12,3,'#f6ecf8',1)+P.l('M32 20v4','#5a4a33',1.6)+P.l('M22 36h20M22 44h20','#c7a8d2',2,.8)+P.g('M24 30v16',2.4,.6)
});
// Jakob 1.11.: späte Saugerbauteile.
Object.assign(D,{
 prismlens:P=>P.l('M3 40L20 32','#fff6d8',3,.9)+P.l('M44 30L61 20','#e8665c',2.6)+P.l('M45 34L61 30','#f0c04c',2.6)+P.l('M46 38L61 40','#68bb7c',2.6)+P.l('M46 42L61 50','#6f8fe0',2.6)+P.s('M32 8L54 52H10z','#c4e8f6')+P.f('M32 8l6 44H10z','#e4f6fc',.25,-.05,1.1)+P.l('M32 8l6 44','#ffffff',1.4,.8)+P.g('M28 19l-8 19',2.6,.9)+P.spark(50,12,3.6,'#ffffff'),
 findercrystal:P=>P.e(32,47,22,8,'#8a6a4a',1.4)+P.e(32,45,16,5,'#d8bf86',1.1)+P.at(14,2,.56,gem(P,'#62cdb8','#c6f4e6'))+P.l('M18 45h28M32 41v8','#7a5b39',1.3,.8)+P.spark(52,16,3.6,'#ffffff'),
 windrotor:P=>[0,90,180,270].map(a=>P.rot(a,32,32,P.s('M32 30C26 20 27 10 36 5c8 6 7 17 0 25z','#e4edf6',1.3)+P.l('M33 27q0-10 2-18','#9eb4c8',1.2,.8))).join('')+P.e(32,32,8,8,'#c49c62',1.3)+P.e(32,32,3,3,'#607e78',1)+P.g('M27 28q2-2 5-3',1.8,.8),
 frostloop:P=>coil(P,'#8fd0e4')+P.l('M14 42q-8 0-8-9t10-11','#7f9c9a',4.4)+P.l('M14 42q-8 0-8-9t10-11','#cfe6e4',1.8)+P.spark(32,13,5,'#ffffff')+P.spark(52,17,3,'#ffffff'),
 embercoil:P=>coil(P,'#c7743c')+P.e(32,27,6,3,'#ffb04c',.9)+P.dot(32,27,1.6,'#fff0a8')+P.spark(14,17,3.6,'#ffc25c')+P.spark(49,13,2.6,'#ff8c42'),
 obsidianlens:P=>P.e(32,32,25,25,'#a8895c',1.5)+P.e(32,32,20,20,'#2a2733',1.4)+P.s('M21 25q10-11 24-5-13 2-19 14z','#6c6683',.8)+P.e(40,41,5,3,'#e8552c',.6,-35)+P.g('M19 21q5-6 12-7',2.8,.9)+P.spark(52,11,3.6,'#ffd9a0'),
 vortexchamber:P=>P.f('M12 18h40v34q-20 9-40 0z','#6f7a86',.15,-.35)+P.e(32,18,20,8,'#b9c6d2',1.5)+P.e(32,18,15,5.6,'#2f3946',1.1)+P.l('M23 18q9-5 16-1t-6 4-6-2 7-2','#8fe0e8',1.7)+P.l('M12 30q20 8 40 0M12 42q20 8 40 0','#4c5762',2)+[18,32,46].map(x=>P.dot(x,x===32?38:36,1.8,'#d9e1e8')).join('')+P.g('M16 24v22',2.4,.5),
 stormcore:P=>P.dot(32,32,27,'#8fa5ff',.22)+P.e(32,32,20,20,'#5d6fd2')+P.l('M18 28q8-11 20-6t6 14-14 8-9-9 8-7 5 5','#c4d4ff',2.2,.85)+P.s('M35 8L21 35h10l-5 21 18-30H33z','#ffe27a',1.2)+P.g('M18 20q5-6 11-7',2.4,.7)+P.spark(53,12,4,'#ffffff')+P.spark(11,50,3,'#ffffff')
});
// Blumen nach flower-config (gleiche Farben wie in der Welt).
const flower=(P,f,kind)=>{if(kind==='bluebell')return P.l('M28 58V12q15-5 18 8M28 24q-14-3-16 8M28 38q14-3 17 7','#5e7d4b',3.4)+P.s('M40 18q13-6 14 12H38z',f.color,1.3)+P.s('M6 30q11-7 15 10H3z',f.color,1.3)+P.s('M38 43q12-7 16 11H35z',f.color,1.3)+P.g('M43 20q3-2 5-1',1.8,.8);
 if(kind==='clover')return P.l('M32 58V30','#5e7d4b',3.4)+P.s('M32 50q-14-2-16-12 12-1 16 12z','#79a561',1.2)+[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>{const a=i*2.399,r=3+i%4*2;return P.e(32+Math.sin(a)*r,22+Math.cos(a)*r*.8,4.2,4.6,i%3?f.color:'#f0cbd8',1);}).join('');
 return P.l('M32 58V24','#5e7d4b',3.4)+P.s('M31 46q-14 2-17-9 12-2 17 9z','#7a9a58',1.2)+P.s('M33 41q13 0 16-10-12-2-16 10z','#7a9a58',1.2)+Array.from({length:f.petals},(_,i)=>P.rot(i*360/f.petals,32,22,P.s(kind==='dandelion'?'M32 22q-3-8 0-15 3 7 0 15z':'M32 22q-6-7 0-15 6 8 0 15z',f.color,1.1))).join('')+P.e(32,22,5,5,f.center,1.1)+P.g('M29 19q2-2 4-2',1.6,.8);};
for(const [kind,f] of Object.entries(FLOWERS))D[kind]=P=>flower(P,f,kind);
D.commonflower=P=>P.at(-6,8,.72,D.daisy(P))+P.at(22,10,.72,D.dandelion(P))+P.at(8,16,.72,D.clover(P));
D.rareflower=P=>P.at(-4,8,.78,D.bluebell(P))+P.at(18,10,.72,D.orchid(P))+P.spark(54,8,3.6);
D.desertsand=P=>P.s('M32 10l10 6 11 2 3 12 4 8-6 9-4 9-11 1-8 4-10-5-11-1-3-11-5-8 5-9 2-11 11-2z','#2a2524')+P.e(32,32,12,10,'#3d3634',.8)+P.l('M15 24q5 2 8 5M46 44q-4-1-7-4','#a8532a',2.2,.8)+P.g('M24 19q4-2 8-2',2,.35);D.pebble=D.stone;
export const PAINTED_IDS=Object.freeze(Object.keys(D).filter(k=>D[k]&&k!=='pebble'));
export function paintedIcon(id){const draw=D[id];if(!draw)return null;const {P,done}=painter(id);return done(draw(P));}
// Jakob 3.11.: Herdgerichte, Blob-Snacks und Blob-Köder.
const plate=P=>P.e(32,44,26,10,'#f4ecd8')+P.e(32,42,20,7,'#e6dcc4',.8);
D.mushroompan=P=>P.e(30,42,24,11,'#3a3a3e')+P.l('M52 40l10-4','#6a4a2a',4)+P.e(30,40,19,7,'#8a5a32',.8)+[[22,38],[32,36],[38,42],[26,43]].map(([x,y])=>P.e(x,y,5,3.4,'#d9b38a',.9)+P.e(x,y+2,1.6,2,'#f3e4cc',.6)).join('')+P.g('M18 36q6-3 12-3',1.8,.6);
D.grilledfish=P=>plate(P)+P.s('M14 38q14-12 30-4l8-6v18l-8-6q-16 8-30-2z','#c98a4a')+P.l('M24 34l4 8M32 32l4 9M40 33l3 7','#7a4a24',2)+P.dot(19,37,1.6,'#2a2020')+P.e(48,46,4,2,'#f2d34a',.6);
D.fishstew=P=>P.s('M10 30h44q-2 22-22 22T10 30z','#b5643c')+P.e(32,30,22,6,'#e0a35a')+P.e(26,29,5,2.4,'#f3e4cc',.7)+P.e(38,31,4,2,'#7aa45c',.7)+P.e(33,28,3,1.6,'#d9b38a',.7)+P.l('M24 18q-3-5 1-9M34 18q-3-5 1-9','#ffffff',2,.6);
D.blobcookie=P=>P.e(32,34,22,20,'#e8b46a')+P.e(32,34,17,15,'#f0c983',.8)+P.dot(25,30,2.6,'#3a2c28')+P.dot(39,30,2.6,'#3a2c28')+P.l('M26 40q6 5 12 0','#3a2c28',2)+[[20,22],[44,44],[22,46],[46,24]].map(([x,y])=>P.dot(x,y,2.2,'#f09ab8')).join('');
D.fishbite=P=>plate(P)+[[22,38],[34,36],[44,40]].map(([x,y])=>P.s(`M${x-7} ${y}q7-6 12-1l3-3v8l-3-3q-5 5-12-1z`,'#8fbcd4',.9)).join('')+P.e(30,44,8,3,'#7aa45c',.7);
D.blobbait=P=>P.e(32,40,20,16,'#8a5a3a')+P.e(32,36,16,12,'#c98a4a',.8)+P.e(26,32,5,5,'#f0b84a')+P.e(38,34,4,4,'#d9a8e8')+P.e(32,40,3,3,'#f6d36a')+P.spark(48,14,4)+P.spark(16,18,3)+P.g('M22 28q6-3 12-2',1.8,.6);

// Steinsockel: Steinblock auf Holzbrettern.
D.stonesocket=P=>P.s('M8 46h48v8H8z','#b48759')+P.l('M8 50h48','#8a6543',1.2)+P.s('M14 22l6-8h24l6 8v24H14z','#8d9a92')+P.s('M14 22h36v6H14z','#aab5ad',.9)+P.l('M24 32v12M38 30v14M14 37h36','#6f7b74',1.4,.8)+P.g('M18 20l6-5',2,.6);
// Jakob 4.11.: schönere Zahnrad- und Bauteilbilder. Zahnkranz rechnerisch, mit runden Zahnköpfen, Speichenlöchern und Nabe.
const gearPath=(cx,cy,ro,ri,teeth)=>{let d='';for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2,w=Math.PI/teeth,pts=[[a-w*.62,ri],[a-w*.38,ro],[a+w*.38,ro],[a+w*.62,ri]];for(const [k,[b,r]]of pts.entries()){const x=(cx+Math.cos(b)*r).toFixed(1),y=(cy+Math.sin(b)*r).toFixed(1);d+=(i===0&&k===0?'M':'L')+x+' '+y;}}return d+'z';};
const holes=(cx,cy,r,n,hr,c)=>Array.from({length:n},(_,i)=>{const a=i/n*Math.PI*2+.4;return `<circle cx="${(cx+Math.cos(a)*r).toFixed(1)}" cy="${(cy+Math.sin(a)*r).toFixed(1)}" r="${hr}" fill="${c}" stroke="${tint(c,-.4)}" stroke-width="1"/>`;}).join('');
D.gear=P=>P.s(gearPath(32,32,26,20.5,12),'#d6a948',1.6)+P.e(32,32,17.5,17.5,'#e8c36a',1.1)+holes(32,32,11,4,3.6,'#8a6a2e')+P.e(32,32,6.5,6.5,'#b48a3a',1.3)+P.e(32,32,2.6,2.6,'#5d4520',.8)+P.g('M17 20q6-8 15-9',2.8,.8)+P.spark(49,13,3.4);
D.mechanical=P=>P.f('M8 22l26-10 22 9v20L30 52 8 42z','#9fb0ad',.25,-.3,1.5)+P.l('M8 22l22 9 26-10M30 31v21',tint('#9fb0ad',-.45),1.4,.8)+[[15,30],[22,36],[41,26]].map(([x,y])=>P.dot(x,y,2.3,'#5f6f6c')+P.dot(x-.6,y-.6,1,'#e3ece9')).join('')+P.at(30,6,.62,P.s(gearPath(32,32,24,19,10),'#d6a948',1.8)+P.e(32,32,9,9,'#e8c36a',1.4)+P.e(32,32,3.5,3.5,'#5d4520',1))+P.l('M10 50q4-6 8 0t8 0 8 0','#c46a3a',2.6)+P.g('M14 23l14-6',2.2,.7);

D.normalbag1=D.backpack1;D.normalbag2=D.backpack3;
// Kopflampe: Stirnband mit runder Lampe und Lichtstrahl.
D.headlamp=P=>P.s('M8 34q24-16 48 0v8q-24-14-48 0z','#6f8c57',1.2)+P.e(32,30,11,11,'#d6a948',1.3)+P.e(32,30,7,7,'#fff6c8',1)+P.s('M40 26l20-10v26l-20-8z','#fff2a8',.6)+P.spark(52,14,3.4);
// Endgame (Jakob 6.11.): Eiswasser als Tropfen in einer Kristallphiole, Eisbohrer als Schraubbohrer mit Eisspitze.
D.icewater=P=>P.s('M22 14h20v8q10 6 10 20 0 12-20 12T12 42q0-14 10-20z','#bfeaf7',1.4)+P.s('M16 40q16 6 32 0 0 10-16 12T16 40z','#6cc7e6',1.2)+P.l('M28 10h8','#8a98a8',3)+P.s('M32 28q7 9 0 15-7-6 0-15z','#e6fbff',1)+P.g('M20 26q4-6 10-8',2.4,.8)+P.spark(46,16,3.2);
D.icedrill=P=>P.s('M28 4h8v14h-8z','#8a8f9b',1.2)+P.s('M20 18h24l-4 8H24z','#6f7683',1.2)+P.s('M32 54L22 26h20z','#9fdcf0',1.4)+P.l('M25 32l14-3M27 40l10-3M29 47l6-2','#e8fbff',2.2)+P.s('M18 8h6v8h-6zM40 8h6v8h-6z','#d6a948',1)+P.spark(46,40,3.2);

D.coralfilter=P=>P.s('M14 18h36v30H14z','#9fb7b4',1.4)+P.s('M18 22h28v22H18z','#e3efe9',1.2)+P.l('M22 26v14M28 26v14M34 26v14M40 26v14','#8aa6a2',1.6)+P.l('M32 40V28M32 34l-6-5M32 31l6-6','#ff6f91',3)+P.dot(26,29,2.2,'#ffb36b')+P.dot(38,25,2.2,'#f08a7a');

// Jakob 7.11.: uralte Bauteile
D.relicforest=P=>P.dot(32,32,24,'#c9f29a',.25)+[0,36,72,108,144,180,216,252,288,324].map(r=>P.rot(r,32,32,P.s('M29 8h6v8h-6z','#8fbf6a',1))).join('')+P.dot(32,32,17,'#8fbf6a')+P.dot(32,32,7,'#5d5447')+P.l('M22 26q8 4 10 12M40 22q-4 10 4 16','#6f8a4a',2.4)+P.spark(52,12,4);
D.reliccoast=P=>P.dot(32,32,24,'#c8f4ff',.25)+P.s('M18 12h28v6H18zM18 46h28v6H18z','#5d5447',1)+P.l('M22 20q20 4 0 8t0 8 0 8 0 6M42 20q-20 4 0 8t0 8 0 8 0 6','#6fc6d6',3.4)+P.l('M32 18v28','#f2ede0',2.4)+P.spark(52,14,4);
D.relicice=P=>P.dot(32,32,24,'#eafaff',.3)+P.s('M22 26h20l2 22H20z','#a9dcf2',1.2)+P.s('M14 34h8v6h-8zM42 34h8v6h-8z','#5d5447')+P.l('M32 10v14M22 17h20M25 12l14 10M39 12L25 22','#5d5447',2.6)+P.dot(32,17,4,'#5d5447')+P.spark(52,14,4);
