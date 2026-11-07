export function completeGoal(s,cost={},coins=0,label=null){const g=s.goal;if(g&&(label&&g.label===label||g.coins===coins&&JSON.stringify(Object.entries(g.cost).sort())===JSON.stringify(Object.entries(cost).sort()))){s.goal=null;return true;}return false;}
export function goalStock(s,k){return (s.inventory.bag[k]??0)+(s.inventory.storage[k]??0);}
