const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH || "playwright-core",
);
const assert = require("node:assert/strict"),
  http = require("node:http"),
  fs = require("node:fs/promises"),
  path = require("node:path");
const root = path.resolve(__dirname, "..");
(async () => {
  const { freshState } = await import("../mondgarten/core.mjs");
  const s = freshState();
  s.tutorial = 3;
  s.sound = false;
  s.journey.round = 7;
  s.journey.pending = 1;
  s.coins = 1e9;
  s.village.workshops.bouquet.level = 1;
  const server = http.createServer(async (req, res) => {
    const file = path.resolve(
      root,
      "." + new URL(req.url, "http://localhost").pathname,
    );
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const bytes = await fs.readFile(file);
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".mjs": "text/javascript",
          ".css": "text/css",
          ".svg": "image/svg+xml",
        }[path.extname(file)] || "application/octet-stream",
      );
      res.end(bytes);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  try {
    const page = await browser.newPage({
        viewport: { width: 390, height: 844 },
        serviceWorkers: "block",
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const origin = "http://127.0.0.1:" + server.address().port;
    await page.route("**/*", (route) =>
      route.request().url().startsWith(origin)
        ? route.continue()
        : route.abort(),
    );

    await page.addInitScript((value) => {
      if (!sessionStorage.getItem("feedback-seeded")) {
        localStorage.setItem("mondgarten.save.v1", value);
        sessionStorage.setItem("feedback-seeded", "1");
      }
    }, JSON.stringify(s));
    const saved = () =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("mondgarten.save.v1")),
      );
    const install = () =>
      page.evaluate(async () => {
        const { GardenScene } = await import("/mondgarten/scene.js"),
          { GardenControls } = await import("/mondgarten/controls.js");
        const update = GardenScene.prototype.update,
          direction = GardenControls.prototype.direction;
        GardenScene.prototype.update = function (dt, args) {
          window.feedbackState = this.villageState;
          update.call(this, dt, args);
        };
        GardenControls.prototype.direction = function (player) {
          if (window.feedbackPlace && !this.blocked()) {
            Object.assign(player, window.feedbackPlace);
            window.feedbackPlace = null;
            this.stop();
          }
          return direction.call(this, player);
        };
      });
    const buyReward = async () => {
      await page.evaluate(() => {
        window.feedbackPlace = { x: -9, z: 1 };
      });
      await page.waitForSelector("#dayFeedbackForm", { timeout: 90000 });
    };
    const slider = async (id, key) => {
      const input = page.locator("#feedback-" + id);
      await input.focus();
      await input.press(key);
    };
    await page.goto(origin + "/mondgarten/index.html");
    await page.waitForFunction(() => !document.querySelector("#loading"));
    await install();
    await buyReward();
    assert.equal(await page.locator("input[type=range]").count(), 3);
    const before = await saved();
    assert.equal(before.journey.closed, true);
    assert.equal(before.feedback.pendingRound, 7);
    assert.equal(before.journey.rewards.length, 1);
    const economics = await page.evaluate(async () => {
      const { bedYield, productionSeconds } =
        await import("/mondgarten/village.mjs");
      const { WORKSHOPS } = await import("/mondgarten/village-content.mjs");
      return {
        harvest: bedYield(window.feedbackState, 0),
        seconds: productionSeconds(window.feedbackState, WORKSHOPS[0]),
      };
    });
    await page
      .locator("#modal")
      .screenshot({ path: "/tmp/mondgarten-day-feedback.png" });
    // A reload between buying and answering restores the optional page and reward.
    await page.reload();
    await page.waitForSelector("#dayFeedbackForm");
    await install();
    await slider("length", "End");
    await slider("income", "Home");
    await slider("workshop", "End");
    assert.equal(
      await page.locator("#feedback-length").getAttribute("aria-valuetext"),
      "Viel zu lang",
    );
    assert.equal(
      await page.locator("#feedback-income").getAttribute("aria-valuetext"),
      "Viel zu mühsam",
    );
    await page.locator("#submitDayFeedback").click();
    await page.waitForSelector("#nightGarden");
    const after = await saved();
    assert.equal(after.feedback.lastResolved, 7);
    assert.equal(after.feedback.pendingRound, 0);
    assert.equal(after.feedback.history.length, 1);
    assert.deepEqual(after.feedback.history[0].answers, {
      length: 100,
      income: -100,
      workshop: 100,
    });
    assert.deepEqual(after.feedback.active, before.feedback.active);
    assert.equal(after.coins, before.coins);
    assert.deepEqual(after.journey.rewards, before.journey.rewards);
    const stillSame = await page.evaluate(async () => {
      const { bedYield, productionSeconds } =
        await import("/mondgarten/village.mjs");
      const { WORKSHOPS } = await import("/mondgarten/village-content.mjs");
      return {
        harvest: bedYield(window.feedbackState, 0),
        seconds: productionSeconds(window.feedbackState, WORKSHOPS[0]),
      };
    });
    assert.deepEqual(stillSame, economics);
    await page.locator("#dayRounds").click();
    await page.locator("#useRound").click();
    const next = await saved();
    assert.equal(next.journey.round, 8);
    assert.ok(next.feedback.active.effort < 1);
    assert.ok(next.feedback.active.income > 1);
    assert.ok(next.feedback.active.workshop < 1);
    await buyReward();
    await page.locator("#closeModal").click();
    const dismissed = await saved();
    assert.equal(dismissed.feedback.lastResolved, 8);
    assert.equal(dismissed.feedback.history[1].answers, null);
    assert.deepEqual(dismissed.feedback.next, after.feedback.next);
    await page.locator("#gardenMenu").click();
    await page.locator("#menuGoal").click();
    await page.waitForSelector("#nightGarden");
    assert.equal(await page.locator("#dayFeedbackForm").count(), 0);
    await page.locator("#nightGarden").click();
    await page.reload();
    await page.waitForFunction(() => !document.querySelector("#loading"));
    assert.equal(await page.locator("#dayFeedbackForm").count(), 0);
    // New early-game fixture exercises the two-question variant and explicit skip.
    const early = freshState();
    early.tutorial = 3;
    early.coins = 1e9;
    await page.locator("#gardenMenu").click();
    await page.locator("#menuSettings").click();
    await page.locator("#saveFile").setInputFiles({
      name: "feedback-early.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(early)),
    });
    await page.locator("#confirmImport").click();
    await install();
    await buyReward();
    assert.equal(await page.locator("input[type=range]").count(), 2);
    assert.equal(await page.locator("#feedback-workshop").count(), 0);
    await page.locator("#skipDayFeedback").click();
    await page.waitForSelector("#nightGarden");
    const skipped = await saved();
    assert.equal(skipped.feedback.lastResolved, 1);
    assert.deepEqual(skipped.feedback.next, {
      effort: 1,
      income: 1,
      workshop: 1,
    });
    assert.equal(skipped.journey.rewards.length, 1);
    assert.equal(skipped.feedback.history[0].answers, null);
    // Native Escape also resolves the optional page; use a genuinely pending saved fixture.
    const pending = structuredClone(before);
    pending.savedAt = Date.now();
    await page.locator("#nightGarden").click();
    await page.locator("#gardenMenu").click();
    await page.locator("#menuSettings").click();
    await page.locator("#saveFile").setInputFiles({
      name: "feedback-pending.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(pending)),
    });
    await page.locator("#confirmImport").click();
    await page.locator("#gardenMenu").click();
    await page.locator("#menuGoal").click();
    await page.waitForSelector("#dayFeedbackForm");
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("mondgarten.save.v1")).feedback
          .lastResolved === 7,
    );
    assert.equal((await saved()).feedback.history[0].answers, null);
    assert.deepEqual(errors, []);
    console.log(
      "Day feedback browser: real reward purchase, conditional questions, slider labels, pending reload, deferred next-day effects, one-shot save, explicit skip, close and Escape preserve rewards and prevent repeated prompts",
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
