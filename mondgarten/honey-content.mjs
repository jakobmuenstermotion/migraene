// Each flower field has one permanent, optional hive two days after its opening.
export const HIVES = [
  {
    id: "moon",
    bed: 0,
    round: 3,
    honey: "moonHoney",
    name: "Mondblütenhonig",
    color: "#efd39b",
    boost: 0.2,
    x: -4.5,
    z: -10,
    pad: { x: -4.5, z: -13 },
  },
  {
    id: "lavender",
    bed: 1,
    round: 14,
    honey: "lavenderHoney",
    name: "Lavendelhonig",
    color: "#c8afd8",
    boost: 0.25,
    x: -10.5,
    z: -4.5,
    pad: { x: -13, z: -4.5 },
  },
  {
    id: "coral",
    bed: 2,
    round: 49,
    honey: "coralHoney",
    name: "Korallenhonig",
    color: "#e8b29c",
    boost: 0.3,
    x: 29,
    z: 26,
    pad: { x: 32.2, z: 26 },
  },
  {
    id: "sun",
    bed: 6,
    round: 70,
    honey: "sunHoney",
    name: "Sonnenhonig",
    color: "#e5bd64",
    boost: 0.35,
    x: -28,
    z: -28.5,
    pad: { x: -25.2, z: -29 },
  },
];
export const HONEY_VALUE_MULTIPLIER = 24;
export const HONEY_SECONDS = 90,
  HIVE_CAPACITY = 3,
  SNACK_SECONDS = 120,
  CONFECTION_ROUND = 52;
export const HONEY_PRODUCTS = Object.fromEntries(
  HIVES.map((h) => [
    h.honey,
    { name: h.name, plural: h.name, icon: "⬡", color: h.color, value: HONEY_VALUE_MULTIPLIER },
  ]),
);
