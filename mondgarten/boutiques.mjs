import { ECONOMY } from "./economy.mjs";

// Long-term savings goals: fixed prices, outside the daily funding quote.
// priceRound preserves existing totals when availability moves to another day.
export const BOUTIQUES = [
  {
    id: "style",
    name: "Faden & Blüte",
    description: "Accessoires für euch beide",
    round: 12,
    priceRound: 20,
    base: 200000,
    x: 6,
    z: -18,
    color: "#b59acb",
  },
  {
    id: "decor",
    name: "Gartenglück",
    description: "Dekorationen für euren Garten",
    round: 20,
    priceRound: 12,
    base: 125000,
    x: -3,
    z: -18,
    color: "#d5a17c",
  },
];
export const COSMETICS = [
  {
    id: "lanterns",
    shop: "decor",
    name: "Zwei Mondlaternen",
    round: 20,
    priceRound: 12,
    base: 100000,
    description: "Warme Lichter am Gartenweg.",
  },
  {
    id: "bench",
    shop: "decor",
    name: "Bank für zwei",
    round: 20,
    priceRound: 18,
    base: 250000,
    description: "Ein kleiner gemeinsamer Lieblingsplatz.",
  },
  {
    id: "arch",
    shop: "decor",
    name: "Blütenbogen",
    round: 30,
    base: 250000,
    description: "Ein blühender Eingang zum Garten.",
  },
  {
    id: "flower",
    shop: "style",
    name: "Blüte im Haar",
    round: 12,
    priceRound: 20,
    base: 100000,
    description: "Eine kleine korallfarbene Blüte.",
  },
  {
    id: "snailEyes",
    shop: "style",
    name: "Aufsetzbare Schneckenaugen",
    round: 22,
    base: 225000,
    description:
      "Ein grüner Haarreif mit zwei lustigen Schneckenaugen auf Fühlern.",
  },
  {
    id: "hat",
    shop: "style",
    name: "Sonnenhut",
    round: 24,
    base: 225000,
    description: "Strohhut mit salbeigrünem Band.",
  },
  {
    id: "scarf",
    shop: "style",
    name: "Lavendelschal",
    round: 28,
    base: 400000,
    description: "Ein weicher Schal für späte Gartenstunden.",
  },
];
const definition = (id) =>
  BOUTIQUES.find((x) => x.id === id) ?? COSMETICS.find((x) => x.id === id);
export const cosmeticPrice = (id) => {
  const d = definition(id);
  return d
    ? Math.ceil(
        d.base * Math.pow(ECONOMY.costGrowth, (d.priceRound ?? d.round) - 1),
      )
    : 0;
};
export const freshBoutiques = () => ({
  built: [],
  owned: [],
  payments: {},
  equipped: [null, null],
});
export function normalizeBoutiques(raw) {
  const b = freshBoutiques();
  b.built = BOUTIQUES.filter((d) => raw?.built?.includes?.(d.id)).map(
    (d) => d.id,
  );
  b.owned = COSMETICS.filter(
    (d) => b.built.includes(d.shop) && raw?.owned?.includes?.(d.id),
  ).map((d) => d.id);
  for (const d of [...BOUTIQUES, ...COSMETICS]) {
    const paid = raw?.payments?.[d.id];
    if (
      Number.isFinite(paid) &&
      paid > 0 &&
      !b.built.includes(d.id) &&
      !b.owned.includes(d.id)
    )
      b.payments[d.id] = Math.min(paid, cosmeticPrice(d.id));
  }
  for (let i = 0; i < 2; i++) {
    const id = raw?.equipped?.[i];
    if (
      COSMETICS.some((d) => d.id === id && d.shop === "style") &&
      b.owned.includes(id)
    )
      b.equipped[i] = id;
  }
  return b;
}
export function contributeCosmetic(s, id, requested) {
  const d = definition(id),
    b = s.village.boutiques;
  if (
    !d ||
    !Number.isFinite(requested) ||
    requested <= 0 ||
    s.journey.round < d.round ||
    b.built.includes(id) ||
    b.owned.includes(id) ||
    (d.shop && !b.built.includes(d.shop))
  )
    return { paid: 0, complete: false };
  const cost = cosmeticPrice(id),
    before = b.payments[id] ?? 0,
    paid = Math.min(
      requested,
      Math.max(0, s.coins),
      Math.max(0, cost - before),
    );
  if (paid <= 0) return { paid: 0, complete: false };
  s.coins -= paid;
  b.payments[id] = before + paid;
  if (s.journey.plan) s.journey.plan.spent += paid;
  const complete = b.payments[id] >= cost - 1e-7;
  if (complete) {
    (d.shop ? b.owned : b.built).push(id);
    delete b.payments[id];
  }
  return { paid, complete };
}
export function equipCosmetic(s, actor, id) {
  const b = s.village.boutiques;
  if (
    ![0, 1].includes(actor) ||
    (id !== null &&
      (!b.owned.includes(id) ||
        !COSMETICS.some((d) => d.id === id && d.shop === "style")))
  )
    return false;
  b.equipped[actor] = id;
  return true;
}
