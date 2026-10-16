import { availableProducts } from "./village.mjs";
import { credit } from "./money.mjs";
export const SNAILS = [
  { id: "garden", name: "Gartenschnecke", color: "#d4b38b", round: 18 },
  { id: "dew", name: "Tauschnecke", color: "#a4c9bc", round: 18 },
  { id: "lavender", name: "Lavendelschnecke", color: "#b6a0d4", round: 25 },
  { id: "honey", name: "Honigschnecke", color: "#e1bf76", round: 25 },
  { id: "moss", name: "Moosschnecke", color: "#91b17c", round: 32 },
  { id: "coral", name: "Korallenschnecke", color: "#dca19a", round: 36 },
  { id: "moon", name: "Mondschnecke", color: "#c4cadf", round: 43 },
  { id: "apple", name: "Apfelschnecke", color: "#c3cc7e", round: 47 },
  { id: "amber", name: "Bernsteinschnecke", color: "#cd9d65", round: 59 },
  { id: "star", name: "Sternenschnecke", color: "#8ea9d0", round: 68 },
];
export const FARM = {
  slots: 6,
  maxShells: 30,
  careVersion: 2,
  growSeconds: 40 * 60,
  mealSeconds: 10 * 60,
  helperMax: 12,
  findEvery: 240,
  findCooldown: 180,
  maxFindsPerDay: 2,
};
const num = (x, max = 1e9) =>
  Number.isFinite(x) && x >= 0 ? Math.min(x, max) : 0;
const species = (id) => SNAILS.some((s) => s.id === id);
export function freshFarm() {
  return {
    careVersion: FARM.careVersion,
    built: false,
    shells: {},
    nursery: [],
    helpers: [],
    discovered: [],
    food: 0,
    foodValue: 0,
    nextID: 1,
    findProgress: 0,
    findClock: 0,
    findRound: 0,
    findsToday: 0,
    rng: 2463534242,
    sold: 0,
  };
}
export function normalizeFarm(raw) {
  const f = freshFarm();
  if (!raw) return f;
  f.built = raw.built === true;
  for (const key of ["food", "nextID", "findRound", "findsToday", "sold"])
    f[key] = Math.floor(num(raw[key]));
  f.nextID = Math.max(1, f.nextID);
  f.foodValue = num(raw.foodValue);
  f.findProgress = num(raw.findProgress, FARM.findEvery);
  f.findClock = num(raw.findClock, FARM.findCooldown);
  f.rng = Math.floor(num(raw.rng, 0xffffffff)) || 2463534242;
  let room = FARM.maxShells;
  for (const s of SNAILS) {
    const count = Math.min(
      room,
      Math.floor(num(raw.shells?.[s.id], FARM.maxShells)),
    );
    if (count) {
      f.shells[s.id] = count;
      room -= count;
    }
  }
  const ids = new Set();
  f.nursery = (raw.nursery ?? [])
    .slice(0, FARM.slots)
    .filter(
      (n) =>
        n &&
        Number.isSafeInteger(n.id) &&
        n.id > 0 &&
        !ids.has(n.id) &&
        ids.add(n.id) &&
        species(n.species),
    )
    .map((n) => ({
      id: n.id,
      species: n.species,
      growth:
        raw.careVersion !== FARM.careVersion && n.growth >= 720
          ? FARM.growSeconds
          : num(n.growth, FARM.growSeconds),
      meal: num(n.meal, FARM.mealSeconds),
      investment: num(n.investment),
    }));
  f.nextID = Math.max(f.nextID, ...f.nursery.map((n) => n.id + 1));
  f.helpers = Array.isArray(raw.helpers)
    ? raw.helpers
        .slice(0, FARM.helperMax)
        .map((id) => (species(id) ? id : null))
    : [];
  f.discovered = Array.isArray(raw.discovered)
    ? [...new Set(raw.discovered.filter(species))]
    : [];
  return f;
}
export function farmHelperLimit(s) {
  return Math.min(
    FARM.helperMax,
    Math.max(0, 1 + Math.floor((s.journey.round - 7) / 6)),
  );
}
function random(f) {
  let x = f.rng;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  f.rng = x >>> 0;
  return f.rng / 4294967296;
}
export function discoverShell(s, harvested, dt) {
  const f = s.village.farm;
  if (!f?.built) return null;
  if (f.findRound !== s.journey.round) {
    f.findRound = s.journey.round;
    f.findsToday = 0;
  }
  f.findProgress = Math.min(
    FARM.findEvery,
    f.findProgress + Math.max(0, harvested),
  );
  f.findClock = Math.min(FARM.findCooldown, f.findClock + Math.max(0, dt));
  if (
    f.findsToday >= FARM.maxFindsPerDay ||
    f.findClock < FARM.findCooldown ||
    f.findProgress < FARM.findEvery ||
    Object.values(f.shells).reduce((a, b) => a + b, 0) >= FARM.maxShells
  )
    return null;
  const choices = SNAILS.filter((n) => n.round <= s.journey.round);
  const found = choices[Math.floor(Math.pow(random(f), 1.8) * choices.length)];
  if (!found) return null;
  f.shells[found.id] = (f.shells[found.id] ?? 0) + 1;
  if (!f.discovered.includes(found.id)) f.discovered.push(found.id);
  f.findProgress = 0;
  f.findClock = 0;
  f.findsToday++;
  return found;
}
export function moveShellToFarm(s, id) {
  const f = s.village.farm;
  if (
    !f.built ||
    !species(id) ||
    !(f.shells[id] > 0) ||
    f.nursery.length >= FARM.slots
  )
    return false;
  f.shells[id]--;
  if (!f.shells[id]) delete f.shells[id];
  f.nursery.push({
    id: f.nextID++,
    species: id,
    growth: 0,
    meal: 0,
    investment: 0,
  });
  return true;
}
function rawCount(s, id) {
  return (s.cargo?.[id]?.count ?? 0) + (s.village.raw[id] ?? 0);
}
function takeRaw(s, id, count) {
  let value = 0;
  const carried = s.cargo?.[id],
    amount = Math.min(count, carried?.count ?? 0);
  if (amount) {
    const cost = (carried.value * amount) / carried.count;
    carried.count -= amount;
    carried.value -= cost;
    s.bag -= amount;
    s.bagValue -= cost;
    value += cost;
    count -= amount;
    if (carried.count < 1e-8) delete s.cargo[id];
  }
  if (count) {
    const v = s.village,
      cost = ((v.rawValues[id] ?? 0) * count) / v.raw[id];
    v.raw[id] -= count;
    v.rawValues[id] -= cost;
    value += cost;
  }
  if (s.bag < 1e-8) {
    s.bag = 0;
    s.bagValue = 0;
  }
  return value;
}
export const FOOD_RECIPES = {
  flowers: { inputs: { moonbloom: 60, bouquet: 3 }, portions: 2 },
  fruit: { inputs: { moonbloom: 30, starfruit: 8, tea: 1 }, portions: 3 },
};
// Retain a small batch at the workshops so automatic sellers cannot make food impossible.
export function farmFoodReserve(s, id) {
  const f = s.village.farm;
  if (
    !f?.built ||
    f.food >= 2 ||
    !f.nursery.some((n) => n.growth < FARM.growSeconds)
  )
    return 0;
  return id === "bouquet" ? 3 : id === "tea" && s.village.beds[4] ? 1 : 0;
}
const productIDs = new Set(["bouquet", "tea"]);
export function foodIngredientCount(s, id) {
  return productIDs.has(id)
    ? (s.productCargo?.items?.[id] ?? 0) +
        availableProducts(s, id, true, { forFarm: true })
    : rawCount(s, id);
}
function takeFoodIngredient(s, id, count) {
  if (!productIDs.has(id)) return takeRaw(s, id, count);
  const cargo = s.productCargo,
    carried = Math.min(count, cargo?.items?.[id] ?? 0);
  let value = 0;
  if (carried) {
    value = (cargo.values[id] * carried) / cargo.items[id];
    cargo.items[id] -= carried;
    cargo.values[id] -= value;
    count -= carried;
  }
  if (count) {
    const v = s.village,
      cost = ((v.finishedValues[id] ?? 0) * count) / v.finished[id];
    v.finished[id] -= count;
    v.finishedValues[id] -= cost;
    value += cost;
  }
  return value;
}
export function makeSnailFood(s, recipe = "flowers") {
  const f = s.village.farm,
    definition = Object.hasOwn(FOOD_RECIPES, recipe)
      ? FOOD_RECIPES[recipe]
      : null;
  if (
    !f.built ||
    !definition ||
    f.food + definition.portions > 100 ||
    !Object.entries(definition.inputs).every(
      ([id, count]) => foodIngredientCount(s, id) >= count,
    )
  )
    return false;
  let value = 0;
  for (const [id, count] of Object.entries(definition.inputs))
    value += takeFoodIngredient(s, id, count);
  f.foodValue = (f.foodValue ?? 0) + value;
  f.food += definition.portions;
  return true;
}
export function feedSnail(s, id) {
  const f = s.village.farm,
    n = f.nursery.find((n) => n.id === id);
  if (!n || n.growth >= FARM.growSeconds || n.meal > 0 || f.food < 1)
    return false;
  const value = (f.foodValue ?? 0) / f.food;
  f.foodValue = Math.max(0, (f.foodValue ?? 0) - value);
  f.food--;
  n.investment += value;
  n.meal = FARM.mealSeconds;
  return true;
}
export function advanceFarm(s, dt) {
  const f = s.village.farm;
  if (!f?.built) return;
  for (const n of f.nursery) {
    const growth = Math.min(
      Math.max(0, dt),
      n.meal,
      FARM.growSeconds - n.growth,
    );
    n.growth += growth;
    n.meal -= growth;
  }
}
export function releaseSnail(s, id, mode) {
  const f = s.village.farm,
    i = f.nursery.findIndex((n) => n.id === id);
  if (i < 0 || f.nursery[i].growth < FARM.growSeconds) return false;
  const n = f.nursery[i];
  if (mode === "helper") {
    if (s.village.snails >= farmHelperLimit(s)) return false;
    s.village.snails++;
    s.helpers = s.village.snails;
    s.stats.helpers++;
    while (f.helpers.length < s.village.snails - 1) f.helpers.push(null);
    f.helpers[s.village.snails - 1] = n.species;
  } else if (mode === "sell") {
    // A shell is a collectible, never an unlimited money multiplier.
    credit(
      s,
      n.investment +
        Math.min(
          n.investment * 0.25,
          150 * Math.pow(1.055, Math.min(76, s.journey.round - 1)),
        ),
    );
    f.sold++;
  } else return false;
  f.nursery.splice(i, 1);
  return true;
}
