import {flowerItemKind} from './flower-config.mjs';
import {GAME_BALANCE,roundCoins,creditDirectSale} from './game-balance.mjs';
import {SAUGER} from './sauger-config.mjs';
export function createInventory(){return {normalBag:{},bag:{sand:0,shell:0,seagrass:0,leaf:0,wood:0,stone:0,acorn:0,fruit:0,moss:0,mushroom:0,paper:0,briquette:0},storage:{sand:0,shell:0,seagrass:0,moss:0,mushroom:0,paper:0,briquette:0,leaf:0,wood:0,stone:0,acorn:0,fruit:0},sold:0,coins:0};}
export function capacityFor(mode,base=mode.baseCapacity??3000){return Math.floor(base*(mode.capacityMultiplier??1)+1e-8);}
export const NORMAL_CAPACITY=1000;
// Jakob 5.11.: normaler Rucksack 1.000 → 1.500 → 2.000 durch Nähmaschinen-Rezepte (equipment.normalBag).
export const normalCapacity=s=>NORMAL_CAPACITY+500*Math.max(0,Math.min(2,s?.equipment?.normalBag??0));
export function normalCount(s){return Object.values(s.inventory.normalBag??{}).reduce((a,n)=>a+n,0);}
export function suctionCount(s){return Math.max(0,s.carried-normalCount(s));}
export function suctionAmount(s,k){return Math.max(0,(s.inventory.bag[k]??0)-(s.inventory.normalBag?.[k]??0));}
export function addNormalMaterial(s,kind,amount){kind=flowerItemKind(kind);const n=Math.max(0,Math.min(amount,normalCapacity(s)-normalCount(s)));s.inventory.normalBag??={};s.inventory.normalBag[kind]=(s.inventory.normalBag[kind]??0)+n;s.inventory.bag[kind]=(s.inventory.bag[kind]??0)+n;s.carried+=n;return n;}
function debitOrigin(s,kind,amount){if(s.inventory.normalBag?.[kind])s.inventory.normalBag[kind]=Math.max(0,s.inventory.normalBag[kind]-amount);}
export function syncBag(s){const bag=s.inventory.bag,total=Object.values(bag).reduce((a,b)=>a+b,0);if(total<s.carried)bag.leaf+=s.carried-total;else if(total>s.carried){let excess=total-s.carried;for(const kind of Object.keys(bag)){const n=Math.min(bag[kind],excess);bag[kind]-=n;excess-=n;}}}
export function addMaterial(s,kind,amount,route='bag',capacity=s.backpackCapacity??3000){kind=flowerItemKind(kind);
 if(route==='sale'){s.inventory.sold+=amount;creditDirectSale(s,amount*(SAUGER.material[kind]?.value??1)/GAME_BALANCE.saleDivisor*GAME_BALANCE.directSaleFactor);return amount;}
 if(route==='storage'){s.inventory.storage[kind]=(s.inventory.storage[kind]??0)+amount;s.stored+=amount;return amount;}
 const n=Math.max(0,Math.min(amount,capacity-suctionCount(s)));s.inventory.bag[kind]=(s.inventory.bag[kind]??0)+n;s.carried+=n;if(n>0){const recent=s.inventory.suctionRecent??=[];for(let i=0;i<Math.min(96,n);i++)recent.push(kind);if(recent.length>96)recent.splice(0,recent.length-96);}if(n>0&&suctionCount(s)>=capacity){s.suctionEnabled=false;s.suctionActive=false;}return n;
}
export function removeMaterial(s,kind,amount=1){syncBag(s);if((s.inventory.bag[kind]??0)<amount)return false;s.inventory.bag[kind]-=amount;debitOrigin(s,kind,amount);s.carried-=amount;return true;}
export function takeBag(s,amount){syncBag(s);const items={};for(const kind of Object.keys(s.inventory.bag)){const n=Math.min(amount,s.inventory.bag[kind]);if(n){items[kind]=n;s.inventory.bag[kind]-=n;debitOrigin(s,kind,n);amount-=n;}if(!amount)break;}return items;}
// Jakob 7.11.: Das Einlagerfeld nimmt nur den Saugtank; der Rucksack bleibt (verwaltet am Entnahmefeld).
export function takeSuction(s,amount){syncBag(s);const items={},normal=s.inventory.normalBag??{};for(const kind of Object.keys(s.inventory.bag)){const n=Math.min(amount,Math.max(0,s.inventory.bag[kind]-(normal[kind]??0)));if(n){items[kind]=n;s.inventory.bag[kind]-=n;amount-=n;}if(!amount)break;}return items;}
// Rucksack → Lager (am Entnahmefeld, Jakob 7.11.).
export function storeNormal(s,kind,amount){const have=s.inventory.normalBag?.[kind]??0,n=Math.max(0,Math.min(have,Math.floor(amount)));if(!n)return 0;s.inventory.normalBag[kind]=have-n;s.inventory.bag[kind]=Math.max(0,(s.inventory.bag[kind]??0)-n);s.carried=Math.max(0,s.carried-n);s.inventory.storage[kind]=(s.inventory.storage[kind]??0)+n;s.stored=(s.stored??0)+n;return n;}
export function emptyBag(s){s.inventory.normalBag={};s.inventory.suctionRecent=[];s.carried=0;for(const k of Object.keys(s.inventory.bag))s.inventory.bag[k]=0;}
export function reservedBagSlots(s){return (s.pullingLeaves??[]).reduce((n,l)=>n+(l.reward?(l.reward.route==='bag'?l.reward.quantity:0):1),0)+(s.resources??[]).filter(r=>r.status==='pulling'&&r.reward?.route==='bag').reduce((n,r)=>n+r.reward.quantity,0);}
export function withdrawMaterial(s,kind,amount,capacity){
 if(!Object.hasOwn(s.inventory.storage,kind)||!Number.isSafeInteger(amount)||amount<=0||!Number.isFinite(capacity)||capacity<0)return 0;
 const n=Math.min(amount,s.inventory.storage[kind],Math.max(0,normalCapacity(s)-normalCount(s)));if(n<=0)return 0;
 s.inventory.storage[kind]-=n;addNormalMaterial(s,kind,n);s.stored=Object.values(s.inventory.storage).reduce((a,b)=>a+b,0);s.storageWithdrawHold=true;s.unloadBatch=null;return n;
}
