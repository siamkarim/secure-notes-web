import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { api } from './client';
import type { Page } from './types';

export interface PagedList<T> {
  items: T[];
  setItems: Dispatch<SetStateAction<T[]>>;
  loading: boolean;
  error: string;
  /** 1-based number of the page being shown */
  page: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
  prev: () => void;
  next: () => void;
  /** Go back to page 1 and load it again (e.g. after creating an item) */
  first: () => void;
  /** Load the current page again (e.g. after deleting an item) */
  refresh: () => void;
}

/**
 * Page-by-page navigation on top of the API's cursor pagination.
 *
 * The API only knows "give me the rows after this cursor". To go backwards we
 * remember the cursor that started every page we have visited (`trail`), so
 * "Previous" simply re-requests the page before with its remembered cursor.
 */
export function usePagedList<T>(path: string, initialPageSize = 10): PagedList<T> {
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [items, setItems] = useState<T[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  // The trail belongs to one list (path + page size). When either changes,
  // the stored trail no longer matches and we start again from page 1.
  const listKey = `${path}|${pageSize}`;
  const [stored, setStored] = useState<{ key: string; trail: (string | null)[] }>({
    key: listKey,
    trail: [null],
  });
  const trail = stored.key === listKey ? stored.trail : [null];
  const cursor = trail[trail.length - 1] ?? null;
  const setTrail = useCallback(
    (next: (string | null)[]) => setStored({ key: listKey, trail: next }),
    [listKey],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const query = new URLSearchParams({ limit: String(pageSize) });
    if (cursor) query.set('cursor', cursor);

    api<Page<T>>(`${path}${path.includes('?') ? '&' : '?'}${query}`)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch((err) => {
        if (cancelled) return;
        setItems([]);
        setNextCursor(null);
        setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Ignore the answer of a request that has been replaced by a newer one.
    return () => {
      cancelled = true;
    };
  }, [path, pageSize, cursor, reloadCount]);

  const prev = useCallback(() => {
    if (trail.length > 1) setTrail(trail.slice(0, -1));
  }, [trail, setTrail]);

  // The last item of a later page was deleted: step back instead of showing an empty page.
  useEffect(() => {
    if (!loading && !error && items.length === 0 && trail.length > 1) prev();
  }, [loading, error, items.length, trail.length, prev]);

  return {
    items,
    setItems,
    loading,
    error,
    page: trail.length,
    pageSize,
    setPageSize,
    hasPrev: trail.length > 1,
    hasNext: nextCursor !== null,
    prev,
    next: () => {
      if (nextCursor) setTrail([...trail, nextCursor]);
    },
    first: () => {
      if (trail.length > 1) setTrail([null]);
      else setReloadCount((n) => n + 1);
    },
    refresh: () => setReloadCount((n) => n + 1),
  };
}
