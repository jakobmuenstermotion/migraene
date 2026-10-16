import {
  advanceFarm,
  discoverShell,
  moveShellToFarm,
  makeSnailFood,
  feedSnail,
  releaseSnail,
  FARM,
  farmHelperLimit,
} from '../mondgarten/snail-farm.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import {
  freshState,
  TOOLS,
  capacity,
  moveSpeed,
  harvestRate,
  normalize,
} from '../mondgarten/core.mjs';
import { BEDS, VILLAGE, WORKSHOPS } from '../mondgarten/village-content.mjs';
import { WORLD } from '../mondgarten/content.mjs';
import { prepareDay } from '../mondgarten/daily.mjs';
import {
  tickJourney,
  startRound,
  grantRound,
  growthFactor,
} from '../mondgarten/journey.mjs';
import {
  createVillageField,
  harvestAt,
  unload,
} from '../mondgarten/harvest.mjs';
import {
  getBuildPads,
  payBuild,
  discoverSeeds,
  bedYield,
  advanceProduction,
  deliverWorkshop,
  workshopSpot,
  takeWorkshopGoods,
  productCargoCount,
  sellCarriedProducts,
  offlineVillage,
} from '../mondgarten/village.mjs';
import { GardenAutomation } from '../mondgarten/automation.mjs';
const DT = 0.5;
function walk(p, target, s) {
  const dx = target.x - p.x,
    dz = target.z - p.z,
    d = Math.hypot(dx, dz),
    step = (moveSpeed(s) / 38) * DT;
  p.moving = d > 0.16;
  if (d <= step) {
    p.x = target.x;
    p.z = target.z;
    p.moving = false;
    return true;
  }
  p.x += (dx / d) * step;
  p.z += (dz / d) * step;
  return false;
}
function run(style) {
  let s = freshState(),
    cells = createVillageField(s),
    actor = { ...WORLD.spawn, angle: 0, moving: false },
    automation = new GardenAutomation(s),
    harvestClock = 0,
    time = 0,
    firstBuy = null;
  const days = [];
  let goal = null,
    stalled = 0;
  for (let round = 1; round <= 77; round++) {
    prepareDay(s, TOOLS);
    discoverSeeds(s);
    cells = createVillageField(s, cells);
    const beforeCoins = s.coins,
      beforeUpgrades = s.stats.upgrades,
      startTime = time;
    let steps = 0;
    while (!s.journey.closed && steps++ < 14400) {
      const previousPosition = { x: actor.x, z: actor.z };
      tickJourney(s, DT);
      time += DT;
      harvestClock += DT;
      advanceProduction(s, DT);
      if (style === 'farm') {
        advanceFarm(s, DT);
        discoverShell(s, 0, DT);
        const f = s.village.farm;
        for (const [id, n] of Object.entries(f.shells))
          if (n) moveShellToFarm(s, id);
        if (f.food < 6) {
          if (!makeSnailFood(s, 'fruit')) makeSnailFood(s);
        }
        for (const n of [...f.nursery]) {
          if (n.growth >= FARM.growSeconds)
            releaseSnail(
              s,
              n.id,
              s.village.snails < farmHelperLimit(s) ? 'helper' : 'sell',
            );
          else if (n.meal <= 0) feedSnail(s, n.id);
        }
      }
      if (style === 'farm' && goal?.kind === 'buy') {
        const live = getBuildPads(s, TOOLS).find((p) => p.id === goal.pad.id);
        if (!live || live.level !== goal.pad.level || live.max || live.locked)
          goal = null;
      }
      if (style !== 'manual')
        automation.update(s, cells, actor, DT, s.journey.growthTime);
      if (!goal) {
        const pads = getBuildPads(s, TOOLS),
          buy = pads.find(
            (p) =>
              p.visible &&
              !p.max &&
              !p.locked &&
              p.id !== 'endDay' &&
              s.coins >= p.cost - p.paid,
          );
        if (buy) goal = { ...buy, kind: 'buy', pad: buy };
        else if (s.bag || productCargoCount(s)) {
          const home = pads.find(
              (p) =>
                p.kind === 'partner' &&
                p.visible &&
                !p.max &&
                p.requiredRound <= round,
            ),
            w =
              home &&
              WORKSHOPS.find(
                (w) =>
                  (VILLAGE.partner.materials[s.village.house]?.[w.product] ??
                    0) > (s.village.finished[w.product] ?? 0) &&
                  Object.keys(w.inputs).some((id) => s.cargo[id]?.count > 0),
              );
          goal = w
            ? { kind: 'deliver', workshop: w, ...workshopSpot(w, 'input') }
            : { kind: 'sell', ...WORLD.bank };
        } else {
          const remaining = pads.filter(
              (p) =>
                p.visible &&
                !p.max &&
                p.id !== 'endDay' &&
                (p.requiredRound ?? 1) <= round,
            ),
            end = pads.find((p) => p.id === 'endDay');
          if (!remaining.length && s.coins >= end.cost - end.paid)
            goal = { ...end, kind: 'buy', pad: end };
          else {
            const home = remaining.find((p) => p.kind === 'partner'),
              need =
                home &&
                Object.entries(
                  VILLAGE.partner.materials[s.village.house] ?? {},
                ).find(([id, n]) => (s.village.finished[id] ?? 0) < n),
              w = need && WORKSHOPS.find((w) => w.product === need[0]);
            const hungry =
              style === 'farm' &&
              s.village.farm.nursery.some(
                (n) => n.growth < FARM.growSeconds && n.meal <= 0,
              ) &&
              s.village.farm.food === 0;
            const crop = w
              ? Object.keys(w.inputs).find((id) =>
                  BEDS.some((b) => b.crop === id),
                )
              : hungry
                ? 'moonbloom'
                : null;
            const bed = BEDS.map((b, i) => ({ ...b, index: i }))
              .filter(
                (b) => s.village.beds[b.index] && (!crop || b.crop === crop),
              )
              .sort((a, b) => bedYield(s, b.index) - bedYield(s, a.index))[0];
            const candidates = cells
              .filter(
                (c) => c.bed === bed.index && c.readyAt <= s.journey.growthTime,
              )
              .sort(
                (a, b) =>
                  Math.hypot(a.x - actor.x, a.z - actor.z) -
                  Math.hypot(b.x - actor.x, b.z - actor.z),
              );
            const cell = candidates[0];
            goal = cell
              ? { kind: 'harvest', cell, ...cell }
              : { kind: 'wait', x: actor.x, z: actor.z };
          }
        }
      }
      if (walk(actor, goal, s)) {
        if (goal.kind === 'buy') {
          const result = payBuild(s, goal.pad, DT);
          if (result.complete) {
            firstBuy ??= time;
            discoverSeeds(s);
            cells = createVillageField(s, cells);
            goal = null;
          }
        } else if (goal.kind === 'sell') {
          unload(s, 28 * DT);
          sellCarriedProducts(s);
          if (s.bag <= 0) goal = null;
        } else if (goal.kind === 'deliver') {
          deliverWorkshop(s, goal.workshop, 24 * DT);
          if (
            !Object.keys(goal.workshop.inputs).some(
              (id) => (s.cargo[id]?.count ?? 0) > 0,
            )
          )
            goal = null;
        } else if (goal.kind === 'wait') {
          goal = null;
          stalled += DT;
        }
      }
      while (harvestClock >= harvestRate(s)) {
        const elapsed = harvestRate(s);
        harvestClock -= elapsed;
        const phase = Math.max(0, Math.min(1, 1 - harvestClock / DT)),
          x = previousPosition.x + (actor.x - previousPosition.x) * phase,
          z = previousPosition.z + (actor.z - previousPosition.z) * phase;
        const picks = harvestAt(s, cells, x, z, s.journey.growthTime, 1, {
          moving: actor.moving,
          dt: elapsed,
        });
        if (style === 'farm')
          discoverShell(
            s,
            picks.reduce((sum, p) => sum + p.units, 0),
            0,
          );
        if (
          goal?.kind === 'harvest' &&
          (picks.length ||
            s.bag + productCargoCount(s) >= capacity(s) ||
            goal.cell.readyAt > s.journey.growthTime)
        )
          goal = null;
      }
      assert.ok(Number.isFinite(s.coins) && s.coins >= 0, 'invalid money');
    }
    if (!s.journey.closed)
      throw Error(
        `${style} day ${round} stalled at ${Math.round(time - startTime)} seconds; goal ${JSON.stringify(goal)} actor ${JSON.stringify(actor)} bag ${s.bag}; coins ${Math.round(s.coins)}; ${JSON.stringify(
          getBuildPads(s, TOOLS)
            .filter((p) => p.visible && !p.max)
            .map((p) => ({
              id: p.id,
              cost: p.cost,
              locked: p.locked,
              reason: p.reason,
            })),
        )}`,
      );
    const activeSeconds = time - startTime,
      earned = s.coins - beforeCoins,
      offline = offlineVillage(s, 8 * 3600);
    const day = {
      round,
      activeSeconds,
      coins: Math.round(s.coins),
      purchases: s.stats.upgrades - beforeUpgrades,
      offlineProduced: offline.produced,
      offlineCoins: offline.amount,
      growth: +growthFactor(s).toFixed(3),
    };
    days.push(day);
    assert.equal(offline.amount, 0);
    assert.ok(
      offline.produced <= WORKSHOPS.length * 8,
      'overnight production runaway',
    );
    if (round % 10 === 0 || round === 77)
      console.log(
        `${style}: day ${round}, ${Math.round(activeSeconds)} s, ${Math.round(s.coins)} coins`,
      );
    assert.ok(
      s.village.snails <= 12 &&
        s.village.farm.nursery.length <= 6 &&
        s.village.farm.food <= 100,
      'farm limit exceeded',
    );
    s.village.fieldCuts = Object.fromEntries(
      cells
        .filter((c) => c.readyAt > s.journey.growthTime)
        .map((c) => [c.key, { readyAt: c.readyAt, cutAt: c.cutAt }]),
    );
    s = normalize(JSON.parse(JSON.stringify(s)));
    cells = createVillageField(s);
    if (round < 77) {
      assert.ok(grantRound(s, `simulation:${round}`));
      assert.ok(startRound(s));
      automation = new GardenAutomation(s);
      goal = null;
    }
  }
  assert.equal(s.village.bus, true, 'bus never reached');
  assert.equal(s.journey.rewards.length, 77, 'missing rewards');
  assert.equal(s.journey.rewards.filter((r) => r.kind === 'seed').length, 7);
  assert.equal(s.journey.rewards.filter((r) => r.kind === 'water').length, 70);
  const sorted = days.map((d) => d.activeSeconds).sort((a, b) => a - b);
  return {
    style,
    firstBuy,
    median: sorted[38],
    maximum: sorted.at(-1),
    totalSeconds: time,
    finalCoins: Math.round(s.coins),
    farmSpecies: s.village.farm.discovered.length,
    farmSold: s.village.farm.sold,
    farmHelpers: s.village.farm.helpers.filter(Boolean).length,
    days,
  };
}
const results = [];
for (const style of process.argv.includes('--manual')
  ? ['manual']
  : process.argv.includes('--farm')
    ? ['farm']
    : ['manual', 'helpers', 'farm'])
  results.push(run(style));
writeFileSync(
  new URL('../balance-results.json', import.meta.url),
  JSON.stringify(
    { generatedAt: new Date().toISOString(), dt: DT, results },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    results.map(({ days, ...summary }) => summary),
    null,
    2,
  ),
);
