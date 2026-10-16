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
  const { FARM_PLACES } = await import("../mondgarten/snail-appearance.mjs");
  const { VILLAGE } = await import("../mondgarten/village-content.mjs");
  const kitchenSpot = (key) => [
    VILLAGE.farm.x + FARM_PLACES[key][0],
    VILLAGE.farm.z + FARM_PLACES[key][1],
  ];
  const s = freshState();
  s.tutorial = 3;
  s.sound = false;
  s.journey.round = 25;
  s.village.farm.built = true;
  s.village.beds[1] = 1;
  s.village.house = 3;
  s.bag = 40;
  s.bagValue = 80;
  s.cargo = { moonbloom: { count: 40, value: 80 } };
  s.productCargo = { items: { bouquet: 3 }, values: { bouquet: 90 } };
  s.village.raw = { moonbloom: 20 };
  s.village.rawValues = { moonbloom: 40 };
  s.village.farm.nextID = 3;
  s.village.farm.nursery = [
    { id: 1, species: "garden", growth: 0, meal: 0, investment: 0 },
    { id: 2, species: "dew", growth: 800, meal: 0, investment: 0 },
  ];
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
      if (!sessionStorage.getItem("farm-seeded")) {
        localStorage.setItem("mondgarten.save.v1", value);
        sessionStorage.setItem("farm-seeded", "1");
      }
    }, JSON.stringify(s));
    const install = async () =>
      page.evaluate(async () => {
        const { GardenScene } = await import("/mondgarten/scene.js"),
          { GardenControls } = await import("/mondgarten/controls.js");
        const update = GardenScene.prototype.update,
          direction = GardenControls.prototype.direction;
        GardenControls.prototype.direction = function (player) {
          if (window.placeAt && !this.blocked()) {
            Object.assign(player, window.placeAt);
            window.placeAt = null;
            this.stop();
          }
          return direction.call(this, player);
        };
        GardenScene.prototype.update = function (dt, args) {
          window.farmLive = this.villageState;
          window.farmScene = this;
          update.call(this, dt, args);
        };
      });
    const place = async (x, z) => {
      await page.evaluate(
        ([x, z]) => {
          window.placeAt = { x, z };
        },
        [x, z],
      );
      await page.waitForFunction(() => window.placeAt === null);
    };
    await page.goto(origin + "/mondgarten/index.html");
    await page.waitForFunction(() => !document.querySelector("#loading"));
    await install();
    await place(...kitchenSpot("input"));
    await page.waitForFunction(
      () => window.farmLive.village.farm.kitchen.inputs.moonbloom === 40,
    );
    assert.equal(
      await page.evaluate(() => window.farmLive.village.raw.moonbloom),
      20,
    );
    await page.locator("#kitchenButton").click();
    await page.locator("#fillKitchen").click();
    assert.equal(
      await page.evaluate(() => window.farmLive.village.farm.kitchen.running),
      true,
    );
    assert.equal(await page.locator("#collectKitchen").isDisabled(), true);
    await page.evaluate(async () => {
      const { advanceFarm } = await import("/mondgarten/snail-farm.mjs");
      advanceFarm(window.farmLive, 20);
    });
    await page.waitForFunction(
      () => document.querySelector("#kitchenProgress").value >= 20,
    );
    await page
      .locator("#modal")
      .screenshot({ path: "/tmp/mondgarten-feed-kitchen-progress.png" });
    await page.locator("#closeModal").click();
    await page.locator("#gardenMenu").click();
    await page.locator("#menuSettings").click();
    await page.locator("#toggleSound").click();
    await page.reload();
    await page.waitForFunction(() => !document.querySelector("#loading"));
    await install();
    await page.waitForFunction(() => window.farmLive);
    const mid = await page.evaluate(() => window.farmLive.village.farm.kitchen);
    assert.ok(mid.progress >= 20 && mid.progress < 45);
    assert.equal(mid.running, true);
    await page.evaluate(async () => {
      const { advanceFarm } = await import("/mondgarten/snail-farm.mjs");
      advanceFarm(window.farmLive, 25);
    });
    await page.waitForFunction(
      () => window.farmLive.village.farm.kitchen.ready === 2,
    );
    await place(...kitchenSpot("output"));
    await page.waitForFunction(() => window.farmLive.village.farm.food === 2);
    assert.equal(
      await page.evaluate(() => window.farmLive.village.farm.kitchen.ready),
      0,
    );
    assert.equal(
      await page.evaluate(() => window.farmScene.foodPouch.visible),
      true,
    );
    // An explicit inventory action stores the pouch; withdrawing through the inventory
    // is a conscious action and never feeds a snail from remote storage.
    await place(-14, -7);
    await page.waitForFunction(
      () => window.farmLive.village.farm.storedFood === 2,
    );
    await page.locator("#stockShortcut").click();
    await page.locator("#withdrawFood").click();
    await page.locator("#closeModal").click();
    await page.waitForTimeout(500);
    assert.equal(
      await page.evaluate(() => window.farmLive.village.farm.food),
      2,
      "withdrawn food must stay in pouch while leaving warehouse",
    );
    await page.locator("#stockShortcut").click();
    await page.locator("#storeFood").click();
    assert.equal(
      await page.evaluate(() => window.farmLive.village.farm.storedFood),
      2,
    );
    await page.locator("#closeModal").click();
    const target = await page.evaluate(
      () => window.farmScene.nurseryTargets()[0],
    );
    await place(target.x, target.z);
    await page.waitForTimeout(350);
    assert.equal(
      await page.evaluate(() => window.farmLive.village.farm.nursery[0].meal),
      0,
    );
    await page.locator("#stockShortcut").click();
    await page.locator("#withdrawFood").click();
    await page.locator("#closeModal").click();
    await page.waitForFunction(
      () => window.farmLive.village.farm.nursery[0].meal > 0,
    );
    await page.waitForFunction(() =>
      window.farmScene.farmVisuals.some((v) => v.snackTime > 0),
    );
    assert.ok(
      await page.evaluate(() =>
        window.farmScene.flights.some((f) => f.type === "food"),
      ),
    );
    assert.ok(
      await page.evaluate(() =>
        window.farmScene.farmVisuals.some((v) => v.foodMarker.visible),
      ),
    );
    assert.equal(
      await page.evaluate(() => window.farmLive.village.farm.food),
      1,
    );
    const second = await page.evaluate(
      () => window.farmScene.nurseryTargets()[1],
    );
    await place(second.x, second.z);
    await page.waitForFunction(() => window.farmLive.village.farm.food === 0);
    assert.ok(
      await page.evaluate(() =>
        window.farmLive.village.farm.nursery.every((n) => n.meal > 0),
      ),
    );
    const investment = await page.evaluate(() =>
      window.farmLive.village.farm.nursery.reduce(
        (sum, n) => sum + n.investment,
        0,
      ),
    );
    assert.equal(investment, 210);
    // Advance only visual clocks to show all destinations without advancing growth.
    const activities = await page.evaluate(async () => {
      const { nurseryPose } = await import("/mondgarten/snail-appearance.mjs");
      return [
        ...new Set(
          Array.from(
            { length: 120 },
            (_, t) => nurseryPose(0, 1, t, 0).activity,
          ),
        ),
      ];
    });
    for (const activity of ["home", "cave", "climb", "hill", "bath", "flowers"])
      assert.ok(activities.includes(activity));
    await page.evaluate(() => {
      window.farmScene.zoom = 0.85;
      window.farmScene.resize();
      window.farmScene.focus.set(-24.5, 0, -7);
    });
    await page.screenshot({ path: "/tmp/mondgarten-snail-habitat.png" });
    assert.deepEqual(errors, []);
    console.log(
      "Feed kitchen browser: carried partial delivery, explicit stored supply, progress, mid-batch reload, physical pickup, pouch, storage, sequential nearby feeding, food flights and all habitat activities OK",
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
