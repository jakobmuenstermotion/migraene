import { WORKSHOPS, VILLAGE } from './village-content.mjs';
import { WORLD } from './content.mjs';
import {
  availableProducts,
  collectProducts,
  depositWorkshopSupplies,
  workshopStock,
  WORKSHOP_INPUT_CAPACITY,
} from './village.mjs';
import { credit } from './money.mjs';
export const WOODCOCK_TASKS = {
  supply: 'Zutaten bringen',
  sell: 'Waren verkaufen',
  search: 'Waldschätze suchen',
};
const count = (cargo) =>
  Object.values(cargo.items).reduce((sum, n) => sum + n, 0);
const clear = () => ({ kind: '', workshop: '', items: {}, values: {} });
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
function supply(s) {
  for (const w of WORKSHOPS) {
    const m = s.village.workshops[w.id];
    if (!m.level) continue;
    for (const recipe of [w.inputs, ...(w.alternatives ?? [])]) {
      let room = Math.min(24, WORKSHOP_INPUT_CAPACITY - workshopStock(m));
      const items = {},
        values = {};
      for (const [id, needed] of Object.entries(recipe)) {
        if (room <= 0) break;
        const count = Math.min(
          room,
          Math.max(0, needed * 2 - (m.inputs?.[id] ?? 0)),
          s.village.raw[id] ?? 0,
        );
        if (count <= 0) continue;
        items[id] = count;
        values[id] =
          ((s.village.rawValues[id] ?? 0) * count) / s.village.raw[id];
        room -= count;
      }
      if (Object.keys(items).length)
        return { kind: 'supply', workshop: w.id, items, values };
    }
  }
  return null;
}
export function advanceWoodcock(s, dt) {
  const b = s.village.woodcock,
    events = [];
  if (!b?.unlocked || dt <= 0) return events;
  if (count(b.cargo) > 1e-8) {
    if (b.cargo.kind === 'sell') {
      if (walk(b, WORLD.bank, dt)) {
        const value = Object.values(b.cargo.values).reduce((a, n) => a + n, 0);
        credit(s, value);
        s.village.autoSold += count(b.cargo);
        b.cargo = clear();
        events.push({ kind: 'woodcockSale', value });
      }
    } else {
      const w = WORKSHOPS.find((w) => w.id === b.cargo.workshop);
      if (w && walk(b, { x: w.x - 1.8, z: w.z + 1.8 }, dt)) {
        const n = depositWorkshopSupplies(s, w, b.cargo);
        if (n) events.push({ kind: 'woodcockDelivery', x: b.x, z: b.z });
        if (count(b.cargo) < 1e-8) b.cargo = clear();
      }
    }
    return events;
  }
  if (b.task === 'search') {
    const target = spots[b.searchIndex % spots.length];
    if (walk(b, target, dt)) {
      b.timer += dt;
      if (b.timer >= 90) {
        b.timer = 0;
        b.searchIndex++;
        b.treasures++;
        events.push({ kind: 'woodcockFind', x: b.x, z: b.z });
      }
    }
    return events;
  }
  if (b.task === 'sell') {
    for (const w of WORKSHOPS) {
      const available = availableProducts(s, w.product, true);
      if (available <= 0) continue;
      if (walk(b, { x: w.x + 1.8, z: w.z + 1.8 }, dt)) {
        const batch = collectProducts(s, 12, true, w.product);
        b.cargo = {
          kind: 'sell',
          workshop: w.id,
          items: batch.items,
          values: batch.values,
        };
      }
      return events;
    }
  }
  if (b.task === 'supply') {
    const job = supply(s);
    if (job) {
      if (walk(b, VILLAGE.warehouse, dt)) {
        // Recomputed at pickup: another helper may have used the ingredients on the way.
        for (const [id, n] of Object.entries(job.items)) {
          s.village.raw[id] -= n;
          s.village.rawValues[id] -= job.values[id];
        }
        b.cargo = job;
      }
      return events;
    }
  }
  walk(b, VILLAGE.woodcock, dt);
  return events;
}
