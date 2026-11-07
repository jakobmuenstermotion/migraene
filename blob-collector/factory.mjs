import {roundCoins} from './game-balance.mjs';
import {getVacuum} from './vacuums.mjs';
import {completeGoal} from './goal-state.mjs';
import {FACTORY_ID,VACUUM_BUILD_COSTS,UPGRADE_COSTS} from './factory-config.mjs';
import {SKILL_TREES} from './vacuum-skills.mjs';
import {removeMaterial} from './inventory.mjs';
import {inHome} from './home-space.mjs';
export function factoryState(s){return s.factory??={owned:['ground']};}
export function ownsVacuum(s,id){return factoryState(s).owned.includes(id);}
export function grantTestVacuums(s){factoryState(s).owned=Object.keys(VACUUM_BUILD_COSTS);}
export function factoryNearby(s){const p=s.placements?.[FACTORY_ID];return Boolean(p&&s.crafting?.workshops[FACTORY_ID]?.owned&&s.area==='sunny'&&!s.testWorld.enabled&&!inHome(s)&&Math.hypot(s.player.x-p.x-Math.sin(p.rotation??0)*3,s.player.z-p.z-Math.cos(p.rotation??0)*3)<2.4);}
export function affordFactoryCost(s,c){return !!c&&s.inventory.coins>=c.coins&&Object.entries(c.materials).every(([k,n])=>(s.inventory.bag[k]??0)>=n);}
function pay(s,c){for(const [k,n]of Object.entries(c.materials))removeMaterial(s,k,n);s.inventory.coins=roundCoins(s.inventory.coins-c.coins);completeGoal(s,c.materials,c.coins);}
export function buildVacuum(s,id){const c=VACUUM_BUILD_COSTS[id];if(!c||ownsVacuum(s,id)||!factoryNearby(s)||!affordFactoryCost(s,c))return false;pay(s,c);completeGoal(s,c.materials,c.coins,getVacuum(id).name);factoryState(s).owned.push(id);s.toolLessons??=[];if(!s.toolLessons.includes(id))s.toolLessons.push(id);return true;}
export function factorySkillStatus(s,id,nodeId){const n=SKILL_TREES[id]?.nodes.find(n=>n.id===nodeId),p=s.progression[id];if(!n||!p||!UPGRADE_COSTS[id]?.[nodeId])return 'missing';if(p.unlocked.includes(nodeId))return 'owned';if(!ownsVacuum(s,id)||n.requires.some(r=>!p.unlocked.includes(r)))return 'locked';return affordFactoryCost(s,UPGRADE_COSTS[id][nodeId])?'available':'expensive';}
export function buyFactoryUpgrade(s,id,nodeId){if(!factoryNearby(s)||factorySkillStatus(s,id,nodeId)!=='available')return false;pay(s,UPGRADE_COSTS[id][nodeId]);completeGoal(s,UPGRADE_COSTS[id][nodeId].materials,UPGRADE_COSTS[id][nodeId].coins,SKILL_TREES[id].nodes.find(n=>n.id===nodeId).name);s.progression[id].unlocked.push(nodeId);s.skillRevision++;return true;}
export function restoreFactory(s,data,legacy=false){s.factory={owned:['ground']};if(legacy){grantTestVacuums(s);return;}for(const id of Object.keys(VACUUM_BUILD_COSTS))if(id!=='ground'&&Array.isArray(data?.owned)&&data.owned.includes(id))s.factory.owned.push(id);}
