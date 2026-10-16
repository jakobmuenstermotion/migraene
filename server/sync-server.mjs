import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync, statSync, mkdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const MAX_BYTES = 1024 * 1024;
const digest = (value) => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
const fail = (status, message) => Object.assign(new Error(message), { status });
export function createSyncServer({
  databasePath = ':memory:',
  inviteCode = '',
  allowedOrigins = [],
  staticRoot = null,
  maxRooms = 100,
} = {}) {
  if (databasePath !== ':memory:')
    mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(databasePath);
  db.exec(
    'PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS saves(id TEXT PRIMARY KEY, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS history(id TEXT NOT NULL, revision INTEGER NOT NULL, payload TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(id,revision));',
  );
  const rates = new Map();
  let requests = 0;
  const json = (res, status, data) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(JSON.stringify(data));
  };
  const server = http.createServer(async (req, res) => {
    try {
      const origin = req.headers.origin;
      if (origin) {
        const hostOrigin = `${req.socket.encrypted ? 'https' : 'http'}://${req.headers.host}`;
        if (origin !== hostOrigin && !allowedOrigins.includes(origin))
          throw fail(403, 'Origin not allowed');
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Expose-Headers', 'ETag');
      }
      if (req.method === 'OPTIONS') {
        res.writeHead(204, {
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
          'Access-Control-Allow-Headers':
            'Authorization, Content-Type, If-Match, If-None-Match, X-Invite-Code',
          'Access-Control-Max-Age': '600',
        });
        res.end();
        return;
      }
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/health' && req.method === 'GET') {
        json(res, 200, { ok: true });
        return;
      }
      if (!url.pathname.startsWith('/api/save/')) {
        if (!staticRoot || req.method !== 'GET') throw fail(404, 'Not found');
        const pathname =
          url.pathname === '/'
            ? '/begleiter.html'
            : decodeURIComponent(url.pathname);
        if (pathname.split('/').includes('..')) throw fail(404, 'Not found');
        const files = [
          'begleiter.html',
          'sw.js',
          'icon-180.png',
          'companion-garden.js',
          'companion-garden.css',
        ];
        if (
          !files.includes(pathname.slice(1)) &&
          !/^\/(mondgarten|garden-assets-webp|garden-modules)\/[a-zA-Z0-9_./-]+$/.test(
            pathname,
          )
        )
          throw fail(404, 'Not found');
        const target = path.resolve(staticRoot, '.' + pathname);
        if (!target.startsWith(path.resolve(staticRoot) + path.sep))
          throw fail(404, 'Not found');
        let bytes;
        try {
          if (
            !statSync(target).isFile() ||
            !realpathSync(target).startsWith(
              realpathSync(staticRoot) + path.sep,
            )
          )
            throw Error();
          bytes = readFileSync(target);
        } catch {
          throw fail(404, 'Not found');
        }
        const types = {
          '.html': 'text/html; charset=utf-8',
          '.js': 'text/javascript; charset=utf-8',
          '.mjs': 'text/javascript; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
        };
        res.writeHead(200, {
          'Content-Type':
            types[path.extname(target)] ?? 'application/octet-stream',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-cache',
        });
        res.end(bytes);
        return;
      }
      const ip = req.socket.remoteAddress,
        now = Date.now(),
        rate = rates.get(ip);
      if (!rate || rate.until < now)
        rates.set(ip, { until: now + 60000, n: 1 });
      else if (++rate.n > 120) throw fail(429, 'Too many requests');
      if (++requests % 100 === 0)
        for (const [key, r] of rates) if (r.until < now) rates.delete(key);
      const id = url.pathname.slice('/api/save/'.length),
        token = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(
          req.headers.authorization ?? '',
        )?.[1];
      if (!/^[a-f0-9]{64}$/.test(id) || !token || !equal(digest(token), id))
        throw fail(401, 'Invalid save key');
      const previous = db
        .prepare('SELECT revision,payload,updated_at FROM saves WHERE id=?')
        .get(id);
      if (req.method === 'GET') {
        if (!previous) throw fail(404, 'Save not found');
        res.setHeader('ETag', `"${previous.revision}"`);
        json(res, 200, {
          revision: previous.revision,
          payload: JSON.parse(previous.payload),
          updatedAt: previous.updated_at,
        });
        return;
      }
      if (req.method !== 'PUT') throw fail(405, 'Method not allowed');
      if (previous) {
        if (req.headers['if-match'] !== `"${previous.revision}"`)
          throw fail(409, 'Save changed on another device');
      } else {
        if (req.headers['if-none-match'] !== '*')
          throw fail(428, 'Creation precondition required');
        if (inviteCode.length < 16)
          throw fail(503, 'Save creation is not configured');
        if (!equal(req.headers['x-invite-code'] ?? '', inviteCode))
          throw fail(403, 'Invitation required');
        if (db.prepare('SELECT count(*) AS n FROM saves').get().n >= maxRooms)
          throw fail(507, 'Save capacity reached');
      }
      if (Number(req.headers['content-length']) > MAX_BYTES)
        throw fail(413, 'Save too large');
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_BYTES) throw fail(413, 'Save too large');
        chunks.push(chunk);
      }
      let payload;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        throw fail(400, 'Invalid save');
      }
      if (
        payload?.version !== 1 ||
        !/^[-_A-Za-z0-9]{16}$/.test(payload.iv ?? '') ||
        !/^[-_A-Za-z0-9]{22,}$/.test(payload.ciphertext ?? '')
      )
        throw fail(400, 'Invalid encrypted save');
      const serialized = JSON.stringify({
          version: 1,
          iv: payload.iv,
          ciphertext: payload.ciphertext,
        }),
        revision = (previous?.revision ?? 0) + 1;
      // The request body is asynchronous: check again in a transaction to reject races.
      db.exec('BEGIN IMMEDIATE');
      try {
        const current = db
          .prepare('SELECT revision FROM saves WHERE id=?')
          .get(id);
        if (
          !current &&
          db.prepare('SELECT count(*) AS n FROM saves').get().n >= maxRooms
        )
          throw fail(507, 'Save capacity reached');
        if ((current?.revision ?? 0) !== (previous?.revision ?? 0))
          throw fail(409, 'Save changed on another device');
        db.prepare(
          'INSERT INTO saves(id,revision,payload,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET revision=excluded.revision,payload=excluded.payload,updated_at=excluded.updated_at',
        ).run(id, revision, serialized, now);
        db.prepare(
          'INSERT INTO history(id,revision,payload,updated_at) VALUES(?,?,?,?)',
        ).run(id, revision, serialized, now);
        db.prepare('DELETE FROM history WHERE id=? AND revision<=?').run(
          id,
          revision - 10,
        );
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
      res.setHeader('ETag', `"${revision}"`);
      json(res, 200, { revision, updatedAt: now });
    } catch (e) {
      if (!res.headersSent)
        json(res, e.status ?? 500, {
          error: e.status ? e.message : 'Storage unavailable',
        });
      else res.end();
    }
  });
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.once('close', () => db.close());
  return server;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.umask(0o077);
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const server = createSyncServer({
    databasePath: process.env.SYNC_DB_PATH ?? '/data/mondgarten.sqlite',
    inviteCode: process.env.SYNC_INVITE_CODE ?? '',
    allowedOrigins: (process.env.SYNC_ALLOWED_ORIGINS ?? '')
      .split(',')
      .filter(Boolean),
    staticRoot: root,
  });
  server.listen(
    Number(process.env.PORT ?? 8080),
    process.env.SYNC_HOST ?? '0.0.0.0',
    () => console.log('Mondgarten storage server started'),
  );
  for (const signal of ['SIGINT', 'SIGTERM'])
    process.on(signal, () => server.close());
}
