import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import pg from 'pg';

function parseArgs(args) {
  assert.equal(args.length, 4, 'Expected backend, shape, MiB and output path');
  const [backend, shape, size, output] = args;
  const mib = Number(size);
  assert.ok(['pglite', 'postgres'].includes(backend));
  assert.ok(['text', 'objects'].includes(shape));
  assert.ok(Number.isSafeInteger(mib) && mib > 0 && mib <= 256 && output);
  return { backend, shape, mib, output };
}
function payload(shape, bytes, generation) {
  const fragment = '{"gameKey":"synthetic","teams":{"home":{"games":1,"W":1,"L":0,"T":0,"R":3,"RA":1}},"batting":{"player":{"PA":4,"AB":3,"H":1,"BB":1,"TB":1,"K":1}},"pitching":{},"batterSplits":{},"pitcherSplits":{},"matchups":{}}';
  return shape === 'text'
    ? JSON.stringify({ generation, padding: 'x'.repeat(bytes) })
    : `{"generation":${generation},"records":[${Array(Math.max(1, Math.floor(bytes / (fragment.length + 1)))).fill(fragment).join(',')}]}`;
}
if (process.argv[2] === '--self-check') {
  assert.equal(process.argv.length, 3);
  for (const shape of ['text', 'objects']) assert.equal(JSON.parse(payload(shape, 32, 1)).generation, 1);
  assert.throws(() => parseArgs(['pglite', 'text', '0', 'out']));
  assert.throws(() => parseArgs(['postgres', 'objects', '257', 'out']));
  assert.throws(() => parseArgs(['other', 'text', '1', 'out']));
  assert.throws(() => parseArgs(['pglite', 'text', '1']));
  console.log('self-check passed');
} else {
  const { backend, shape, mib, output } = parseArgs(process.argv.slice(2));
  let client, stage = 'connect', inTransaction = false;
  const report = { backend, shape, requestedMiB: mib, scope: 'synthetic database boundary only; no engine or game verification', memoryScope: 'driver process; native PostgreSQL server memory is separate', node: process.version, stages: [] };
  const sample = name => {
    const { rss, heapUsed, heapTotal, external, arrayBuffers } = process.memoryUsage();
    report.stages.push({ stage: name, rss, heapUsed, heapTotal, external, arrayBuffers, wasmBytes: backend === 'pglite' ? client?.mod?.HEAPU8?.buffer?.byteLength ?? null : null });
  };
  try {
    if (backend === 'postgres') {
      const url = new URL(process.env.PLAYBALL_PROFILE_DATABASE_URL);
      assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname));
      assert.ok(/^\/playball_profile_[A-Za-z0-9_]+$/.test(url.pathname) && !url.search);
      assert.ok(['postgres:', 'postgresql:'].includes(url.protocol));
      client = new pg.Client({ connectionString: url.href });
      await client.connect();
    } else {
      client = new PGlite();
      await client.waitReady;
    }
    report.databaseVersion = (await client.query('SELECT version() AS version')).rows[0].version;
    stage = 'create';
    await client.query('CREATE TEMP TABLE probe (id integer primary key, state jsonb NOT NULL)');
    await client.query('CREATE TEMP TABLE probe_receipts (id integer primary key)');
    const initial = payload(shape, mib * 1024 * 1024, 0);
    report.payloadBytes = Buffer.byteLength(initial);
    sample('input-ready');
    stage = 'insert'; await client.query('INSERT INTO probe VALUES (1, $1::jsonb)', [initial]); sample(stage);
    stage = 'select';
    const selected = await client.query('SELECT state FROM probe WHERE id=1');
    assert.equal(selected.rows[0].state.generation, 0); sample(stage);
    stage = 'begin'; await client.query('BEGIN'); inTransaction = true;
    stage = 'update'; await client.query('UPDATE probe SET state=$1::jsonb WHERE id=1', [payload(shape, mib * 1024 * 1024, 1)]); sample(stage);
    stage = 'receipt'; await client.query('INSERT INTO probe_receipts VALUES (1)'); sample(stage);
    stage = 'commit'; await client.query('COMMIT'); inTransaction = false; sample(stage);
    stage = 'verify';
    const result = await client.query("SELECT state->>'generation' AS generation, (SELECT count(*) FROM probe_receipts) AS receipts FROM probe WHERE id=1");
    report.observed = { generation: Number(result.rows[0].generation), receipts: Number(result.rows[0].receipts) };
    assert.deepEqual(report.observed, { generation: 1, receipts: 1 });
    report.status = 'PASS';
  } catch (error) {
    report.status = 'FAILED';
    report.error = { stage, code: error.code ?? null, file: error.file ?? null, line: error.line ?? null, routine: error.routine ?? null };
    sample('error');
    if (client && inTransaction) {
      try {
        await client.query('ROLLBACK');
        const result = await client.query("SELECT state->>'generation' AS generation, (SELECT count(*) FROM probe_receipts) AS receipts FROM probe WHERE id=1");
        report.observed = { generation: Number(result.rows[0].generation), receipts: Number(result.rows[0].receipts) };
        report.atomic = report.observed.generation === 0 && report.observed.receipts === 0;
      } catch { report.atomic = null; }
    }
    process.exitCode = 1;
  } finally {
    try { if (client) await (backend === 'postgres' ? client.end() : client.close()); }
    finally { writeFileSync(output, JSON.stringify(report, null, 2) + '\n'); }
  }
}
