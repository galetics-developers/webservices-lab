export type Protocol = 'REST' | 'SOAP' | 'RSS';

export type ServiceSource =
  | 'own-soap'
  | 'own-rss'
  | 'open-meteo'
  | 'country-info'
  | 'external-rss';

export type GatewayErrorCode =
  | 'TIMEOUT'
  | 'CONNECTION_ERROR'
  | 'UPSTREAM_ERROR'
  | 'SOAP_FAULT'
  | 'INVALID_RESPONSE'
  | 'NOT_FOUND';

export interface GatewayError {
  code: GatewayErrorCode;
  message: string;
}

export interface GatewayResult<T> {
  source: ServiceSource;
  protocol: Protocol;
  endpoint: string;
  ok: boolean;
  durationMs: number;
  data: T | null;
  raw?: string;
  rawRequest?: string;
  error?: GatewayError;
}
