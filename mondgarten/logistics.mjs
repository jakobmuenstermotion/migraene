import {takeStoredGood} from './warehouse-stock.mjs';
import { farmFoodReserve } from "./snail-farm.mjs";
import { WORKSHOPS, PRODUCTS, VILLAGE } from "./village-content.mjs";
import { WORLD } from "./content.mjs";
import { neededMaterials } from "./funding.mjs";
import {
  acceptsIngredient,availableStoredProducts,depositRaw,storageCapacity,stockCount,
  workshopSpot,
  workshopStock,
  WORKSHOP_INPUT_CAPACITY,
  WORKSHOP_OUTPUT_CAPACITY,
} from "./village.mjs";

export const cargoCount = (cargo) =>
  Object.values(cargo.items).reduce((sum, n) => sum + n, 0);
export const cargoValue = (cargo) =>
  Object.values(cargo.values).reduce((sum, n) => sum + n, 0);
function incomingIngredients(loads,workshop){const incoming={};for(const load of loads)if(load.supplyWorkshop===workshop)for(const [id,n]of Object.entries(load.items??{}))incoming[id]=(incoming[id]??0)+n;return incoming;}


// Snails may sell overflow; supply haulers retain ingredients for their destination.
// Recompute every frame so construction and partially delivered legacy loads are safe.
export function ingredientDestination(
  s,
  cargo,
  actor,
  { sellOverflow = false } = {},
) {
  const id = Object.keys(cargo.items).find((id) => cargo.items[id] > 1e-8);
  if (!id) return null;
  const matches = WORKSHOPS.filter(
    (w) => s.village.workshops[w.id].level && acceptsIngredient(w, id),
  );
  matches.sort((a, b) => {
    const full = (w) =>
      workshopStock(s.village.workshops[w.id]) >= WORKSHOP_INPUT_CAPACITY;
    return (
      Number(full(a)) - Number(full(b)) ||
      Math.hypot(a.x - actor.x, a.z - actor.z) -
        Math.hypot(b.x - actor.x, b.z - actor.z)
    );
  });
  const workshop = matches[0];
  if (
    workshop &&
    sellOverflow &&
    workshopStock(s.village.workshops[workshop.id]) >=
      WORKSHOP_INPUT_CAPACITY - 1e-8
  )
    return { kind: "sell", id, overflow: true, ...WORLD.bank };
  return workshop
    ? { kind: "workshop", workshop, ...workshopSpot(workshop, "input") }
    : { kind: "sell", id, ...WORLD.bank };
}

// Plan only; stock stays at its source until a helper physically reaches it.
// Finished ingredients are moved first so compound recipes do not rely on teleportation.
export function planSupply(s, limit = 24, { productsOnly = false } = {}) {
  const v = s.village;
  for (const products of productsOnly ? [true] : [true, false])
    for (const w of WORKSHOPS) {
      const m = v.workshops[w.id];
      if (!m.level || (v.finished[w.product] ?? 0) >= WORKSHOP_OUTPUT_CAPACITY)
        continue;
      const incoming=incomingIngredients(v.snailLoads??[],w.id);
      let room = Math.min(limit, WORKSHOP_INPUT_CAPACITY - workshopStock(m)-Object.values(incoming).reduce((n,x)=>n+x,0));
      if (room <= 0) continue;
      for (const recipe of [w.inputs, ...(w.alternatives ?? [])])
        for (const [id, needed] of Object.entries(recipe)) {
          if (!!PRODUCTS[id] !== products) continue;
          if(products){const stored=v.storedGoods?.[id],count=Math.min(room,Math.max(0,needed*2-(m.inputs[id]??0)-(incoming[id]??0)),availableStoredProducts(s,id));if(stored&&count>1e-8)return{kind:'supply',workshop:w.id,source:'stockroom',items:{[id]:count},values:{[id]:stored.value*count/stored.count}};}
          const source = products
            ? WORKSHOPS.find((source) => source.product === id)?.id ?? (id.endsWith('Honey')?'honey':undefined)
            : "warehouse";
          if (!source || (products && source!=='honey'&&!v.workshops[source].level)) continue;
          const stock = products ? v.finished : v.raw,
            values = products ? v.finishedValues : v.rawValues;
          const home = products
            ? Math.max(neededMaterials(s)[id] ?? 0,
                v.house < 3 ? (VILLAGE.partner.materials[v.house]?.[id] ?? 0) : 0)
            : 0;
          const count = Math.min(
            room,
            Math.max(0, needed * 2 - (m.inputs[id] ?? 0)-(incoming[id]??0)),
            Math.max(
              0,
              (stock[id] ?? 0) - home - (products ? farmFoodReserve(s, id) : 0),
            ),
          );
          if (count <= 1e-8) continue;
          return {
            kind: "supply",
            workshop: w.id,
            source,
            items: { [id]: count },
            values: { [id]: ((values[id] ?? 0) * count) / stock[id] },
          };
        }
    }
  return null;
}
export function supplySourceSpot(job) {
  return ["warehouse","honey","stockroom"].includes(job.source)
    ? VILLAGE.warehouse
    : workshopSpot(
        WORKSHOPS.find((w) => w.id === job.source),
        "output",
      );
}
export function takeSupply(s, job) {
  if(job.source==='stockroom'){for(const [id,n]of Object.entries(job.items)){const batch=takeStoredGood(s.village,id,n);job.items[id]=batch.count;job.values[id]=batch.value;}return job;}
  const stock = job.source === "warehouse" ? s.village.raw : s.village.finished;
  const values =
    job.source === "warehouse" ? s.village.rawValues : s.village.finishedValues;
  for (const [id, count] of Object.entries(job.items)) {
    stock[id] = Math.max(0, stock[id] - count);
    values[id] = Math.max(0, values[id] - job.values[id]);
  }
  return job;
}

// Warehouse-only hauls for the assigned snails. A load may contain every
// ingredient of a recipe; stock stays untouched until physical pickup.
function warehouseIngredient(s,id){
 if(!PRODUCTS[id])return{count:s.village.raw[id]??0,value:s.village.rawValues[id]??0};
 const stored=s.village.storedGoods?.[id],count=availableStoredProducts(s,id);
 const legacy=id.endsWith('Honey')?(s.village.finished[id]??0):0;
 return{count:count+legacy,value:(stored?.count?stored.value*count/stored.count:0)+(legacy?s.village.finishedValues[id]??0:0)};
}
export function planWarehouseSupply(s,limit=24,pending=[],workshopID=null){
 const v=s.village;if(limit<=0)return null;
 for(const w of WORKSHOPS.filter(w=>w.id===workshopID)){const m=v.workshops[w.id];if(!m.level||(v.finished[w.product]??0)>=WORKSHOP_OUTPUT_CAPACITY)continue;
  const incoming=incomingIngredients(pending,w.id);
  const local=id=>(m.inputs[id]??0)+(incoming[id]??0),room=Math.max(0,WORKSHOP_INPUT_CAPACITY-workshopStock(m)-Object.values(incoming).reduce((n,x)=>n+x,0));if(!room)continue;
  const recipes=[w.inputs,...(w.alternatives??[])],rank=r=>{const entries=Object.entries(r);return Math.min(...entries.map(([id,n])=>Math.min(2,(local(id)+warehouseIngredient(s,id).count)/n)))*10+entries.reduce((sum,[id,n])=>sum+Math.min(2,local(id)/n),0)/entries.length;};
  const recipe=recipes.reduce((best,r)=>rank(r)>rank(best)?r:best,w.inputs),items={},values={};let left=Math.min(limit,room);
  for(const [id,n]of Object.entries(recipe)){const stock=warehouseIngredient(s,id),count=Math.min(left,Math.max(0,n*2-local(id)),stock.count);if(count<=1e-8)continue;items[id]=count;values[id]=stock.value*count/stock.count;left-=count;}
  if(Object.keys(items).length)return{kind:'supply',source:'warehouse',workshop:w.id,items,values};
 }
 return null;
}
export function takeWarehouseSupply(s,job){
 const items={},values={};for(const [id,requested]of Object.entries(job.items)){let left=Math.min(requested,warehouseIngredient(s,id).count),count=0,value=0;
  if(!PRODUCTS[id]){const before=s.village.raw[id]??0,n=Math.min(left,before);if(n){value=(s.village.rawValues[id]??0)*n/before;s.village.raw[id]-=n;s.village.rawValues[id]-=value;count=n;}}
  else{const batch=takeStoredGood(s.village,id,Math.min(left,availableStoredProducts(s,id)));count+=batch.count;value+=batch.value;left-=batch.count;if(left>1e-8&&id.endsWith('Honey')){const before=s.village.finished[id]??0,n=Math.min(left,before);if(n){const cost=(s.village.finishedValues[id]??0)*n/before;s.village.finished[id]-=n;s.village.finishedValues[id]-=cost;count+=n;value+=cost;}}}
  if(count>1e-8){items[id]=count;values[id]=value;}
 }
 job.items=items;job.values=values;return job;
}
export function returnSupplyToWarehouse(s,cargo){let room=Math.max(0,storageCapacity(s)-stockCount(s.village)),delivered=0;
 for(const [id,before]of Object.entries(cargo.items)){const n=Math.min(before,room);if(n<=1e-8)continue;const value=(cargo.values[id]??0)*n/before;if(PRODUCTS[id]){s.village.storedGoods??={};const e=s.village.storedGoods[id]??={count:0,value:0};e.count+=n;e.value+=value;}else depositRaw(s,id,n,value);cargo.items[id]-=n;cargo.values[id]-=value;room-=n;delivered+=n;}
 return delivered;
}
