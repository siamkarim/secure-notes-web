import { useState } from 'react';
import { api } from '../api/client';
import type { Note } from '../api/types';
import { usePagedList } from '../api/usePagedList';
import { ErrorText, formatDate, ListFooter, useSubmit } from '../components/ui';

export function NotesPage() {
  const list = usePagedList<Note>('/notes');
  const create = useSubmit();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const addNote = create.run(async () => {
    const { note } = await api<{ note: Note }>('/notes', { method: 'POST', body: { title, body } });
    list.setItems((old) => [note, ...old]);
    setTitle('');
    setBody('');
  });

  return (
    <main>
      <h1>My notes</h1>

      <form onSubmit={addNote} className="stack card">
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        <textarea placeholder="Write something…" value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={10000} />
        <ErrorText>{create.error}</ErrorText>
        <button type="submit" disabled={create.busy}>Add note</button>
      </form>

      {list.items.map((note) => (
        <NoteCard
          key={note._id}
          note={note}
          onSaved={(saved) => list.setItems((old) => old.map((n) => (n._id === saved._id ? saved : n)))}
          onDeleted={() => list.setItems((old) => old.filter((n) => n._id !== note._id))}
        />
      ))}

      <ListFooter {...list} empty={list.items.length === 0} onMore={list.loadMore} />
    </main>
  );
}

function NoteCard(props: { note: Note; onSaved: (note: Note) => void; onDeleted: () => void }) {
  const { note } = props;
  const action = useSubmit();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);

  const save = action.run(async () => {
    const res = await api<{ note: Note }>(`/notes/${note._id}`, { method: 'PATCH', body: { title, body } });
    props.onSaved(res.note);
    setEditing(false);
  });

  const remove = action.run(async () => {
    if (!window.confirm('Delete this note?')) return;
    await api(`/notes/${note._id}`, { method: 'DELETE' });
    props.onDeleted();
  });

  if (editing) {
    return (
      <form onSubmit={save} className="stack card">
        <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={10000} />
        <ErrorText>{action.error}</ErrorText>
        <div className="row">
          <button type="submit" disabled={action.busy}>Save</button>
          <button type="button" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <article className="card">
      <h3>{note.title}</h3>
      {note.body && <p className="pre">{note.body}</p>}
      <p className="muted">Created {formatDate(note.createdAt)}</p>
      <ErrorText>{action.error}</ErrorText>
      <div className="row">
        <button onClick={() => setEditing(true)}>Edit</button>
        <button onClick={() => void remove()} disabled={action.busy} className="danger">Delete</button>
      </div>
    </article>
  );
}
