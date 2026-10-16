import { GardenAutomation } from "./mondgarten/automation.mjs";
import { createVillageField, harvestAt } from "./mondgarten/harvest.mjs";
import { getBuildPads, payBuild } from "./mondgarten/village.mjs";
import test from "node:test";
import assert from "node:assert/strict";
import {
  freshState,
  normalize,
  TOOLS,
  offlineEarnings,
} from "./mondgarten/core.mjs";
import { prepareDay } from "./mondgarten/daily.mjs";
import {
  tickJourney,
  closeDay,
  grantRound,
  startRound,
  rewardCount,
  growthFactor,
} from "./mondgarten/journey.mjs";
import { DAY_RHYTHM, advanceDayRhythm } from "./mondgarten/day-rhythm.mjs";
import {
  BOUTIQUES,
  COSMETICS,
  cosmeticPrice,
  contributeCosmetic,
  equipCosmetic,
} from "./mondgarten/boutiques.mjs";

test("boutiques preserve instalments, cannot overspend or charge twice, and do not change daily quotes", () => {
  let s = freshState();
  s.journey.round = 20;
  s.coins = 100000;
  prepareDay(s, TOOLS);
  const quote = s.journey.plan.target,
    boost = s.journey.plan.boost;
  assert.equal(contributeCosmetic(s, "flower", 100).paid, 0);
  assert.equal(contributeCosmetic(s, "style", 100).paid, 100);
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(s.village.boutiques.payments.style, 100);
  const before = s.coins;
  assert.equal(contributeCosmetic(s, "style", 1e9).complete, true);
  assert.equal(before - s.coins, cosmeticPrice("style") - 100);
  assert.equal(contributeCosmetic(s, "style", 100).paid, 0);
  assert.equal(s.village.boutiques.built.length, 1);
  assert.equal(s.journey.plan.target, quote);
  assert.equal(s.journey.plan.boost, boost);
  assert.equal(contributeCosmetic(s, "flower", 1e9).complete, true);
  assert.equal(equipCosmetic(s, 0, "flower"), true);
  assert.equal(equipCosmetic(s, 1, "flower"), true);
  assert.deepEqual(
    normalize(JSON.parse(JSON.stringify(s))).village.boutiques.equipped,
    ["flower", "flower"],
  );
  assert.equal(equipCosmetic(s, 0, "arch"), false);
  assert.equal(equipCosmetic(s, 9, "flower"), false);
  assert.equal(equipCosmetic(s, 0, null), true);
});

test("shops are optional, round gated, wallet independent and remain usable after day close", () => {
  const s = freshState();
  s.coins = 20;
  assert.equal(contributeCosmetic(s, "decor", 100).paid, 0);
  s.journey.round = 12;
  s.journey.closed = true;
  assert.equal(contributeCosmetic(s, "decor", 100).paid, 20);
  assert.equal(s.coins, 0);
  assert.equal(contributeCosmetic(s, "decor", NaN).paid, 0);
  assert.equal(contributeCosmetic(s, "decor", -1).paid, 0);
  assert.equal(contributeCosmetic(s, "decor", Infinity).paid, 0);
  assert.equal(normalize({ v: 2 }).village.boutiques.built.length, 0);
  s.journey.round = 77;
  s.coins = 1e9;
  for (const d of [...BOUTIQUES, ...COSMETICS])
    assert.equal(contributeCosmetic(s, d.id, 1e9).complete, true);
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.village.boutiques.owned.length, COSMETICS.length);
});

test("warnings persist once each, sleep refunds only unfinished daily reward and preserves assets", () => {
  let s = freshState();
  s.coins = 100;
  s.village.raw = { moonbloom: 12 };
  s.village.payments = { endDay: 75, "bed:0": 30 };
  s.village.boutiques.payments.decor = 20;
  s.journey.elapsed = DAY_RHYTHM.warning;
  assert.equal(advanceDayRhythm(s).kind, "warning");
  assert.equal(advanceDayRhythm(s), null);
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(advanceDayRhythm(s), null);
  s.journey.elapsed = DAY_RHYTHM.lastWarning;
  assert.equal(advanceDayRhythm(s).seconds, 60);
  s.journey.elapsed = DAY_RHYTHM.sleep;
  assert.deepEqual(advanceDayRhythm(s), {
    kind: "sleep",
    missed: true,
    refund: 75,
  });
  assert.equal(s.coins, 175);
  assert.equal(s.village.payments["bed:0"], 30);
  assert.equal(s.village.boutiques.payments.decor, 20);
  assert.equal(s.village.raw.moonbloom, 12);
  assert.equal(s.journey.rewards.length, 0);
  assert.equal(growthFactor(s), 0);
  assert.equal(tickJourney(s, 20), 0);
  assert.equal(advanceDayRhythm(s), null);
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(s.journey.asleep, true);
  assert.equal(startRound(s), false);
  assert.equal(grantRound(s, "test:next"), true);
  assert.equal(startRound(s), true);
  assert.equal(s.journey.asleep, false);
  assert.equal(s.journey.sleepWarning, 0);
  assert.equal(s.journey.elapsed, 0);
});

test("a purchased reward closes the day, allows remaining active time, and survives sleep", () => {
  const s = freshState();
  s.journey.elapsed = 180;
  assert.equal(closeDay(s), true);
  assert.equal(advanceDayRhythm(s), null);
  assert.ok(tickJourney(s, 30) > 0);
  assert.equal(s.journey.asleep, false);
  s.journey.elapsed = DAY_RHYTHM.sleep;
  assert.equal(advanceDayRhythm(s).missed, false);
  assert.equal(s.journey.rewards.length, 1);
  assert.equal(closeDay(s), false);
});

test("missed days cannot permanently lose the seven seeds and seventy watering rewards", () => {
  let s = freshState();
  let missed = 0;
  // Miss early seed days and several later days; recover through further earned entries.
  for (let round = 1; round <= 100; round++) {
    if ([1, 12, 23, 34, 45, 56, 67, 77].includes(round)) {
      s.journey.elapsed = DAY_RHYTHM.sleep;
      advanceDayRhythm(s);
      missed++;
    } else assert.equal(closeDay(s), true);
    s = normalize(JSON.parse(JSON.stringify(s)));
    if (round < 100) {
      grantRound(s, "entry:recovery" + round);
      assert.equal(startRound(s), true);
    }
  }
  assert.equal(missed, 8);
  assert.equal(rewardCount(s, "seed"), 7);
  assert.equal(rewardCount(s, "water"), 70);
  assert.equal(new Set(s.journey.rewards.map((r) => r.id)).size, 77);
});

test("unearned and absent days do not collapse, and legacy long sessions get a warning window", () => {
  const s = freshState();
  s.journey.round = 0;
  s.journey.elapsed = 1e6;
  assert.equal(advanceDayRhythm(s), null);
  const old = freshState();
  delete old.journey.rhythmVersion;
  old.journey.elapsed = 4000;
  const loaded = normalize(old);
  assert.equal(loaded.journey.elapsed, DAY_RHYTHM.warning);
  assert.equal(advanceDayRhythm(loaded).kind, "warning");
  loaded.savedAt -= 8 * 3600 * 1000;
  offlineEarnings(loaded);
  assert.equal(loaded.journey.asleep, false);
});

test("legacy daily plans refresh their yield exactly once without revaluing saved supplies", () => {
  const s = freshState();
  s.journey.round = 22;
  s.coins = 123;
  const plan = prepareDay(s, TOOLS);
  plan.balanceVersion = 5;
  plan.boost = 1e6;
  plan.spent = 77;
  s.village.raw = { moonbloom: 10 };
  s.village.rawValues = { moonbloom: 250 };
  const migrated = prepareDay(s, TOOLS);
  assert.ok(migrated.boost > 0 && migrated.boost < 1e6);
  assert.equal(migrated.spent, 77);
  const boost = migrated.boost;
  const loaded = normalize(JSON.parse(JSON.stringify(s)));
  prepareDay(loaded, TOOLS);
  assert.equal(loaded.journey.plan.boost, boost);
  assert.equal(loaded.coins, 123);
  assert.equal(loaded.village.rawValues.moonbloom, 250);
});

test("early upgrade choices do not add costs to the regular daily plan", () => {
  const s = freshState();
  s.journey.round = 3;
  s.coins = 1e7;
  s.tools = { reach: 1, bag: 1, speed: 16, value: 16 };
  s.village.beds[0] = 5;
  s.village.workshops.bouquet.level = 7;
  const pads = getBuildPads(s, TOOLS),
    reach = pads.find((p) => p.id === "tool:reach"),
    bag = pads.find((p) => p.id === "tool:bag");
  assert.equal(reach.optional, true);
  assert.equal(reach.locked, false);
  assert.equal(reach.availableRound, 3);
  assert.equal(reach.requiredRound, 6);
  assert.equal(bag.optional, true);
  const onSchedule = structuredClone(s);
  onSchedule.journey.round = 6;
  assert.equal(
    getBuildPads(onSchedule, TOOLS).find((p) => p.id === reach.id).cost,
    reach.cost,
  );
  const plan = prepareDay(s, TOOLS);
  assert.deepEqual(plan.items, []);
  assert.equal(plan.target, s.journey.goalCost * 1.015);
  const poor = structuredClone(s);
  poor.coins = 0;
  assert.equal(
    getBuildPads(poor, TOOLS).find((p) => p.id === reach.id).cost,
    reach.cost,
  );
  assert.equal(closeDay(s), true);
  assert.ok(payBuild(s, reach, 10).complete);
  assert.equal(s.tools.reach, 2);
  assert.equal(s.tools.bag, 1);
  assert.equal(s.journey.rewards.length, 1);
  const next = getBuildPads(s, TOOLS).find((p) => p.id === "tool:reach");
  assert.equal(next.locked, true);
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.tools.reach, 2);
  assert.equal(restored.tools.bag, 1);
});

test("the late-day growth curve freezes at nine minutes but ripe harvest remains available", () => {
  const s = freshState();
  s.journey.closed = true;
  for (const [t, factor] of [
    [300, 1],
    [360, 0.7],
    [420, 0.4],
    [480, 0.1],
    [540, 0],
    [599, 0],
  ]) {
    s.journey.elapsed = t;
    assert.ok(Math.abs(growthFactor(s) - factor) < 1e-10);
  }
  s.journey.elapsed = 540;
  s.journey.growthTime = 402;
  const cell = createVillageField(s)[0];
  assert.ok(harvestAt(s, [cell], cell.x, cell.z, 402).length > 0);
  assert.ok(cell.readyAt > 402);
  assert.equal(tickJourney(s, 59), 0);
  assert.equal(s.journey.growthTime, 402);
  assert.equal(harvestAt(s, [cell], cell.x, cell.z, 402).length, 0);
  assert.equal(s.journey.asleep, false);
  tickJourney(s, 1);
  assert.equal(advanceDayRhythm(s).kind, "sleep");
  const ripe = { ...cell, readyAt: 0 };
  assert.equal(harvestAt(s, [ripe], ripe.x, ripe.z, 402).length, 0);
});

test("growth across the five/eight/nine minute boundaries is independent of frame size", () => {
  const one = freshState(),
    frames = freshState();
  tickJourney(one, 600);
  for (let i = 0; i < 1200; i++) tickJourney(frames, 0.5);
  assert.equal(one.journey.growthTime, 402);
  assert.ok(
    Math.abs(frames.journey.growthTime - one.journey.growthTime) < 1e-8,
  );
});

test("helpers can collect already ripe plants after regrowth has stopped", () => {
  const s = freshState();
  s.journey.elapsed = 550;
  s.journey.growthTime = 402;
  s.village.snails = 1;
  const cells = createVillageField(s),
    cell = cells[0],
    automation = new GardenAutomation(s);
  automation.snails[0].x = cell.x;
  automation.snails[0].z = cell.z;
  const events = automation.update(s, [cell], null, 1, 402);
  assert.ok(events.some((e) => e.kind === "snail"));
  assert.ok(cell.readyAt > 402);
  assert.equal(s.journey.growthTime, 402);
});
