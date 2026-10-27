const CONFIGURED_API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');
const BACKEND_PORT = (process.env.NEXT_PUBLIC_BACKEND_PORT ?? '4000').trim() || '4000';

export const SERVER_API_URL = CONFIGURED_API_URL || `http://localhost:${BACKEND_PORT}`;

export function getApiUrl(): string {
  if (CONFIGURED_API_URL) return CONFIGURED_API_URL;
  if (typeof window === 'undefined') return SERVER_API_URL;
  return `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}`;
}

export interface ApiResponse<T> {
  status: number;
  body: T | null;
  rawText: string;
  networkError?: string;
}

export async function callApi<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const baseUrl = getApiUrl();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}) },
      signal: AbortSignal.timeout(20000),
    });
    const rawText = await res.text();
    let body: T | null = null;
    try {
      body = rawText ? (JSON.parse(rawText) as T) : null;
    } catch {
      body = null;
    }
    return { status: res.status, body, rawText };
  } catch (err) {
    return {
      status: 0,
      body: null,
      rawText: '',
      networkError: `No se pudo conectar con el backend en ${baseUrl} (${(err as Error).message})`,
    };
  }
}

export function validationMessages(body: unknown): string[] {
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.map(String);
  if (typeof message === 'string') return [message];
  return [];
}
