import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize } from "./mondgarten/core.mjs";
import { equipSnailHat, equipCosmetic } from "./mondgarten/boutiques.mjs";
import { GardenAutomation } from "./mondgarten/automation.mjs";
import { createVillageField } from "./mondgarten/harvest.mjs";
import { tickJourney } from "./mondgarten/journey.mjs";
import { stockCount } from "./mondgarten/village.mjs";
function ready() {
  const s = freshState();
  s.village.snails = 3;
  s.village.boutiques.built = ["style"];
  s.village.boutiques.owned = [
    "hat",
    "mushroomHat",
    "moonCrown",
    "flower",
    "scarf",
  ];
  return s;
}

test("snail hats require ownership and an existing helper; scarves and other accessories cannot be used as hats", () => {
  const s = ready();
  for (const i of [-1, 3, 12, 1.5, NaN])
    assert.equal(equipSnailHat(s, i, "hat"), false);
  for (const id of ["flower", "scarf", "snailEyes", "missing"])
    assert.equal(equipSnailHat(s, 0, id), false);
  s.village.boutiques.owned = [];
  assert.equal(equipSnailHat(s, 0, "hat"), false);
  assert.deepEqual(s.village.boutiques.snailHats, []);
});

test("one bought hat can dress characters and several snails without another purchase, and choices persist separately", () => {
  let s = ready();
  s.coins = 12345;
  assert.equal(equipCosmetic(s, 0, "hat"), true);
  assert.equal(equipSnailHat(s, 0, "hat"), true);
  assert.equal(equipSnailHat(s, 1, "hat"), true);
  assert.equal(equipSnailHat(s, 2, "moonCrown"), true);
  assert.equal(s.coins, 12345);
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(s.village.boutiques.snailHats, ["hat", "hat", "moonCrown"]);
  assert.equal(equipSnailHat(s, 0, null), true);
  assert.equal(equipSnailHat(s, 1, "mushroomHat"), true);
  assert.deepEqual(s.village.boutiques.snailHats, [
    null,
    "mushroomHat",
    "moonCrown",
  ]);
  assert.equal(s.village.boutiques.equipped[0], "hat");
  assert.equal(s.coins, 12345);
  const automation = new GardenAutomation(s);
  assert.deepEqual(
    automation.snails.map((n) => n.hat),
    s.village.boutiques.snailHats,
  );
  assert.equal(equipSnailHat(s, 2, null), true);
  automation.sync(s);
  assert.equal(automation.snails[2].hat, null);
});

test("old saves default to bare heads, malformed or unowned hats are removed and absent helpers keep no orphaned hats", () => {
  const old = ready();
  delete old.village.boutiques.snailHats;
  assert.deepEqual(normalize(old).village.boutiques.snailHats, []);
  old.village.boutiques.snailHats = ["hat", "flower", "not-a-hat", "moonCrown"];
  let restored = normalize(old);
  assert.deepEqual(restored.village.boutiques.snailHats, ["hat", null, null]);
  old.village.boutiques.owned = [];
  restored = normalize(old);
  assert.deepEqual(restored.village.boutiques.snailHats, [null, null, null]);
  restored.village.snails = 4;
  assert.equal(new GardenAutomation(restored).snails[3].hat, null);
});

test("wearing hats does not change harvesting, delivery, cargo or money at either end of the upgrade range", () => {
  function work(level, hat) {
    const s = ready();
    s.village.snails = 1;
    s.village.snailLevel = level;
    s.village.warehouse = 5;
    if (hat) equipSnailHat(s, 0, hat);
    const automation = new GardenAutomation(s),
      cells = createVillageField(s);
    for (let i = 0; i < 3000; i++) {
      tickJourney(s, 0.1);
      automation.update(s, cells, { x: -30, z: 30 }, 0.1, s.journey.growthTime);
    }
    return {
      harvested: s.stats.harvested,
      stored: stockCount(s.village),
      carried: automation.snails[0].bag,
      coins: s.coins,
      values: s.village.rawValues,
    };
  }
  for (const level of [0, 10]) {
    const plain = work(level, null);
    assert.ok(plain.harvested > 0 && plain.stored > 0);
    for (const id of ["hat", "mushroomHat", "moonCrown"])
      assert.deepEqual(work(level, id), plain);
  }
});
