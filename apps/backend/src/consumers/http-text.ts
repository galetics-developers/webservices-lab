import { ConsumerError } from './consumer-error.js';

export const MAX_RESPONSE_BYTES = 1024 * 1024;

export interface HttpTextResponse {
  status: number;
  contentType: string;
  body: string;
}

export async function fetchText(
  url: string,
  options: { timeoutMs: number; accept: string },
): Promise<HttpTextResponse> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: options.accept, 'User-Agent': 'webservices-lab/1.0 (practica academica)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(options.timeoutMs),
  });

  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > MAX_RESPONSE_BYTES) {
    await response.body?.cancel();
    throw new ConsumerError('INVALID_RESPONSE', 'La respuesta excede el tamaño máximo permitido');
  }

  if (!response.ok) {
    await response.body?.cancel();
    throw new ConsumerError('UPSTREAM_ERROR', `El servicio respondió con HTTP ${response.status}`);
  }

  return {
    status: response.status,
    contentType: response.headers.get('content-type') ?? '',
    body: await readLimited(response),
  };
}

async function readLimited(response: Response): Promise<string> {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new ConsumerError('INVALID_RESPONSE', 'La respuesta excede el tamaño máximo permitido');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}
