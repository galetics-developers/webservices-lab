'use client';

import { useCallback, useState } from 'react';
import { callApi, type ApiResponse } from './api';

export function useRequest<T>() {
  const [response, setResponse] = useState<ApiResponse<T> | null>(null);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (path: string, init?: RequestInit) => {
    setLoading(true);
    const res = await callApi<T>(path, init);
    setResponse(res);
    setLoading(false);
    return res;
  }, []);

  return { response, loading, run };
}
