import {fundingProgress} from './funding.mjs';
// A full dusk/dawn takes at least a minute, including while a menu is open.
export function nightTarget(s){return s.journey.closed?1:s.journey.plan?Math.max(0,(fundingProgress(s)-.65)/.35)*.78:Math.max(0,Math.min(.78,(s.journey.elapsed-210)/390*.78));}
export function advanceLighting(s,dt){const j=s.journey,target=nightTarget(s),current=j.light??0;const step=Math.max(0,dt)/65;j.light=current+Math.max(-step,Math.min(step,target-current));return j.light;}
