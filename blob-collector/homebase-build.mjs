import {completeGoal} from './goal-state.mjs';
import {computerNearby} from './home-computer.mjs';
import {BUILDINGS} from './living-config.mjs';
import {payConstruction} from './construction-stock.mjs';
// Missing state is reserved for legacy fixtures and old saves, which had both buildings.
export function buildingBuilt(s,id){return s.freeBuildings?s.buildings?.[id]===true&&Boolean(s.placements?.[id]):s.buildings?.[id]!==false;}
export function constructHomebase(s,id){const spec=BUILDINGS[id];if(!computerNearby(s)||!spec||s.buildings?.[id]===true||spec.requires&&!buildingBuilt(s,spec.requires)||!payConstruction(s,spec.cost,spec.coins))return false;s.buildings[id]=true;completeGoal(s,spec.cost,spec.coins,spec.name);s.buildAnimation={id,at:s.time};s.events.push('build');return true;}
