// Local, bounded preferences. The current day keeps its own frozen settings.
export const FEEDBACK_LIMITS = { step: 1.03, total: 1.2, history: 100 };
const keys = ["effort", "income", "workshop"];
const neutral = () => ({ effort: 1, income: 1, workshop: 1 });
const norm = (values) => values.reduce((sum, v) => sum + Math.abs(v), 0);
const finite = (n, fallback = 0) => (Number.isFinite(n) ? n : fallback);
const roundNumber = (n) =>
  Number.isSafeInteger(n) && n >= 0 && n <= 10000 ? n : 0;
function safeFactors(raw) {
  let logs = keys.map((k) =>
    Math.log(
      Math.max(
        1 / FEEDBACK_LIMITS.total,
        Math.min(FEEDBACK_LIMITS.total, finite(raw?.[k], 1)),
      ),
    ),
  );
  const total = norm(logs),
    limit = Math.log(FEEDBACK_LIMITS.total);
  if (total > limit) logs = logs.map((v) => (v * limit) / total);
  return Object.fromEntries(keys.map((k, i) => [k, Math.exp(logs[i])]));
}
export function freshFeedback(round = 1) {
  return {
    version: 1,
    next: neutral(),
    active: { round, ...neutral() },
    pendingRound: 0,
    lastResolved: 0,
    history: [],
  };
}
export function normalizeFeedback(raw, round) {
  const f = freshFeedback(round);
  if (raw?.version !== 1) return f;
  f.next = safeFactors(raw.next);
  f.active = {
    round,
    ...(raw.active?.round === round ? safeFactors(raw.active) : neutral()),
  };
  f.lastResolved = Math.min(round, roundNumber(raw.lastResolved));
  f.pendingRound =
    roundNumber(raw.pendingRound) === round && f.lastResolved < round
      ? round
      : 0;
  const seen = new Set();
  f.history = (Array.isArray(raw.history) ? raw.history : [])
    .filter(
      (r) =>
        r &&
        roundNumber(r.round) > 0 &&
        r.round <= f.lastResolved &&
        !seen.has(r.round) &&
        seen.add(r.round),
    )
    .slice(-FEEDBACK_LIMITS.history)
    .map((r) => ({
      round: r.round,
      answers:
        r.answers &&
        ["length", "income"].every(
          (k) => Number.isFinite(r.answers[k]) && Math.abs(r.answers[k]) <= 100,
        )
          ? {
              length: r.answers.length,
              income: r.answers.income,
              ...(Number.isFinite(r.answers.workshop) &&
              Math.abs(r.answers.workshop) <= 100
                ? { workshop: r.answers.workshop }
                : {}),
            }
          : null,
    }));
  return f;
}
export function activeFeedback(s) {
  return s.feedback?.active?.round === s.journey.round
    ? s.feedback.active
    : neutral();
}
export function activateFeedback(s) {
  s.feedback ??= freshFeedback(s.journey.round);
  if (s.feedback.active.round !== s.journey.round)
    s.feedback.active = {
      round: s.journey.round,
      ...safeFactors(s.feedback.next),
    };
  return s.feedback.active;
}
export function queueFeedback(s) {
  s.feedback ??= freshFeedback(s.journey.round);
  if (s.feedback.lastResolved < s.journey.round)
    s.feedback.pendingRound = s.journey.round;
}
export function feedbackPending(s) {
  return (
    s.journey.closed &&
    !s.journey.asleep &&
    s.feedback?.pendingRound === s.journey.round &&
    s.feedback.lastResolved < s.journey.round
  );
}
export function workshopQuestionAvailable(s) {
  return Object.values(s.village.workshops).some((w) => w.level > 0);
}
function record(s, answers) {
  const f = s.feedback;
  f.lastResolved = s.journey.round;
  f.pendingRound = 0;
  f.history.push({ round: s.journey.round, answers });
  f.history = f.history.slice(-FEEDBACK_LIMITS.history);
}
export function skipFeedback(s) {
  if (!feedbackPending(s)) return false;
  record(s, null);
  return true;
}
export function submitFeedback(s, answers) {
  if (
    !feedbackPending(s) ||
    !answers ||
    !["length", "income"].every(
      (k) => Number.isFinite(answers[k]) && Math.abs(answers[k]) <= 100,
    )
  )
    return false;
  const hasWorkshop = workshopQuestionAvailable(s);
  if (
    hasWorkshop &&
    (!Number.isFinite(answers.workshop) || Math.abs(answers.workshop) > 100)
  )
    return false;
  const vote = {
    length: answers.length,
    income: answers.income,
    ...(hasWorkshop ? { workshop: answers.workshop } : {}),
  };
  const amount = (n) => (Math.abs(n) < 10 ? 0 : n / 100);
  // Long days -> less reference effort; difficult income -> higher new harvest value;
  // long waits -> shorter production. Share a single budget across all questions.
  let delta = [
    -amount(vote.length),
    -amount(vote.income),
    -amount(vote.workshop ?? 0),
  ];
  const weight = Math.max(1, norm(delta)),
    budget = Math.log(FEEDBACK_LIMITS.step);
  delta = delta.map((n) => (n * budget) / weight);
  const before = safeFactors(s.feedback.next),
    logs = keys.map((k) => Math.log(before[k])),
    limit = Math.log(FEEDBACK_LIMITS.total);
  // Move only as far as the common total budget permits. This never moves other
  // preferences unexpectedly just to make room for a saturated slider.
  let low = 0,
    high = 1;
  for (let i = 0; i < 48; i++) {
    const mid = (low + high) / 2;
    if (norm(logs.map((v, j) => v + delta[j] * mid)) <= limit + 1e-14)
      low = mid;
    else high = mid;
  }
  s.feedback.next = Object.fromEntries(
    keys.map((k, i) => [k, Math.exp(logs[i] + delta[i] * low)]),
  );
  record(s, vote);
  return true;
}
