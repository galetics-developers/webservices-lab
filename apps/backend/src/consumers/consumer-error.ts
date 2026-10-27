import type { GatewayErrorCode } from '@wslab/shared';

export class ConsumerError extends Error {
  constructor(
    readonly code: GatewayErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ConsumerError';
  }
}

const CONNECTION_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
]);

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT']);

interface SoapFault {
  faultcode?: string;
  faultstring?: string;
  detail?: { code?: string };
}

export function toConsumerError(err: unknown): ConsumerError {
  if (err instanceof ConsumerError) return err;

  const e = err as {
    name?: string;
    code?: string;
    message?: string;
    cause?: { code?: string; message?: string };
    response?: { status?: number };
    root?: { Envelope?: { Body?: { Fault?: SoapFault } } };
  };

  const fault = e?.root?.Envelope?.Body?.Fault;
  if (fault) {
    const code = fault.detail?.code === 'NOT_FOUND' ? 'NOT_FOUND' : 'SOAP_FAULT';
    return new ConsumerError(code, `SOAP Fault ${fault.faultcode ?? ''}: ${fault.faultstring ?? ''}`.trim());
  }

  if (e?.name === 'TimeoutError' || e?.name === 'AbortError' || TIMEOUT_CODES.has(e?.code ?? '')) {
    return new ConsumerError('TIMEOUT', 'El servicio no respondió dentro del tiempo de espera');
  }

  const netCode = e?.code ?? e?.cause?.code;
  if (netCode && CONNECTION_CODES.has(netCode)) {
    return new ConsumerError('CONNECTION_ERROR', `No se pudo conectar con el servicio (${netCode})`);
  }

  const wsdlStatus = /Invalid WSDL URL[\s\S]*?Code:\s*(\d{3})/.exec(e?.message ?? '');
  if (wsdlStatus) {
    return new ConsumerError('UPSTREAM_ERROR', `No se pudo descargar el WSDL (HTTP ${wsdlStatus[1]})`);
  }

  if (typeof e?.response?.status === 'number') {
    return new ConsumerError('UPSTREAM_ERROR', `El servicio respondió con HTTP ${e.response.status}`);
  }

  if (e?.name === 'TypeError' && e?.message === 'fetch failed') {
    const detail = e.cause?.message ? ` (${e.cause.message})` : '';
    return new ConsumerError('CONNECTION_ERROR', `No se pudo conectar con el servicio${detail}`);
  }

  return new ConsumerError('UPSTREAM_ERROR', e?.message ?? 'Error desconocido al consumir el servicio');
}
