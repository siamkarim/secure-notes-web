import { useState, type FormEvent, type ReactNode } from 'react';

export function ErrorText({ children }: { children: ReactNode }) {
  return children ? <p className="error" role="alert">{children}</p> : null;
}

/** "Load more" button plus loading / empty / error states for a paged list. */
export function ListFooter(props: {
  loading: boolean;
  error: string;
  hasMore: boolean;
  empty: boolean;
  onMore: () => void;
}) {
  return (
    <div className="list-footer">
      <ErrorText>{props.error}</ErrorText>
      {props.loading && <p className="muted">Loading…</p>}
      {!props.loading && props.empty && !props.error && <p className="muted">Nothing here yet.</p>}
      {!props.loading && props.hasMore && <button onClick={props.onMore}>Load more</button>}
    </div>
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

export const formatDate = (iso: string) => new Date(iso).toLocaleString();

/** "Chess, reading " -> ['Chess', 'reading'] (the API lower-cases and de-duplicates). */
export const parseInterests = (text: string) =>
  text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
