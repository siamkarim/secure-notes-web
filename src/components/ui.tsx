import { useState, type FormEvent, type ReactNode } from 'react';
import type { PagedList } from '../api/usePagedList';
import type { Role } from '../api/types';

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? <p className="error" role="alert">{children}</p> : null;
}

/** Title row at the top of every page. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="page-header">
      <h1>{title}</h1>
      {subtitle && <p className="muted">{subtitle}</p>}
    </div>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  return <span className={`badge ${role === 'admin' ? 'badge-admin' : ''}`}>{role}</span>;
}

export function Chips({ values }: { values: string[] }) {
  if (values.length === 0) return <span className="muted">None</span>;
  return (
    <span className="chips">
      {values.map((v) => <span key={v} className="chip">{v}</span>)}
    </span>
  );
}

const PAGE_SIZES = [5, 10, 20, 50];

/** Loading / error / empty states and the Previous / Next controls of a paged list. */
export function Pager(props: { list: Omit<PagedList<unknown>, 'setItems'>; emptyText?: string }) {
  const { list, emptyText = 'Nothing here yet.' } = props;
  const isEmpty = !list.loading && !list.error && list.items.length === 0;

  return (
    <>
      <ErrorText>{list.error}</ErrorText>
      {isEmpty && <p className="empty">{emptyText}</p>}

      <nav className="pager" aria-label="Pagination">
        <label className="pager-size">
          Rows per page
          <select value={list.pageSize} onChange={(e) => list.setPageSize(Number(e.target.value))}>
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
        </label>

        <span className="pager-status" aria-live="polite">
          {list.loading ? 'Loading…' : `Page ${list.page}`}
        </span>

        <div className="row">
          <button onClick={list.prev} disabled={!list.hasPrev || list.loading}>← Previous</button>
          <button onClick={list.next} disabled={!list.hasNext || list.loading}>Next →</button>
        </div>
      </nav>
    </>
  );
}

/** Runs an async submit handler and shows its error, disabling the form while it runs. */
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = (action: () => Promise<void>) => async (event?: FormEvent) => {
    event?.preventDefault();
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, run };
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** "Chess, reading " -> ['Chess', 'reading'] (the API lower-cases and de-duplicates). */
export const parseInterests = (text: string) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
