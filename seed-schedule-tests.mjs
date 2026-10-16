import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize } from "./mondgarten/core.mjs";
import {
  SEED_ROUNDS,
  closeDay,
  startRound,
  grantRound,
  rewardCount,
  seedsDue,
  seedCatchupAvailable,
  seedCatchupPrice,
  buyCatchupSeed,
} from "./mondgarten/journey.mjs";
import { emptyPlants, receiveRewards } from "./garden-ledger.mjs";

function oldDaySeven(closed = false) {
  const s = freshState();
  s.coins = 10000;
  s.journey.round = 7;
  s.journey.rewardKind = "water";
  s.journey.closed = closed;
  s.journey.rewards = Array.from({ length: closed ? 7 : 6 }, (_, i) => ({
    id: "garden-day:" + (i + 1),
    round: i + 1,
    kind: i ? "water" : "seed",
  }));
  return s;
}

test("regular companion seeds arrive at 1/5/12/20/30/40/50, giving four by 20 and seven by 50", () => {
  let s = freshState();
  const days = [];
  for (let day = 1; day <= 77; day++) {
    if (s.journey.rewardKind === "seed") days.push(day);
    assert.equal(closeDay(s), true);
    if (day === 20) assert.equal(rewardCount(s, "seed"), 4);
    if (day === 50) assert.equal(rewardCount(s, "seed"), 7);
    s = normalize(JSON.parse(JSON.stringify(s)));
    if (day < 77) {
      assert.equal(grantRound(s, "seed-test:" + day), true);
      assert.equal(startRound(s), true);
    }
  }
  assert.deepEqual(days, SEED_ROUNDS);
  assert.equal(rewardCount(s, "water"), 70);
  assert.equal(s.journey.rewards.length, 77);
});

test("an old level-seven save can buy the missed second seed without replacing its daily watering reward or duplicating companion tokens", () => {
  let s = oldDaySeven();
  const before = structuredClone(s.journey.rewards),
    price = seedCatchupPrice(s);
  let ledger = receiveRewards(emptyPlants(), before);
  ledger.tokens = []; // Previous tokens may already be spent.
  assert.equal(seedCatchupAvailable(s), 1);
  assert.equal(buyCatchupSeed(s), true);
  assert.equal(s.coins, 10000 - price);
  assert.equal(rewardCount(s, "seed"), 2);
  assert.equal(s.journey.closed, false);
  assert.equal(s.journey.rewardKind, "water");
  assert.deepEqual(s.journey.rewards, before);
  s = normalize(JSON.parse(JSON.stringify(s)));
  const all = [...s.journey.rewards, ...s.journey.seedCatchups];
  ledger = receiveRewards(ledger, all);
  assert.deepEqual(ledger.tokens, [{ id: "garden-seed:2", kind: "seed" }]);
  assert.deepEqual(receiveRewards(ledger, all), ledger);
  assert.equal(buyCatchupSeed(s), false);
  assert.equal(s.coins, 10000 - price);
  assert.equal(closeDay(s), true);
  assert.equal(rewardCount(s, "water"), 6);
});

test("catch-up is available after a closed or slept old day, is bounded by unlocked seeds, and never spends unavailable money", () => {
  let s = oldDaySeven(true);
  s.journey.asleep = true;
  const rewards = structuredClone(s.journey.rewards);
  s.coins = seedCatchupPrice(s) - 1;
  assert.equal(buyCatchupSeed(s), false);
  s.coins++;
  assert.equal(buyCatchupSeed(s), true);
  assert.equal(s.coins, 0);
  assert.equal(s.journey.asleep, true);
  assert.equal(s.journey.closed, true);
  assert.deepEqual(s.journey.rewards, rewards);
  s.journey.round = 20;
  s.coins = 1e9;
  while (buyCatchupSeed(s)) {}
  assert.equal(rewardCount(s, "seed"), 4);
  assert.equal(seedCatchupAvailable(s), 0);
  s.journey.round = 50;
  while (buyCatchupSeed(s)) {}
  assert.equal(rewardCount(s, "seed"), 7);
  assert.equal(buyCatchupSeed(s), false);
  s = normalize(JSON.parse(JSON.stringify(s)));
  assert.equal(rewardCount(s, "seed"), 7);
  assert.equal(
    new Set(s.journey.seedCatchups.map((r) => r.id)).size,
    s.journey.seedCatchups.length,
  );
});

test("an open scheduled day reserves its normal seed and unavailable early seeds cannot be claimed", () => {
  const s = freshState();
  s.coins = 1e9;
  assert.equal(seedCatchupAvailable(s), 0);
  assert.equal(buyCatchupSeed(s), false);
  closeDay(s);
  grantRound(s, "next:2");
  startRound(s);
  assert.equal(seedsDue(2), 1);
  assert.equal(s.journey.rewardKind, "water");
  s.journey.rewardKind = "seed";
  assert.equal(closeDay(s), false);
  s.journey.round = 5;
  assert.equal(seedCatchupAvailable(s), 0);
  assert.equal(closeDay(s), true);
  assert.equal(rewardCount(s, "seed"), 2);
});

test("malformed or duplicate catch-up receipts cannot add early seeds or watering rewards", () => {
  const s = oldDaySeven();
  s.journey.seedCatchups = [
    { id: "garden-seed:2", kind: "seed", round: 7 },
    { id: "garden-seed:2", kind: "seed", round: 7 },
    { id: "garden-seed:7", kind: "seed", round: 7 },
    { id: "garden-seed:3", kind: "seed", round: 99 },
    { id: "garden-seed:1", kind: "water", round: 1 },
  ];
  const normalized = normalize(s);
  assert.deepEqual(normalized.journey.seedCatchups, [
    { id: "garden-seed:2", kind: "seed", round: 7 },
  ]);
  assert.deepEqual(
    receiveRewards(emptyPlants(), [
      { id: "garden-seed:8", kind: "seed" },
      { id: "garden-seed:2", kind: "water" },
    ]).tokens,
    [],
  );
});
