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
  const { HIVES } = await import("../mondgarten/honey-content.mjs");
  const { FARM_PLACES } = await import("../mondgarten/snail-appearance.mjs");
  const { VILLAGE, WORKSHOPS } =
    await import("../mondgarten/village-content.mjs");
  const s = freshState();
  s.tutorial = 3;
  s.sound = false;
  s.journey.round = 70;
  s.village.beds = [1, 1, 0, 0, 1, 1, 0];
  s.village.seeds = s.village.beds.map(Boolean);
  s.village.house = 3;
  s.village.farm.built = true;
  s.village.farm.food = 2;
  s.village.farm.foodValue = 200;
  s.village.farm.nextID = 2;
  s.village.farm.nursery = [
    {
      id: 1,
      species: "garden",
      growth: 1800,
      meal: 0,
      investment: 300,
      honeyMeal: false,
    },
  ];
  s.village.snails = 1;
  s.village.snailProfiles = [{ name: "Honigfreund", task: "rest" }];
  s.village.snailLoads = [{ x: 0, z: 0, mode: "graze", items: {}, values: {} }];
  s.village.workshops.tea.level = 1;
  s.village.raw.starfruit = 4;
  s.village.rawValues.starfruit = 40;
  s.village.apiary.hives.forEach((h, i) => {
    h.built = i < 2;
    h.count = i < 2 ? 2 : 0;
    h.value = i === 0 ? 20 : i === 1 ? 45 : 0;
  });

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
      if (!sessionStorage.getItem("honey-seeded")) {
        localStorage.setItem("mondgarten.save.v1", value);
        sessionStorage.setItem("honey-seeded", "1");
      }
    }, JSON.stringify(s));
    await page.goto(origin + "/mondgarten/index.html");
    await page.waitForFunction(() => !document.querySelector("#loading"));
    await page.evaluate(async () => {
      const { GardenScene } = await import("/mondgarten/scene.js"),
        { GardenControls } = await import("/mondgarten/controls.js");
      const update = GardenScene.prototype.update,
        direction = GardenControls.prototype.direction;
      GardenScene.prototype.update = function (dt, args) {
        window.honeyLive = this.villageState;
        window.honeyScene = this;
        if (window.sceneOverview)
          args = {
            ...args,
            player: { ...args.player, ...window.sceneOverview },
          };
        update.call(this, dt, args);
      };
      GardenControls.prototype.direction = function (player) {
        if (window.placeAt && !this.blocked()) {
          Object.assign(player, window.placeAt);
          window.placeAt = null;
          this.stop();
        }
        return direction.call(this, player);
      };
    });
    const place = async (x, z) => {
      await page.evaluate(
        ([x, z]) => {
          window.sceneOverview = null;
          window.placeAt = { x, z };
        },
        [x, z],
      );
      await page.waitForFunction(() => window.placeAt === null);
    };
    const kitchenSpot = (key) => [
      VILLAGE.farm.x + FARM_PLACES[key][0],
      VILLAGE.farm.z + FARM_PLACES[key][1],
    ];
    const cook = async (recipe) => {
      await page.locator("#foodPouch").click();
      await page.locator("#openKitchen").click();
      await page.locator('[data-recipe="' + recipe + '"]').click();
      await page.locator("#bringKitchen").click();
      await place(...kitchenSpot("input"));
      await page.waitForFunction(
        () => window.honeyLive.village.farm.kitchen.running,
      );
      await page.locator("#foodPouch").click();
      await page.locator("#openKitchen").click();
      await page.evaluate(async () => {
        const { advanceFarm } = await import("/mondgarten/snail-farm.mjs");
        advanceFarm(window.honeyLive, 45);
      });
      await page.waitForFunction(
        () => !document.querySelector("#collectKitchen").disabled,
      );
      await page.locator("#collectKitchen").click();
      await place(...kitchenSpot("output"));
      await page.waitForFunction(
        () => window.honeyLive.village.farm.kitchen.ready === 0,
      );
    };
    await place(HIVES[0].x, HIVES[0].z);
    await page.waitForFunction(
      () => window.honeyLive.productCargo.items.moonHoney === 2,
    );
    assert.equal(
      await page.evaluate(() => window.honeyScene.hiveVisuals.length),
      2,
    );
    assert.ok(
      await page.evaluate(() =>
        window.honeyScene.hiveVisuals[0].bees.some((b) => b.visible),
      ),
    );
    await page.screenshot({ path: "/tmp/mondgarten-bees-honey.png" });
    await cook("honey");
    assert.equal(
      await page.evaluate(() => window.honeyLive.village.farm.honeyFood),
      1,
    );
    const target = await page.evaluate(
      () => window.honeyScene.nurseryTargets()[0],
    );
    await place(target.x, target.z);
    await page.waitForFunction(
      () => window.honeyLive.village.farm.nursery[0].honeyMeal,
    );
    assert.equal(
      await page.evaluate(() => window.honeyLive.village.farm.honeyFood),
      0,
    );
    assert.ok(
      await page.evaluate(
        () => window.honeyLive.village.farm.nursery[0].meal > 0,
      ),
    );
    await cook("snack-moon");
    assert.equal(
      await page.evaluate(
        () => window.honeyLive.village.farm.snacks.moonHoney.count,
      ),
      1,
    );
    await place(0, 3);
    await page.waitForTimeout(800);
    const point = await page.evaluate(() => {
      const scene = window.honeyScene;
      window.sceneOverview = { x: 0, z: 3 };
      scene.focus.set(-1, 0, 1.7);
      scene.updateCamera(0);
      scene.renderer.render(scene.scene, scene.camera);
      return scene.worldToScreen(0, 0.5, 0);
    });
    await page.mouse.click(point.x, point.y);
    await page.waitForSelector('[data-give-snack="moonHoney"]');
    await page.locator('[data-give-snack="moonHoney"]').click();
    assert.equal(
      await page.evaluate(
        () => window.honeyLive.village.farm.snacks.moonHoney.count,
      ),
      0,
    );
    assert.ok(
      await page.evaluate(
        () => window.honeyLive.village.apiary.buffs["snail:0"].remaining > 0,
      ),
    );
    await place(HIVES[1].x, HIVES[1].z);
    await page.waitForFunction(
      () => window.honeyLive.productCargo.items.lavenderHoney === 2,
    );
    await page.locator("#gardenMenu").click();
    await page.locator("#menuApiary").click();
    await page.locator("#makeHoneyApples").click();
    assert.equal(
      await page.evaluate(
        () => window.honeyLive.village.apiary.confection.running,
      ),
      true,
    );
    await page.evaluate(async () => {
      const { advanceHoneyApples } = await import("/mondgarten/apiary.mjs");
      advanceHoneyApples(window.honeyLive, 60);
    });
    await page.locator("#collectHoneyApples").click();
    await place(WORKSHOPS[1].x + 1.8, WORKSHOPS[1].z + 1.8);
    await page.waitForFunction(
      () => window.honeyLive.productCargo.items.honeyapple === 1,
    );
    assert.equal(
      await page.evaluate(
        () => window.honeyLive.productCargo.values.honeyapple,
      ),
      102,
    );
    const cell = await page.evaluate(() =>
      window.honeyScene.cells.find((c) => c.bed === 5 && !c.rare),
    );
    const before = await page.evaluate(
      () => window.honeyLive.cargo.crystal?.count ?? 0,
    );
    await place(cell.x, cell.z);
    await page.waitForFunction(
      (before) => (window.honeyLive.cargo.crystal?.count ?? 0) > before,
      before,
    );
    assert.ok(await page.evaluate(() => window.honeyScene.pickaxe.visible));
    await page.evaluate(() => {
      window.sceneOverview = { x: 0, z: -29 };
      window.honeyScene.zoom = 0.72;
      window.honeyScene.resize();
      window.honeyScene.focus.set(0, 0, -29);
    });
    await page.screenshot({ path: "/tmp/mondgarten-crystal-cave.png" });
    await page.locator("#gardenMenu").click();
    await page.locator("#menuSettings").click();
    await page.locator("#toggleSound").click();
    const saved = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    await page.reload();
    await page.waitForFunction(() => !document.querySelector("#loading"));
    const restored = await page.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(restored.village.farm.nursery[0].honeyMeal, true);
    assert.equal(restored.productCargo.items.honeyapple, 1);
    assert.ok(
      restored.village.apiary.buffs["snail:0"].remaining <=
        saved.village.apiary.buffs["snail:0"].remaining,
    );
    await page.locator("#gardenMenu").click();
    await page.locator("#menuBuild").click();
    await page.locator("#productionOverview").click();
    await page.locator('[data-tab="production"]').click();
    await page.locator("#honeyRecipes").click();
    await page.waitForSelector("#makeHoneyApples");
    assert.deepEqual(errors, []);
    console.log(
      "Honey browser: visible bees, physical honey collection, honey meal and last growth stage, timed snack cooking, actual helper tap and buff, honey apples in existing tea workshop, output pickup, crystal strikes/pickaxe and save/reload OK",
    );
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
