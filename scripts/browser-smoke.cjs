const path = require("node:path");
const root = path.resolve(__dirname, "..");
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH || "playwright-core",
);
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
(async () => {
  const { freshState } = await import(
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
    const s = freshState();
    s.tutorial = 3;
    s.journey.round = 50;
    s.village.farm.built = true;
    s.village.farm.discovered = ["garden", "apple"];
    s.village.farm.shells = { garden: 1 };
    s.village.farm.nextID = 4;
    s.village.farm.nursery = [
      { id: 1, species: "garden", growth: 0, meal: 0, investment: 0 },
      { id: 2, species: "apple", growth: 719.95, meal: 0.05, investment: 30 },
      { id: 3, species: "garden", growth: 720, meal: 0, investment: 48 },
    ];
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
