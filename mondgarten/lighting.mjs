import {DAY_RHYTHM} from './day-rhythm.mjs';
export const SUNSET_START=4*60;
// A single active-time curve: day -> sunset -> full night at sleep.
export function nightTarget(s){
 const j=s.journey;if(j.asleep)return 1;
 const t=Math.max(0,Math.min(1,(j.elapsed-SUNSET_START)/(DAY_RHYTHM.sleep-SUNSET_START)));
 return t*t*(3-2*t);
}
export function advanceLighting(s,dt){
 const j=s.journey;j.light=nightTarget(s);return j.light;
}
