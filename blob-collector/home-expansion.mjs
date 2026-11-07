import {softCoins,cheaper} from './coin-curve.mjs';
import {canBuildWithStock,payConstruction} from './construction-stock.mjs';
import {completeGoal} from './goal-state.mjs';
import {setHomeLevel} from './home-space.mjs';
// Neugestaltung (Jakob 29.10., Testwerte): Hausanbau am Hauscomputer, Stufe für Stufe.
export const HOME_EXPANSIONS=[
 {name:'Zweites Zimmer',text:'Ein heller Raum neben dem Schlafzimmer mit viel Stellfläche.',cost:{beam:20,stonebrick:10,ironfitting:6,upholstery:2},coins:3000},
 {name:'Wintergarten',text:'Glasdach, Mosaikboden und Blick ins Grüne – Platz fürs große Aquarium.',cost:{frostglass:6,frostbeam:4,mosaictile:4},coins:10000}
];
export function nextHomeExpansion(s){return HOME_EXPANSIONS[s.home?.expansion|0]??null;}
export function buyHomeExpansion(s){const next=nextHomeExpansion(s);if(!next||!canBuildWithStock(s,next.cost,next.coins)||!payConstruction(s,next.cost,next.coins))return false;s.home.expansion=(s.home.expansion|0)+1;completeGoal(s,next.cost,next.coins,next.name);setHomeLevel(s);s.layoutRevision=(s.layoutRevision??0)+1;return true;}

for(const h of HOME_EXPANSIONS){h.coins=softCoins(h.coins);cheaper(h.cost);}
