import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, normalize } from './mondgarten/core.mjs';
import {
  freshFarm,
  FARM,
  SNAILS,
  discoverShell,
  moveShellToFarm,
  makeSnailFood,
  feedSnail,
  advanceFarm,
  releaseSnail,
  farmHelperLimit,
} from './mondgarten/snail-farm.mjs';
import {
  getBuildPads,
  payBuild,
  offlineVillage,
} from './mondgarten/village.mjs';
const state = () => {
  const s = freshState();
  s.journey.round = 18;
  s.village.farm.built = true;
  return s;
};
function raw(s, count = 120) {
  s.village.raw.moonbloom = count;
  s.village.rawValues.moonbloom = count * 2;
}
test('farm is a purchased mid-game upgrade, and old saves get empty safe defaults', () => {
  const s = freshState();
  s.coins = 1e9;
  s.journey.round = 17;
  let p = getBuildPads(s).find((p) => p.id === 'farm');
  assert.equal(p.visible, false);
  assert.equal(payBuild(s, p, 10).complete, false);
  s.journey.round = 18;
  p = getBuildPads(s).find((p) => p.id === 'farm');
  assert.equal(payBuild(s, p, 10).complete, true);
  delete s.village.farm;
  assert.deepEqual(normalize(s).village.farm, freshFarm());
});
test('shells require real harvest and active time; rarity gates and per-day cap persist', () => {
  const s = state();
  assert.equal(discoverShell(s, 240, 179), null);
  let found = discoverShell(s, 0, 1);
  assert.ok(found.round <= 18);
  assert.equal(s.village.farm.shells[found.id], 1);
  assert.ok(discoverShell(s, 240, 180));
  assert.equal(discoverShell(s, 10000, 10000), null);
  const restored = normalize(s);
  assert.equal(discoverShell(restored, 240, 180), null);
  restored.journey.round = 19;
  assert.ok(discoverShell(restored, 240, 180));
  assert.equal(SNAILS.length, 10);
});
test('three meals grow a snail; hunger pauses without loss; a mature snail is consumed once', () => {
  const s = state(),
    f = s.village.farm;
  raw(s);
  f.shells.garden = 1;
  assert.ok(moveShellToFarm(s, 'garden'));
  assert.equal(moveShellToFarm(s, 'garden'), false);
  const n = f.nursery[0];
  assert.ok(makeSnailFood(s));
  advanceFarm(s, 10000);
  assert.equal(n.growth, 0);
  for (let meal = 0; meal < 3; meal++) {
    if (!f.food) makeSnailFood(s);
    assert.ok(feedSnail(s, n.id));
    assert.equal(feedSnail(s, n.id), false);
    advanceFarm(s, 240);
  }
  assert.equal(n.growth, 720);
  assert.ok(releaseSnail(s, n.id, 'helper'));
  assert.equal(s.village.snails, 1);
  assert.equal(f.helpers[0], 'garden');
  assert.equal(releaseSnail(s, n.id, 'helper'), false);
});
test('food consumes both carried and stored ingredients; fruit recipe is optional and efficient', () => {
  const s = state();
  s.bag = 6;
  s.bagValue = 12;
  s.cargo = { moonbloom: { count: 6, value: 12 } };
  s.village.raw.moonbloom = 6;
  s.village.rawValues.moonbloom = 12;
  assert.ok(makeSnailFood(s));
  assert.equal(s.bag, 0);
  assert.equal(s.village.raw.moonbloom, 0);
  assert.equal(s.village.farm.foodValue, 24);
  assert.equal(makeSnailFood(s, 'fruit'), false);
  s.village.raw = { moonbloom: 6, starfruit: 2 };
  s.village.rawValues = { moonbloom: 12, starfruit: 20 };
  assert.ok(makeSnailFood(s, 'fruit'));
  assert.equal(s.village.farm.food, 6);
  assert.equal(s.village.farm.foodValue, 56);
});
test('nursery and helper caps cannot be bypassed; selling preserves ingredient investment with bounded profit', () => {
  const s = state(),
    f = s.village.farm;
  f.shells.garden = 7;
  for (let i = 0; i < 6; i++) assert.ok(moveShellToFarm(s, 'garden'));
  assert.equal(moveShellToFarm(s, 'garden'), false);
  const n = f.nursery[0];
  n.growth = 720;
  n.investment = 10000;
  s.village.snails = farmHelperLimit(s);
  assert.equal(releaseSnail(s, n.id, 'helper'), false);
  assert.equal(f.nursery.length, 6);
  assert.ok(releaseSnail(s, n.id, 'sell'));
  assert.ok(s.coins >= 10000 && s.coins < 11000);
  s.journey.round = 10000;
  assert.equal(farmHelperLimit(s), 12);
});
test('farm food, care, species and shipment compatibility survive save/load and small offline progress', () => {
  const s = state();
  s.village.farm.shells.garden = 1;
  moveShellToFarm(s, 'garden');
  raw(s);
  makeSnailFood(s);
  feedSnail(s, 1);
  advanceFarm(s, 100);
  const restored = normalize(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(restored.village.farm, s.village.farm);
  offlineVillage(restored, 8 * 3600);
  assert.equal(restored.village.farm.nursery[0].growth, 190);
  assert.equal(restored.village.farm.nursery[0].meal, 50);
  assert.equal(restored.village.farm.findsToday, s.village.farm.findsToday);
});

test('a raised helper keeps its own species after previously purchased helpers and save/load', () => {
  const s = state();
  s.journey.round = 25;
  s.village.snails = 2;
  s.village.farm.shells.apple = 1;
  moveShellToFarm(s, 'apple');
  const n = s.village.farm.nursery[0];
  n.growth = 720;
  assert.ok(releaseSnail(s, n.id, 'helper'));
  assert.deepEqual(s.village.farm.helpers, [null, null, 'apple']);
  assert.deepEqual(normalize(s).village.farm.helpers, [null, null, 'apple']);
});
