'use client';

import type { GatewayResult } from '@wslab/shared';
import type { ReactNode } from 'react';
import type { ApiResponse } from '@/lib/api';
import { validationMessages } from '@/lib/api';
import { RawView } from './RawView';
import { StatusChip } from './StatusChip';

interface Props<T> {
  response: ApiResponse<GatewayResult<T>> | null;
  loading: boolean;
  children: (data: T) => ReactNode;
}

export function GatewayResultView<T>({ response, loading, children }: Props<T>) {
  if (loading) return <p className="caption">Consultando...</p>;
  if (!response) return null;

  if (response.networkError) {
    return (
      <div className="alert error" role="alert">
        <strong>Sin conexión</strong>
        <div>{response.networkError}</div>
      </div>
    );
  }

  const result = response.body;
  if (!result || typeof result !== 'object' || !('source' in result)) {
    const messages = validationMessages(response.body);
    return (
      <div className="alert error" role="alert">
        <strong>HTTP {response.status}</strong>
        {messages.length > 0 && (
          <ul>
            {messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div>
      <dl className="meta">
        <div>
          <dt>Servicio</dt>
          <dd>{result.source}</dd>
        </div>
        <div>
          <dt>Protocolo</dt>
          <dd>
            <span className="chip">{result.protocol}</span>
          </dd>
        </div>
        <div>
          <dt>Gateway</dt>
          <dd>
            <StatusChip status={response.status} />
          </dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd className="num" style={{ textAlign: 'left' }}>
            {result.durationMs} ms
          </dd>
        </div>
        <div className="wide">
          <dt>Endpoint consumido</dt>
          <dd>
            <code>{result.endpoint}</code>
          </dd>
        </div>
      </dl>

      {result.ok && result.data !== null ? (
        children(result.data)
      ) : (
        <div className="alert error" role="alert">
          <strong>{result.error?.code}</strong>
          <div>{result.error?.message}</div>
        </div>
      )}

      <div className="raw-list">
        <RawView label="solicitud original" content={result.rawRequest} />
        <RawView label="respuesta original" content={result.raw} />
        <RawView label="JSON del gateway" content={response.rawText} />
      </div>
    </div>
  );
}
