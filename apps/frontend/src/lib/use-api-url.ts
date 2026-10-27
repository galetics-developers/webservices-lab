'use client';

import { useSyncExternalStore } from 'react';
import { getApiUrl, SERVER_API_URL } from './api';

const subscribe = () => () => {};

export function useApiUrl(): string {
  return useSyncExternalStore(subscribe, getApiUrl, () => SERVER_API_URL);
}
