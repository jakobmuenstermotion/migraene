import { farmFoodReserve } from "./snail-farm.mjs";
import { WORKSHOPS, PRODUCTS, VILLAGE } from "./village-content.mjs";
import { WORLD } from "./content.mjs";
import { neededMaterials } from "./funding.mjs";
import {
  acceptsIngredient,
  workshopSpot,
  workshopStock,
  WORKSHOP_INPUT_CAPACITY,
  WORKSHOP_OUTPUT_CAPACITY,
} from "./village.mjs";

export const cargoCount = (cargo) =>
  Object.values(cargo.items).reduce((sum, n) => sum + n, 0);
export const cargoValue = (cargo) =>
  Object.values(cargo.values).reduce((sum, n) => sum + n, 0);

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
      let room = Math.min(limit, WORKSHOP_INPUT_CAPACITY - workshopStock(m));
      if (room <= 0) continue;
      for (const recipe of [w.inputs, ...(w.alternatives ?? [])])
        for (const [id, needed] of Object.entries(recipe)) {
          if (!!PRODUCTS[id] !== products) continue;
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
            Math.max(0, needed * 2 - (m.inputs[id] ?? 0)),
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
  return ["warehouse","honey"].includes(job.source)
    ? VILLAGE.warehouse
    : workshopSpot(
        WORKSHOPS.find((w) => w.id === job.source),
        "output",
      );
}
export function takeSupply(s, job) {
  const stock = job.source === "warehouse" ? s.village.raw : s.village.finished;
  const values =
    job.source === "warehouse" ? s.village.rawValues : s.village.finishedValues;
  for (const [id, count] of Object.entries(job.items)) {
    stock[id] = Math.max(0, stock[id] - count);
    values[id] = Math.max(0, values[id] - job.values[id]);
  }
  return job;
}
