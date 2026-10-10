#!/usr/bin/env node

// Measure one Redis round trip at a time, without pipelining or app work.
const { createClient } = require('redis');

function positiveInteger(value, name) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return number;
}

function percentile(sorted, p) {
  return sorted[Math.ceil((p / 100) * sorted.length) - 1] / 1e6;
}

async function main() {
  const count = positiveInteger(process.argv[2] ?? '1000', 'count');
  const warmup = positiveInteger(process.argv[3] ?? '100', 'warmup');
  if (count === 0) throw new Error('count must be greater than zero');

  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: { reconnectStrategy: false },
  });
  client.on('error', () => {}); // connect/ping promises report errors below
  try {
    await client.connect();
    for (let i = 0; i < warmup; i++) await client.ping();

    const samples = [];
    for (let i = 0; i < count; i++) {
      const start = process.hrtime.bigint();
      await client.ping();
      samples.push(Number(process.hrtime.bigint() - start));
    }
    samples.sort((a, b) => a - b);
    const average = samples.reduce((sum, value) => sum + value, 0) / count / 1e6;
    console.log(`Redis PING: ${count} sequential requests (${warmup} warmup)`);
    console.log(`Latency (ms): avg ${average.toFixed(3)}  p50 ${percentile(samples, 50).toFixed(3)}  p95 ${percentile(samples, 95).toFixed(3)}  p99 ${percentile(samples, 99).toFixed(3)}  min ${(samples[0] / 1e6).toFixed(3)}  max ${(samples[count - 1] / 1e6).toFixed(3)}`);
  } finally {
    if (client.isOpen) await client.disconnect();
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
