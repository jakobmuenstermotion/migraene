const path = require("node:path");
const root = path.resolve(__dirname, "..");
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH || "playwright-core",
);
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
(async () => {
  const { freshState, normalize } = await import(
    require("node:url").pathToFileURL(path.join(root, "mondgarten/core.mjs"))
      .href
  );
  const app = http.createServer((req, res) => {
    const target = path.resolve(
      root,
      "." + new URL(req.url, "http://localhost").pathname,
    );
    if (!target.startsWith(root + path.sep)) {
      res.writeHead(404);
      res.end();
      return;
    }
    fs.readFile(target, (err, bytes) => {
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
        ".svg": "image/svg+xml",
      };
      res.writeHead(200, {
        "Content-Type":
          types[path.extname(target)] || "application/octet-stream",
      });
      res.end(bytes);
    });
  });
  await new Promise((r) => app.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${app.address().port}`;
  const b = await chromium.launch({
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
    const c = await b.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: "block",
    });
    const { FARM } = await import(
      require("node:url").pathToFileURL(
        path.join(root, "mondgarten/snail-farm.mjs"),
      ).href
    );
    const s = freshState();
    s.tutorial = 3;
    s.coins = 100000000;
    s.journey.round = 50;
    s.village.farm.built = true;
    s.village.farm.discovered = ["garden", "apple"];
    s.village.farm.shells = { garden: 1 };
    s.village.farm.nextID = 4;
    s.village.farm.nursery = [
      { id: 1, species: "garden", growth: 0, meal: 0, investment: 0 },
      {
        id: 2,
        species: "apple",
        growth: FARM.growSeconds - 0.05,
        meal: 0.05,
        investment: 30,
      },
      {
        id: 3,
        species: "garden",
        growth: FARM.growSeconds,
        meal: 0,
        investment: 48,
      },
    ];
    s.productCargo = { items: { bouquet: 3 }, values: { bouquet: 90 } };
    s.village.raw = { moonbloom: 120, starfruit: 10 };
    s.village.rawValues = { moonbloom: 240, starfruit: 100 };
    await c.addInitScript((value) => {
      if (!sessionStorage.getItem("seeded")) {
        localStorage.setItem("mondgarten.save.v1", value);
        localStorage.setItem(
          "mt-garden-actions-v1",
          JSON.stringify({
            version: 1,
            installedAt: Date.now(),
            lastRewardAt: 0,
            actions: [],
            handled: [],
            gifts: {},
          }),
        );
        localStorage.setItem(
          "mt-garden-plants-v1",
          JSON.stringify({
            version: 1,
            beds: {},
            tokens: [{ id: "garden-day:1", kind: "seed" }],
            receipts: ["garden-day:1"],
          }),
        );
        localStorage.setItem("mt-begleiter-v1", "never-upload-medical");
        localStorage.setItem(
          "mondgarten.save.v1.cloud.v1",
          JSON.stringify({
            backend: "supabase",
            url: "https://example.supabase.co",
            key: "old-settings",
          }),
        );
        sessionStorage.setItem("seeded", "1");
      }
    }, JSON.stringify(s));
    const p = await c.newPage(),
      errors = [];
    const watch = (page) => {
      page.on("pageerror", (e) => {
        errors.push(e.message);
        console.log("PAGE ERROR", e.message);
      });
      page.on("console", (m) => {
        if (
          m.type() === "error" &&
          !m.text().includes("404") &&
          !m.text().includes("409")
        )
          errors.push(m.text());
      });
    };
    watch(p);
    const externalRequests = [];
    p.on("request", (req) => {
      if (!req.url().startsWith(url) && /^https?:/.test(req.url()))
        externalRequests.push(req.url());
    });
    await p.goto(url + "/mondgarten/index.html");
    await p.waitForFunction(() => !document.querySelector("#loading"));
    await p.locator("#stockShortcut").click();
    await p.locator("#openFarm").click();
    await p.locator('[data-food="flowers"]').click();
    await p.locator('[data-snail-feed="1"]').click();
    await p.locator('[data-snail-helper="2"]').click();
    await p.locator('[data-snail-sell="3"]').click();
    await p.locator('[data-shell="garden"]').click();
    assert.ok(
      (await p.locator("#farmSummary").innerText()).includes(
        "1 / 8 Helferplätze",
      ),
    );
    await p.locator("#closeModal").click();
    console.log(
      "Farm UI: craft, feed, mature, recruit, sell and plant shell OK",
    );
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    assert.equal(await p.locator("#onlineSave").count(), 0);
    assert.equal(await p.locator("#exportSave").count(), 1);
    assert.equal(await p.locator("#importSave").count(), 1);
    await p.locator("#toggleSound").click();
    const saved = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(saved.village.snails, 1);
    assert.equal(saved.village.farm.nursery.length, 2);
    assert.equal(saved.village.farm.nursery[0].meal > 0, true);
    await p.reload();
    await p.waitForFunction(() => !document.querySelector("#loading"));
    const reloaded = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(reloaded.village.snails, saved.village.snails);
    assert.equal(reloaded.sound, saved.sound);
    assert.equal(reloaded.village.farm.nursery.length, 2);
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    const downloading = p.waitForEvent("download");
    await p.locator("#exportSave").click();
    const download = await downloading;
    const file = await download.path();
    await p.locator("#saveFile").setInputFiles(file);
    await p.locator("#confirmImport").click();
    const imported = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(imported.village.snails, saved.village.snails);
    assert.equal(imported.village.farm.nursery.length, 2);
    // Shops keep deposits and accessories across reloads without touching farm stock.
    const boutiques = async () => {
      await p.locator("#gardenMenu").click();
      await p.locator("#menuBoutiques").click();
    };
    await boutiques();
    await p.locator('[data-cosmetic="style"][data-amount="100"]').click();
    await p.reload();
    await p.waitForFunction(() => !document.querySelector("#loading"));
    const deposit = await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("mondgarten.save.v1")).village.boutiques
          .payments.style,
    );
    assert.equal(deposit, 100);
    await boutiques();
    await p.locator('[data-cosmetic="style"]').last().click();
    await p.locator('[data-cosmetic="flower"]').last().click();
    await p.locator('[data-equip="flower"][data-actor="0"]').click();
    await p.locator('[data-equip="flower"][data-actor="1"]').click();
    await p.locator('[data-cosmetic="decor"]').last().click();
    await p.locator('[data-cosmetic="lanterns"]').last().click();
    const appearance = await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("mondgarten.save.v1")).village
          .boutiques,
    );
    assert.deepEqual(appearance.equipped, ["flower", "flower"]);
    assert.ok(appearance.owned.includes("lanterns"));
    await p.locator('[data-cosmetic="snailEyes"][data-amount="100"]').click();
    assert.equal(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("mondgarten.save.v1")).village
            .boutiques.payments.snailEyes,
      ),
      100,
    );
    await p.locator('[data-cosmetic="snailEyes"]').last().click();
    await p.locator('[data-equip="snailEyes"][data-actor="0"]').click();
    await p.locator('[data-equip="snailEyes"][data-actor="1"]').click();
    await p.reload();
    await p.waitForFunction(() => !document.querySelector("#loading"));
    const eyeAppearance = await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("mondgarten.save.v1")).village
          .boutiques,
    );
    assert.ok(eyeAppearance.owned.includes("snailEyes"));
    assert.deepEqual(eyeAppearance.equipped, ["snailEyes", "snailEyes"]);
    await boutiques();
    assert.ok(
      (
        await p.locator('[data-equip="snailEyes"][data-actor="0"]').innerText()
      ).includes("Ablegen"),
    );
    assert.ok(
      (
        await p.locator('[data-equip="snailEyes"][data-actor="1"]').innerText()
      ).includes("Ablegen"),
    );
    for (const id of ["mushroomHat", "moonCrown"])
      await p.locator(`[data-cosmetic="${id}"]`).last().click();
    await p.locator('[data-cosmetic="hat"]').last().click();
    await p.locator('[data-equip="mushroomHat"][data-actor="0"]').click();
    await p.locator('[data-equip="moonCrown"][data-actor="1"]').click();
    await p.locator('[data-snail-hats="mushroomHat"]').click();
    await p.locator('[data-hat-snail="0"]').click();
    await p.locator("#snailHatsBack").click();

    await p.reload();
    await p.waitForFunction(() => !document.querySelector("#loading"));
    const newAppearance = await p.evaluate(
      () =>
        JSON.parse(localStorage.getItem("mondgarten.save.v1")).village
          .boutiques,
    );
    assert.deepEqual(newAppearance.equipped, ["mushroomHat", "moonCrown"]);
    assert.deepEqual(newAppearance.snailHats, ["mushroomHat"]);
    assert.ok(
      newAppearance.owned.includes("mushroomHat") &&
        newAppearance.owned.includes("moonCrown"),
    );
    await boutiques();
    await p.locator("#closeModal").click();
    await p.screenshot({ path: "/tmp/mondgarten-boutiques.png" });
    // Render the actual exported character models close up, including both eye stalks.
    const modelVisibility = await p.evaluate(async () => {
      const T = await import("/mondgarten/vendor/three.module.js");
      const { makeActor, makeSnail, updateStack, GardenScene } =
        await import("/mondgarten/scene.js");
      const { COLLECTIBLES, WORLD, stackHeight } =
        await import("/mondgarten/content.mjs");
      const canvas = document.createElement("canvas");
      canvas.id = "accessoryPreview";
      canvas.style.marginTop = "48px";
      document.querySelector("#modalBody").replaceChildren(canvas);
      document.querySelector("#modal").showModal();
      const renderer = new T.WebGLRenderer({
        canvas,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      renderer.setPixelRatio(2);
      renderer.setSize(320, 300);
      const scene = new T.Scene();
      scene.background = new T.Color("#e4ead5");
      scene.add(new T.HemisphereLight("#fff9eb", "#77866b", 2));
      const light = new T.DirectionalLight("#ffffff", 2);
      light.position.set(-2, 4, 5);
      scene.add(light);
      const camera = new T.OrthographicCamera(-1.4, 1.4, 1.45, -1.35, 0.1, 30);
      camera.position.set(0, 1.8, 7);
      camera.lookAt(0, 1.2, 0);
      const actors = [false, true].map((companion, i) => {
        const actor = makeActor(companion);
        actor.root.position.x = i ? 0.65 : -0.65;
        actor.root.rotation.y = i ? -0.16 : 0.16;
        scene.add(actor.root);
        return actor;
      });
      const ids = ["snailEyes", "mushroomHat", "moonCrown"];
      const visibility = ids.map((id) =>
        actors.map((actor) => {
          actor.setAccessory(id);
          const group = actor.body.getObjectByName("accessory:" + id);
          const visible =
            group.visible &&
            ["flower", "hat", "scarf", ...ids].every(
              (other) =>
                other === id ||
                !actor.body.getObjectByName("accessory:" + other).visible,
            );
          actor.setAccessory(null);
          const removable = !group.visible;
          return { visible, removable };
        }),
      );
      const templates = [
        GardenScene.prototype.makeBundle.call({}, COLLECTIBLES.moonbloom),
        GardenScene.prototype.makeBundle.call({}, COLLECTIBLES.mushroom),
        GardenScene.prototype.productBundle.call({}, "bouquet"),
      ];
      const stackMeasurements = [];
      for (const template of templates)
        for (const cap of [80, 272, 2768]) {
          const actor = makeActor();
          for (const amount of [
            0,
            1,
            52,
            53,
            cap / 2,
            cap / 2 + 0.25,
            cap - 1,
            cap,
            cap / 2,
          ]) {
            updateStack(actor, template, amount, cap, {
              dt: 1,
              reducedMotion: true,
            });
            const box = new T.Box3().setFromObject(actor.stack),
              height = actor.layers.length ? box.max.y - box.min.y : 0;
            stackMeasurements.push({
              height,
              expected: stackHeight(amount, cap),
              layers: actor.layers.length,
            });
          }
        }
      canvas.showAccessory = (id) => {
        actors.forEach((actor) => actor.setAccessory(id));
        renderer.render(scene, camera);
      };
      actors.forEach((actor) => actor.setAccessory("snailEyes"));
      const snails = [0, 1].map((i) => {
        const snail = makeSnail(i);
        snail.root.position.x = i ? 0.65 : -0.65;
        snail.root.visible = false;
        snail.upgrade(6);
        scene.add(snail.root);
        return snail;
      });
      const snailVisibility = ["hat", "mushroomHat", "moonCrown"].map((id) =>
        snails.map((snail) => {
          snail.setHat(id);
          const visible = snail.root.getObjectByName("snail-hat:" + id).visible;
          const leafHidden =
            !snail.root.getObjectByName("snail-default-leaf").visible;
          snail.setHat(null);
          const removable =
            !snail.root.getObjectByName("snail-hat:" + id).visible &&
            snail.root.getObjectByName("snail-default-leaf").visible;
          return { visible, leafHidden, removable };
        }),
      );
      canvas.showSnailHat = (id) => {
        actors.forEach((a) => (a.root.visible = false));
        snails.forEach((snail) => {
          snail.root.visible = true;
          snail.setHat(id);
        });
        camera.position.set(0, 1.7, 6);
        camera.lookAt(0, 0.75, 0);
        renderer.render(scene, camera);
      };
      renderer.render(scene, camera);
      canvas.disposePreview = () => renderer.dispose();
      return { visibility, stackMeasurements, snailVisibility };
    });
    assert.ok(
      modelVisibility.visibility.flat().every((v) => v.visible && v.removable),
    );
    assert.ok(
      modelVisibility.stackMeasurements.every(
        (m) => Math.abs(m.height - m.expected) < 1e-8 && m.layers <= 26,
      ),
    );
    for (const [id, name] of [
      ["snailEyes", "snail-eyes"],
      ["mushroomHat", "mushroom-hat"],
      ["moonCrown", "moon-crown"],
    ]) {
      await p.evaluate(
        (id) => document.querySelector("#accessoryPreview").showAccessory(id),
        id,
      );
      await p
        .locator("#accessoryPreview")
        .screenshot({ path: `/tmp/mondgarten-${name}.png` });
    }
    assert.ok(
      modelVisibility.snailVisibility
        .flat()
        .every((v) => v.visible && v.leafHidden && v.removable),
    );
    for (const id of ["hat", "mushroomHat", "moonCrown"]) {
      await p.evaluate(
        (id) => document.querySelector("#accessoryPreview").showSnailHat(id),
        id,
      );
      await p
        .locator("#accessoryPreview")
        .screenshot({ path: `/tmp/mondgarten-snails-${id}.png` });
    }
    await p.evaluate(() =>
      document.querySelector("#accessoryPreview").disposePreview(),
    );
    await p.locator("#closeModal").click();
    console.log(
      "Boutiques: construction, saved instalment, decorations, all six accessories available after shop construction, new purchases saved, and capacity-scaled stacks match actual mesh heights",
    );
    const importState = async (value) => {
      await p.locator("#gardenMenu").click();
      await p.locator("#menuSettings").click();
      await p.locator("#saveFile").setInputFiles({
        name: "rhythm-test.json",
        mimeType: "application/json",
        buffer: Buffer.from(JSON.stringify(value)),
      });
      await p.locator("#confirmImport").click();
    };
    const earlyShop = await p.evaluate(() => {
      const value = JSON.parse(localStorage.getItem("mondgarten.save.v1"));
      value.village.snails = 3;
      value.journey.round = 12;
      value.journey.elapsed = 0;
      value.journey.plan = null;
      value.journey.closed = false;
      value.village.boutiques.owned = [];
      value.village.boutiques.equipped = [null, null];
      value.village.boutiques.payments = {};
      return value;
    });
    await importState(earlyShop);
    await boutiques();
    for (const id of [
      "flower",
      "snailEyes",
      "hat",
      "scarf",
      "mushroomHat",
      "moonCrown",
    ]) {
      assert.equal(
        await p
          .locator(`[data-cosmetic="${id}"][data-amount="100"]`)
          .isEnabled(),
        true,
      );
    }
    await p.locator('[data-cosmetic="hat"]').last().click();
    await p.locator('[data-snail-hats="hat"]').click();
    await p.locator("#hatAllSnails").click();
    assert.deepEqual(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("mondgarten.save.v1")).village
            .boutiques.snailHats,
      ),
      ["hat", "hat", "hat"],
    );
    await p.locator('[data-hat-snail="1"]').click();
    assert.deepEqual(
      await p.evaluate(
        () =>
          JSON.parse(localStorage.getItem("mondgarten.save.v1")).village
            .boutiques.snailHats,
      ),
      ["hat", null, "hat"],
    );
    await p.locator("#snailHatsBack").click();
    await p.locator("#closeModal").click();
    await p.evaluate(async () => {
      const { GardenScene } = await import("/mondgarten/scene.js"),
        T = await import("/mondgarten/vendor/three.module.js");
      const original = GardenScene.prototype.update;
      GardenScene.prototype.update = function (dt, args) {
        original.call(this, dt, args);
        const box = new T.Box3().setFromObject(this.actors[0].stack);
        window.stackProbe = {
          amount: args.bag,
          capacity: args.bagCapacity,
          height: this.actors[0].layers.length ? box.max.y - box.min.y : 0,
        };
      };
      window.stopStackProbe = () => {
        GardenScene.prototype.update = original;
      };
    });
    // Observe real game events and transfer effects while using the normal JSON import UI.
    await p.evaluate(async () => {
      const { GardenAutomation } = await import("/mondgarten/automation.mjs");
      const { GardenScene } = await import("/mondgarten/scene.js");
      const update = GardenAutomation.prototype.update,
        transfer = GardenScene.prototype.makeTransfer;
      window.logisticsProbe = { events: [], transfers: 0 };
      GardenAutomation.prototype.update = function (...args) {
        const events = update.apply(this, args);
        window.logisticsProbe.events.push(...events);
        return events;
      };
      GardenScene.prototype.makeTransfer = function (...args) {
        window.logisticsProbe.transfers++;
        return transfer.apply(this, args);
      };
      window.stopLogisticsProbe = () => {
        GardenAutomation.prototype.update = update;
        GardenScene.prototype.makeTransfer = transfer;
      };
    });
    const direct = freshState();
    direct.tutorial = 3;
    direct.sound = false;
    direct.journey.round = 7;
    direct.village.snails = 1;
    direct.village.workshops.bouquet.level = 1;
    direct.village.raw = { moonbloom: 17 };
    direct.village.rawValues = { moonbloom: 34 };
    direct.village.snailLoads = [
      {
        x: -1.8,
        z: 13.8,
        mode: "deliver",
        items: { moonbloom: 24 },
        values: { moonbloom: 48 },
      },
    ];
    await importState(direct);
    await p.waitForFunction(() =>
      window.logisticsProbe.events.some((e) => e.kind === "helperDelivery"),
    );
    assert.ok(await p.evaluate(() => window.logisticsProbe.transfers > 0));
    await p.locator("#stockShortcut").click();
    assert.ok(
      (await p.locator("#modalBody").innerText()).includes(
        "Du lagerst dort selbst ein",
      ),
    );
    assert.ok(
      (await p.locator('[data-stock="raw:moonbloom"]').innerText()).includes(
        "17",
      ),
    );
    await p.locator("#closeModal").click();
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#toggleSound").click();
    const delivered = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(delivered.village.raw.moonbloom, 17);
    assert.deepEqual(delivered.village.snailLoads[0].items, {});
    const bindery = delivered.village.workshops.bouquet;
    assert.equal(
      (bindery.inputs.moonbloom ?? 0) +
        (bindery.running ? 6 : 0) +
        (delivered.village.finished.bouquet ?? 0) * 6,
      24,
    );
    await p.locator("#closeModal").click();
    const sale = structuredClone(direct);
    sale.village.workshops.bouquet.level = 0;
    sale.village.snailLoads[0].x = -9;
    sale.village.snailLoads[0].z = 8;
    await importState(sale);
    await p.waitForFunction(() =>
      window.logisticsProbe.events.some((e) => e.kind === "snailSale"),
    );
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#toggleSound").click();
    const sold = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(sold.coins, 48);
    assert.equal(sold.village.autoSold, 24);
    assert.equal(sold.village.raw.moonbloom, 17);
    assert.deepEqual(sold.village.snailLoads[0].items, {});
    await p.locator("#closeModal").click();
    const overflow = structuredClone(sale);
    overflow.village.workshops.bouquet.level = 1;
    overflow.village.workshops.bouquet.inputs = { moonbloom: 120 };
    overflow.village.workshops.bouquet.inputValues = { moonbloom: 240 };
    overflow.village.finished = { bouquet: 24 };
    overflow.village.finishedValues = { bouquet: 288 };
    await p.evaluate(() => {
      window.logisticsProbe.events = [];
    });
    await importState(overflow);
    await p.waitForFunction(() =>
      window.logisticsProbe.events.some((e) => e.kind === "snailSale"),
    );
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#toggleSound").click();
    const overflowSold = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(overflowSold.coins, 48);
    assert.equal(overflowSold.village.autoSold, 24);
    assert.equal(overflowSold.village.workshops.bouquet.inputs.moonbloom, 120);
    assert.equal(overflowSold.village.raw.moonbloom, 17);
    await p.locator("#closeModal").click();
    await p.evaluate(() => window.stopLogisticsProbe());
    console.log(
      "Logistics: direct snail delivery renders transfer, no warehouse teleportation; missing or full workshop sells carried value at stand and saves once",
    );

    // Exercise the actual import and save path for a pre-fix day-seven plan.
    const { prepareDay } = await import(
      require("node:url").pathToFileURL(path.join(root, "mondgarten/daily.mjs"))
        .href
    );
    const { TOOLS } = await import(
      require("node:url").pathToFileURL(path.join(root, "mondgarten/core.mjs"))
        .href
    );
    const { createVillageField } = await import(
      require("node:url").pathToFileURL(
        path.join(root, "mondgarten/harvest.mjs"),
      ).href
    );
    const legacy = freshState();
    legacy.tutorial = 3;
    legacy.reducedMotion = true;
    legacy.journey.round = 7;
    legacy.journey.goalCost = null;
    legacy.tools = { reach: 2, bag: 3, speed: 2, value: 2 };
    legacy.village.beds[0] = 3;
    legacy.village.workshops.bouquet.level = 1;
    const correctedBoost = prepareDay(legacy, TOOLS).boost;
    legacy.journey.plan.balanceVersion = 6;
    legacy.journey.plan.boost = 9.8839;
    legacy.journey.plan.spent = 77;
    legacy.coins = 12345;
    legacy.bag = 12;
    legacy.bagValue = 500;
    legacy.cargo = { moonbloom: { count: 12, value: 500 } };
    legacy.village.payments = { "bed:0": 333 };
    legacy.village.fieldCuts = Object.fromEntries(
      createVillageField(legacy).map((cell) => [
        cell.key,
        { readyAt: 10000, cutAt: 0 },
      ]),
    );
    await importState(legacy);
    await p.waitForFunction(
      () =>
        window.stackProbe?.amount === 12 && window.stackProbe?.capacity === 272,
    );
    const stackProbe = await p.evaluate(() => window.stackProbe);
    assert.ok(Math.abs(stackProbe.height - (12 / 272) * 26 * 0.31) < 1e-8);
    await p.evaluate(() => window.stopStackProbe());

    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#toggleSound").click();
    const migrated = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(migrated.journey.plan.boost, correctedBoost);
    assert.equal(migrated.journey.plan.spent, 77);
    assert.equal(migrated.journey.plan.target, legacy.journey.plan.target);
    assert.equal(migrated.coins, 12345);
    assert.equal(migrated.bagValue, 500);
    assert.deepEqual(migrated.village.payments, legacy.village.payments);
    await p.reload();
    await p.waitForFunction(() => !document.querySelector("#loading"));
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#toggleSound").click();
    const migratedAgain = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(migratedAgain.journey.plan.boost, correctedBoost);
    assert.equal(migratedAgain.coins, 12345);
    await p.locator("#closeModal").click();
    console.log(
      "Economy: inflated day-seven plan corrected once; wallet, cargo value and instalments preserved through import and reload",
    );
    const installCareProbe = () =>
      p.evaluate(async () => {
        const { GardenScene } = await import("/mondgarten/scene.js");
        const original = GardenScene.prototype.update;
        GardenScene.prototype.update = function (dt, args) {
          if (window.previewToolPads) {
            args = { ...args, player: { ...args.player, x: -9.5, z: 23 } };
            this.focus.set(-9.55, 0, 19.7);
          }
          original.call(this, dt, args);
          const helper = this.helpers[0];
          window.careProbe = {
            sleeping: args.snails[0]?.sleeping,
            faceVisible: helper.root.getObjectByName("snail-face").visible,
            sleepVisible: helper.root.getObjectByName("snail-sleep").visible,
            cargo: args.snails[0]?.bag,
            pads: [...this.padVisuals].map(([id, v]) => ({
              id,
              icon: v.iconKind,
              width: v.icon.geometry.parameters.width,
              sign: v.sign.visible,
              x: v.root.position.x,
              z: v.root.position.z,
            })),
          };
        };
        window.stopCareProbe = () => {
          GardenScene.prototype.update = original;
          window.previewToolPads = false;
        };
      });
    const care = freshState();
    care.tutorial = 3;
    care.sound = false;
    care.journey.round = 50;
    care.journey.closed = true;
    care.journey.pending = 1;
    care.journey.light = 1;
    care.journey.elapsed = 350;
    care.village.snails = 1;
    care.village.snailLoads = [
      {
        x: -9,
        z: 8,
        mode: "deliver",
        items: { moonbloom: 24 },
        values: { moonbloom: 48 },
      },
    ];
    care.village.snailProfiles = [{ name: "", task: "sell" }];
    await installCareProbe();
    await importState(care);
    await p.waitForFunction(
      () =>
        window.careProbe?.sleeping &&
        window.careProbe.sleepVisible &&
        !window.careProbe.faceVisible,
    );
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSnails").click();
    assert.ok(
      (await p.locator("#modalBody").innerText()).includes(
        "Im Häuschen eingekuschelt",
      ),
    );
    await p.locator('[data-snail-name="0"]').fill("Flitzi <3");
    await p.locator('[data-snail-task="0"]').selectOption("warehouse");
    const named = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.deepEqual(named.village.snailProfiles, [
      { name: "Flitzi <3", task: "warehouse" },
    ]);
    assert.equal(named.coins, 0);
    assert.equal(named.village.snailLoads[0].items.moonbloom, 24);
    await p
      .locator("#modal")
      .screenshot({ path: "/tmp/mondgarten-snail-menu.png" });
    await p.reload();
    await p.waitForFunction(() => !document.querySelector("#loading"));
    await installCareProbe();
    await p.waitForFunction(() => window.careProbe?.sleeping);
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSnails").click();
    assert.equal(
      await p.locator('[data-snail-name="0"]').inputValue(),
      "Flitzi <3",
    );
    assert.equal(
      await p.locator('[data-snail-task="0"]').inputValue(),
      "warehouse",
    );
    await p.locator('[data-snail-task="0"]').selectOption("sell");
    await p.locator("#closeModal").click();
    await p
      .locator("#world")
      .screenshot({ path: "/tmp/mondgarten-snails-night.png" });
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#roundSettings").click();
    await p.locator("#useRound").click();
    await p.waitForFunction(
      () =>
        window.careProbe?.sleeping === false && window.careProbe.cargo === 0,
    );
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#toggleSound").click();
    const awakeHelper = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(awakeHelper.coins, 48);
    assert.equal(awakeHelper.journey.round, 51);
    assert.equal(awakeHelper.village.snailProfiles[0].name, "Flitzi <3");
    await p.locator("#closeModal").click();
    await p.evaluate(() => {
      window.previewToolPads = true;
    });
    await p.waitForFunction(
      () =>
        window.careProbe.pads.filter((p) => p.id.startsWith("tool:") && p.sign)
          .length === 1,
    );
    const toolPads = await p.evaluate(() =>
      window.careProbe.pads.filter((p) => p.id.startsWith("tool:")),
    );
    assert.deepEqual(toolPads.map((p) => p.icon).sort(), [
      "bag",
      "boot",
      "coin",
      "sickle",
    ]);
    assert.equal(new Set(toolPads.map((p) => p.z)).size, 2);
    assert.ok(toolPads.every((p) => p.width >= 2));
    await p
      .locator("#world")
      .screenshot({ path: "/tmp/mondgarten-upgrade-pads.png" });
    await p.evaluate(() => window.stopCareProbe());
    const catchup = freshState();
    catchup.tutorial = 3;
    catchup.sound = false;
    catchup.coins = 10000;
    catchup.journey.round = 7;
    catchup.journey.closed = true;
    catchup.journey.rewardKind = "water";
    catchup.journey.rewards = Array.from({ length: 7 }, (_, i) => ({
      id: "garden-day:" + (i + 1),
      round: i + 1,
      kind: i ? "water" : "seed",
    }));
    await importState(catchup);
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSeeds").click();
    assert.ok(
      (await p.locator("#modalBody").innerText()).includes("vier bis Tag 20"),
    );
    assert.equal(await p.locator("#buyCatchupSeed").isEnabled(), true);
    await p.locator("#buyCatchupSeed").click();
    assert.equal(await p.locator("#buyCatchupSeed").count(), 0);
    const caughtUp = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.deepEqual(caughtUp.journey.rewards, catchup.journey.rewards);
    assert.deepEqual(caughtUp.journey.seedCatchups, [
      { id: "garden-seed:2", round: 7, kind: "seed" },
    ]);
    assert.ok(caughtUp.coins < 10000);
    assert.equal(caughtUp.journey.closed, true);
    await p.reload();
    await p.waitForFunction(() => !document.querySelector("#loading"));
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSeeds").click();
    assert.equal(await p.locator("#buyCatchupSeed").count(), 0);
    const caughtUpAgain = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(caughtUpAgain.coins, caughtUp.coins);
    assert.deepEqual(
      caughtUpAgain.journey.seedCatchups,
      caughtUp.journey.seedCatchups,
    );
    await p.locator("#closeModal").click();
    console.log(
      "Companion seeds: old level-seven save buys missed seed once, retains watering rewards, and cannot repurchase after reload",
    );
    await importState(migratedAgain);
    console.log(
      "Snail care: names/tasks persist; shell sleep blocks night sale; earned morning resumes cargo; large distinct tool pictograms and spaced layout render",
    );

    const late = await p.evaluate(() => {
      const value = JSON.parse(localStorage.getItem("mondgarten.save.v1"));
      value.journey.round = 3;
      value.journey.elapsed = 541;
      value.journey.growthTime = 402;
      value.journey.closed = true;
      value.journey.plan = null;
      value.journey.asleep = false;
      value.journey.sleepWarning = 1;
      value.journey.rewards = [{ round: 3, kind: "seed" }];
      value.tools = { reach: 1, bag: 1, speed: 16, value: 16 };
      value.coins = 10000000;
      value.bag = 0;
      value.bagValue = 0;
      value.cargo = {};
      value.village.fieldCuts = {};
      value.savedAt = Date.now();
      return value;
    });
    await importState(late);
    await p.locator("#world").click({ position: { x: 195, y: 400 } });
    await p.keyboard.down("w");
    await p.waitForTimeout(1300);
    await p.keyboard.up("w");
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#toggleSound").click();
    const lateHarvest = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.ok(lateHarvest.bag > 0);
    assert.equal(lateHarvest.journey.growthTime, 402);
    assert.equal(lateHarvest.journey.asleep, false);
    await p.locator("#closeModal").click();
    await p.locator("#gardenMenu").click();
    await p.locator("#menuBuild").click();
    await p.locator("#productionOverview").click();
    const earlyUpgrade = p.locator('[data-pad="tool:reach"]');
    assert.ok(
      (await earlyUpgrade.innerText()).includes("Freiwilliges Upgrade"),
    );
    assert.equal(await earlyUpgrade.isEnabled(), true);
    await earlyUpgrade.click();
    await p.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem("mondgarten.save.v1")).tools.reach ===
        2,
    );
    const upgraded = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(upgraded.journey.rewards.length, 1);
    assert.equal(upgraded.journey.closed, true);
    console.log(
      "Minute nine: growth frozen, ripe plants harvestable, optional specialization purchasable after paid closure",
    );
    // At the time limit, only the unfinished daily reward payment is refunded.
    const sleepFixture = await p.evaluate(() => {
      const value = JSON.parse(localStorage.getItem("mondgarten.save.v1"));
      value.journey.elapsed = 599.95;
      value.journey.closed = false;
      value.journey.pending = 1;
      value.journey.rewards = [];
      value.coins = 100;
      value.village.payments.endDay = 75;
      value.savedAt = Date.now();
      return value;
    });
    await p.locator("#gardenMenu").click();
    await p.locator("#menuSettings").click();
    await p.locator("#saveFile").setInputFiles({
      name: "sleep-test.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(sleepFixture)),
    });
    await p.locator("#confirmImport").click();
    await p.waitForSelector("#sleepRounds");
    const sleeping = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(sleeping.journey.asleep, true);
    assert.equal(sleeping.journey.rewards.length, 0);
    assert.equal(sleeping.coins, 175);
    assert.deepEqual(
      sleeping.village.boutiques,
      normalize(sleepFixture).village.boutiques,
    );
    await p.locator("#sleepRounds").click();
    await p.locator("#useRound").click();
    const awake = await p.evaluate(() =>
      JSON.parse(localStorage.getItem("mondgarten.save.v1")),
    );
    assert.equal(awake.journey.asleep, false);
    assert.equal(awake.journey.round, sleeping.journey.round + 1);
    console.log(
      "Day rhythm: automatic sleep, reward refund, preserved belongings and earned next day OK",
    );
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(errors, []);
    console.log(
      "Local save survives reload; export/import remain; online settings removed; no browser errors",
    );
  } finally {
    await b.close();
    app.closeAllConnections();
    await new Promise((r) => app.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
