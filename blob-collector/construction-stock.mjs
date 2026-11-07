import {completeGoal} from './goal-state.mjs';
import {removeMaterial} from './inventory.mjs';
import {roundCoins} from './game-balance.mjs';
export function constructionStock(s,k){return (s.inventory.bag[k]??0)+(s.inventory.storage[k]??0);}
export function canBuildWithStock(s,cost,coins=0){return s.inventory.coins>=coins&&Object.entries(cost??{}).every(([k,n])=>Number.isSafeInteger(n)&&n>0&&constructionStock(s,k)>=n);}
export function payConstruction(s,cost,coins=0){if(!canBuildWithStock(s,cost,coins))return false;for(const [k,n]of Object.entries(cost)){const carried=Math.min(n,s.inventory.bag[k]??0);if(carried)removeMaterial(s,k,carried);s.inventory.storage[k]=(s.inventory.storage[k]??0)-(n-carried);}s.stored=Object.values(s.inventory.storage).reduce((a,n)=>a+n,0);s.inventory.coins=roundCoins(s.inventory.coins-coins);completeGoal(s,cost,coins);return true;}
