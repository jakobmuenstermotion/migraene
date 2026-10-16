import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createSyncServer } from './server/sync-server.mjs';
import {
  CloudSave,
  newSaveKey,
  saveIdentity,
  encryptSave,
  decryptSave,
  saveServerURL,
  SaveConflict,
} from './mondgarten/cloud-save.mjs';
const invite = 'local-test-invitation-only';
async function server(t, options = {}) {
  const app = createSyncServer({ inviteCode: invite, ...options });
  await new Promise((resolve) => app.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${app.address().port}`;
  t.after(
    () =>
      new Promise((resolve) => {
        app.closeAllConnections();
        app.close(resolve);
      }),
  );
  return { url, app };
}
const fixture = () => ({
  schema: 1,
  game: { v: 2, coins: 120, names: ['Test', 'Schnecki'] },
  garden: { plants: { version: 1, beds: {}, tokens: [], receipts: [] } },
});
test('encryption round trip, authentication separation and tamper protection', async () => {
  const key = newSaveKey(),
    id = await saveIdentity(key),
    other = await saveIdentity(newSaveKey()),
    snapshot = fixture(),
    payload = await encryptSave(snapshot, id);
  assert.ok(!JSON.stringify(payload).includes('Schnecki'));
  assert.deepEqual(await decryptSave(payload, id), snapshot);
  await assert.rejects(decryptSave(payload, other));
  const modified = {
    ...payload,
    ciphertext:
      (payload.ciphertext[0] === 'A' ? 'B' : 'A') + payload.ciphertext.slice(1),
  };
  await assert.rejects(decryptSave(modified, id));
  await assert.rejects(saveIdentity('short-password'));
  assert.throws(() => saveServerURL('http://example.com'));
  assert.throws(() => saveServerURL('https://user:pass@example.com'));
  assert.throws(() => saveServerURL('https://example.com?token=secret'));
});
test('new saves require invitation; existing saves require their own key', async (t) => {
  const { url } = await server(t),
    key = newSaveKey(),
    client = new CloudSave({ url, key, revision: 0 });
  assert.equal(await client.read(), null);
  await assert.rejects(client.write(fixture()));
  await client.write(fixture(), invite);
  assert.equal(client.config.revision, 1);
  assert.deepEqual((await client.read()).snapshot, fixture());
  const wrong = await saveIdentity(newSaveKey()),
    correct = await saveIdentity(key);
  const response = await fetch(url + '/api/save/' + correct.id, {
    headers: { Authorization: 'Bearer ' + wrong.auth },
  });
  assert.equal(response.status, 401);
});
test('two-device conflict cannot silently overwrite; explicit version choice succeeds', async (t) => {
  const { url } = await server(t),
    key = newSaveKey(),
    a = new CloudSave({ url, key, revision: 0 });
  await a.write(fixture(), invite);
  let status;
  const b = new CloudSave(
    { url, key, revision: 1 },
    { onStatus: (s) => (status = s) },
  );
  await a.write({ ...fixture(), game: { v: 2, coins: 150 } });
  b.queue({ ...fixture(), game: { v: 2, coins: 90 } });
  await b.flush();
  assert.equal(status, 'conflict');
  assert.equal(b.paused, true);
  assert.equal((await a.read()).snapshot.game.coins, 150);
  const remote = await b.read();
  b.useRevision(remote.revision);
  await b.flush();
  assert.equal((await a.read()).snapshot.game.coins, 90);
});
test('concurrent conditional writes have exactly one winner', async (t) => {
  const { url } = await server(t),
    key = newSaveKey(),
    a = new CloudSave({ url, key, revision: 0 });
  await a.write(fixture(), invite);
  const b = new CloudSave({ url, key, revision: 1 });
  const results = await Promise.allSettled([
    a.write({ ...fixture(), game: { coins: 1 } }),
    b.write({ ...fixture(), game: { coins: 2 } }),
  ]);
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 1);
  assert.ok(
    results.find((r) => r.status === 'rejected').reason instanceof SaveConflict,
  );
});
test('offline writes keep pending progress and retry with the same version', async (t) => {
  const { url } = await server(t),
    key = newSaveKey();
  let online = true,
    status;
  const client = new CloudSave(
    { url, key, revision: 0 },
    {
      fetcher: (...args) =>
        online ? fetch(...args) : Promise.reject(Error('offline')),
      onStatus: (s) => (status = s),
    },
  );
  await client.write(fixture(), invite);
  online = false;
  client.queue({ ...fixture(), game: { coins: 180 } });
  await client.flush();
  assert.equal(status, 'offline');
  assert.equal(client.config.revision, 1);
  assert.ok(client.pending);
  online = true;
  await client.flush();
  assert.equal(client.pending, null);
  assert.equal((await client.read()).snapshot.game.coins, 180);
});
test('database survives restart and retains only ten encrypted revisions', async (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'mondgarten-sync-')),
    databasePath = path.join(dir, 'save.sqlite');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const first = await server(t, { databasePath }),
    key = newSaveKey(),
    client = new CloudSave({ url: first.url, key, revision: 0 });
  await client.write(fixture(), invite);
  for (let i = 0; i < 12; i++)
    await client.write({ ...fixture(), game: { coins: i } });
  await new Promise((resolve) => {
    first.app.closeAllConnections();
    first.app.close(resolve);
  });
  const second = await server(t, { databasePath });
  const reopened = new CloudSave({ url: second.url, key, revision: 13 });
  assert.equal((await reopened.read()).snapshot.game.coins, 11);
  const inspect = new DatabaseSync(databasePath, { readOnly: true });
  assert.equal(
    inspect.prepare('SELECT count(*) AS n FROM history').get().n,
    10,
  );
  assert.ok(
    !inspect
      .prepare('SELECT payload FROM saves')
      .get()
      .payload.includes('coins'),
  );
  inspect.close();
});
test('origin checks, quotas and static traversal are enforced', async (t) => {
  const { url } = await server(t, { maxRooms: 1, staticRoot: process.cwd() });
  assert.equal(
    (
      await fetch(url + '/health', {
        headers: { Origin: 'https://unrelated.example' },
      })
    ).status,
    403,
  );
  assert.equal(
    (await fetch(url + '/mondgarten/%2e%2e%2fserver/sync-server.mjs')).status,
    404,
  );
  assert.equal((await fetch(url + '/server/sync-server.mjs')).status, 404);
  assert.equal((await fetch(url + '/mondgarten/game.js')).status, 200);
  const a = new CloudSave({ url, key: newSaveKey(), revision: 0 });
  await a.write(fixture(), invite);
  const b = new CloudSave({ url, key: newSaveKey(), revision: 0 });
  await assert.rejects(b.write(fixture(), invite));
});

test('Supabase adapter uses public project key and private capability through RPC, with correct CAS', async () => {
  const { publicSupabaseKey } = await import('./mondgarten/cloud-save.mjs');
  assert.throws(() => publicSupabaseKey('sb_secret_test_fixture'));
  assert.throws(() =>
    publicSupabaseKey(
      'header.' + btoa(JSON.stringify({ role: 'service_role' })) + '.signature',
    ),
  );
  assert.equal(
    publicSupabaseKey('sb_publishable_fixture'),
    'sb_publishable_fixture',
  );
  const calls = [];
  let revision = 0,
    payload;
  const fetcher = async (url, options) => {
    const args = JSON.parse(options.body);
    calls.push({ url, options, args });
    if (url.endsWith('garden_read'))
      return Response.json(
        revision ? { revision, payload, updatedAt: 1 } : null,
      );
    if (args.p_expected !== revision)
      return Response.json({ error: 'conflict' }, { status: 409 });
    if (!revision && args.p_invite !== 'test-invite')
      return Response.json({ error: 'invite' }, { status: 403 });
    revision++;
    payload = args.p_payload;
    return Response.json({ revision, updatedAt: 1 });
  };
  const key = newSaveKey(),
    client = new CloudSave(
      {
        url: 'https://example.supabase.co',
        key,
        backend: 'supabase',
        publicKey: 'sb_publishable_fixture',
        revision: 0,
      },
      { fetcher },
    );
  assert.equal(await client.read(), null);
  await client.write(fixture(), 'test-invite');
  assert.deepEqual((await client.read()).snapshot, fixture());
  assert.ok(
    calls.every(
      (c) =>
        c.options.headers.apikey === 'sb_publishable_fixture' &&
        !JSON.stringify(c.args).includes(key),
    ),
  );
  assert.ok(
    calls.some(
      (c) =>
        c.url.endsWith('/rest/v1/rpc/garden_write') && c.args.p_expected === 0,
    ),
  );
  const stale = new CloudSave({ ...client.config, revision: 0 }, { fetcher });
  await assert.rejects(stale.write(fixture()), SaveConflict);
});

test('disconnect during a pending upload cannot reactivate configuration callbacks', async () => {
  let release, requestStarted;
  const started = new Promise((resolve) => (requestStarted = resolve));
  let updates = 0;
  const client = new CloudSave(
    { url: 'https://storage.example', key: newSaveKey(), revision: 0 },
    {
      fetcher: () => {
        requestStarted();
        return new Promise((resolve) => (release = resolve));
      },
      onConfig: () => updates++,
      onStatus: () => updates++,
    },
  );
  const writing = client.write(fixture(), 'test-invite');
  await started;
  client.stop();
  release(Response.json({ revision: 1, updatedAt: 1 }));
  await writing;
  assert.equal(client.paused, true);
  assert.equal(client.pending, null);
  assert.equal(updates, 0);
});
