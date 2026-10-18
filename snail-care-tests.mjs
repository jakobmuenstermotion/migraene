import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize } from "./mondgarten/core.mjs";
import { GardenAutomation } from "./mondgarten/automation.mjs";
import {
  SNAIL_TASKS,
  snailProfile,
  setSnailProfile,
  snailsResting,
} from "./mondgarten/snail-care.mjs";
import { WORLD } from "./mondgarten/content.mjs";
import { VILLAGE, WORKSHOPS } from "./mondgarten/village-content.mjs";
import {
  workshopSpot,
  storageCapacity,
  offlineVillage,
} from "./mondgarten/village.mjs";
import { createVillageField } from "./mondgarten/harvest.mjs";
import { startRound } from "./mondgarten/journey.mjs";
import { advanceLighting } from "./mondgarten/lighting.mjs";

function loaded(task = "workshop") {
  const s = freshState();
  s.village.snails = 1;
  s.village.workshops.bouquet.level = 1;
  s.village.snailLoads = [
    {
      x: WORLD.bank.x,
      z: WORLD.bank.z,
      mode: "deliver",
      items: { moonbloom: 24 },
      values: { moonbloom: 48 },
    },
  ];
  setSnailProfile(s, 0, { name: "Flitzi", task });
  return s;
}

test("snail profiles survive saving, old saves default to workshop work, and invalid names/tasks/indices are bounded", () => {
  let s = loaded();
  assert.equal(setSnailProfile(s, -1, { task: "sell" }), false);
  assert.equal(setSnailProfile(s, 1, { task: "sell" }), false);
  assert.equal(setSnailProfile(s, 0.5, {}), false);
  assert.equal(
    setSnailProfile(s, 0, { name: " a".repeat(50), task: "not-real" }),
    true,
  );
  assert.ok(snailProfile(s, 0).name.length <= 24);
  assert.equal(snailProfile(s, 0).name, snailProfile(s, 0).name.trim());
  assert.equal(snailProfile(s, 0).task, "workshop");
  setSnailProfile(s, 0, { name: "Flitzi", task: "warehouse" });
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(snailProfile(s, 0), { name: "Flitzi", task: "warehouse", field:null, workshop:null });
  assert.equal(s.village.snailProfiles.length, 1);
  delete s.village.snailProfiles;
  assert.deepEqual(snailProfile(normalize(s), 0), {
    name: "",
    task: "workshop",
    field:null, workshop:null,
  });
});

test("explicit tasks route the same real cargo to a built workshop, the stand or the warehouse", () => {
  for (const task of ["workshop", "sell", "warehouse"]) {
    const s = loaded(task),
      a = new GardenAutomation(s),
      target =
        task === "sell"
          ? WORLD.bank
          : task === "warehouse"
            ? VILLAGE.warehouse
            : workshopSpot(WORKSHOPS[0], "input");
    Object.assign(a.snails[0], target);
    a.update(s, [], null, 0.1, 0);
    assert.equal(a.snails[0].bag, 0);
    assert.equal(s.coins, task === "sell" ? 48 : 0);
    assert.equal(s.village.raw.moonbloom ?? 0, task === "warehouse" ? 24 : 0);
    assert.equal(
      s.village.workshops.bouquet.inputs.moonbloom ?? 0,
      task === "workshop" ? 24 : 0,
    );
  }
});

test("changing an assignment redirects carried cargo without keeping an old overflow sale or losing value", () => {
  const s = loaded(),
    m = s.village.workshops.bouquet;
  m.inputs.moonbloom = 120;
  m.inputValues.moonbloom = 240;
  const a = new GardenAutomation(s);
  a.snails[0].x = 4;
  a.snails[0].z = 0;
  a.update(s, [], null, 0.1, 0);
  assert.equal(a.snails[0].saleCrop, "moonbloom");
  setSnailProfile(s, 0, { name: "Neue Aufgabe", task: "warehouse" });
  Object.assign(a.snails[0], VILLAGE.warehouse);
  a.update(s, [], null, 0.1, 0);
  assert.equal(a.snails[0].saleCrop, null);
  assert.equal(s.village.raw.moonbloom, 24);
  assert.equal(s.village.rawValues.moonbloom, 48);
  assert.equal(s.coins, 0);
});

test("warehouse jobs keep cargo when storage is full and resume after room is freed, without selling", () => {
  const s = loaded("warehouse"),
    a = new GardenAutomation(s);
  s.village.raw.moonbloom = storageCapacity(s);
  s.village.rawValues.moonbloom = 1200;
  Object.assign(a.snails[0], VILLAGE.warehouse);
  for (let i = 0; i < 100; i++) a.update(s, [], null, 0.1, 0);
  assert.equal(a.snails[0].bag, 24);
  assert.equal(s.coins, 0);
  s.village.raw = {};
  s.village.rawValues = {};
  a.update(s, [], null, 0.1, 0);
  assert.equal(s.village.raw.moonbloom, 24);
  assert.equal(s.village.rawValues.moonbloom, 48);
});

test("darkness blocks harvesting, movement, selling and deposits for every assigned task, including already arrived cargo", () => {
  for (const task of Object.keys(SNAIL_TASKS)) {
    let s = loaded(task);
    s.journey.light = 0.68;
    let a = new GardenAutomation(s);
    Object.assign(
      a.snails[0],
      task === "warehouse" ? VILLAGE.warehouse : WORLD.bank,
    );
    const position = { x: a.snails[0].x, z: a.snails[0].z };
    const cells = createVillageField(s);
    for (let i = 0; i < 100; i++) a.update(s, cells, null, 1, 1000);
    assert.equal(a.snails[0].sleeping, true);
    assert.equal(a.snails[0].moving, false);
    assert.equal(a.snails[0].x, position.x);
    assert.equal(a.snails[0].z, position.z);
    assert.equal(a.snails[0].bag, 24);
    assert.equal(s.coins, 0);
    assert.equal(s.stats.harvested, 0);
    assert.deepEqual(s.village.raw, {});
    assert.deepEqual(s.village.workshops.bouquet.inputs, {});
    a.snapshot(s);
    s = normalize(JSON.parse(JSON.stringify(s)));
    offlineVillage(s, 8 * 3600);
    a = new GardenAutomation(s);
    a.update(s, cells, null, 1, 1000);
    assert.equal(a.snails[0].bag, 24);
    assert.equal(a.snails[0].name, "Flitzi");
    assert.equal(s.coins, 0);
  }
});

test("night starts from actual lighting and a new earned morning wakes helpers with their existing cargo", () => {
  const s = loaded("sell");
  s.journey.closed = true;
  s.journey.elapsed=460;
  advanceLighting(s,0);
  assert.equal(snailsResting(s), false);
  s.journey.elapsed+=5;
  advanceLighting(s,5);
  assert.equal(snailsResting(s), true);
  const a = new GardenAutomation(s);
  a.update(s, [], null, 0.1, 0);
  assert.equal(s.coins, 0);
  s.journey.pending = 1;
  assert.equal(startRound(s), true);
  assert.equal(s.journey.light, 0);
  a.update(s, [], null, 0.1, 0);
  assert.equal(a.snails[0].sleeping, false);
  assert.equal(s.coins, 48);
  assert.equal(a.snails[0].bag, 0);
});

test("an explicit rest task pauses immediately in daylight and resumes the same shipment on reassignment", () => {
  const s = loaded("rest"),
    a = new GardenAutomation(s);
  a.update(s, createVillageField(s), null, 10, 0);
  assert.equal(a.snails[0].sleeping, true);
  assert.equal(s.coins, 0);
  assert.equal(a.snails[0].bag, 24);
  setSnailProfile(s, 0, { name: "Flitzi", task: "sell" });
  a.update(s, [], null, 0.1, 0);
  assert.equal(a.snails[0].sleeping, false);
  assert.equal(s.coins, 48);
});
