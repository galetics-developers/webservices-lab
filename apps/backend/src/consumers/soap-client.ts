import * as soap from 'soap';
import { MAX_RESPONSE_BYTES } from './http-text.js';
import type { ExecutionTrace } from './execute.js';

export type DynamicSoapClient = soap.Client & Record<string, any>;

export async function createSoapClient(
  wsdlUrl: string,
  timeoutMs: number,
  endpoint?: string,
): Promise<DynamicSoapClient> {
  const client = await soap.createClientAsync(wsdlUrl, {
    disableCache: true,
    endpoint,
    wsdl_options: { timeout: timeoutMs, maxContentLength: MAX_RESPONSE_BYTES },
  });
  return client as DynamicSoapClient;
}

export async function callSoapOperation(
  client: DynamicSoapClient,
  operation: string,
  args: Record<string, unknown>,
  timeoutMs: number,
  trace: ExecutionTrace,
): Promise<{ result: any; rawRequest: string; rawResponse: string }> {
  const method = client[`${operation}Async`];
  if (typeof method !== 'function') {
    throw new Error(`El WSDL no define la operación ${operation}`);
  }
  try {
    const [result, rawResponse, , rawRequest] = await method.call(client, args, {
      timeout: timeoutMs,
      maxContentLength: MAX_RESPONSE_BYTES,
    });
    return { result, rawRequest, rawResponse };
  } finally {
    trace.rawRequest = client.lastRequest;
    trace.raw = client.lastResponse;
  }
}

export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function soapText(value: unknown): string {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return '';
  return String(value);
}
