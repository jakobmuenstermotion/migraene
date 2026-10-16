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
