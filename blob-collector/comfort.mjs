import {FURNITURE,placeableType} from './crafting-config.mjs';
// Gemütlichkeit (Jakob 31.10., Testwerte): Aufgestellte Möbel vergrößern die Ausdauerleiste. Neue Möbelarten zählen mehr als Wiederholungen.
export const COMFORT_RULES={perKind:.03,perRepeat:.01,max:1};
export function comfortStats(s){const types=[];for(const id of Object.keys(s.placements??{})){const t=placeableType(id);if(FURNITURE[t]&&!FURNITURE[t].station&&!['bed','desk','wardrobe','shelf','charger'].includes(t))types.push(t);}const kinds=new Set(types).size,bonus=Math.min(COMFORT_RULES.max,kinds*COMFORT_RULES.perKind+(types.length-kinds)*COMFORT_RULES.perRepeat);return {count:types.length,kinds,bonus};}
export const comfortStamina=s=>1+comfortStats(s).bonus;
export function comfortHTML(s){const c=comfortStats(s);return `<div class="comfort-card"><strong>♥ Gemütlichkeit</strong><span>${c.kinds} Möbelarten · ${c.count} aufgestellt</span><b>+${Math.round(c.bonus*100)} % Ausdauer</b></div>`;}
