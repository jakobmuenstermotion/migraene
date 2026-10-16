// Sunset follows active time instead of income. A completed day fades slowly to night.
export function nightTarget(s){return s.journey.closed?1:Math.min(.58,Math.max(0,(s.journey.elapsed-480)/600)*.58);}
export function advanceLighting(s,dt){const j=s.journey,target=nightTarget(s),current=j.light??0,step=Math.max(0,dt)/180;j.light=current+Math.max(-step,Math.min(step,target-current));return j.light;}
