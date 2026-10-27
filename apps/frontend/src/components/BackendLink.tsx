'use client';

import { useApiUrl } from '@/lib/use-api-url';

export function BackendLink({ path }: { path: string }) {
  const url = `${useApiUrl()}${path}`;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <code>{url}</code>
    </a>
  );
}

export function BackendUrl({ path = '' }: { path?: string }) {
  return <code>{`${useApiUrl()}${path}`}</code>;
}
