import fs from 'node:fs';
import {CRAFT_RECIPES,WORKSHOPS} from './crafting-config.mjs';
import {UPGRADE_COSTS,VACUUM_BUILD_COSTS} from './factory-config.mjs';
import {CLOTHING,BUILDINGS} from './living-config.mjs';
import {PRODUCT_NAMES} from './material-press.mjs';
const n={...PRODUCT_NAMES,glassblank:'Glasrohling',sewingmachine:'Nähmaschine',frostflower:'Frostblume',desertcrystal:'Wüstenkristall',icecrystal:'Eiskristall'};
const cost=x=>Object.entries(x||{}).map(([k,v])=>v+' '+(n[k]||k)).join(', ')||'–';
let s='\n### Presse\n\n| Produkt | Zutaten |\n|---|---|\n| Papier | 100 Blätter |\n| Blütenessenz | 50 Blumen |\n| Sandsteinblock | 100 Sand |\n| Muschelkalk | 20 Muscheln |\n';
s+='\n### Werkstattrezepte, Möbel, Kleidung und Rucksäcke\n\n| Werkstatt | Produkt | Zutaten und Preis | Status |\n|---|---|---|---|\n';
for(const r of Object.values(CRAFT_RECIPES)) s+='| '+(WORKSHOPS[r.workshop]?.name||r.workshop)+' | '+r.name+' | '+cost(r.inputs)+(r.coins?', '+r.coins+' M':'')+' | '+(r.furniture?(r.starter?'Startrezept':'Blaupause'):r.clothing?'Kleidung':r.backpack?'Rucksack':'Material')+' |\n';
s+='\n### Kleidungswirkung\n\n| Kleidung | Wirkung |\n|---|---|\n';
for(const a of Object.values(CLOTHING)){let b=a.bonus,e=b.speed?'Tempo +'+Math.round((b.speed-1)*100)+' %':b.bag?'Tragkapazität +'+Math.round((b.bag-1)*100)+' %':b.fish?'Fangkontakt '+Math.round((1-b.fish)*100)+' % kürzer':b.explorer?'Entdeckerhinweise':b.battery?'bisher Akkukapazität +10 %, künftig offen':'–';s+='| '+a.name+' | '+e+' |\n';}
s+='\n### Gebäude und Sauger\n\n| Gebäude | Kosten |\n|---|---|\n';
for(const b of Object.values(BUILDINGS))s+='| '+b.name+' | '+cost(b.cost)+', '+b.coins+' M |\n';
for(const b of Object.values(WORKSHOPS).filter(x=>!x.indoor))s+='| '+b.name+' | '+cost(b.cost)+', '+b.coins+' M |\n';
s+='\n| Sauger | Baukosten |\n|---|---|\n';
let labels={ground:'Boden',focus:'Fern',fan:'Fächer',power:'Kraft',vortex:'Wirbel'};
for(const [id,b] of Object.entries(VACUUM_BUILD_COSTS))s+='| '+labels[id]+' | '+cost(b.materials)+', '+b.coins+' M |\n';
s+='\n### Alle Sauger-Upgrades\n\nDie Kosten sind aus dem aktuellen Spiel; die bestehenden Skilltree-Abhängigkeiten gelten weiter. Quellen für späte Zutaten sind in diesem Dokument Vorschläge.\n\n| Sauger | Upgrade | Zutaten | M |\n|---|---|---|---:|\n';
const p={depth:'Grabtiefe',width:'Saugbreite',light:'Leichterer Sauger',energy:'Energie',bonus:'Bonus',detector:'Detektor',range:'Reichweite',beam:'Strahlbreite',height:'Höhensog',anchor:'Anker',super:'Superfähigkeit',angle:'Fächerbreite',pack:'Rucksack',heat:'Überhitzung',cool:'Kühlung',mine:'Abbau',size:'Hindernisgröße',push:'Schubumkehr',diameter:'Durchmesser',transport:'Transport',regrowth:'Wirbelernte'};
for(const [tool,entries] of Object.entries(UPGRADE_COSTS))for(const [id,c] of Object.entries(entries)){let m=id.match(/^(.*?)([0-9]*)$/);s+='| '+labels[tool]+' | '+(p[m[1]]||m[1])+' '+m[2]+' | '+cost(c.materials)+' | '+c.coins+' |\n';}
fs.appendFileSync('BlobCollector_Materialplan.md',s,'utf8');
