import { capacity } from "./core.mjs";
import { ECONOMY } from "./economy.mjs";
import {
  getBuildPads,
  completeBuild,
  discoverSeeds,
  bedYield,
} from "./village.mjs";
import { dayPrice } from "./journey.mjs";
import { BEDS, VILLAGE } from "./village-content.mjs";

function dayBoost(s, total) {
  const base = structuredClone(s);
  base.journey.plan = null;
  // Include the manual bonus and best owned crop, without multiplying the old boost.
  const unit = Math.max(
    ...BEDS.map((_, i) =>
      s.village.beds[i] ? bedYield(base, i) * VILLAGE.manualBonus : 0,
    ),
  );
  // Larger bags save journeys. Bound their contribution by the field's regrowth,
  // rather than assuming an arbitrarily large bag can be refilled at the same rate.
  const units =
    (ECONOMY.dailyUnits + Math.min(capacity(s), ECONOMY.dailyBagAllowance)) *
    (1 + s.tools.reach * ECONOMY.dailyReachUnits);
  return Math.max(Number.MIN_VALUE, total / Math.max(1, units * unit));
}

// Quote the complete prerequisite closure, not a prescribed shopping list.
export function prepareDay(s, tools) {
  const existing = s.journey.plan;
  if (existing?.round === s.journey.round) {
    if (existing.balanceVersion !== ECONOMY.version) {
      // Keep the original day's budget, purchases and instalments. Only future
      // harvest changes; saved coins and the values of actual supplies stay intact.
      existing.boost = dayBoost(s, existing.target / (1 + ECONOMY.dailyBuffer));
      existing.balanceVersion = ECONOMY.version;
      existing.materials = existing.materials.map((step) => ({
        ...step,
        items: { ...VILLAGE.partner.materials[step.level] },
      }));
    }
    return existing;
  }
  const v = structuredClone(s),
    items = [],
    materials = [];
  v.journey.closed = false;
  v.journey.plan = null;
  discoverSeeds(v);
  for (let i = 0; i < 250; i++) {
    if (v.village.house < 3)
      for (const [id, n] of Object.entries(
        VILLAGE.partner.materials[v.village.house],
      )) {
        v.village.finished[id] = Math.max(n, v.village.finished[id] ?? 0);
        v.village.finishedValues[id] ??= 0;
      }
    const p = getBuildPads(v, tools).find(
      (p) =>
        p.id !== "endDay" && p.visible && !p.max && !p.locked && !p.optional,
    );
    if (!p) break;
    items.push({ id: p.id, level: p.level, cost: p.cost, paid: p.paid });
    if (p.id === "partner")
      materials.push({
        level: p.level,
        items: { ...VILLAGE.partner.materials[p.level] },
      });
    if (!completeBuild(v, p.id)) throw Error("Cannot quote " + p.id);
    discoverSeeds(v);
  }
  const total = items.reduce(
    (a, p) => a + p.cost - p.paid,
    Math.max(0, dayPrice(s) - (s.village.payments.endDay ?? 0)),
  );
  const plan = {
    version: 1,
    balanceVersion: ECONOMY.version,
    round: s.journey.round,
    target: Math.max(1, total * (1 + ECONOMY.dailyBuffer)),
    spent: 0,
    boost: dayBoost(s, total),
    items,
    materials,
  };
  s.journey.plan = plan;
  return plan;
}
