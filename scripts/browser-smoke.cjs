const path = require('node:path');
const root = path.resolve(__dirname, '..');
const moduleURL = (name) =>
  require('node:url').pathToFileURL(path.join(root, name)).href;
const { chromium } = require(
  process.env.PLAYWRIGHT_CORE_PATH || 'playwright-core',
);
const assert = require('node:assert/strict');
(async () => {
  const { createSyncServer } = await import(
    moduleURL('server/sync-server.mjs')
  );
  const { freshState } = await import(moduleURL('mondgarten/core.mjs'));
  const { CloudSave } = await import(moduleURL('mondgarten/cloud-save.mjs'));
  const { randomBytes } = await import('node:crypto');
  const { readFileSync } = require('node:fs');
  const { spawnSync } = require('node:child_process');
  const http = require('node:http');
  const invitation = randomBytes(24).toString('base64url');
  const app = createSyncServer({ staticRoot: root, inviteCode: invitation });
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  let url = `http://127.0.0.1:${app.address().port}`;
  let proxy = null;
  const supabase = process.argv.includes('--supabase'),
    db = 'mondgarten_browser_' + process.pid;
  const pg = (input, database = db) =>
    spawnSync(
      'docker',
      [
        'exec',
        '-i',
        'mondgarten-pg-test',
        'psql',
        '-X',
        '-qAt',
        '-v',
        'ON_ERROR_STOP=1',
        '-U',
        'postgres',
        '-d',
        database,
      ],
      { input, encoding: 'utf8' },
    );
  if (supabase) {
    if (pg('CREATE DATABASE ' + db, 'postgres').status !== 0)
      throw Error('Cannot create disposable browser-test database');
    const setup = pg(
      readFileSync(path.join(root, 'supabase/setup.sql'), 'utf8'),
    );
    if (setup.status !== 0) throw Error(setup.stderr);
    pg(
      "UPDATE garden_private.settings SET invite_hash=encode(extensions.digest('" +
        invitation +
        "','sha256'),'hex')",
    );
    const target = url;
    proxy = http.createServer(async (req, res) => {
      if (req.url.startsWith('/rest/v1/rpc/')) {
        const chunks = [];
        for await (const x of req) chunks.push(x);
        const args = JSON.parse(Buffer.concat(chunks));
        const quote = (x) =>
          x === null ? 'null' : "'" + String(x).replaceAll("'", "''") + "'";
        const call = req.url.endsWith('garden_read')
          ? 'public.garden_read(' +
            quote(args.p_id) +
            ',' +
            quote(args.p_token) +
            ')'
          : 'public.garden_write(' +
            quote(args.p_id) +
            ',' +
            quote(args.p_token) +
            ',' +
            Number(args.p_expected) +
            ',' +
            quote(JSON.stringify(args.p_payload)) +
            '::jsonb,' +
            quote(args.p_invite) +
            ')';
        const result = pg('SET ROLE anon; SELECT ' + call + ';');
        res.setHeader('Content-Type', 'application/json');
        if (result.status !== 0) {
          res.statusCode = result.stderr.includes('Save changed') ? 409 : 400;
          res.end(JSON.stringify({ error: 'RPC test error' }));
        } else res.end(result.stdout.trim() || 'null');
        return;
      }
      const upstream = await fetch(target + req.url);
      res.writeHead(upstream.status, Object.fromEntries(upstream.headers));
      res.end(Buffer.from(await upstream.arrayBuffer()));
    });
    await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
    url = `http://127.0.0.1:${proxy.address().port}`;
  }
  const b = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: [
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
    ],
  });
  try {
    const c = await b.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: 'block',
    });
    const s = freshState();
    s.tutorial = 3;
    s.journey.round = 50;
    s.village.farm.built = true;
    s.village.farm.discovered = ['garden', 'apple'];
    s.village.farm.shells = { garden: 1 };
    s.village.farm.nextID = 4;
    s.village.farm.nursery = [
      { id: 1, species: 'garden', growth: 0, meal: 0, investment: 0 },
      { id: 2, species: 'apple', growth: 719.95, meal: 0.05, investment: 30 },
      { id: 3, species: 'garden', growth: 720, meal: 0, investment: 48 },
    ];
    s.village.raw = { moonbloom: 120, starfruit: 10 };
    s.village.rawValues = { moonbloom: 240, starfruit: 100 };
    await c.addInitScript((value) => {
      if (!sessionStorage.getItem('seeded')) {
        localStorage.setItem('mondgarten.save.v1', value);
        localStorage.setItem(
          'mt-garden-actions-v1',
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
          'mt-garden-plants-v1',
          JSON.stringify({
            version: 1,
            beds: {},
            tokens: [{ id: 'garden-day:1', kind: 'seed' }],
            receipts: ['garden-day:1'],
          }),
        );
        localStorage.setItem('mt-begleiter-v1', 'never-upload-medical');
        sessionStorage.setItem('seeded', '1');
      }
    }, JSON.stringify(s));
    const p = await c.newPage(),
      errors = [];
    const watch = (page) => {
      page.on('pageerror', (e) => {
        errors.push(e.message);
        console.log('PAGE ERROR', e.message);
      });
      page.on('console', (m) => {
        if (
          m.type() === 'error' &&
          !m.text().includes('404') &&
          !m.text().includes('409')
        )
          errors.push(m.text());
      });
    };
    watch(p);
    await p.goto(url + '/mondgarten/index.html');
    await p.waitForFunction(() => !document.querySelector('#loading'));
    await p.locator('#stockShortcut').click();
    await p.locator('#openFarm').click();
    await p.locator('[data-food="flowers"]').click();
    await p.locator('[data-snail-feed="1"]').click();
    await p.locator('[data-snail-helper="2"]').click();
    await p.locator('[data-snail-sell="3"]').click();
    await p.locator('[data-shell="garden"]').click();
    assert.ok(
      (await p.locator('#farmSummary').innerText()).includes(
        '1 / 8 Helferplätze',
      ),
    );
    await p.locator('#closeModal').click();
    console.log(
      'Farm UI: craft, feed, mature, recruit, sell and plant shell OK',
    );
    const cloudMenu = async (page) => {
      await page.locator('#gardenMenu').click();
      await page.locator('#menuSettings').click();
      await page.locator('#onlineSave').click();
    };
    await cloudMenu(p);
    await p
      .locator('#cloudBackend')
      .selectOption(supabase ? 'supabase' : 'server');
    if (supabase)
      await p.locator('#cloudPublicKey').fill('sb_publishable_browser_fixture');
    await p.locator('#cloudURL').fill(url);
    await p.locator('#newCloudKey').click();
    const key = await p.locator('#cloudKey').inputValue();
    await p.locator('#cloudInvite').fill(invitation);
    assert.equal(
      await p.locator('#cloudForm').evaluate((f) => f.checkValidity()),
      true,
    );
    await p.locator('#connectCloud').click();
    await p.waitForSelector('#disconnectCloud');
    assert.equal(
      await p.locator('#cloudStatus').innerText(),
      'Online gesichert.',
    );
    const probe = new CloudSave({
      url,
      key,
      revision: 1,
      backend: supabase ? 'supabase' : 'server',
      publicKey: 'sb_publishable_browser_fixture',
    });
    let remote = await probe.read();
    assert.equal(remote.snapshot.game.village.snails, 1);
    assert.equal(remote.snapshot.garden.plants.tokens.length, 1);
    assert.ok(
      !JSON.stringify(remote.snapshot).includes('never-upload-medical'),
    );
    assert.ok(!JSON.stringify(remote.snapshot).includes(key));
    assert.equal(remote.snapshot.game.village.farm.nursery.length, 2);
    assert.ok(remote.snapshot.game.coins > 0);
    const c2 = await b.newContext({
      viewport: { width: 390, height: 844 },
      serviceWorkers: 'block',
    });
    await c2.addInitScript(() =>
      localStorage.setItem('mt-begleiter-v1', 'second-device-medical-marker'),
    );
    const p2 = await c2.newPage();
    watch(p2);
    await p2.goto(url + '/mondgarten/index.html');
    await p2.waitForFunction(() => !document.querySelector('#loading'));
    await p2.locator('#dismissTutorial').click();
    await cloudMenu(p2);
    await p2
      .locator('#cloudBackend')
      .selectOption(supabase ? 'supabase' : 'server');
    if (supabase)
      await p2
        .locator('#cloudPublicKey')
        .fill('sb_publishable_browser_fixture');
    await p2.locator('#cloudURL').fill(url);
    await p2.locator('#cloudKey').fill(key);
    await p2.locator('#connectCloud').click();
    await p2.locator('#loadCloud').click();
    await p2.waitForFunction(() => !document.querySelector('#modal').open);
    const restored = await p2.evaluate(() =>
      JSON.parse(localStorage.getItem('mondgarten.save.v1')),
    );
    assert.equal(restored.village.snails, 1);
    assert.equal(
      await p2.evaluate(() => localStorage.getItem('mt-begleiter-v1')),
      'second-device-medical-marker',
    );
    assert.equal(
      await p2.evaluate(
        () =>
          JSON.parse(localStorage.getItem('mt-garden-plants-v1')).tokens.length,
      ),
      1,
    );
    assert.equal(restored.village.farm.nursery.length, 2);
    assert.ok(
      await p2.evaluate(
        () => !!localStorage.getItem('mondgarten.save.v1.before-online-load'),
      ),
    );
    console.log(
      'Online UI: encrypted creation and restore on a second device OK',
    );
    // Advance the first device, then try the second device's stale revision.
    await p.locator('#closeModal').click();
    await p.locator('#stockShortcut').click();
    await p.locator('#openFarm').click();
    await p.locator('[data-food="flowers"]').click();
    await p.locator('#closeModal').click();
    await p.evaluate(() => window.dispatchEvent(new Event('online')));
    await p.waitForTimeout(250);
    remote = await probe.read();
    assert.ok(remote.revision >= 2);
    await p2.locator('#stockShortcut').click();
    await p2.locator('#openFarm').click();
    await p2.locator('[data-food="flowers"]').click();
    await p2.locator('#closeModal').click();
    await p2.evaluate(() => window.dispatchEvent(new Event('online')));
    await p2.waitForTimeout(250);
    await cloudMenu(p2);
    assert.ok(
      (await p2.locator('#cloudStatus').innerText()).includes('anderer Stand'),
    );
    assert.equal((await probe.read()).revision, remote.revision);
    console.log(
      'Online UI: second-device conflict is visible and preserves the server save',
    );
    await p2.screenshot({ path: '/tmp/migraene-online-ui.png' });
    assert.deepEqual(errors, []);
    console.log('No browser runtime errors');
  } finally {
    await b.close();
    if (proxy) {
      proxy.closeAllConnections();
      await new Promise((r) => proxy.close(r));
      pg('DROP DATABASE IF EXISTS ' + db + ' WITH (FORCE)', 'postgres');
    }
    app.closeAllConnections();
    await new Promise((r) => app.close(r));
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
