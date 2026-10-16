// Five active minutes on the first bed: actual regrowth, movement, cargo and unloading.
// Manual play follows an efficient route, not a measured human playing speed.
import {
  freshState,
  capacity,
  moveSpeed,
  harvestRate,
} from "../mondgarten/core.mjs";
import { WORLD } from "../mondgarten/content.mjs";
import { VILLAGE } from "../mondgarten/village-content.mjs";
import {
  createVillageField,
  harvestAt,
  unload,
} from "../mondgarten/harvest.mjs";
import { GardenAutomation } from "../mondgarten/automation.mjs";
import { tickJourney } from "../mondgarten/journey.mjs";
import { stockCount } from "../mondgarten/village.mjs";
const dt = 1 / 30;
function manual(toolLevel = 0) {
  const s = freshState();
  for (const id of ["bag", "reach", "speed"]) s.tools[id] = toolLevel;
  const cells = createVillageField(s),
    p = { ...WORLD.spawn };
  let clock = 0,
    selling = false,
    rate = 0;
  for (let i = 0; i < 300 / dt; i++) {
    tickJourney(s, dt);
    clock += dt;
    if (s.bag >= capacity(s)) selling = true;
    let target;
    if (selling) target = WORLD.bank;
    else
      target =
        cells
          .filter((c) => c.readyAt <= s.journey.growthTime)
          .sort(
            (a, b) =>
              Math.hypot(a.x - p.x, a.z - p.z) -
              Math.hypot(b.x - p.x, b.z - p.z),
          )[0] ?? p;
    const d = Math.hypot(target.x - p.x, target.z - p.z),
      step = (moveSpeed(s) / 38) * dt;
    p.moving = d > step;
    if (d) {
      p.x += ((target.x - p.x) / d) * Math.min(d, step);
      p.z += ((target.z - p.z) / d) * Math.min(d, step);
    }
    if (selling && d <= step) {
      rate ||= Math.max(28, s.bag / 1.3);
      unload(s, rate * dt);
      if (s.bag < 1e-6) {
        selling = false;
        rate = 0;
      }
    }
    while (clock >= harvestRate(s)) {
      clock -= harvestRate(s);
      harvestAt(s, cells, p.x, p.z, s.journey.growthTime, 1, {
        moving: p.moving,
        dt: harvestRate(s),
      });
    }
  }
  return {
    toolLevel,
    capacity: capacity(s),
    harvested: s.stats.harvested,
    perMinute: s.stats.harvested / 5,
    bag: s.bag,
  };
}
function snail(level, cap, perLevel = 2) {
  VILLAGE.snail.capacity = cap;
  VILLAGE.snail.capacityPerLevel = perLevel;
  const s = freshState();
  s.village.snails = 1;
  s.village.snailLevel = level;
  s.village.warehouse = 5;
  const cells = createVillageField(s),
    a = new GardenAutomation(s);
  let trips = 0;
  for (let i = 0; i < 300 / dt; i++) {
    tickJourney(s, dt);
    trips += a
      .update(s, cells, { x: -30, z: 30 }, dt, s.journey.growthTime)
      .filter((e) => e.kind === "warehouseDelivery").length;
  }
  return {
    level,
    cap: cap + level * perLevel,
    harvested: s.stats.harvested,
    perMinute: s.stats.harvested / 5,
    stored: stockCount(s.village),
    carried: a.snails[0].bag,
    trips,
  };
}
const original = { ...VILLAGE.snail };
try {
  console.log(
    JSON.stringify(
      {
        seconds: 300,
        dt,
        manual: [0, 2, 6, 10].map(manual),
        previous: [0, 3, 6, 10].map((level) => snail(level, 12, 2)),
        current: [0, 3, 6, 10].map((level) =>
          snail(level, original.capacity, original.capacityPerLevel),
        ),
      },
      null,
      2,
    ),
  );
} finally {
  Object.assign(VILLAGE.snail, original);
}
