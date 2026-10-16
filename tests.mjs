import { GardenAutomation } from './mondgarten/automation.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, normalize, TOOLS, capacity } from './mondgarten/core.mjs';
import {
  growthFactor,
  tickJourney,
  closeDay,
  startRound,
  grantRound,
} from './mondgarten/journey.mjs';
import { materialHarvestRemaining } from './mondgarten/funding.mjs';
import { prepareDay } from './mondgarten/daily.mjs';
import {
  createVillageField,
  harvestAt,
  unload,
} from './mondgarten/harvest.mjs';
import { WORKSHOPS, VILLAGE } from './mondgarten/village-content.mjs';
import {
  productionSeconds,
  deliverWorkshop,
  advanceProduction,
  offlineVillage,
  depositBag,
  takeWorkshopGoods,
  productCargoCount,
  sellCarriedProducts,
  workshopStock,
  getBuildPads,
  payBuild,
} from './mondgarten/village.mjs';
import { nightTarget, advanceLighting } from './mondgarten/lighting.mjs';
const bouquet = WORKSHOPS[0];
function carry(s, count = 60, value = count * 2) {
  s.bag = count;
  s.bagValue = value;
  s.cargo = { moonbloom: { count, value } };
}
function built() {
  const s = freshState();
  s.journey.round = 3;
  s.village.workshops.bouquet.level = 1;
  return s;
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('manual delivery conserves ingredients and value; processing and collection never sell automatically', () => {
  const s = built();
  carry(s);
  const before = s.coins;
  assert.equal(deliverWorkshop(s, bouquet).count, 60);
  assert.equal(s.bag, 0);
  assert.equal(s.village.raw.moonbloom, undefined);
  assert.equal(advanceProduction(s, productionSeconds(s, bouquet)).length, 1);
  assert.equal(s.village.finished.bouquet, 1);
  assert.equal(workshopStock(s.village.workshops.bouquet), 54);
  near(s.village.finishedValues.bouquet, 14.4);
  assert.equal(s.coins, before);
  const batch = takeWorkshopGoods(s, 'bouquet', 4);
  assert.equal(batch.count, 1);
  assert.equal(productCargoCount(s), 1);
  assert.equal(s.coins, before);
  near(sellCarriedProducts(s).value, 14.4);
  near(s.coins, before + 14.4);
  assert.equal(sellCarriedProducts(s).count, 0);
});

test('warehouse never supplies workshops invisibly, even with helpers; manual delivery accepts matching cargo', () => {
  const s = built();
  carry(s);
  depositBag(s);
  assert.equal(advanceProduction(s, 1000).length, 0);
  assert.equal(s.village.raw.moonbloom, 60);
  s.village.snails = 1;
  s.village.partner = true;
  s.village.woodcock.unlocked = true;
  assert.equal(advanceProduction(s, productionSeconds(s, bouquet)).length, 0);
  assert.equal(s.village.raw.moonbloom, 60);
  carry(s, 10);
  s.cargo.lavender = { count: 8, value: 16 };
  s.bag += 8;
  s.bagValue += 16;
  assert.equal(deliverWorkshop(s, bouquet).count, 10);
  assert.equal(s.bag, 8);
  assert.deepEqual(s.cargo, { lavender: { count: 8, value: 16 } });
});

test('small frame deliveries can complete exact recipes without losing fractional values', () => {
  const s = built();
  carry(s, 6, 12);
  for (let i = 0; i < 100; i++) deliverWorkshop(s, bouquet, 0.24);
  assert.equal(s.bag, 0);
  assert.equal(advanceProduction(s, productionSeconds(s, bouquet)).length, 1);
  near(s.village.finishedValues.bouquet, 14.4);
});

test('workshops have finite input and output stacks; collection respects available carrying space', () => {
  const s = built();
  carry(s, 200);
  assert.equal(deliverWorkshop(s, bouquet).count, 120);
  assert.equal(s.bag, 80);
  advanceProduction(s, 10000);
  assert.equal(s.village.finished.bouquet, 20);
  carry(s, 60);
  deliverWorkshop(s, bouquet);
  advanceProduction(s, 10000);
  assert.equal(s.village.finished.bouquet, 24);
  takeWorkshopGoods(s, 'bouquet', capacity(s) - s.bag);
  assert.ok(s.bag + productCargoCount(s) <= capacity(s));
});

test('offline work is tiny, consumes existing ingredients and preserves carried helper shipments', () => {
  const s = built();
  carry(s, 120);
  deliverWorkshop(s, bouquet);
  s.village.snails = 2;
  s.village.partner = true;
  s.village.hauler = {
    kind: 'finished',
    items: { bouquet: 3 },
    values: { bouquet: 36 },
  };
  const shipment = structuredClone(s.village.hauler);
  const before = s.stats.harvested,
    coins = s.coins;
  assert.equal(offlineVillage(s, 20 * 60).produced, 0);
  assert.equal(offlineVillage(s, 8 * 3600).produced, 1);
  assert.equal(s.coins, coins);
  assert.equal(s.stats.harvested, before);
  assert.deepEqual(s.village.hauler, shipment);
  assert.equal(s.village.raw.moonbloom, undefined);
  assert.ok(workshopStock(s.village.workshops.bouquet) < 120);
});

test('alternative and compound recipes consume real local supplies', () => {
  const s = built();
  s.cargo = { sunbloom: { count: 4, value: 100 } };
  s.bag = 4;
  s.bagValue = 100;
  deliverWorkshop(s, bouquet);
  advanceProduction(s, productionSeconds(s, bouquet));
  near(s.village.finishedValues.bouquet, 120);
  const w = WORKSHOPS.find((w) => w.id === 'elixir');
  s.village.workshops.elixir.level = 1;
  s.productCargo = { items: { tea: 1, oil: 1 }, values: { tea: 20, oil: 30 } };
  s.cargo = { mushroom: { count: 6, value: 60 } };
  s.bag = 6;
  s.bagValue = 60;
  assert.equal(deliverWorkshop(s, w).count, 8);
  advanceProduction(s, 100);
  near(s.village.finishedValues.elixir, 132);
  assert.equal(productCargoCount(s), 0);
});

test('new workstation inventory and legacy saves round-trip without losing existing supplies or rewards', () => {
  const s = built();
  carry(s, 30);
  deliverWorkshop(s, bouquet);
  advanceProduction(s, 10);
  s.village.raw.lavender = 8;
  s.village.rawValues.lavender = 16;
  closeDay(s);
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.village.workshops, s.village.workshops);
  assert.deepEqual(restored.journey.rewards, s.journey.rewards);
  assert.equal(restored.village.raw.lavender, 8);
  const legacy = structuredClone(s);
  delete legacy.village.workshops.bouquet.inputs;
  delete legacy.village.workshops.bouquet.inputValues;
  assert.deepEqual(normalize(legacy).village.workshops.bouquet.inputs, {});
  assert.equal(normalize(legacy).village.workshops.bouquet.running, true);
});

test('regrowth slows by time, while ripe harvest and purchases continue after day completion', () => {
  const s = freshState();
  prepareDay(s, TOOLS);
  s.coins = s.journey.plan.target * 100;
  assert.equal(materialHarvestRemaining(s, 'moonbloom'), Infinity);
  assert.equal(growthFactor(s), 1);
  let previous = 1;
  for (const elapsed of [300, 360, 420, 480, 539]) {
    s.journey.elapsed = elapsed;
    const factor = growthFactor(s);
    assert.ok(factor > 0 && factor <= previous);
    previous = factor;
  }
  s.journey.elapsed = 360;
  assert.equal(closeDay(s), true);
  const before = s.journey.growthTime;
  assert.ok(tickJourney(s, 60) > 0);
  assert.ok(s.journey.growthTime > before);
  const cell = createVillageField(s)[0];
  assert.ok(
    harvestAt(s, [cell], cell.x, cell.z, s.journey.growthTime).length > 0,
  );
  assert.ok(unload(s, 10).value > 0);
  assert.equal(closeDay(s), false);
  assert.equal(s.journey.rewards.length, 1);
  const pad = getBuildPads(s, TOOLS).find((p) => p.id === 'tool:bag');
  assert.ok(payBuild(s, pad, 10).paid > 0);
  grantRound(s, 'entry:next');
  assert.equal(startRound(s), true);
  assert.equal(s.journey.elapsed, 0);
  assert.equal(growthFactor(s), 1);
});

test('unearned initial companion day cannot yield harvest', () => {
  const s = freshState();
  s.journey.round = 0;
  s.journey.closed = true;
  assert.equal(growthFactor(s), 0);
  const cell = createVillageField(s)[0];
  assert.equal(harvestAt(s, [cell], cell.x, cell.z, 0).length, 0);
});

test('sunset depends on active time and fades slowly; income cannot make noon dark', () => {
  const s = freshState();
  prepareDay(s, TOOLS);
  s.coins = 1e20;
  s.journey.elapsed = 100;
  assert.equal(nightTarget(s), 0);
  s.journey.elapsed = 240;
  near(nightTarget(s), 0.29);
  advanceLighting(s, 1);
  assert.ok(s.journey.light <= 1 / 90);
  s.journey.closed = true;
  s.journey.light = 0;
  for (let i = 0; i < 45; i++) advanceLighting(s, 1);
  near(s.journey.light, 0.5);
  for (let i = 0; i < 45; i++) advanceLighting(s, 1);
  near(s.journey.light, 1);
});

test('orchard requires a short stationary pick and gives a fruit bundle', () => {
  const s = freshState();
  s.village.beds[4] = 1;
  const cell = createVillageField(s).find((c) => c.bed === 4);
  cell.rare = false;
  assert.equal(
    harvestAt(s, [cell], cell.x, cell.z, 0, 1, { moving: true, dt: 2 }).length,
    0,
  );
  assert.equal(
    harvestAt(s, [cell], cell.x, cell.z, 0, 1, { moving: false, dt: 0.7 })
      .length,
    0,
  );
  assert.equal(
    harvestAt(s, [cell], cell.x + 3, cell.z, 0, 1, { moving: false, dt: 1 })
      .length,
    0,
  );
  assert.equal(
    harvestAt(s, [cell], cell.x, cell.z, 0, 1, { moving: false, dt: 0.7 })
      .length,
    0,
  );
  assert.equal(
    harvestAt(s, [cell], cell.x, cell.z, 0, 1, { moving: false, dt: 0.6 })[0]
      .units,
    6,
  );
  assert.equal(s.cargo.starfruit.count, 6);
});

const { advanceWoodcock } = await import('./mondgarten/woodcock.mjs');
function birdAt(s, point) {
  s.village.woodcock.unlocked = true;
  Object.assign(s.village.woodcock, point);
}
test('woodcock transports real ingredients; changing an order preserves its shipment', () => {
  const s = built();
  birdAt(s, VILLAGE.warehouse);
  carry(s, 24, 48);
  depositBag(s);
  const b = s.village.woodcock;
  advanceWoodcock(s, 0.1);
  assert.equal(b.cargo.kind, 'supply');
  assert.equal(s.village.raw.moonbloom, 12);
  b.task = 'search';
  Object.assign(b, { x: bouquet.x - 1.8, z: bouquet.z + 1.8 });
  advanceWoodcock(s, 0.1);
  assert.equal(workshopStock(s.village.workshops.bouquet), 12);
  near(s.village.workshops.bouquet.inputValues.moonbloom, 24);
  assert.equal(b.cargo.items.moonbloom, undefined);
});

test('woodcock sells by carrying goods to the stand, never by duplicating them', () => {
  const s = built();
  birdAt(s, { x: bouquet.x + 1.8, z: bouquet.z + 1.8 });
  s.village.woodcock.task = 'sell';
  s.village.house = 3;
  s.village.finished.bouquet = 3;
  s.village.finishedValues.bouquet = 45;
  advanceWoodcock(s, 0.1);
  assert.equal(s.coins, 0);
  assert.equal(s.village.finished.bouquet, 0);
  s.village.woodcock.x = -9;
  s.village.woodcock.z = 8;
  advanceWoodcock(s, 0.1);
  assert.equal(s.coins, 45);
  advanceWoodcock(s, 0.1);
  assert.equal(s.coins, 45);
});

test('woodcock search consumes active time, persists orders and never runs offline', () => {
  const s = built();
  birdAt(s, { x: -25, z: -3 });
  const b = s.village.woodcock;
  b.task = 'search';
  advanceWoodcock(s, 89);
  assert.equal(b.treasures, 0);
  advanceWoodcock(s, 1);
  assert.equal(b.treasures, 1);
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.village.woodcock.task, 'search');
  assert.equal(restored.village.woodcock.treasures, 1);
  offlineVillage(s, 3600);
  assert.equal(b.treasures, 1);
});

test('woodcock unlocks only in a later earned round and can be purchased', () => {
  const s = freshState();
  s.coins = 1e10;
  let p = getBuildPads(s, TOOLS).find((p) => p.id === 'woodcock');
  assert.equal(p.visible, false);
  assert.equal(payBuild(s, p, 10).complete, false);
  s.journey.round = 31;
  p = getBuildPads(s, TOOLS).find((p) => p.id === 'woodcock');
  assert.equal(p.visible, false);
  assert.equal(payBuild(s, p, 10).complete, false);
  s.journey.round = 32;
  p = getBuildPads(s, TOOLS).find((p) => p.id === 'woodcock');
  assert.equal(p.locked, false);
  assert.equal(payBuild(s, p, 10).complete, true);
  assert.equal(s.village.woodcock.unlocked, true);
});

test('content validation includes the orchard renderer model', async () => {
  const { validateContent } = await import('./mondgarten/content.mjs');
  assert.equal(validateContent(), true);
});

test('woodcock leaves reserved house materials and can choose a different product', () => {
  const s = built();
  s.village.workshops.tea.level = 1;
  birdAt(s, { x: 8 + 1.8, z: 12 + 1.8 });
  s.village.woodcock.task = 'sell';
  s.village.finished.bouquet = VILLAGE.partner.materials[0].bouquet;
  s.village.finishedValues.bouquet = 10 * VILLAGE.partner.materials[0].bouquet;
  s.village.finished.tea = 1;
  s.village.finishedValues.tea = 20;
  advanceWoodcock(s, 0.1);
  assert.equal(
    s.village.finished.bouquet,
    VILLAGE.partner.materials[0].bouquet,
  );
  assert.equal(s.village.woodcock.cargo.items.tea, 1);
});

test('orchard is a purchased third area at day 25, not a starting field', () => {
  const s = freshState();
  s.coins = 1e10;
  assert.equal(s.village.beds[4], 0);
  s.village.beds[1] = 1;
  s.village.seeds[4] = true;
  s.journey.round = 24;
  let p = getBuildPads(s, TOOLS).find((p) => p.id === 'bed:4');
  assert.equal(p.visible, false);
  assert.equal(payBuild(s, p, 10).complete, false);
  s.journey.round = 25;
  p = getBuildPads(s, TOOLS).find((p) => p.id === 'bed:4');
  assert.equal(p.locked, false);
  assert.equal(s.village.beds[4], 0);
  assert.equal(payBuild(s, p, 10).complete, true);
  assert.equal(s.village.beds[4], 1);
});

test('snails leave the active harvesting area to the player and can still work farther away', () => {
  const s = freshState();
  s.village.snails = 1;
  const cells = createVillageField(s),
    automation = new GardenAutomation(s),
    player = { x: 4, z: 0 };
  automation.update(s, cells, player, 0.1, 0);
  for (const snail of automation.snails)
    if (snail.target)
      assert.ok(
        Math.hypot(snail.target.x - player.x, snail.target.z - player.z) >=
          VILLAGE.snail.playerSpace,
      );
  automation.update(s, cells, { x: -30, z: 30 }, 0.1, 0);
  assert.ok(automation.snails[0].target);
});
