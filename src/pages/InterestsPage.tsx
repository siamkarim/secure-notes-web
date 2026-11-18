import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { InterestGroup } from '../api/types';
import { usePagedList } from '../api/usePagedList';
import { PageHeader, Pager } from '../components/ui';

/** Users grouped by interest (the single-aggregate() endpoint), paged by interest name. */
export function InterestsPage() {
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('');
  const path = filter ? `/users/by-interest?interest=${encodeURIComponent(filter)}` : '/users/by-interest';
  const list = usePagedList<InterestGroup>(path, 5);

  const applyFilter = (event: FormEvent) => {
    event.preventDefault();
    setFilter(input.trim());
  };

  return (
    <main>
      <PageHeader title="Users by interest" subtitle="Everyone grouped under each interest they list, A to Z." />

      <form onSubmit={applyFilter} className="row toolbar">
        <input placeholder="Show one interest, e.g. chess" value={input} onChange={(e) => setInput(e.target.value)} maxLength={40} />
        <button type="submit">Filter</button>
        {filter && (
          <button type="button" onClick={() => { setInput(''); setFilter(''); }}>
            Show all
          </button>
        )}
      </form>

      {list.items.map((group) => (
        <section key={group.interest} className="card">
          <h3 className="group-title">
            {group.interest}
            <span className="badge">{group.count} {group.count === 1 ? 'user' : 'users'}</span>
          </h3>
          <ul className="inline-list">
            {group.users.map((u) => (
              <li key={u._id}>
                <Link to={`/users/${u._id}/posts`} className="chip chip-link">{u.name}</Link>
              </li>
            ))}
          </ul>
          {group.count > group.users.length && (
            <p className="muted">Showing the first {group.users.length}.</p>
          )}
        </section>
      ))}

      <Pager list={list} emptyText="No users have this interest." />
    </main>
  );
}
