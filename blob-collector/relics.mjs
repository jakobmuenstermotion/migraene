import {PRODUCT_NAMES} from './material-press.mjs';
import {SUNNY,sunnyHeight} from './sunny-area.mjs';
import {ICE_ROOM} from './cave-space.mjs';
// Jakob 7.11.: Drei uralte Bauteile an schwer erreichbaren Orten, je mit einer alten Notiz (Blaupause). Gebraucht für die
// Startsequenzen von drei Vulkansystemen (das vierte Teil steckt schon im Vulkan). Einlagerbar, aber nicht verkäuflich.
//  Wald  → Krone des mystischen Riesenbaums (Anker IV)     → Hauptleitung
//  Strand→ obere Windterrasse (Anker III)                   → Druck und Ansaugung
//  Eis   → Eisgrotte hoch in der Gipfelwand (Anker IV)      → Filtersystem
export const RELICS=[
 {id:'relicforest',name:'Uraltes Wurzelzahnrad',system:'corePipes',x:-45,z:-4,color:'#8fbf6a',glow:'#c9f29a',
  note:{id:'note7',title:'Blaupause: Wurzelzahnrad',text:'Für die Hauptleitung haben wir ein Zahnrad aus versteinertem Wurzelholz gefertigt. Es greift in die Ventile, ohne zu verrosten. Wir haben es dort verwahrt, wo der älteste Baum des Waldes seine Krone trägt. Ohne dieses Rad bleiben die Leitungen geschlossen.'}},
 {id:'reliccoast',name:'Uralte Gezeitenspule',system:'corePressure',x:52,z:-48,color:'#6fc6d6',glow:'#c8f4ff',
  note:{id:'note8',title:'Blaupause: Gezeitenspule',text:'Die Druckkammer braucht einen gleichmäßigen Takt. Die Spule aus Perlmutt und Seeglas schwingt mit den Gezeiten und gibt ihn vor. Wir haben sie hoch über der Küste versteckt, wo der Wind nie aufhört. Nur mit ihr hält die Ansaugung den Druck.'}},
 {id:'relicice',name:'Uraltes Frostventil',system:'coreFilter',x:ICE_ROOM.x,z:ICE_ROOM.z-3.6,room:'ice',color:'#a9dcf2',glow:'#eafaff',
  note:{id:'note9',title:'Blaupause: Frostventil',text:'Das Filtersystem darf nicht überhitzen. Das Frostventil kühlt die Kammern mit ewigem Eis. Wir haben es in eine Grotte hoch in der Gipfelwand gebracht, wo es nie taut. Ohne das Ventil verstopfen die Filter nach wenigen Minuten.'}}
];
for(const r of RELICS)PRODUCT_NAMES[r.id]=r.name;
export const NO_SALE=new Set(RELICS.map(r=>r.id));
export const RELIC_FOR=Object.fromEntries(RELICS.map(r=>[r.system,{[r.id]:1}]));
export const relicY=r=>r.room?ICE_ROOM.floor:sunnyHeight(r.x,r.z);
// Höhenanker am Grotteneingang: zieht direkt in die Eisgrotte (kein Landeplatz draußen).
export const GROTTO={x:39.6,z:-96.4,y:sunnyHeight(39.6,-95.8)+3.2};
if(!SUNNY.anchors.some(a=>a.id==='ice-grotto'))SUNNY.anchors.push({id:'ice-grotto',x:GROTTO.x,z:GROTTO.z,y:GROTTO.y,rank:4,portal:'ice'});
// Bauteil aufnehmen: landet im Rucksack, auch wenn er voll ist (nur 1 Stück, darf nicht verloren gehen).
export function giveRelic(s,id){const inv=s.inventory;inv.normalBag[id]=(inv.normalBag[id]??0)+1;inv.bag[id]=(inv.bag[id]??0)+1;s.carried=(s.carried??0)+1;s.events?.push('blueprint');}
export const hasRelic=(s,id)=>((s.inventory.bag[id]??0)+(s.inventory.storage[id]??0))>0;
