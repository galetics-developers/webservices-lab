import { mkdirSync, writeFileSync } from 'node:fs';
import { argv, exit } from 'node:process';

const DEFAULTS = {
  url: 'http://localhost:4000/api/products',
  duration: 30,
  concurrency: 10,
  timeout: 30000,
  label: 'local',
  out: 'evidencias',
};

function parseArgs(args) {
  const options = { ...DEFAULTS };
  for (let i = 0; i < args.length; i += 1) {
    const [flag, inline] = args[i].split('=');
    const key = flag.replace(/^--/, '');
    if (!(key in DEFAULTS)) {
      console.error(`Opción desconocida: ${flag}`);
      exit(1);
    }
    const value = inline ?? args[++i];
    options[key] = typeof DEFAULTS[key] === 'number' ? Number(value) : value;
  }
  if (!Number.isFinite(options.duration) || options.duration < 1) {
    console.error('--duration debe ser un número de segundos mayor que 0');
    exit(1);
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    console.error('--concurrency debe ser un entero mayor que 0');
    exit(1);
  }
  return options;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[Math.max(0, index)]);
}

async function timedRequest(url, timeoutMs) {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    await response.arrayBuffer();
    return { ms: performance.now() - start, status: response.status, ok: response.ok };
  } catch (error) {
    return {
      ms: performance.now() - start,
      status: 0,
      ok: false,
      error: error?.name === 'AbortError' ? 'TIMEOUT' : (error?.cause?.code ?? error?.name ?? 'ERROR'),
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const options = parseArgs(argv.slice(2));
  const startedAt = new Date();

  console.log(`Objetivo      : ${options.url}`);
  console.log(`Etiqueta      : ${options.label}`);
  console.log(`Duración      : ${options.duration} s`);
  console.log(`Concurrencia  : ${options.concurrency}`);
  console.log('');

  console.log('Midiendo arranque en frío...');
  const cold = await timedRequest(options.url, options.timeout);
  console.log(`  ${Math.round(cold.ms)} ms (HTTP ${cold.status}${cold.error ? ` ${cold.error}` : ''})`);
  console.log('');

  console.log('Generando carga...');
  const latencies = [];
  const statusCount = {};
  const errorCount = {};
  const deadline = performance.now() + options.duration * 1000;

  async function worker() {
    while (performance.now() < deadline) {
      const result = await timedRequest(options.url, options.timeout);
      latencies.push(result.ms);
      statusCount[result.status] = (statusCount[result.status] ?? 0) + 1;
      if (result.error) errorCount[result.error] = (errorCount[result.error] ?? 0) + 1;
    }
  }

  const wallStart = performance.now();
  await Promise.all(Array.from({ length: options.concurrency }, worker));
  const elapsedSeconds = (performance.now() - wallStart) / 1000;

  const sorted = [...latencies].sort((a, b) => a - b);
  const failed = Object.entries(statusCount)
    .filter(([status]) => Number(status) === 0 || Number(status) >= 400)
    .reduce((total, [, count]) => total + count, 0);

  const report = {
    label: options.label,
    url: options.url,
    startedAt: startedAt.toISOString(),
    durationSeconds: Math.round(elapsedSeconds * 10) / 10,
    concurrency: options.concurrency,
    coldStartMs: Math.round(cold.ms),
    coldStartStatus: cold.status,
    requests: latencies.length,
    requestsPerSecond: Math.round((latencies.length / elapsedSeconds) * 10) / 10,
    failed,
    errorRatePercent: latencies.length
      ? Math.round((failed / latencies.length) * 10000) / 100
      : 0,
    latencyMs: {
      min: percentile(sorted, 0),
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
      max: sorted.length ? Math.round(sorted[sorted.length - 1]) : null,
    },
    statusCount,
    errorCount,
  };

  console.log('');
  console.log('Resultado');
  console.log('---------');
  console.log(`Peticiones        : ${report.requests} (${report.requestsPerSecond}/s)`);
  console.log(`Fallidas          : ${report.failed} (${report.errorRatePercent} %)`);
  console.log(`Arranque en frío  : ${report.coldStartMs} ms`);
  console.log(
    `Latencia (ms)     : p50 ${report.latencyMs.p50} | p90 ${report.latencyMs.p90} | p95 ${report.latencyMs.p95} | p99 ${report.latencyMs.p99} | máx ${report.latencyMs.max}`,
  );
  console.log(`Códigos HTTP      : ${JSON.stringify(report.statusCount)}`);
  if (Object.keys(report.errorCount).length) {
    console.log(`Errores           : ${JSON.stringify(report.errorCount)}`);
  }

  console.log('');
  console.log('Fila para la bitácora');
  console.log(
    '| Plataforma | Arranque frío (ms) | p50 | p95 | p99 | Pet./s | Error % |',
  );
  console.log('|---|---|---|---|---|---|---|');
  console.log(
    `| ${report.label} | ${report.coldStartMs} | ${report.latencyMs.p50} | ${report.latencyMs.p95} | ${report.latencyMs.p99} | ${report.requestsPerSecond} | ${report.errorRatePercent} |`,
  );

  mkdirSync(options.out, { recursive: true });
  const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
  const file = `${options.out}/carga-${options.label}-${stamp}.json`;
  writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log('');
  console.log(`Evidencia guardada en ${file}`);
}

await main();
