import test from "node:test";
import assert from "node:assert/strict";
import {
  WORLD,
  stackHeight,
  stackLayers,
  stackLevels,
} from "./mondgarten/content.mjs";
import { capacity, freshState } from "./mondgarten/core.mjs";

test("the stack grows with every collected unit and reaches maximum height only at full capacity", () => {
  const max = WORLD.stack.maxVisible * WORLD.stack.layerHeight;
  for (const bag of [0, 1, 3, 8, 16])
    for (const pocket of [0, 3]) {
      const s = freshState();
      s.tools.bag = bag;
      s.permanent.pocket = pocket;
      const cap = capacity(s);
      let previous = 0;
      for (let amount = 1; amount <= cap; amount++) {
        const height = stackHeight(amount, cap);
        assert.ok(height > previous, `${amount}/${cap} stopped growing`);
        if (amount < cap) assert.ok(height < max);
        assert.ok(stackLayers(amount, cap) <= WORLD.stack.maxVisible);
        previous = height;
      }
      assert.equal(previous, max);
      assert.equal(stackHeight(0, cap), 0);
      assert.equal(stackLayers(0, cap), 0);
    }
});

test("a larger backpack and mixed product cargo use the same fill-ratio scale without an early plateau", () => {
  const cap = 272;
  assert.ok(stackHeight(52, cap) < stackHeight(53, cap));
  assert.ok(stackHeight(150, cap) < stackHeight(151, cap));
  assert.ok(stackHeight(cap - 1, cap) < stackHeight(cap, cap));
  assert.equal(stackLayers(52, cap), 5);
  assert.equal(stackHeight(40, 80), stackHeight(136, 272));
  assert.equal(stackHeight(100 + 36, cap), stackHeight(cap / 2, cap));
  assert.equal(stackLevels(cap, cap), WORLD.stack.maxVisible);
  assert.equal(stackHeight(cap + 1, cap), stackHeight(cap, cap));
});
