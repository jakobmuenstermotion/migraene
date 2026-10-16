import test from "node:test";
import assert from "node:assert/strict";
import { freshState, normalize, TOOLS } from "./mondgarten/core.mjs";
import { prepareDay } from "./mondgarten/daily.mjs";
import {
  startRound,
  closeDay,
  growthFactor,
  grantRound,
} from "./mondgarten/journey.mjs";
import {
  bedYield,
  productionSeconds,
  getBuildPads,
  payBuild,
} from "./mondgarten/village.mjs";
import { WORKSHOPS } from "./mondgarten/village-content.mjs";
import { FARM } from "./mondgarten/snail-farm.mjs";
import {
  FEEDBACK_LIMITS,
  freshFeedback,
  activeFeedback,
  feedbackPending,
  submitFeedback,
  skipFeedback,
  workshopQuestionAvailable,
} from "./mondgarten/day-feedback.mjs";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const logDistance = (a, b) =>
  ["effort", "income", "workshop"].reduce(
    (sum, k) => sum + Math.abs(Math.log(a[k] / b[k])),
    0,
  );
function purchased({ workshop = false } = {}) {
  const s = freshState();
  s.journey.round = 7;
  if (workshop) s.village.workshops.bouquet.level = 1;
  prepareDay(s, TOOLS);
  s.coins = 1e9;
  const pad = getBuildPads(s, TOOLS).find((p) => p.id === "endDay");
  assert.ok(payBuild(s, pad, 20).complete);
  return s;
}
function nextDay(s) {
  grantRound(s, "feedback-test:" + s.journey.round);
  assert.ok(startRound(s));
  prepareDay(s, TOOLS);
}

test("old saves get neutral feedback without reopening previous completed days or changing their economics", () => {
  const s = freshState();
  prepareDay(s, TOOLS);
  const old = structuredClone(s);
  delete old.feedback;
  const restored = normalize(old);
  assert.deepEqual(restored.feedback, freshFeedback());
  assert.deepEqual(restored.journey.plan, s.journey.plan);
  near(bedYield(restored, 0), bedYield(s, 0));
  old.journey.closed = true;
  assert.equal(feedbackPending(normalize(old)), false);
});
test("only a successful paid closure queues feedback; missed sleep, partial payments and repeat closure cannot add a questionnaire", () => {
  const s = freshState();
  prepareDay(s, TOOLS);
  s.coins = 1;
  assert.equal(
    payBuild(
      s,
      getBuildPads(s, TOOLS).find((p) => p.id === "endDay"),
      0.1,
    ).complete,
    false,
  );
  assert.equal(feedbackPending(s), false);
  s.journey.asleep = true;
  s.journey.closed = true;
  assert.equal(feedbackPending(s), false);
  assert.equal(closeDay(s), false);
  const paid = purchased();
  assert.equal(feedbackPending(paid), true);
  assert.equal(closeDay(paid), false);
  assert.equal(paid.journey.rewards.length, 1);
});
test("skipping and neutral answers never change preferences; each completed day can be resolved only once", () => {
  const s = purchased(),
    base = structuredClone(s.feedback.next);
  assert.ok(skipFeedback(s));
  assert.deepEqual(s.feedback.next, base);
  assert.equal(submitFeedback(s, { length: 100, income: -100 }), false);
  assert.equal(skipFeedback(s), false);
  nextDay(s);
  assert.ok(closeDay(s));
  assert.ok(submitFeedback(s, { length: 0, income: 0 }));
  assert.deepEqual(s.feedback.next, base);
  assert.deepEqual(
    s.feedback.history.map((h) => h.answers),
    [null, { length: 0, income: 0 }],
  );
});
test("a longer-than-wanted day reduces next reference effort and income votes have the correct direction and proportional strength", () => {
  const strong = purchased(),
    mild = purchased(),
    easy = purchased();
  submitFeedback(strong, { length: 100, income: 0 });
  submitFeedback(mild, { length: 50, income: 0 });
  submitFeedback(easy, { length: 0, income: 100 });
  assert.ok(
    strong.feedback.next.effort < mild.feedback.next.effort &&
      mild.feedback.next.effort < 1,
  );
  near(
    Math.log(strong.feedback.next.effort),
    2 * Math.log(mild.feedback.next.effort),
  );
  assert.ok(easy.feedback.next.income < 1);
  const hard = purchased();
  submitFeedback(hard, { length: 0, income: -100 });
  assert.ok(hard.feedback.next.income > 1);
  const short = purchased();
  submitFeedback(short, { length: -100, income: 0 });
  assert.ok(short.feedback.next.effort > 1);
});
test("workshop question appears only with a built workshop, and unavailable answers cannot alter its factor", () => {
  const s = purchased();
  assert.equal(workshopQuestionAvailable(s), false);
  assert.ok(submitFeedback(s, { length: 0, income: 0, workshop: 100 }));
  assert.equal(s.feedback.next.workshop, 1);
  const built = purchased({ workshop: true });
  assert.equal(workshopQuestionAvailable(built), true);
  assert.equal(submitFeedback(built, { length: 0, income: 0 }), false);
  assert.ok(submitFeedback(built, { length: 0, income: 0, workshop: 100 }));
  assert.ok(built.feedback.next.workshop < 1);
});
test("feedback is deferred to next earned day and leaves wallet, products, active production, instalments and current harvest unchanged", () => {
  const s = purchased({ workshop: true });
  s.village.raw = { moonbloom: 9 };
  s.village.rawValues = { moonbloom: 99 };
  s.village.payments["tool:bag"] = 12;
  const machine = s.village.workshops.bouquet;
  machine.running = true;
  machine.progress = 2;
  machine.outputValue = 33;
  machine.inputs = { moonbloom: 6 };
  machine.inputValues = { moonbloom: 60 };
  s.bag = 2;
  s.bagValue = 44;
  s.cargo = { moonbloom: { count: 2, value: 44 } };
  const old = structuredClone(s),
    yieldBefore = bedYield(s, 0),
    secondsBefore = productionSeconds(s, WORKSHOPS[0]);
  assert.ok(submitFeedback(s, { length: 100, income: -100, workshop: 100 }));
  near(bedYield(s, 0), yieldBefore);
  near(productionSeconds(s, WORKSHOPS[0]), secondsBefore);
  assert.deepEqual(s.village, old.village);
  assert.equal(s.coins, old.coins);
  assert.equal(s.bagValue, old.bagValue);
  assert.deepEqual(s.journey.plan, old.journey.plan);
  nextDay(s);
  assert.deepEqual(
    { ...activeFeedback(s), round: 7 },
    { ...s.feedback.next, round: 7 },
  );
  assert.ok(productionSeconds(s, WORKSHOPS[0]) < secondsBefore);
  assert.equal(s.bagValue, 44);
  assert.equal(s.village.workshops.bouquet.outputValue, 33);
});
test("daily quote calibration does not cancel income feedback or accumulate it again when preparing or loading the same day", () => {
  const s = purchased();
  submitFeedback(s, { length: 100, income: -100 });
  nextDay(s);
  const baseline = structuredClone(s);
  baseline.feedback = freshFeedback(s.journey.round);
  baseline.journey.plan = null;
  prepareDay(baseline, TOOLS);
  const ratio = bedYield(s, 0) / bedYield(baseline, 0);
  near(ratio, s.feedback.active.income / s.feedback.active.effort);
  const before = structuredClone(s.journey.plan);
  prepareDay(s, TOOLS);
  assert.deepEqual(s.journey.plan, before);
  const reloaded = normalize(JSON.parse(JSON.stringify(s)));
  prepareDay(reloaded, TOOLS);
  near(bedYield(reloaded, 0), bedYield(s, 0));
  assert.deepEqual(reloaded.feedback, s.feedback);
});
test("all three sliders share the 3 percent step and common 20 percent total budget over a thousand changing days", () => {
  let s = purchased({ workshop: true });
  const neutral = { effort: 1, income: 1, workshop: 1 };
  for (let i = 0; i < 1000; i++) {
    const before = structuredClone(s.feedback.next),
      sign = i < 150 || i > 700 ? 1 : -1;
    assert.ok(
      submitFeedback(s, {
        length: sign * 100,
        income: -sign * 100,
        workshop: sign * 100,
      }),
    );
    const after = s.feedback.next;
    assert.ok(
      logDistance(before, after) <= Math.log(FEEDBACK_LIMITS.step) + 1e-10,
    );
    assert.ok(
      logDistance(neutral, after) <= Math.log(FEEDBACK_LIMITS.total) + 1e-10,
    );
    const combined = after.income / after.effort / after.workshop;
    assert.ok(combined <= 1.2 + 1e-10 && combined >= 1 / 1.2 - 1e-10);
    assert.ok(s.feedback.history.length <= 100);
    s = normalize(JSON.parse(JSON.stringify(s)));
    nextDay(s);
    assert.ok(closeDay(s));
  }
});
test("one maximum vote saturates gently and reversing it can move back toward neutral", () => {
  const s = purchased();
  for (let i = 0; i < 30; i++) {
    submitFeedback(s, { length: 0, income: -100 });
    nextDay(s);
    closeDay(s);
  }
  near(s.feedback.next.income, 1.2);
  const before = s.feedback.next.income;
  submitFeedback(s, { length: 0, income: 100 });
  assert.ok(s.feedback.next.income < before);
});
test("pending feedback and resolved history survive save/import without a second adjustment or retroactive old-day prompt", () => {
  const s = purchased({ workshop: true }),
    pending = normalize(JSON.parse(JSON.stringify(s)));
  assert.ok(feedbackPending(pending));
  submitFeedback(pending, { length: 50, income: -50, workshop: 50 });
  const restored = normalize(JSON.parse(JSON.stringify(pending)));
  assert.equal(feedbackPending(restored), false);
  assert.equal(
    submitFeedback(restored, { length: 100, income: -100, workshop: 100 }),
    false,
  );
  assert.deepEqual(restored.feedback, pending.feedback);
});
test("malformed sliders do not consume the pending answer and imported extreme factors are bounded", () => {
  const s = purchased({ workshop: true }),
    before = structuredClone(s.feedback);
  for (const invalid of [
    { length: NaN, income: 0, workshop: 0 },
    { length: 101, income: 0, workshop: 0 },
    { length: 0, income: "100", workshop: 0 },
    { length: 0, income: 0, workshop: Infinity },
  ]) {
    assert.equal(submitFeedback(s, invalid), false);
    assert.deepEqual(s.feedback, before);
  }
  s.feedback.next = { effort: 1e-100, income: 1e100, workshop: NaN };
  const restored = normalize(s);
  assert.ok(
    logDistance(restored.feedback.next, {
      effort: 1,
      income: 1,
      workshop: 1,
    }) <=
      Math.log(1.2) + 1e-10,
  );
});
test("growth slowdown, ten-minute rhythm, food kitchen and snail growth remain independent of feedback", () => {
  const s = purchased({ workshop: true });
  s.journey.elapsed = 540;
  const before = growthFactor(s),
    farm = structuredClone(FARM);
  submitFeedback(s, { length: 100, income: -100, workshop: 100 });
  assert.equal(growthFactor(s), before);
  assert.equal(s.journey.elapsed, 540);
  assert.deepEqual(FARM, farm);
});
