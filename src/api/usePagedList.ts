import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './client';
import type { Page } from './types';

/**
 * Loads a cursor-paginated list: the first page on mount (and whenever `path`
 * changes), then one more page each time loadMore() is called.
 */
export function usePagedList<T>(path: string, limit = 10) {
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const latest = useRef(0);

  const load = useCallback(
    async (cursor: string | null) => {
      const requestId = ++latest.current;
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({ limit: String(limit) });
        if (cursor) query.set('cursor', cursor);
        const page = await api<Page<T>>(`${path}${path.includes('?') ? '&' : '?'}${query}`);
        if (requestId !== latest.current) return; // a newer request replaced this one
        setItems((old) => (cursor ? [...old, ...page.items] : page.items));
        setNextCursor(page.nextCursor);
      } catch (err) {
        if (requestId === latest.current) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (requestId === latest.current) setLoading(false);
      }
    },
    [path, limit],
  );

  useEffect(() => {
    void load(null);
  }, [load]);

  return {
    items,
    setItems,
    loading,
    error,
    hasMore: nextCursor !== null,
    loadMore: () => load(nextCursor),
    reload: () => load(null),
  };
}
