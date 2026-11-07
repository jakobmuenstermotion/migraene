// Münzpreise (Jakob 31.10.): darüber flacher, damit sie zum gedämpften Warenpreis passen. COIN_CURVE dreht die Kurve,
// PRICE_CUT (Jakob 1.11.: alles deutlich günstiger, nicht stundenlang sammeln) senkt alle Münzpreise, MATERIAL_CUT alle Materialmengen.
export const COIN_CURVE=.6,PRICE_CUT=.5,MATERIAL_CUT=.6;
export function softCoins(c){if(!Number.isFinite(c)||c<=0)return c;const v=(c<=500?c:500*Math.pow(c/500,COIN_CURVE))*PRICE_CUT,step=v>=2000?50:v>=200?10:5;return Math.max(5,Math.round(v/step)*step);}
export function cheaper(cost,factor=MATERIAL_CUT){for(const k of Object.keys(cost??{}))cost[k]=Math.max(1,Math.ceil(cost[k]*factor));return cost;}
