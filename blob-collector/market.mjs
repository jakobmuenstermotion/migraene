import {softCoins,cheaper} from './coin-curve.mjs';
import {GAME_BALANCE,roundCoins,creditDirectSale} from './game-balance.mjs';
import {SAUGER} from './sauger-config.mjs';
import {BUTTERFLIES} from './butterflies.mjs';
import {PRESS} from './material-press.mjs';
import {CRAFT_RECIPES} from './crafting-config.mjs';
import {FISH} from './fishing.mjs';
import {addNormalMaterial,removeMaterial} from './inventory.mjs';
import {canBuildWithStock,payConstruction} from './construction-stock.mjs';
export const MARKET={x:-3,z:3,w:3,d:2.1,height:3,rotation:0};
// Jakob 1.11.: der Stand lässt sich am Computer versetzen; Kollision und Bedienfeld lesen dieses eine Objekt.
export function syncMarket(s){const p=s?.placements?.market;Object.assign(MARKET,p?{x:p.x,z:p.z,rotation:p.rotation??0}:{x:-3,z:3,rotation:0});}
export const marketSpot=()=>({x:MARKET.x+Math.sin(MARKET.rotation)*2.5,z:MARKET.z+Math.cos(MARKET.rotation)*2.5});
// Provisional wait-time factor approved for the test economy.
export const PRICE_RULES={rawMultiplier:2,perSecond:50,tradeBonus:1.5};/* Jakob 31.10.: Zutaten × 2 plus Maschinenzeit statt je Stufe × 2 × Zeit; perSecond in Hundertstel-Münzen je Rezeptsekunde */// tradeBonus: Handelsware (Jakob 29.10.)
function baseSalePrice(kind,visited=new Set()){
 if(PRESS.recipes[kind]?.sale)return PRESS.recipes[kind].sale*GAME_BALANCE.saleDivisor;
 if(kind==='flowers')return SAUGER.material.daisy.value;
 if(FISH[kind])return FISH[kind].value*GAME_BALANCE.fishSaleMultiplier;
 if(kind.startsWith('bf_'))return (BUTTERFLIES[kind.slice(3)]?.coins??1)*GAME_BALANCE.saleDivisor; // Schmetterlinge: Geld erst beim Verkauf (Jakob 6.11.)
 if(visited.has(kind))return 0;visited.add(kind);
 const press=PRESS.recipes[kind];if(press)return Math.ceil(PRICE_RULES.rawMultiplier*(press.inputs?Object.entries(press.inputs).reduce((n,[k,q])=>n+baseSalePrice(k,new Set(visited))*q,0):baseSalePrice(press.input,new Set(visited))*press.cost)+press.seconds*PRICE_RULES.perSecond);
 const r=Object.values(CRAFT_RECIPES).find(r=>r.output===kind&&!r.furniture&&!r.retired)??Object.values(CRAFT_RECIPES).find(r=>r.output===kind&&!r.furniture);if(r)return Math.ceil((PRICE_RULES.rawMultiplier*Object.entries(r.inputs).reduce((n,[k,q])=>n+baseSalePrice(k,new Set(visited))*q,0)+r.seconds*PRICE_RULES.perSecond)/(r.quantity??1)*(r.trade?PRICE_RULES.tradeBonus:1)*(r.saleFactor??1));
 return SAUGER.material[kind]?.value??1;
}
export const salePrice=kind=>baseSalePrice(kind)/GAME_BALANCE.saleDivisor;
// Neugestaltung (Jakob 29.10., Testwerte): drei Ausbaustufen des Verkaufsstands.
export const MARKET_UPGRADES=[
 {id:'regulars',name:'Stammkunden',text:'Jeden Morgen wünscht sich ein Stammkunde eine Ware: alle Stücke davon bringen abends doppelt so viel.',cost:{board:6,rope:2},coins:800},
 {id:'display',name:'Auslage',text:'Alles, was abends verkauft wird, bringt 10 % mehr.',cost:{beam:8,fabric:4},coins:1500},
 {id:'cart',name:'Händlerkarren',text:'Sofortverkauf am Stand bringt 30 % statt 10 %.',cost:{ironfitting:4,springsteel:2,beam:6},coins:12000}
];
for(const u of MARKET_UPGRADES){u.coins=softCoins(u.coins);if(u.id!=='regulars')cheaper(u.cost);}
export function marketLevel(s){return Math.max(0,Math.min(MARKET_UPGRADES.length,s.market?.level|0));}
export function buyMarketUpgrade(s){const next=MARKET_UPGRADES[marketLevel(s)];if(!next||!canBuildWithStock(s,next.cost,next.coins)||!payConstruction(s,next.cost,next.coins))return false;s.market??={stock:{}};s.market.level=marketLevel(s)+1;return true;}
const WISH_FALLBACK=['board','paper','rope','fibre','stoneslab','resin','beam','essence'];
// Wunschware des Tages: aus den Dingen, die man gerade besitzt (Rucksack, Lager, Verkaufskorb), sonst aus Grundwaren.
export function marketWish(s){if(marketLevel(s)<1)return null;const day=s.round?.day??1,m=s.market??={stock:{}};if(m.wish?.day===day)return m.wish.kind;const owned=new Set([...Object.entries(s.inventory.bag),...Object.entries(s.inventory.storage),...Object.entries(m.stock??{})].filter(([k,n])=>n>0&&salePrice(k)>=.5).map(([k])=>k));const list=(owned.size?[...owned]:WISH_FALLBACK).sort(),pick=list[Math.floor(((Math.sin(day*12.9898)*43758.5453)%1+1)%1*list.length)];m.wish={day,kind:pick};return pick;}
export function eveningPrice(s,kind){const lv=marketLevel(s);return salePrice(kind)*(lv>=2?1.1:1)*(lv>=1&&marketWish(s)===kind?2:1);}
export function directSaleShare(s){return marketLevel(s)>=3?.3:GAME_BALANCE.directSaleFactor;}
// Jakob 7.11.: uralte Bauteile sind nicht verkäuflich (relics.mjs NO_SALE; hier fest eingetragen, um Kreisimporte zu vermeiden).
export const UNSELLABLE=new Set(['relicforest','reliccoast','relicice']);
export function sellAtMarket(s,kind,amount,source='bag',defer=false){if(UNSELLABLE.has(kind))return false;
 if(!['bag','storage'].includes(source)||!Number.isSafeInteger(amount)||amount<1||Math.hypot(s.player.x-MARKET.x,s.player.z-MARKET.z)>7||s.area!=='sunny'||s.testWorld.enabled)return 0;
 const stock=s.inventory[source],n=Math.min(stock[kind]??0,amount);if(!n)return 0;
 if(source==='bag'){if(!removeMaterial(s,kind,n))return 0;}else{stock[kind]-=n;s.stored=Object.values(stock).reduce((a,b)=>a+b,0);}
 if(defer){const m=s.market??={stock:{}};m.stock[kind]=(m.stock[kind]??0)+n;return n;}creditDirectSale(s,n*salePrice(kind)*directSaleShare(s));s.inventory.sold+=n;if(FISH[kind]){s.fishing.book[kind]??={caught:0,sold:0};s.fishing.book[kind].sold+=n;}return n;
}

export function consignAtMarket(s,kind,amount,source='bag'){return sellAtMarket(s,kind,amount,source,true);}
export function marketValue(s){return roundCoins(Object.entries(s.market?.stock??{}).reduce((v,[k,n])=>v+n*eveningPrice(s,k),0));}
export function settleMarket(s){const stock=s.market?.stock??{},coins=marketValue(s),count=Object.values(stock).reduce((a,n)=>a+n,0);s.inventory.coins=roundCoins(s.inventory.coins+coins);s.inventory.sold+=count;for(const [k,n]of Object.entries(stock))if(FISH[k]){s.fishing.book[k]??={caught:0,sold:0};s.fishing.book[k].sold+=n;}s.market={stock:{},level:marketLevel(s)};return {coins,count};}

export function reclaimMarket(s,kind){if(s.area!=='sunny'||s.testWorld.enabled||s.home?.interior||Math.hypot(s.player.x-MARKET.x,s.player.z-MARKET.z)>7)return 0;const stock=s.market?.stock;if(!stock)return 0;const n=addNormalMaterial(s,kind,stock[kind]??0);if(n)stock[kind]-=n;return n;}
