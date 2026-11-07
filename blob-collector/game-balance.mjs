// Explicitly approved provisional rebalance, 23 October 2026.
export const GAME_BALANCE=Object.freeze({backpack:1000,saleDivisor:100,directSaleFactor:.1,productionMultiplier:10,roundSeconds:600,fishInterval:[75,150],wildPerRound:1,fishSaleMultiplier:5});
export const roundCoins=n=>Math.round((n+Number.EPSILON)*100)/100;
export const formatCoins=n=>roundCoins(n).toLocaleString('de-DE',{maximumFractionDigits:2});

export function creditDirectSale(s,amount){const inv=s.inventory,tenths=Math.max(0,Math.round(amount*1000))+Math.max(0,Math.min(9,Math.floor(inv.saleTenths??0))),cents=Math.floor(tenths/10);inv.saleTenths=tenths%10;inv.coins=roundCoins(inv.coins+cents/100);return cents/100;}

const COIN_ART='<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#e9b949" stroke="#9a6f1f" stroke-width="3"/><circle cx="32" cy="32" r="16" fill="#f6d778" stroke="#b98a2c" stroke-width="2.5"/><path d="M22 24q6-7 14-6" fill="none" stroke="#fff6d0" stroke-width="3" stroke-linecap="round"/></svg>';
export const coinCost=(coins,have)=>`<span class="factory-cost ${have>=coins?'has':''}" title="Münzen">${COIN_ART}<b>${formatCoins(coins)}</b><small>${formatCoins(have)}</small><em>Münzen</em></span>`;
