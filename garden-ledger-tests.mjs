import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyJournal,
  acceptEntries,
  acceptGiftCounter,
} from "./garden-ledger.mjs";
import { GARDEN } from "./garden-config.mjs";
import { freshState } from "./mondgarten/core.mjs";
import {
  prepareHostedState,
  syncCompanionActions,
} from "./mondgarten/companion-bridge.mjs";
const start = 1_000_000,
  cooldown = GARDEN.cooldownMs;
const entry = (id, ts = start, deleted = false) => ({ id, ts, deleted });

test("a locally saved entry immediately unlocks the first hosted day without any delivery acknowledgement", () => {
  const journal = acceptEntries(
    emptyJournal(start),
    [entry("local:one")],
    start,
    cooldown,
  );
  assert.deepEqual(journal.actions, ["entry:local:one"]);
  const game = prepareHostedState(freshState());
  syncCompanionActions(game, journal);
  assert.equal(game.journey.round, 1);
  assert.equal(game.journey.closed, false);
  syncCompanionActions(game, journal);
  assert.equal(game.journey.pending, 0);
});

test("local edits, repeated snapshots and later acknowledgements cannot duplicate an earned action", () => {
  const first = acceptEntries(
    emptyJournal(start),
    [entry("local:one")],
    start,
    cooldown,
  );
  const later = acceptEntries(
    first,
    [entry("local:one")],
    start + cooldown + 1,
    cooldown,
  );
  assert.deepEqual(later.actions, first.actions);
  assert.equal(later.lastRewardAt, start);
});

test("entries made during the ten minute cooldown remain handled after waiting and reload", () => {
  let journal = acceptEntries(
    emptyJournal(start),
    [entry("one")],
    start,
    cooldown,
  );
  journal = acceptEntries(
    journal,
    [entry("two", start + 1)],
    start + 1,
    cooldown,
  );
  journal = acceptEntries(
    JSON.parse(JSON.stringify(journal)),
    [entry("one"), entry("two", start + 1)],
    start + cooldown,
    cooldown,
  );
  assert.equal(journal.actions.length, 1);
  journal = acceptEntries(
    journal,
    [entry("three", start + cooldown)],
    start + cooldown,
    cooldown,
  );
  assert.equal(journal.actions.length, 2);
});

test("deletion cannot earn an action or revoke a previously earned day", () => {
  const first = acceptEntries(
    emptyJournal(start),
    [entry("one")],
    start,
    cooldown,
  );
  const deleted = acceptEntries(
    first,
    [entry("one", start, true), entry("two", start + cooldown, true)],
    start + cooldown,
    cooldown,
  );
  assert.deepEqual(deleted.actions, first.actions);
});

test("historical entries from before garden setup and invalid future dates cannot earn a local reward", () => {
  const journal = acceptEntries(
    emptyJournal(start),
    [entry("historical", start - 1), entry("future", start + 120001)],
    start,
    cooldown,
  );
  assert.deepEqual(journal.actions, []);
});

test("authenticated gift counters remain independent of local-entry cooldown and are deduplicated", () => {
  const first = acceptEntries(
    emptyJournal(start),
    [entry("one")],
    start,
    cooldown,
  );
  const gifts = acceptGiftCounter(first, { epoch: 1, count: 2 });
  assert.equal(gifts.actions.length, 3);
  assert.deepEqual(
    acceptGiftCounter(gifts, { epoch: 1, count: 2 }).actions,
    gifts.actions,
  );
  assert.equal(gifts.lastRewardAt, start);
});
