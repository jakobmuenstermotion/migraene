const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const assert = require("node:assert/strict");
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH || "playwright-core",
);
const root = path.resolve(__dirname, "..");
(async () => {
  const app = http.createServer((req, res) => {
    const file = path.resolve(
      root,
      "." + new URL(req.url, "http://localhost").pathname,
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(404);
      res.end();
      return;
    }
    fs.readFile(file, (err, bytes) => {
      if (err) {
        res.writeHead(404);
        res.end();
        return;
      }
      const types = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
      };
      res.writeHead(200, {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
      });
      res.end(bytes);
    });
  });
  await new Promise((r) => app.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${app.address().port}`;
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  let releaseGarden;
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: "block",
    });
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const startedAt = Date.now();
    await page.addInitScript(
      ({ startedAt }) => {
        window.__gardenTestNow =
          Number(sessionStorage.getItem("garden-test-now")) || startedAt;
        Date.now = () => window.__gardenTestNow;
        if (!sessionStorage.getItem("garden-test-seeded")) {
          localStorage.setItem(
            "mt-begleiter-v1",
            JSON.stringify({
              cfg: {
                t: "garden_test_topic_0123456789",
                k: "A".repeat(43),
                m: [],
              },
              entries: [
                {
                  id: "historical",
                  ts: startedAt - 60000,
                  u: startedAt - 60000,
                  k: "drink",
                  ml: 250,
                },
              ],
              acked: {},
              lists: {},
            }),
          );
          sessionStorage.setItem("garden-test-seeded", "1");
        }
      },
      { startedAt },
    );
    let acknowledgement = null;
    // Every external request is intercepted. No diary entry or test message leaves this process.
    await context.route("**/*", async (route) => {
      const destination = route.request().url();
      if (destination.startsWith(url + "/")) return route.continue();
      if (acknowledgement && destination.includes("-ok/json"))
        return route.fulfill({
          status: 200,
          contentType: "text/plain",
          body: acknowledgement,
        });
      if (acknowledgement && destination.includes("-v/json"))
        return route.fulfill({
          status: 200,
          contentType: "text/plain",
          body: "",
        });
      return route.abort();
    });
    const gardenGate = new Promise((r) => {
      releaseGarden = r;
    });
    await page.route("**/companion-garden.js", async (route) => {
      await gardenGate;
      return route.continue();
    });
    await page.goto(url + "/begleiter.html", { waitUntil: "commit" });
    await page.locator('.big[data-act="drink"]').click();
    releaseGarden();
    await page.waitForSelector(".garden-footer");
    assert.equal(await page.evaluate(() => {const toolbar=document.querySelector('.garden-inline');return !!toolbar&&[...document.querySelectorAll('#app .big[data-act]')].every(button=>!!(button.compareDocumentPosition(toolbar)&Node.DOCUMENT_POSITION_FOLLOWING));}),true,'Garden controls and hints must follow every entry button, including both grids during an attack');
    const journal = () =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("mt-garden-actions-v1")),
      );
    assert.equal((await journal()).actions.length, 1);
    assert.equal(
      await page.locator(".garden-footer button").first().isEnabled(),
      true,
    );
    const first = await page.evaluate(() => {
      const st = JSON.parse(localStorage.getItem("mt-begleiter-v1"));
      return {
        entry: st.entries.at(-1),
        acked: st.acked,
        metadata: window.CompanionGardenEvents.snapshot(),
      };
    });
    assert.deepEqual(first.acked, {});
    for (const value of first.metadata)
      assert.deepEqual(Object.keys(value).sort(), ["deleted", "id", "ts"]);
    assert.deepEqual((await journal()).actions, ["entry:" + first.entry.id]);
    console.log(
      "Local save unlocks a garden day immediately without ACK, even before the garden bundle attaches",
    );
    await page.evaluate(() => {
      window.__gardenTestNow += 10 * 60 * 1000;
      sessionStorage.setItem("garden-test-now", String(window.__gardenTestNow));
    });
    await page.locator("#mlr").evaluate((input) => {
      input.value = "6";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    assert.equal((await journal()).actions.length, 1);
    await page.locator('.big[data-act="drink"]').click();
    assert.equal((await journal()).actions.length, 2);
    await page.locator('.big[data-act="nausea"]').click();
    assert.equal((await journal()).actions.length, 2);
    await page.reload();
    await page.waitForSelector(".garden-footer");
    assert.equal((await journal()).actions.length, 2);
    console.log(
      "Edits and reload do not grant extra days; a new entry after ten minutes does",
    );
    acknowledgement = await page.evaluate(async () => {
      const st = JSON.parse(localStorage.getItem("mt-begleiter-v1"));
      const payload = { a: st.entries.map((e) => [e.id, e.u]) };
      const key = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(32),
        { name: "AES-GCM" },
        false,
        ["encrypt"],
      );
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const cipher = new Uint8Array(
        await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          key,
          new TextEncoder().encode(JSON.stringify(payload)),
        ),
      );
      const packet = new Uint8Array(iv.length + cipher.length);
      packet.set(iv);
      packet.set(cipher, iv.length);
      const encoded = btoa(String.fromCharCode(...packet))
        .replaceAll("+", "-")
        .replaceAll("/", "_")
        .replaceAll("=", "");
      return (
        JSON.stringify({
          event: "message",
          time: Math.floor(Date.now() / 1000),
          message: "MT1." + encoded,
        }) + "\n"
      );
    });
    await page.evaluate(() => window.dispatchEvent(new Event("online")));
    await page.waitForFunction(() => {
      const st = JSON.parse(localStorage.getItem("mt-begleiter-v1"));
      return st.entries.every((e) => st.acked[e.id] === e.u);
    });
    assert.equal((await journal()).actions.length, 2);
    await page
      .locator('[data-act="del"][data-id="' + first.entry.id + '"]')
      .click();
    assert.equal((await journal()).actions.length, 2);
    console.log(
      "A real encrypted test ACK still marks entries as delivered without duplicating actions; deletion keeps the earned day",
    );
    await page.evaluate(() => {
      window.__gardenTestNow += 10 * 60 * 1000;
      window.CompanionGardenEvents.entries(
        window.CompanionGardenEvents.snapshot(),
      );
    });
    assert.equal((await journal()).actions.length, 2);
    await page.locator('.big[data-act="drink"]').click();
    assert.equal((await journal()).actions.length, 3);
    await page.evaluate(() => {
      window.__gardenTestNow += 10 * 60 * 1000;
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "mt-begleiter-v1")
          throw new DOMException("Test full storage", "QuotaExceededError");
        return set.call(this, key, value);
      };
    });
    await page.locator('.big[data-act="drink"]').click();
    assert.equal((await journal()).actions.length, 3);
    // Catch-up purchases have their own receipt; a spent old daily seed stays spent.
    await page.evaluate(() => {
      localStorage.setItem(
        "mt-garden-plants-v1",
        JSON.stringify({
          version: 1,
          beds: {},
          tokens: [],
          receipts: ["garden-day:1"],
        }),
      );
      localStorage.setItem(
        "mondgarten.companion.save.v1",
        JSON.stringify({
          journey: {
            round: 7,
            rewards: [{ id: "garden-day:1", round: 1, kind: "seed" }],
            seedCatchups: [{ id: "garden-seed:2", round: 7, kind: "seed" }],
          },
        }),
      );
      window.dispatchEvent(
        new StorageEvent("storage", { key: "mondgarten.companion.save.v1" }),
      );
    });
    await page.waitForFunction(() =>
      JSON.parse(localStorage.getItem("mt-garden-plants-v1")).tokens.some(
        (t) => t.id === "garden-seed:2",
      ),
    );
    const purchasedSeed = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mt-garden-plants-v1")),
    );
    assert.deepEqual(purchasedSeed.tokens, [
      { id: "garden-seed:2", kind: "seed" },
    ]);
    await page.reload();
    await page.waitForSelector(".garden-footer");
    assert.deepEqual(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("mt-garden-plants-v1")),
      ),
      purchasedSeed,
    );
    console.log(
      "Purchased catch-up seed reaches the real companion ledger once; old spent daily rewards and reload cannot duplicate it",
    );
    assert.deepEqual(errors, []);
    console.log(
      "Cooldown entries do not become delayed rewards; a failed diary save never grants a garden day; no browser errors",
    );
  } finally {
    releaseGarden?.();
    await browser.close();
    app.closeAllConnections();
    await new Promise((r) => app.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
