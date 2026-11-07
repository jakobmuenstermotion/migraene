// Keep the rules intact; draw only prerequisites not already implied by a path.
export function layoutSkills(nodes){
 const ancestors=new Map(),parents=new Map(),levels=new Map(),rows=[];
 for(const n of nodes){const all=new Set(n.requires);for(const id of n.requires)for(const a of ancestors.get(id)??[])all.add(a);ancestors.set(n.id,all);
  const direct=n.requires.filter(id=>!n.requires.some(other=>other!==id&&ancestors.get(other)?.has(id)));parents.set(n.id,direct);
  let level=1+Math.max(0,...direct.map(id=>levels.get(id)));
  while((rows[level]?.length??0)>=3)level++;
  (rows[level]??=[]).push(n.id);levels.set(n.id,level);
 }
 const height=(rows.length+0.15)*124,positions=new Map(),root={x:50,y:100-65/height*100};
 for(let level=1;level<rows.length;level++){
  const row=rows[level]??[],bary=id=>{const p=parents.get(id);return p.length?p.reduce((sum,id)=>sum+(positions.get(id)?.x??50),0)/p.length:50;};
  row.sort((a,b)=>bary(a)-bary(b));
  row.forEach((id,i)=>positions.set(id,{x:row.length===1?50:row.length===2?26+i*48:16+i*34,y:root.y-level*124/height*100}));
 }
 return {height,positions,parents,root};
}

export function startingSkillNode(nodes,unlocked){const learned=new Set(unlocked),layout=layoutSkills(nodes);const ready=nodes.filter(n=>!learned.has(n.id)&&n.requires.every(id=>learned.has(id))),owned=nodes.filter(n=>learned.has(n.id));return (ready.length?ready:owned.length?owned:nodes).slice().sort((a,b)=>layout.positions.get(a.id).y-layout.positions.get(b.id).y)[0]?.id;}
export const NIGHT_GLYPH='<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M42 8a25 25 0 1 0 14 34A21 21 0 0 1 42 8z" fill="#f3dc8a" stroke="#8a7338" stroke-width="3" stroke-linejoin="round"/><path d="M18 16l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#fff6c8"/></svg>';
