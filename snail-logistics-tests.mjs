import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize } from "./mondgarten/core.mjs";
import { GardenAutomation } from "./mondgarten/automation.mjs";
import { advanceWoodcock } from "./mondgarten/woodcock.mjs";
import { WORKSHOPS, VILLAGE } from "./mondgarten/village-content.mjs";
import { WORLD } from "./mondgarten/content.mjs";
import {
  advanceProduction,
  depositBag,
  offlineVillage,
  workshopSpot,
  workshopStock,
  WORKSHOP_INPUT_CAPACITY,
} from "./mondgarten/village.mjs";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function loaded(items = { moonbloom: 24 }, values = { moonbloom: 48 }) {
  const s = freshState();
  s.village.snails = 1;
  s.village.snailLoads = [{ x: 4, z: 0, mode: "deliver", items, values }];
  return s;
}
function until(automation, s, predicate) {
  for (let i = 0; i < 3000 && !predicate(); i++)
    automation.update(s, [], null, 0.1, 0);
  assert.ok(predicate(), "transport did not finish");
}

test("all seven crops go to the correct built workshop, including alternative recipes; no warehouse detour", () => {
  for (const [crop, workshop] of [
    ["moonbloom", "bouquet"],
    ["lavender", "tea"],
    ["coral", "oil"],
    ["mushroom", "elixir"],
    ["starfruit", "tea"],
    ["nebula", "oil"],
    ["sunbloom", "bouquet"],
  ]) {
    const s = loaded({ [crop]: 24 }, { [crop]: 48 }),
      w = WORKSHOPS.find((w) => w.id === workshop);
    s.village.workshops[workshop].level = 1;
    // Even a full warehouse cannot block a direct delivery.
    s.village.raw = { moonbloom: 600 };
    s.village.rawValues = { moonbloom: 1200 };
    const automation = new GardenAutomation(s);
    automation.update(s, [], null, 0.1, 0);
    assert.equal(
      workshopStock(s.village.workshops[workshop]),
      0,
      "no remote deposit",
    );
    Object.assign(automation.snails[0], workshopSpot(w, "input"));
    const events = automation.update(s, [], null, 0.1, 0);
    assert.equal(s.village.workshops[workshop].inputs[crop], 24);
    near(s.village.workshops[workshop].inputValues[crop], 48);
    assert.equal(automation.snails[0].bag, 0);
    assert.equal(events[0].kind, "helperDelivery");
    assert.equal(events[0].count, 24);
    assert.deepEqual(s.village.raw, { moonbloom: 600 });
    assert.equal(s.coins, 0);
  }
});

test("unprocessed harvest is only sold after reaching the stand, at its carried value, once and across reload", () => {
  let s = loaded({ lavender: 24 }, { lavender: 73 });
  let automation = new GardenAutomation(s);
  automation.update(s, [], null, 0.1, 0);
  assert.equal(s.coins, 0);
  automation.snapshot(s);
  s = normalize(JSON.parse(JSON.stringify(s)));
  automation = new GardenAutomation(s);
  assert.equal(automation.snails[0].bag, 24);
  until(automation, s, () => automation.snails[0].bag === 0);
  near(s.coins, 73);
  near(s.stats.earned, 73);
  assert.equal(s.village.autoSold, 24);
  assert.ok(
    Math.hypot(
      automation.snails[0].x - WORLD.bank.x,
      automation.snails[0].z - WORLD.bank.z,
    ) < 0.2,
  );
  assert.deepEqual(s.village.raw, {});
  automation.update(s, [], null, 1, 0);
  near(s.coins, 73);
});

test("new construction redirects an in-flight sale to the workshop; mixed legacy loads keep separate destinations", () => {
  const s = loaded(
    { moonbloom: 24, lavender: 8 },
    { moonbloom: 48, lavender: 32 },
  );
  const automation = new GardenAutomation(s),
    w = WORKSHOPS[0];
  automation.update(s, [], null, 0.1, 0);
  s.village.workshops.bouquet.level = 1;
  Object.assign(automation.snails[0], WORLD.bank);
  automation.update(s, [], null, 0.1, 0);
  assert.equal(s.coins, 0, "a matching workshop was built before sale");
  Object.assign(automation.snails[0], workshopSpot(w, "input"));
  automation.update(s, [], null, 0.1, 0);
  assert.equal(s.village.workshops.bouquet.inputs.moonbloom, 24);
  assert.equal(automation.snails[0].bag, 8);
  Object.assign(automation.snails[0], WORLD.bank);
  automation.update(s, [], null, 0.1, 0);
  near(s.coins, 32);
  assert.equal(automation.snails[0].bag, 0);
  assert.deepEqual(s.village.raw, {});
});

test("full workshop overflow goes to the stand; the sale survives reload and new room, while zero elapsed time pauses it", () => {
  let s = loaded();
  const w = WORKSHOPS[0];
  s.village.workshops.bouquet.level = 1;
  s.village.workshops.bouquet.inputs.moonbloom = WORKSHOP_INPUT_CAPACITY;
  s.village.workshops.bouquet.inputValues.moonbloom = 240;
  let a = new GardenAutomation(s);
  Object.assign(a.snails[0], workshopSpot(w, "input"));
  a.update(s, [], null, 0.1, 0);
  assert.equal(a.snails[0].saleCrop, "moonbloom");
  assert.equal(a.snails[0].bag, 24);
  assert.equal(s.coins, 0);
  a.snapshot(s);
  s = normalize(JSON.parse(JSON.stringify(s)));
  a = new GardenAutomation(s);
  // Finishing the chosen trip avoids oscillation when production frees a slot.
  s.village.workshops.bouquet.inputs = {};
  s.village.workshops.bouquet.inputValues = {};
  Object.assign(a.snails[0], WORLD.bank);
  assert.deepEqual(a.update(s, [], null, 0, 0), []);
  assert.equal(s.coins, 0);
  assert.equal(a.snails[0].bag, 24);
  a.update(s, [], null, 0.1, 0);
  near(s.coins, 48);
  assert.equal(a.snails[0].bag, 0);
  assert.deepEqual(s.village.raw, {});
  assert.equal(workshopStock(s.village.workshops.bouquet), 0);
  a.update(s, [], null, 0.1, 0);
  near(s.coins, 48);
});

test("player deposits stay in storage during production and offline time; Schnecki must physically pick up and deliver", () => {
  const s = freshState();
  s.village.partner = true;
  s.village.house = 3;
  s.village.workshops.bouquet.level = 1;
  s.cargo = { moonbloom: { count: 24, value: 48 } };
  s.bag = 24;
  s.bagValue = 48;
  depositBag(s);
  advanceProduction(s, 100);
  offlineVillage(s, 8 * 3600);
  assert.equal(s.village.raw.moonbloom, 24);
  const a = new GardenAutomation(s);
  a.update(s, [], null, 0.1, 0);
  assert.equal(s.village.raw.moonbloom, 24, "no remote pickup");
  Object.assign(a.partner, VILLAGE.warehouse);
  a.update(s, [], null, 0.1, 0);
  assert.equal(s.village.raw.moonbloom, 12);
  assert.equal(s.village.hauler.items.moonbloom, 12);
  assert.equal(workshopStock(s.village.workshops.bouquet), 0);
  Object.assign(a.partner, workshopSpot(WORKSHOPS[0], "input"));
  a.update(s, [], null, 0.1, 0);
  assert.equal(s.village.workshops.bouquet.inputs.moonbloom, 12);
  near(s.village.workshops.bouquet.inputValues.moonbloom, 24);
  assert.equal(s.village.raw.moonbloom, 12);
  assert.equal(s.coins, 0);
});

test("old partner raw shipments deliver directly rather than adding to player storage", () => {
  const s = freshState();
  s.village.partner = true;
  s.village.workshops.bouquet.level = 1;
  s.village.hauler = {
    kind: "raw",
    items: { moonbloom: 30 },
    values: { moonbloom: 91 },
  };
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  const helper = new GardenAutomation(restored);
  Object.assign(helper.partner, workshopSpot(WORKSHOPS[0], "input"));
  helper.update(restored, [], null, 0.1, 0);
  assert.deepEqual(restored.village.raw, {});
  assert.equal(restored.village.workshops.bouquet.inputs.moonbloom, 30);
  near(restored.village.workshops.bouquet.inputValues.moonbloom, 91);
  assert.equal(Object.values(restored.village.hauler.items).length, 0);
});

test("Schnecki carries finished ingredients between workshops and enables compound recipes without teleportation", () => {
  const s = freshState();
  s.village.partner = true;
  s.village.house = 3;
  for (const id of ["tea", "oil", "elixir"]) s.village.workshops[id].level = 1;
  s.village.finished = { tea: 1, oil: 1 };
  s.village.finishedValues = { tea: 20, oil: 30 };
  s.village.workshops.elixir.inputs = { mushroom: 6 };
  s.village.workshops.elixir.inputValues = { mushroom: 60 };
  const a = new GardenAutomation(s);
  advanceProduction(s, 100);
  assert.equal(s.village.finished.tea, 1);
  assert.equal(s.village.finished.elixir, undefined);
  for (const [id, value] of [
    ["tea", 20],
    ["oil", 30],
  ]) {
    const w = WORKSHOPS.find((w) => w.product === id);
    Object.assign(a.partner, workshopSpot(w, "output"));
    a.update(s, [], null, 0.1, 0);
    assert.equal(s.village.hauler.items[id], 1);
    assert.equal(s.village.finished[id], 0);
    assert.equal(s.village.workshops.elixir.inputs[id], undefined);
    Object.assign(
      a.partner,
      workshopSpot(
        WORKSHOPS.find((w) => w.id === "elixir"),
        "input",
      ),
    );
    a.update(s, [], null, 0.1, 0);
    assert.equal(s.village.workshops.elixir.inputs[id], 1);
    near(s.village.workshops.elixir.inputValues[id], value);
  }
  advanceProduction(s, 26);
  assert.equal(s.village.finished.elixir, 1);
  near(s.village.finishedValues.elixir, 132);
  assert.deepEqual(s.village.raw, {});
  assert.equal(s.coins, 0);
});

test("woodcock also carries intermediate ingredients, preserves house reserves and finishes cargo after task changes", () => {
  const s = freshState();
  s.village.woodcock.unlocked = true;
  for (const id of ["tea", "elixir"]) s.village.workshops[id].level = 1;
  // Leave the current second-section tea requirement untouched.
  const reserve=VILLAGE.partner.materials[1].tea;
  s.village.house = 1;
  s.village.finished.tea = reserve+1;
  s.village.finishedValues.tea = (reserve+1)*20;
  Object.assign(
    s.village.woodcock,
    workshopSpot(
      WORKSHOPS.find((w) => w.id === "tea"),
      "output",
    ),
  );
  advanceWoodcock(s, 0.1);
  assert.equal(s.village.finished.tea, reserve);
  assert.equal(s.village.woodcock.cargo.items.tea, 1);
  s.village.woodcock.task = "search";
  Object.assign(
    s.village.woodcock,
    workshopSpot(
      WORKSHOPS.find((w) => w.id === "elixir"),
      "input",
    ),
  );
  advanceWoodcock(s, 0.1);
  assert.equal(s.village.workshops.elixir.inputs.tea, 1);
  near(s.village.workshops.elixir.inputValues.tea, 20);
  assert.deepEqual(s.village.raw, {});
});

test("a saved overflow trip sells only the chosen crop even when normalization reorders a mixed load", () => {
  let s = loaded(
    { lavender: 8, moonbloom: 24 },
    { lavender: 32, moonbloom: 48 },
  );
  s.village.workshops.tea.level = 1;
  s.village.workshops.bouquet.level = 1;
  s.village.workshops.tea.inputs.lavender = WORKSHOP_INPUT_CAPACITY;
  s.village.workshops.tea.inputValues.lavender = 240;
  let a = new GardenAutomation(s);
  a.update(s, [], null, 0.1, 0);
  assert.equal(a.snails[0].saleCrop, "lavender");
  a.snapshot(s);
  s = normalize(JSON.parse(JSON.stringify(s)));
  a = new GardenAutomation(s);
  assert.equal(Object.keys(a.snails[0].items)[0], "moonbloom");
  Object.assign(a.snails[0], WORLD.bank);
  a.update(s, [], null, 0.1, 0);
  near(s.coins, 32);
  assert.equal(a.snails[0].bag, 24);
  Object.assign(a.snails[0], workshopSpot(WORKSHOPS[0], "input"));
  a.update(s, [], null, 0.1, 0);
  assert.equal(s.village.workshops.bouquet.inputs.moonbloom, 24);
  near(s.coins, 32);
  assert.equal(a.snails[0].bag, 0);
});
