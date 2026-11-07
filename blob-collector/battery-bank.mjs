import {softCoins} from './coin-curve.mjs';
import {chargerNearby,updateCharging,dockVacuum} from './charging.mjs';
import {computerNearby} from './home-computer.mjs';
import {spendEquipment} from './equipment.mjs';
export const BATTERY_UPGRADES=[
 {id:'spare1',name:'Erster Zusatzakku',coins:5000,cost:{beam:6,filtermodule:6},requires:[],effect:'Ein zusätzlicher Akku. Wechsel ausschließlich an der Ladestation.'},
 {id:'spare2',name:'Zweiter Zusatzakku',coins:20000,cost:{frostloop:2,embercoil:2,energycore:1},requires:['spare1'],effect:'Insgesamt drei Akkus. Wechsel ausschließlich an der Ladestation.'},
 {id:'automatic',name:'Saugautomatik',coins:10000,cost:{findercrystal:2,optical:2,filtermodule:2},requires:[],effect:'Am Saugerknopf aktivieren: Saugt nur, wenn passende Materialien oder Hindernisse im Saugfeld liegen.'}
];
export function batteryBank(s){return s.batteryBank??={unlocked:[],cells:[s.battery.charge],active:0,automatic:false};}
export function batterySnapshot(s){const b=batteryBank(s);b.cells[b.active]=s.battery.charge;return {...b,cells:[...b.cells],unlocked:[...b.unlocked]};}
export function restoreBatteryBank(s,data){const unlocked=BATTERY_UPGRADES.filter(n=>data?.unlocked?.includes(n.id)&&n.requires.every(id=>data.unlocked.includes(id))).map(n=>n.id),count=1+Number(unlocked.includes('spare1'))+Number(unlocked.includes('spare2')),cells=Array.from({length:count},(_,i)=>Math.max(0,Math.min(s.battery.max,Number(data?.cells?.[i]??(i===0?s.battery.charge:0))||0))),active=Math.max(0,Math.min(count-1,Math.floor(Number(data?.active)||0)));s.batteryBank={unlocked,cells,active,automatic:unlocked.includes('automatic')&&data?.automatic===true};s.battery.charge=cells[active];}
export function buyBatteryUpgrade(s,id){const b=batteryBank(s),n=BATTERY_UPGRADES.find(n=>n.id===id);if(!n||!computerNearby(s)||b.unlocked.includes(id)||!n.requires.every(id=>b.unlocked.includes(id))||!spendEquipment(s,n))return false;const wasCharging=Boolean(s.charging),now=Date.now();if(wasCharging)updateCharging(s,now);b.unlocked.push(id);if(id.startsWith('spare'))b.cells.push(0);if(wasCharging){s.charging=null;dockVacuum(s,now,true);}s.skillRevision++;return true;}
export function switchBattery(s,index,now=Date.now()){if(!chargerNearby(s))return false;if(s.charging)updateCharging(s,now);const b=batteryBank(s);if(!Number.isInteger(index)||index<0||index>=b.cells.length||index===b.active)return false;b.cells[b.active]=s.battery.charge;b.active=index;s.battery.charge=b.cells[index];return true;}
export function fillBatteryBank(s){const b=batteryBank(s);b.cells=b.cells.map(()=>s.battery.max);s.battery.charge=s.battery.max;}
export function toggleAutomatic(s){const b=batteryBank(s);if(!b.unlocked.includes('automatic'))return false;b.automatic=!b.automatic;s.autoProbe=null;return true;}

for(const u of BATTERY_UPGRADES)u.coins=softCoins(u.coins);
