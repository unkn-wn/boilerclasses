#!/usr/bin/env node

// node benchmark/benchmark-search.js redis|api [case|all] [count] [warmup]
const { createClient } = require('redis');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { defaults, cases } = JSON.parse(readFileSync(join(__dirname, 'cases.json'), 'utf8'));

function redisQuery(p) {
  const q = p.get('q');
  const sub = p.get('sub').split(',');
  const term = p.get('term').split(',');
  const gen = p.get('gen').split(',');
  const levels = p.get('levels').split(',');
  const sched = p.get('sched').split(',');
  const ranges = levels.map(level => `@courseCode:[${parseInt(level, 10) * 100}, ${parseInt(level, 10) * 100 + 9999}]`);
  // Match src/lib/redis.js, including its current level range calculation.
  return `${q}${q.trim() ? '*' : ''}${sub[0] ? ` @subjectCode:{${sub.join('|')}}` : ''}${term[0] ? ` @terms:{${term.join('|')}}` : ''}${gen[0] ? gen.map(g => ` @gened:{${g}}`) : ''} (@creditMin:[${p.get('cmin')}, ${p.get('cmax')}] | @creditMax:[${p.get('cmin')}, ${p.get('cmax')}])${levels[0] ? ` (${ranges.join(' | ')})` : ' @courseCode:[0, 0]'}${sched[0] ? ` @sched:{${sched.join('|')}}` : ' @sched:{}'}`;
}

function percentile(sorted, p) {
  return sorted[Math.ceil(sorted.length * p / 100) - 1] / 1e6;
}

async function main() {
  const mode = process.argv[2];
  const selected = process.argv[3] ?? 'all';
  const count = Number(process.argv[4] ?? 100);
  const warmup = Number(process.argv[5] ?? 10);
  if (!['redis', 'api'].includes(mode) || (selected !== 'all' && !cases[selected]) ||
      !Number.isSafeInteger(count) || count < 1 || !Number.isSafeInteger(warmup) || warmup < 0) {
    throw new Error(`Usage: node benchmark/benchmark-search.js redis|api [${Object.keys(cases).join('|')}|all] [positive count] [nonnegative warmup]`);
  }

  let client;
  if (mode === 'redis') {
    client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379', socket: { reconnectStrategy: false } });
    client.on('error', () => {});
    await client.connect();
  }
  try {
    for (const name of selected === 'all' ? Object.keys(cases) : [selected]) {
      const params = new URLSearchParams({ ...defaults, ...cases[name] });
      let run;
      if (mode === 'redis') {
        run = () => client.ft.search('idx:classes', redisQuery(params), { LIMIT: { from: 0, size: Number(params.get('maxlim')) } });
      } else {
        const url = new URL('/api/search', process.env.API_URL || 'http://localhost:3000');
        url.search = params.toString();
        if (process.env.BENCH_PROFILE === '1') url.searchParams.set('__profile', '1');
        run = async () => {
          const start = process.hrtime.bigint();
          const response = await fetch(url);
          const headers = process.hrtime.bigint();
          if (!response.ok) throw new Error(`API returned HTTP ${response.status}`);
          const payload = await response.text();
          const downloaded = process.hrtime.bigint();
          const body = JSON.parse(payload);
          const parsed = process.hrtime.bigint();
          if (!body.courses?.documents) throw new Error('API returned an unexpected response');
          return {
            ...body.courses,
            phases: {
              headers: Number(headers - start),
              body: Number(downloaded - headers),
              parse: Number(parsed - downloaded),
              bytes: Buffer.byteLength(payload),
              server: response.headers.get('server-timing'),
            },
          };
        };
      }

      for (let i = 0; i < warmup; i++) await run();
      const samples = [];
      const phaseSamples = { headers: [], body: [], parse: [] };
      const serverSamples = { params: [], serialize: [] };
      let result;
      for (let i = 0; i < count; i++) {
        const start = process.hrtime.bigint();
        result = await run();
        samples.push(Number(process.hrtime.bigint() - start));
        if (result.phases) {
          for (const phase of Object.keys(phaseSamples)) phaseSamples[phase].push(result.phases[phase]);
          if (result.phases.server) {
            for (const metric of result.phases.server.split(',')) {
              const match = metric.trim().match(/^(params|serialize);dur=([\d.]+)/);
              if (match) serverSamples[match[1]].push(Number(match[2]) * 1e6);
            }
          }
        }
      }
      samples.sort((a, b) => a - b);
      const avg = samples.reduce((sum, n) => sum + n, 0) / count / 1e6;
      console.log(`${mode.toUpperCase()} ${name}: ${result.documents.length} documents${result.phases ? `, ${result.phases.bytes} bytes` : ''}; ${count} requests, ${warmup} warmup`);
      console.log(`  avg ${avg.toFixed(3)}  p50 ${percentile(samples, 50).toFixed(3)}  p95 ${percentile(samples, 95).toFixed(3)}  p99 ${percentile(samples, 99).toFixed(3)}  min ${(samples[0] / 1e6).toFixed(3)}  max ${(samples[count - 1] / 1e6).toFixed(3)} ms`);
      if (mode === 'api') {
        for (const [phase, values] of Object.entries(phaseSamples)) {
          values.sort((a, b) => a - b);
          console.log(`  ${phase} p50 ${percentile(values, 50).toFixed(3)} ms`);
        }
        for (const [phase, values] of Object.entries(serverSamples)) {
          if (values.length === count) {
            values.sort((a, b) => a - b);
            console.log(`  server ${phase} p50 ${percentile(values, 50).toFixed(3)} ms`);
          }
        }
      }
    }
  } finally {
    if (client?.isOpen) await client.disconnect();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
