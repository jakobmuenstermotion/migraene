import {RELICS,relicY as RELICS_Y} from './relics.mjs';
﻿import {craftState} from './crafting.mjs';
import {factoryState} from './factory.mjs';
import {volcanoRegion,volcanoZoneAt,VOLCANO_PEAK} from './volcano-area.mjs';
import {iceRegion} from './ice-area.mjs';
import {coastRegion} from './coast-area.mjs';
import {introFocus,COMPUTER_POS} from './intro.mjs';
// Jakob 6.11.: Der Charakter ist ein kleiner Ordnungsfanatiker, der immer bessere Sauger will. Dialoge erscheinen nur bei erstmaligen
// Ereignissen (gespeichert in s.story.seen), kurz und ohne Zwischensequenz. Art 'think' = kleine Gedankenblase, verschwindet von selbst
// und blockiert nichts; 'big' = große Sprechblase, Antippen für weiter, Überspringen möglich. Reaktion = Körperanimation + Comic-Zeichen.
// Orte: Jeder Satz kommt erst, wenn man die Sache wirklich sieht (Eissee: erst am Ufer, Vulkan-Rohre: erst am Kraterrand).
// Vor dem Vulkan darf kein Text verraten, dass die Anlage ein Sauger ist (Erzählregel).
const outside=s=>s.area==='sunny'&&!s.home?.interior&&!s.nursery?.interior&&!s.cave?.interior&&!s.testWorld?.enabled;
const stat=(s,k)=>Number(s.stats?.[k])||0;
const at=(s,x,z,r)=>Math.hypot(s.player.x-x,s.player.z-z)<r;
const zone=s=>volcanoRegion(s.player.x,s.player.z)?volcanoZoneAt(s.player.x,s.player.z)?.id:null;
const step=(s,id)=>s.intro?.step===id;
const inside=s=>s.area==='sunny'&&Boolean(s.home?.interior);
// Neuer Spielstart (Jakob 6.11.): Schritt für Schritt nur über Sprechblasen, Kamera zeigt jeweils hin (focus).
const INTRO_DIALOGS=[
 {id:'introWake',kind:'big',react:'enthusiasm',when:s=>step(s,'leaves')&&inside(s),lines:['Guten Morgen! Neuer Tag, neues Glück. ♪','Draußen liegt bestimmt wieder alles voller Blätter. Na dann: raus mit mir!']},
 {id:'introHand',kind:'think',react:'curious',when:s=>step(s,'leaves')&&outside(s)&&s.story?.seen?.includes('start'),lines:['Erst mal mit der Hand: neben ein Blatt stellen und auf die Hand tippen. ✋']},
 {id:'introTooLong',kind:'big',react:'dismay',when:s=>step(s,'computer'),lines:['Vierzig Blätter. Und da liegen noch … ungefähr zehntausend.','Das dauert viel zu lange! Ich brauche einen Sauger.','Am Computer im Haus gibt es eine Ladestation, der erste Sauger ist gleich dabei. Kostet 100 Blätter.']},
 {id:'introComputer',kind:'big',react:'pride',when:s=>step(s,'computer')&&inside(s)&&at(s,COMPUTER_POS().x,COMPUTER_POS().z,3.2),focus:s=>introFocus(s,'computer'),lines:['Mein Computer! Hier kaufe ich Gebäude, stelle sie auf und verbessere sie später.','Jetzt aber: Ladestation kaufen und ein schönes Plätzchen im Haus suchen! ♪']},
 {id:'introCharger',kind:'big',react:'excited',when:s=>step(s,'charger'),focus:s=>introFocus(s,'charger'),lines:['Da ist sie, die Ladestation! Und mein erster Sauger steht schon drauf!','Ich nehme ihn mir an der Station. Ist der Akku leer, stelle ich ihn hier wieder ab.']},
 {id:'introSuck',kind:'think',react:'joy',when:s=>step(s,'suck')&&outside(s),lines:['Saugerknopf antippen: an. Nochmal antippen: aus. Herrlich einfach!']},
 {id:'introMarket',kind:'big',react:'curious',when:s=>step(s,'market')&&outside(s),focus:s=>introFocus(s,'market'),lines:['Mein Tank wird voll. Und Blätter kann man verkaufen!','Am Verkaufsstand lege ich Sachen in den Abendkorb. Bezahlt wird, wenn ich abends schlafen gehe.','Brauche ich sofort Münzen, gibt es dort direkt nur ein Zehntel. Lieber warten. ♪']},
 {id:'introSleep',kind:'big',react:'pride',when:s=>step(s,'sleep'),focus:s=>inside(s)?introFocus(s,'sleep'):null,lines:['Der Korb ist voll. Wenn ich müde bin, stelle ich den Sauger an die Ladestation und geh ins Bett: Dann wird alles verkauft und ein neuer Tag beginnt.']},
 {id:'introBoard',kind:'big',react:'enthusiasm',when:s=>step(s,'board')&&outside(s),focus:s=>introFocus(s,'board'),lines:['Guten Morgen, Welt! An der Pinnwand neben dem Haus hängen Aufgaben. Wer sie erledigt, bekommt Münzen.']},
 {id:'introStorage',kind:'big',react:'pride',when:s=>step(s,'storage')&&outside(s),focus:s=>introFocus(s,'storage'),lines:['Und rechts am Haus ist mein Lager. Stelle ich mich aufs Einlagerfeld, wandert alles aus dem Tank hinein.']}
];
// Neue Sauger erklären sich jetzt auch als Sprechblase (vorher Karte „Dein neuer Sauger“).
export const TOOL_LINES={focus:['Ein Fernsauger! Sein schmaler Strahl holt Dinge aus der Ferne, sogar springende Fische und Früchte aus den Bäumen.','Mit den Anker-Verbesserungen ziehe ich mich später über Schluchten und nach oben.'],fan:['Der Fächersauger! Er sammelt ganze Laubflächen auf einmal. Und der verfilzte Laubhaufen am Weg zum Strand hat jetzt keine Chance mehr.'],power:['Der Kraftsauger! Damit löse ich schwere, feststeckende Dinge. Einfach lange draufhalten.'],vortex:['Ein Wirbelsauger! Er saugt rund um mich herum. Was für ein Wirbel! ♪']};
export const DIALOGS=[
 ...INTRO_DIALOGS,
 {id:'start',kind:'big',react:'enthusiasm',when:s=>outside(s)&&s.time>2.5,lines:['Ahhh~ frische Luft! Sonnenschein! Natur! … und überall liegt Zeug herum. Tz tz tz.','Blätter! Ästchen! Steinchen! ÜBERALL! Wer soll das denn alles aufräumen?','Andere sehen einen schönen Wald. Ich sehe … Arbeit. ♪','Ich brauche einen Sauger. Einen richtig, richtig guten Sauger!','Eines Tages wird hier alles blitzblank sein. ALLES! ✨']},
 {id:'suck1',kind:'think',react:'joy',when:s=>outside(s)&&s.suctionActive&&stat(s,'leaf')>=2,lines:['Ohhh! Das ist ja herrlich! ♪','Weg damit! Und das auch! UND DAS ERST RECHT!']},
 {id:'suck2',kind:'think',react:'pride',when:s=>stat(s,'leaf')>=60,lines:['Ein Blatt weniger. Die Welt ist schon ein klitzekleines bisschen besser.']},
 {id:'suck3',kind:'think',react:'curious',when:s=>stat(s,'leaf')>=250,lines:['Moment mal … kann man damit eigentlich ALLES aufsaugen?','Das ist erst der Anfang. Ich brauche mehr Saugkraft!']},
 {id:'material',kind:'think',react:'curious',when:s=>stat(s,'stone')>=1||stat(s,'wood')>=1,lines:['Hmm, das sieht wertvoll aus. Oder schmutzig. Manchmal ist das dasselbe.','Nichts verschwenden! Das kann man bestimmt noch gebrauchen.']},
 {id:'workshop',kind:'big',react:'pride',when:s=>outside(s)&&Object.keys(craftState(s).workshops??{}).some(id=>id!=='forge'&&id!=='stove'&&id!=='sewingmachine'&&s.placements?.[id]),lines:['Endlich eine Werkstatt! Hier werden meine Saugerträume wahr. ♪']},
 {id:'newsucker',kind:'think',react:'excited',when:s=>(factoryState(s).owned?.length??0)>=2,lines:['Ein neuer Sauger! Ich bin ganz aufgeregt. Und das passiert mir nicht oft!','Mehr Saugkraft! MEHR!']},
 {id:'blobs',kind:'big',react:'hearts',when:s=>(s.forestBlobs?.roster?.length??0)>=1,lines:['Kleine Helfer! Ihr versteht mich!','Endlich jemand, der meine Leidenschaft teilt. ♥','Zusammen schaffen wir das. Kein Blatt bleibt zurück!','Du bist vielleicht klein, aber dein Ordnungssinn ist RIESIG.']},
 {id:'upgrade',kind:'think',react:'pride',when:s=>(factoryState(s).owned?.length??0)>=3,lines:['Das ist kein Sauger mehr. Das ist ein Lebensstil!','Ein bisschen übertrieben? Unsinn. Es gibt kein ZU VIEL Saugkraft.','Ich brauche bald einen größeren Rucksack. Oder einen größeren Sauger. Oder beides!']},
 // Küste: erst wenn man wirklich auf dem Sand steht.
 {id:'coast',kind:'think',react:'dismay',when:s=>outside(s)&&coastRegion(s.player.x,s.player.z)&&s.player.x>56,lines:['Sand. Überall Sand! Wie soll man da bitte Ordnung halten?']},
 {id:'coast2',kind:'think',react:'dismay',when:s=>outside(s)&&coastRegion(s.player.x,s.player.z)&&at(s,66,-2,16)&&s.story?.seen?.includes('coast'),lines:['Muscheln, Treibholz und Seetang … das wird ein laaanger Tag.']},
 // Berg: Schnee beim Betreten, der Eissee erst am Ufer.
 {id:'snow',kind:'think',react:'wonder',when:s=>outside(s)&&iceRegion(s.player.x,s.player.z),lines:['Schnee! So schön weiß. Und trotzdem liegt hier alles voller Zeug!']},
 {id:'icelake',kind:'think',react:'wonder',when:s=>outside(s)&&at(s,42.5,-66.5,12)&&iceRegion(s.player.x,s.player.z),lines:['Ooh, ein gefrorener See … ich frage mich, was sich unter dem Eis verbirgt.','Hier könnte man bestimmt auch angeln. Wenn man nur durch das Eis käme …']},
 // Vulkan: Asche beim Betreten, der seltsame Berg erst weiter hinten, die Rohre erst am Kraterrand.
 {id:'ash',kind:'big',react:'shock',when:s=>outside(s)&&zone(s)==='ash',lines:['Asche. ÜBERALL ASCHE! Das ist entweder eine Katastrophe … oder eine einmalige Gelegenheit!']},
 {id:'cone1',kind:'think',react:'curious',when:s=>outside(s)&&zone(s)==='lava'&&at(s,VOLCANO_PEAK.x,VOLCANO_PEAK.z,75),lines:['Dieser Berg sieht irgendwie … seltsam aus.']},
 {id:'cone2',kind:'big',react:'shock',when:s=>outside(s)&&zone(s)==='crater'&&at(s,VOLCANO_PEAK.x,VOLCANO_PEAK.z,62),lines:['Da oben stimmt doch etwas nicht. Ist das ein natürlicher Vulkan?','Ich sehe Rohre. Oder Felsen. Vielleicht sind es auch sehr, sehr große Rohre.']},
 // Vulkankern (Endgame): erst nach dem Betreten des Kerns, danach bei den Meilensteinen.
 {id:'coreSeen',kind:'think',react:'curious',when:s=>outside(s)&&zone(s)==='crater'&&s.player.x>-30,lines:['Da drüben am Fuß des Berges … blitzt da Metall zwischen den Felsen?','Wenn ich nur über diesen Lavafluss käme. Vielleicht mit etwas sehr, sehr Kaltem …']},
 {id:'coreEnter',kind:'big',react:'shock',when:s=>outside(s)&&zone(s)==='core',lines:['Moment mal … das ist gar kein Berg!','Das ist ein SAUGER. Ein riesiger, uralter, kaputter SAUGER!','Energie, Leitungen, Filter, Druck … vier große Systeme, und alle wollen repariert werden.','Ich … ich muss sofort aufräumen. Äh, reparieren!']},
 {id:'coreFirst',kind:'think',react:'excited',when:s=>(s.builtSites?.coreEnergy1||s.builtSites?.corePipes1||s.builtSites?.coreFilter1||s.builtSites?.corePressure1)&&true,lines:['Es funkelt! Es SUMMT! Mehr davon!']},
 {id:'coreHalf',kind:'think',react:'pride',when:s=>['coreEnergy','corePipes','coreFilter','corePressure'].filter(k=>s.builtSites?.[k+'3']).length>=2,lines:['Zwei Systeme laufen schon. Der Berg schnurrt fast. ♪']},
 {id:'coreFinale',kind:'big',react:'enthusiasm',when:s=>Boolean(s.builtSites?.coreActivate),lines:['MEHR SAUGKRAFT!','…','Sauber. Sauber! SAUBER!','Und da hinten liegt noch ein Blatt. Das hol ich mir gleich. ♪']}
];
// Verstreute Notizen: feste Fundorte, erscheinen als kleine Zettel in der Welt. Sie verraten vor dem Vulkan nicht, dass die Anlage ein Sauger ist.
export const NOTES=[
 {id:'note1',title:'Ungewöhnliche Bauformen',x:19,z:10,text:'Bei unserer Expedition haben wir am Horizont eine ungewöhnliche Bergformation entdeckt. Die regelmäßigen Formen und die teilweise sichtbaren Metallflächen lassen vermuten, dass dort einst eine größere Konstruktion errichtet wurde. Wir konnten den Zweck bisher nicht bestimmen.'},
 {id:'note2',title:'Das zentrale Projekt',x:66,z:6,text:'Die Arbeiten am zentralen Projekt schreiten voran. Die Anlage soll mehrere regionale Systeme miteinander verbinden. Dafür werden gewaltige Leitungen und spezielle Druckkammern benötigt. Die Dimensionen des Vorhabens sind größer als zunächst angenommen.'},
 {id:'note3',title:'Energieversorgung',x:30,z:-50,text:'Die Energieversorgung wird über geothermische Kraft gewonnen. Die Hitze aus dem Inneren des Berges ermöglicht den Betrieb der großen Turbinen. Erste Tests zeigen, dass die Anlage außergewöhnlich hohe Leistungen erreichen kann. Die Kühlung der Leitungen bleibt allerdings problematisch.'},
 {id:'note4',title:'Das Filtersystem',x:-54.1,z:42.1,text:'Das neue Filtersystem ist endlich einsatzbereit. Es kann unterschiedliche Materialien voneinander trennen und über eigene Leitungen weiterleiten. Damit ist ein wichtiger Teil des zentralen Projekts abgeschlossen. Randnotiz: Wer hat die Pilze in den Holzfilter gesteckt?'},
 {id:'note5',title:'Die regionalen Kontrollsysteme',x:-52.6,z:65.8,text:'Die vier regionalen Systeme müssen unabhängig voneinander funktionieren, bevor die Hauptanlage gestartet werden kann. Jedes System übernimmt eine eigene Aufgabe. Bei einem Ausfall muss die gesamte Anlage abgeschaltet bleiben. Die Ersatzteile wurden an verschiedenen Orten gelagert.'},
 {id:'note6',title:'Der letzte technische Hinweis',x:-4.5,z:69.3,text:'Die Vorbereitungen für die finale Aktivierung sind abgeschlossen. Alle regionalen Systeme müssen synchronisiert werden. Erst dann kann die zentrale Anlage ihre volle Leistung entfalten. Wir hoffen, dass die Konstruktion hält, was ihre Berechnungen versprechen.'}
];
export const storyState=s=>s.story??={seen:[],notes:[]};
export const storySnapshot=s=>({seen:[...storyState(s).seen],notes:[...storyState(s).notes]});
export function restoreStory(s,d){const ids=new Set(DIALOGS.map(x=>x.id)),nids=new Set(NOTES.map(x=>x.id));s.story={seen:(Array.isArray(d?.seen)?d.seen:[]).filter(k=>ids.has(k)||String(k).startsWith('hint')),notes:(Array.isArray(d?.notes)?d.notes:[]).filter(k=>nids.has(k))};}
// Nächster fälliger Dialog (oder null). Der Zeitpunkt wird vom UI bestimmt; hier nur Bedingung und Merken.
export function nextDialog(s){const st=storyState(s);for(const d of DIALOGS)if(!st.seen.includes(d.id)&&d.when(s))return d;return null;}
export const markDialog=(s,id)=>{const st=storyState(s);if(!st.seen.includes(id))st.seen.push(id);};
// Jakob 7.11.: drei Notizen gehören zu den uralten Bauteilen (relics.mjs); sie liegen beim Bauteil und geben es beim Aufheben.
for(const r of RELICS)if(!NOTES.some(n=>n.id===r.note.id))NOTES.push({...r.note,x:r.x,z:r.z,relic:r.id,room:r.room??null});
export function collectNote(s,id){const st=storyState(s);if(st.notes.includes(id))return null;const n=NOTES.find(x=>x.id===id);if(!n)return null;st.notes.push(id);return n;}
export const nearNote=(s,r=1.1)=>{const inIce=s.cave?.interior&&s.cave.room==='ice';return NOTES.find(n=>{if(storyState(s).notes.includes(n.id))return false;if(n.room==='ice'?!inIce:!outside(s))return false;if(n.relic&&!n.room&&Math.abs((s.player.y??0)-relicY(n))>1.4)return false;return Math.hypot(s.player.x-n.x,s.player.z-n.z)<(n.relic?1.6:r);})??null;};
const relicY=n=>RELICS.find(r=>r.id===n.relic)?RELICS_Y(RELICS.find(r=>r.id===n.relic)):0;
