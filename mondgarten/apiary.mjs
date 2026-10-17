import {
  HIVES,
  HONEY_VALUE_MULTIPLIER,
  HONEY_SECONDS,
  HIVE_CAPACITY,
  SNACK_SECONDS,
  CONFECTION_ROUND,
} from "./honey-content.mjs";
import {
  bedYield,
  harvestMultiplier,
  productCargoCount,
  productionSeconds,
} from "./village.mjs";
import { capacity } from "./core.mjs";
import { WORKSHOPS } from "./village-content.mjs";
const num = (x, max = 1e100) =>
  Number.isFinite(x) && x >= 0 ? Math.min(max, x) : 0;
export function freshApiary() {
  return {
    hives: HIVES.map(() => ({ built: false, progress: 0, count: 0, value: 0 })),
    buffs: {},
    confection: { running: false, progress: 0, value: 0 },
  };
}
export function normalizeApiary(raw, snails = 0) {
  const a = freshApiary();
  if (!raw) return a;
  a.hives = a.hives.map((h, i) => ({
    built: raw.hives?.[i]?.built === true,
    progress: num(raw.hives?.[i]?.progress, HONEY_SECONDS),
    count: Math.floor(num(raw.hives?.[i]?.count, HIVE_CAPACITY)),
    value: num(raw.hives?.[i]?.value),
  }));
  for (const [id, b] of Object.entries(raw.buffs ?? {})) {
    if (
      (id === "partner" ||
        id === "woodcock" ||
        (/^snail:\d+$/.test(id) && Number(id.slice(6)) < snails)) &&
      HIVES.some((h) => h.honey === b?.honey) &&
      num(b.remaining, SNACK_SECONDS) > 0
    )
      a.buffs[id] = {
        honey: b.honey,
        remaining: num(b.remaining, SNACK_SECONDS),
      };
  }
  const c = raw.confection;
  a.confection = {
    running: c?.running === true,
    progress: c?.running ? num(c.progress, 60) : 0,
    value: c?.running ? num(c.value) : 0,
  };
  return a;
}
export function helperBoost(s, id) {
  if (s.journey.asleep || (s.journey.light ?? 0) >= 0.68) return 1;
  const b = s.village.apiary?.buffs[id];
  return b?.remaining > 0
    ? 1 + Math.min(0.4, HIVES.find((h) => h.honey === b.honey)?.boost ?? 0)
    : 1;
}
export function advanceApiary(s, cells, dt) {
  const a = s.village.apiary;
  if (!a || dt <= 0 || s.journey.asleep) return;
  if ((s.journey.light ?? 0) >= 0.68) return;
  for (const [id, b] of Object.entries(a.buffs)) {
    b.remaining = Math.max(0, b.remaining - dt);
    if (!b.remaining) delete a.buffs[id];
  }
  for (const [i, h] of a.hives.entries()) {
    const type = HIVES[i];
    if (
      !h.built ||
      !s.village.beds[type.bed] ||
      h.count >= HIVE_CAPACITY ||
      !cells.some(
        (c) => c.bed === type.bed && c.readyAt <= s.journey.growthTime,
      )
    )
      continue;
    h.progress += dt;
    while (h.progress >= HONEY_SECONDS && h.count < HIVE_CAPACITY) {
      h.progress -= HONEY_SECONDS;
      h.count++;
      h.value += bedYield(s, type.bed) * HONEY_VALUE_MULTIPLIER;
    }
    if (h.count === HIVE_CAPACITY) h.progress = 0;
  }
}
export function collectHoney(s, index) {
  const hive = s.village.apiary.hives[index],
    type = HIVES[index];
  if (!hive?.built || !type) return 0;
  const n = Math.min(
    hive.count,
    Math.max(0, Math.floor(capacity(s) - s.bag - productCargoCount(s))),
  );
  if (!n) return 0;
  const value = (hive.value * n) / hive.count;
  hive.count -= n;
  hive.value -= value;
  s.productCargo.items[type.honey] =
    (s.productCargo.items[type.honey] ?? 0) + n;
  s.productCargo.values[type.honey] =
    (s.productCargo.values[type.honey] ?? 0) + value;
  return n;
}
export function honeyCount(s, id = null, source = "all") {
  return HIVES.filter((h) => !id || h.honey === id).reduce(
    (sum, h) =>
      sum +
      (source !== "storage" ? (s.productCargo.items[h.honey] ?? 0) : 0) +
      (source !== "carried" ? (s.village.finished[h.honey] ?? 0) : 0),
    0,
  );
}
export function takeHoney(s, count, id = null, source = "all") {
  if (honeyCount(s, id, source) < count) return null;
  let value = 0;
  for (const h of HIVES.filter((h) => !id || h.honey === id))
    for (const from of ["carried", "storage"]) {
      if (source !== "all" && source !== from) continue;
      const counts =
          from === "carried" ? s.productCargo.items : s.village.finished,
        values =
          from === "carried" ? s.productCargo.values : s.village.finishedValues,
        n = Math.min(count, counts[h.honey] ?? 0);
      if (n) {
        const cost = ((values[h.honey] ?? 0) * n) / counts[h.honey];
        counts[h.honey] -= n;
        values[h.honey] -= cost;
        count -= n;
        value += cost;
      }
    }
  return value;
}
export function storeHoney(s) {
  let n = 0;
  for (const h of HIVES) {
    const count = s.productCargo.items[h.honey] ?? 0;
    if (!count) continue;
    s.village.finished[h.honey] = (s.village.finished[h.honey] ?? 0) + count;
    s.village.finishedValues[h.honey] =
      (s.village.finishedValues[h.honey] ?? 0) +
      (s.productCargo.values[h.honey] ?? 0);
    s.productCargo.items[h.honey] = 0;
    s.productCargo.values[h.honey] = 0;
    n += count;
  }
  return n;
}
export function giveHelperSnack(s, id, honey) {
  const valid =
    id === "partner"
      ? s.village.partner
      : id === "woodcock"
        ? s.village.woodcock.unlocked
        : /^snail:\d+$/.test(id) && Number(id.slice(6)) < s.village.snails;
  const snack = s.village.farm.snacks[honey];
  if (
    !valid ||
    !HIVES.some((h) => h.honey === honey) ||
    !snack?.count ||
    s.village.apiary.buffs[id]?.remaining > 0 ||
    s.journey.asleep ||
    (s.journey.light ?? 0) >= 0.68
  )
    return false;
  snack.value -= snack.value / snack.count;
  snack.count--;
  s.village.apiary.buffs[id] = { honey, remaining: SNACK_SECONDS };
  return true;
}
export function startHoneyApples(s) {
  const c = s.village.apiary.confection;
  if (
    s.journey.round < CONFECTION_ROUND ||
    !s.village.workshops.tea.level ||
    c.running ||
    (s.village.finished.honeyapple ?? 0) >= 24 ||
    honeyCount(s) < 2 ||
    (s.cargo.starfruit?.count ?? 0) + (s.village.raw.starfruit ?? 0) < 4
  )
    return false;
  let count = 4,
    value = takeHoney(s, 2);
  const carried = s.cargo.starfruit,
    n = Math.min(count, carried?.count ?? 0);
  if (n) {
    const cost = (carried.value * n) / carried.count;
    carried.count -= n;
    carried.value -= cost;
    s.bag -= n;
    s.bagValue -= cost;
    value += cost;
    count -= n;
    if (!carried.count) delete s.cargo.starfruit;
  }
  if (count) {
    const v = s.village,
      cost = ((v.rawValues.starfruit ?? 0) * count) / v.raw.starfruit;
    v.raw.starfruit -= count;
    v.rawValues.starfruit -= cost;
    value += cost;
  }
  c.running = true;
  c.progress = 0;
  c.value = value * 1.2;
  return true;
}
export function advanceHoneyApples(s, dt) {
  const c = s.village.apiary?.confection;
  if (!c?.running || dt <= 0 || !s.village.workshops.tea.level) return;
  const w = WORKSHOPS.find((w) => w.id === "tea"),
    seconds = productionSeconds(s, w) * 2;
  c.progress += dt;
  if (c.progress >= seconds) {
    s.village.finished.honeyapple = (s.village.finished.honeyapple ?? 0) + 1;
    s.village.finishedValues.honeyapple =
      (s.village.finishedValues.honeyapple ?? 0) + c.value;
    s.village.produced++;
    c.running = false;
    c.progress = 0;
    c.value = 0;
  }
}
