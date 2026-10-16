import { helperBoost } from "./apiary.mjs";
import { WORKSHOPS, VILLAGE } from "./village-content.mjs";
import { WORLD } from "./content.mjs";
import {
  availableProducts,
  collectProducts,
  depositWorkshopSupplies,
} from "./village.mjs";
import { credit } from "./money.mjs";
import { planSupply, supplySourceSpot, takeSupply } from "./logistics.mjs";
export const WOODCOCK_TASKS = {
  supply: "Zutaten bringen",
  sell: "Waren verkaufen",
  search: "Waldschätze suchen",
};
const count = (cargo) =>
  Object.values(cargo.items).reduce((sum, n) => sum + n, 0);
const clear = () => ({ kind: "", workshop: "", items: {}, values: {} });
const spots = [
  { x: -25, z: -3 },
  { x: -19, z: 13 },
  { x: -3, z: -16 },
  { x: 22, z: -13 },
];
function walk(b, target, dt) {
  const dx = target.x - b.x,
    dz = target.z - b.z,
    d = Math.hypot(dx, dz);
  b.moving = d > 0.15;
  if (!b.moving) return true;
  const step = Math.min(d, 3.4 * dt);
  b.x += (dx / d) * step;
  b.z += (dz / d) * step;
  b.angle = Math.atan2(dx, dz);
  return step >= d;
}
export function advanceWoodcock(s, dt) {
  const b = s.village.woodcock,
    events = [];
  if (!b?.unlocked || dt <= 0) return events;
  dt *= helperBoost(s, "woodcock");
  if (count(b.cargo) > 1e-8) {
    if (b.cargo.kind === "sell") {
      if (walk(b, WORLD.bank, dt)) {
        const value = Object.values(b.cargo.values).reduce((a, n) => a + n, 0);
        credit(s, value);
        s.village.autoSold += count(b.cargo);
        b.cargo = clear();
        events.push({ kind: "woodcockSale", value });
      }
    } else {
      const w = WORKSHOPS.find((w) => w.id === b.cargo.workshop);
      if (w && walk(b, { x: w.x - 1.8, z: w.z + 1.8 }, dt)) {
        const n = depositWorkshopSupplies(s, w, b.cargo);
        if (n) events.push({ kind: "woodcockDelivery", x: b.x, z: b.z });
        if (count(b.cargo) < 1e-8) b.cargo = clear();
      }
    }
    return events;
  }
  if (b.task === "search") {
    const target = spots[b.searchIndex % spots.length];
    if (walk(b, target, dt)) {
      b.timer += dt;
      if (b.timer >= 90) {
        b.timer = 0;
        b.searchIndex++;
        b.treasures++;
        events.push({ kind: "woodcockFind", x: b.x, z: b.z });
      }
    }
    return events;
  }
  if (b.task === "sell") {
    for (const w of WORKSHOPS) {
      const product =
        w.id === "tea" && (s.village.finished.honeyapple ?? 0) > 0
          ? "honeyapple"
          : w.product;
      const available = availableProducts(s, product, true);
      if (available <= 0) continue;
      if (walk(b, { x: w.x + 1.8, z: w.z + 1.8 }, dt)) {
        const batch = collectProducts(s, 12, true, product);
        b.cargo = {
          kind: "sell",
          workshop: w.id,
          items: batch.items,
          values: batch.values,
        };
      }
      return events;
    }
  }
  if (b.task === "supply") {
    const job = planSupply(s);
    if (job) {
      if (walk(b, supplySourceSpot(job), dt)) {
        // Planned again each frame, so stock is only removed at physical pickup.
        takeSupply(s, job);
        b.cargo = job;
      }
      return events;
    }
  }
  walk(b, VILLAGE.woodcock, dt);
  return events;
}
