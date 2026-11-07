import {softCoins,cheaper} from './coin-curve.mjs';
import {canBuildWithStock,payConstruction} from './construction-stock.mjs';
import {completeGoal} from './goal-state.mjs';
// Ausbau der Blobstation (Jakob 31.10., Testwerte): jede Stufe erlaubt einen weiteren arbeitenden Blob und vergrößert den Raum.
export const STATION_UPGRADES=[
 {level:2,name:'Zweiter Helferplatz',cost:{board:8,rope:2},coins:500},
 {level:3,name:'Dritter Helferplatz',cost:{beam:8,stoneslab:8,fibre:6},coins:2500},
 {level:4,name:'Vierter Helferplatz',cost:{reinforcedpanel:3,mechanical:4,fabric:4},coins:8000},
 {level:5,name:'Fünfter Helferplatz',cost:{ironfitting:6,upholstery:4,filtermodule:4},coins:20000}
];
for(const u of STATION_UPGRADES){u.coins=softCoins(u.coins);cheaper(u.cost);}
export const nextStationUpgrade=s=>STATION_UPGRADES[(s.forestBlobs?.stationLevel??1)-1]??null;
export function canBuyStationUpgrade(s){const next=nextStationUpgrade(s);return Boolean(next)&&canBuildWithStock(s,next.cost,next.coins);}
export function buyStationUpgrade(s){const next=nextStationUpgrade(s);if(!next||!canBuildWithStock(s,next.cost,next.coins)||!payConstruction(s,next.cost,next.coins))return false;s.forestBlobs.stationLevel=next.level;s.forestBlobs.revision++;completeGoal(s,next.cost,next.coins,next.name);return true;}

// Jakob 3.11.: Stufe 2 mit Steinsockeln.
STATION_UPGRADES[0].cost={board:4,rope:2,stonesocket:2};
