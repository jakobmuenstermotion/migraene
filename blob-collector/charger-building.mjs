import {HOME_ROOM,HOME_FITTINGS} from './home-space.mjs';
import {canBuildWithStock,payConstruction} from './construction-stock.mjs';
import {grantStarter} from './intro.mjs';
import {craftState} from './crafting.mjs';
// Jakob 7.11.: Die Ladestation ist ein Gebäude wie die Werkstätten. Man kauft sie am Hauscomputer (zusammen mit dem
// ersten Bodensauger, Testpreis 100 Blätter), stellt sie frei im Haus auf und verbessert dort den Akku (Akku-Skilltree).
// Vorher steht im Haus keine Ladestation. Alte Spielstände (ohne Einführung) besitzen sie und bekommen sie an den alten Platz.
export const CHARGER={name:'Ladestation',cost:{leaf:100},coins:0};
// Stände, die das Merkmal durch einen früheren Speicherfehler verloren haben: aufgestellte Ladestation zählt auch.
export const chargerOwned=s=>!s.intro||Boolean(s.builtSites?.introVacuum)||Object.keys(s.placements??{}).some(k=>k.startsWith('charger_'));
export const chargerPlacement=s=>{for(const [id,p] of Object.entries(s.placements??{}))if(id.startsWith('charger_'))return {id,...p};return null;};
const DEFAULT=()=>{const f=HOME_FITTINGS.find(f=>f.id==='charger');return {x:HOME_ROOM.x+f.x,z:HOME_ROOM.z+f.z,rotation:0};};
// Ort der Ladestation im Haus (null = keine aufgestellt). Besitzt man sie, ohne dass sie je aufgestellt wurde (alte Stände,
// Testzustände), gilt der alte feste Platz.
export function chargerPos(s){const p=chargerPlacement(s);if(p)return p;if(!chargerOwned(s)||(s.crafting?.loose?.charger??0)>0)return null;return DEFAULT();}
export function buyCharger(s){if(chargerOwned(s)||!canBuildWithStock(s,CHARGER.cost,CHARGER.coins)||!payConstruction(s,CHARGER.cost,CHARGER.coins))return false;(s.builtSites??={}).introVacuum=true;const c=craftState(s);c.loose.charger=(c.loose.charger??0)+1;grantStarter(s);s.events?.push('build');return true;}
// Alte Stände: sichtbare Ladestation an den alten Platz stellen.
export function migrateCharger(s){/* Reparatur: Merkmal ging beim Laden verloren, obwohl Station/Sauger da sind */if(s.intro&&!s.builtSites?.introVacuum&&(Object.keys(s.placements??{}).some(k=>k.startsWith('charger_'))||(s.crafting?.loose?.charger??0)>0))(s.builtSites??={}).introVacuum=true;if(!chargerOwned(s)||chargerPlacement(s)||(s.crafting?.loose?.charger??0)>0)return false;s.placements??={};s.placements.charger_1=DEFAULT();s.layoutRevision=(s.layoutRevision??0)+1;return true;}
