import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync, spawn } from 'node:child_process';
const container = process.argv[2] ?? 'mondgarten-pg-test',
  database = 'mondgarten_test_' + process.pid;
function sql(text, { db = database, allowFailure = false } = {}) {
  const result = spawnSync(
    'docker',
    [
      'exec',
      '-i',
      container,
      'psql',
      '-X',
      '-v',
      'ON_ERROR_STOP=1',
      '-U',
      'postgres',
      '-d',
      db,
      '-tA',
    ],
    { input: text, encoding: 'utf8' },
  );
  if (result.status !== 0 && !allowFailure) throw Error(result.stderr);
  return result;
}
try {
  sql(`CREATE DATABASE ${database};`, { db: 'postgres' });
  sql(
    "DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;",
    { db: 'postgres' },
  );
  const setup = readFileSync(
    new URL('../supabase/setup.sql', import.meta.url),
    'utf8',
  );
  sql(setup);
  sql(`UPDATE garden_private.settings SET invite_hash=encode(extensions.digest('local-test-invitation-only','sha256'),'hex');
 DO $$ DECLARE token text:=repeat('a',43); id text:=encode(extensions.digest(token,'sha256'),'hex'); payload jsonb:='{"version":1,"iv":"abcdefghijklmnop","ciphertext":"abcdefghijklmnopqrstuvwxyz"}'; data jsonb; BEGIN
  BEGIN PERFORM public.garden_write(id,token,0,payload,null); RAISE EXCEPTION 'missing invite accepted'; EXCEPTION WHEN SQLSTATE 'PT403' THEN NULL; END;
  data:=public.garden_write(id,token,0,payload,'local-test-invitation-only');
  IF data->>'revision'<>'1' THEN RAISE EXCEPTION 'bad initial version'; END IF;
  BEGIN PERFORM public.garden_read(id,repeat('b',43)); RAISE EXCEPTION 'wrong key accepted'; EXCEPTION WHEN SQLSTATE 'PT401' THEN NULL; END;
  BEGIN PERFORM public.garden_write(id,token,0,payload,null); RAISE EXCEPTION 'stale overwrite accepted'; EXCEPTION WHEN SQLSTATE 'PT409' THEN NULL; END;
  FOR i IN 1..12 LOOP PERFORM public.garden_write(id,token,i,payload,null); END LOOP;
  IF (SELECT count(*) FROM garden_private.history)<>10 THEN RAISE EXCEPTION 'history not bounded'; END IF;
  IF public.garden_read(id,token)->>'revision'<>'13' THEN RAISE EXCEPTION 'bad read version'; END IF;
  BEGIN PERFORM public.garden_write(id,token,13,jsonb_build_object('version',1,'iv','abcdefghijklmnop','ciphertext',repeat('a',1048576)),null); RAISE EXCEPTION 'oversize accepted'; EXCEPTION WHEN SQLSTATE 'PT400' THEN NULL; END;
 END $$;`);
  // Reapplying setup must preserve existing saves and invitation configuration.
  sql(setup);
  const testID = createHash('sha256').update('a'.repeat(43)).digest('hex');
  const read = sql(
    `SET ROLE anon; SELECT public.garden_read('${testID}',repeat('a',43))->>'revision'; RESET ROLE;`,
  );
  assert.ok(read.status === 0);
  const denied = sql('SET ROLE anon; SELECT * FROM garden_private.saves;', {
    allowFailure: true,
  });
  assert.notEqual(denied.status, 0);
  assert.ok(denied.stderr.includes('permission denied'));
  const concurrentText =
    'SELECT public.garden_write(encode(extensions.digest(repeat(\'a\',43),\'sha256\'),\'hex\'),repeat(\'a\',43),13,\'{"version":1,"iv":"abcdefghijklmnop","ciphertext":"abcdefghijklmnopqrstuvwxyz"}\'::jsonb,null);';
  const query = () =>
    new Promise((resolve) => {
      const p = spawn('docker', [
        'exec',
        '-i',
        container,
        'psql',
        '-X',
        '-v',
        'ON_ERROR_STOP=1',
        '-U',
        'postgres',
        '-d',
        database,
      ]);
      let output = '';
      p.stderr.on('data', (x) => (output += x));
      p.stdout.resume();
      p.on('close', (code) => resolve({ code, output }));
      p.stdin.end(concurrentText);
    });
  const results = await Promise.all([query(), query()]);
  assert.equal(results.filter((r) => r.code === 0).length, 1);
  assert.ok(results.find((r) => r.code !== 0).output.includes('Save changed'));
  console.log(
    'PostgreSQL/Supabase SQL: creation, encryption envelope, invitation, wrong key, stale/racing writes, history, size limit, migration repeatability and private-table denial passed',
  );
} finally {
  sql(`DROP DATABASE IF EXISTS ${database} WITH (FORCE);`, {
    db: 'postgres',
    allowFailure: true,
  });
}
