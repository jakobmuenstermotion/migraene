export const DAY_RHYTHM = {
  warning: 27 * 60,
  lastWarning: 29 * 60,
  sleep: 30 * 60,
};
// Only active play advances elapsed. Menus and absence cannot lose a reward.
export function advanceDayRhythm(s) {
  const j = s.journey;
  if (j.round === 0 || j.asleep) return null;
  if (j.elapsed >= DAY_RHYTHM.sleep) {
    const missed = !j.closed;
    // Refund an unfinished reward purchase, but preserve all building deposits.
    const refund = missed ? Math.max(0, s.village.payments.endDay ?? 0) : 0;
    if (refund) {
      s.coins += refund;
      delete s.village.payments.endDay;
      if (j.plan) j.plan.spent = Math.max(0, j.plan.spent - refund);
    }
    j.closed = true;
    j.asleep = true;
    j.sleepMissed = missed;
    return { kind: "sleep", missed, refund };
  }
  const level =
    j.elapsed >= DAY_RHYTHM.lastWarning
      ? 2
      : j.elapsed >= DAY_RHYTHM.warning
        ? 1
        : 0;
  if (level > (j.sleepWarning ?? 0)) {
    j.sleepWarning = level;
    return {
      kind: "warning",
      seconds: Math.ceil(DAY_RHYTHM.sleep - j.elapsed),
    };
  }
  return null;
}
