import type { GatewayResult, Protocol, ServiceSource } from '@wslab/shared';
import { toConsumerError } from './consumer-error.js';

export interface ConsumerOutput<T> {
  data: T;
  raw?: string;
  rawRequest?: string;
}

export interface ExecutionTrace {
  raw?: string;
  rawRequest?: string;
}

export async function execute<T>(
  source: ServiceSource,
  protocol: Protocol,
  endpoint: string,
  call: (trace: ExecutionTrace) => Promise<ConsumerOutput<T>>,
): Promise<GatewayResult<T>> {
  const started = performance.now();
  const trace: ExecutionTrace = {};
  const durationMs = () => Math.round(performance.now() - started);

  try {
    const out = await call(trace);
    return {
      source,
      protocol,
      endpoint,
      ok: true,
      durationMs: durationMs(),
      data: out.data,
      raw: out.raw,
      rawRequest: out.rawRequest,
    };
  } catch (err) {
    const error = toConsumerError(err);
    return {
      source,
      protocol,
      endpoint,
      ok: false,
      durationMs: durationMs(),
      data: null,
      raw: trace.raw,
      rawRequest: trace.rawRequest,
      error: { code: error.code, message: error.message },
    };
  }
}
