import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize } from "./mondgarten/core.mjs";
import { GardenAutomation } from "./mondgarten/automation.mjs";
import { createVillageField } from "./mondgarten/harvest.mjs";
import { tickJourney } from "./mondgarten/journey.mjs";
import { stockCount, storageCapacity } from "./mondgarten/village.mjs";

function fullLoad(level) {
  const s = freshState();
  s.village.snails = 1;
  s.village.snailLevel = level;
  const cells = createVillageField(s);
  for (const cell of cells) cell.rare = false;
  const automation = new GardenAutomation(s);
  const previousLimit = 12 + 2 * level;
  let workedPastOldLimit = false;
  for (let i = 0; i < 9000; i++) {
    tickJourney(s, 1 / 30);
    automation.update(s, cells, null, 1 / 30, s.journey.growthTime);
    const snail = automation.snails[0];
    if (snail.bag >= previousLimit && snail.mode === "graze")
      workedPastOldLimit = true;
    if (snail.mode === "deliver") {
      assert.ok(
        workedPastOldLimit,
        "helper should keep harvesting beyond its old carrying limit",
      );
      return { s, cells, automation };
    }
  }
  assert.fail("helper never filled its cargo");
}

test("larger helper loads arrive intact after saving mid-transport at both upgrade extremes", () => {
  for (const [level, expected] of [
    [0, 24],
    [10, 64],
  ]) {
    let { s, cells, automation } = fullLoad(level);
    assert.equal(automation.snails[0].bag, expected);
    const value = Object.values(automation.snails[0].values).reduce(
      (a, b) => a + b,
      0,
    );
    automation.snapshot(s);
    s = normalize(JSON.parse(JSON.stringify(s)));
    automation = new GardenAutomation(s);
    assert.equal(automation.snails[0].bag, expected);
    for (let i = 0; i < 9000 && automation.snails[0].bag > 0; i++) {
      tickJourney(s, 1 / 30);
      automation.update(s, cells, null, 1 / 30, s.journey.growthTime);
    }
    assert.equal(automation.snails[0].bag, 0);
    assert.equal(stockCount(s.village), expected);
    assert.ok(Math.abs(s.village.rawValues.moonbloom - value) < 1e-8);
    assert.equal(s.stats.harvested, expected);
    assert.equal(s.coins, 0, "transport must not create money");
  }
});

test("larger loads keep undelivered stock and its value when only part fits in storage", () => {
  let { s, cells, automation } = fullLoad(10);
  const value = automation.snails[0].values.moonbloom;
  const before = storageCapacity(s) - 10;
  s.village.raw.moonbloom = before;
  s.village.rawValues.moonbloom = before;
  for (let i = 0; i < 1800 && automation.snails[0].bag === 64; i++)
    automation.update(s, cells, null, 1 / 30, s.journey.growthTime);
  assert.equal(stockCount(s.village), storageCapacity(s));
  assert.equal(automation.snails[0].bag, 54);
  assert.ok(
    Math.abs(
      s.village.rawValues.moonbloom +
        automation.snails[0].values.moonbloom -
        before -
        value,
    ) < 1e-8,
  );
  automation.snapshot(s);
  s = normalize(JSON.parse(JSON.stringify(s)));
  automation = new GardenAutomation(s);
  for (let i = 0; i < 30; i++)
    automation.update(s, cells, null, 1 / 30, s.journey.growthTime);
  assert.equal(
    automation.snails[0].bag,
    54,
    "full storage must not erase the remaining load",
  );
  s.village.raw = {};
  s.village.rawValues = {};
  automation.update(s, cells, null, 1 / 30, s.journey.growthTime);
  assert.equal(automation.snails[0].bag, 0);
  assert.equal(stockCount(s.village), 54);
  assert.ok(Math.abs(s.village.rawValues.moonbloom - (value * 54) / 64) < 1e-8);
});
