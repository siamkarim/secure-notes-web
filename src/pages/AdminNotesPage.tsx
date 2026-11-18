import { Link, useSearchParams } from 'react-router-dom';
import type { Note } from '../api/types';
import { usePagedList } from '../api/usePagedList';
import { formatDate, ListFooter } from '../components/ui';

/** Read-only view of everyone's notes. ?owner=<id> narrows it to one user. */
export function AdminNotesPage() {
  const [params] = useSearchParams();
  const owner = params.get('owner');
  const list = usePagedList<Note>(owner ? `/admin/notes?owner=${owner}` : '/admin/notes');

  return (
    <main>
      <h1>All notes</h1>
      {owner ? (
        <p>Showing notes of one user. <Link to="/admin/notes">Show everyone's notes</Link></p>
      ) : (
        <p className="muted">Admins can view every note, but only edit their own.</p>
      )}

      {list.items.map((note) => (
        <article key={note._id} className="card">
          <h3>{note.title}</h3>
          {note.body && <p className="pre">{note.body}</p>}
          <p className="muted">
            {typeof note.owner === 'object' ? (
              <>By <Link to={`/admin/notes?owner=${note.owner._id}`}>{note.owner.name}</Link> ({note.owner.email})</>
            ) : (
              'Owner deleted'
            )}
            {' · '}{formatDate(note.createdAt)}
          </p>
        </article>
      ))}

      <ListFooter {...list} empty={list.items.length === 0} onMore={list.loadMore} />
    </main>
  );
}
