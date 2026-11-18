import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Role, User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { usePagedList } from '../api/usePagedList';
import { Chips, ErrorText, PageHeader, Pager, parseInterests, PasswordInput, RoleBadge, useSubmit } from '../components/ui';

export function AdminUsersPage() {
  const { user: me } = useAuth();
  const list = usePagedList<User>('/admin/users');
  const create = useSubmit();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' as Role, interests: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const addUser = create.run(async () => {
    const { user } = await api<{ user: User }>('/admin/users', {
      method: 'POST',
      body: { ...form, interests: parseInterests(form.interests) },
    });
    list.first();
    setForm({ name: '', email: '', password: '', role: 'user', interests: '' });
  });

  return (
    <main>
      <PageHeader title="Manage users" subtitle="Add, update and remove accounts." />

      <form onSubmit={addUser} className="card card-form grid-form">
        <h3>Add user</h3>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <PasswordInput placeholder="Password (min 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} autoComplete="new-password" />
        <input placeholder="Interests (comma separated)" value={form.interests} onChange={(e) => setForm({ ...form, interests: e.target.value })} />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} aria-label="Role">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button type="submit" disabled={create.busy}>Add user</button>
        <ErrorText>{create.error}</ErrorText>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Interests</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {list.items.map((u) =>
              editingId === u._id ? (
                <EditRow
                  key={u._id}
                  user={u}
                  isSelf={u._id === me?._id}
                  onCancel={() => setEditingId(null)}
                  onSaved={(saved) => {
                    list.setItems((old) => old.map((x) => (x._id === saved._id ? saved : x)));
                    setEditingId(null);
                  }}
                />
              ) : (
                <ViewRow
                  key={u._id}
                  user={u}
                  isSelf={u._id === me?._id}
                  onEdit={() => setEditingId(u._id)}
                  onDeleted={list.refresh}
                />
              ),
            )}
          </tbody>
        </table>
      </div>

      <Pager list={list} emptyText="No users found." />
    </main>
  );
}

function ViewRow(props: { user: User; isSelf: boolean; onEdit: () => void; onDeleted: () => void }) {
  const { user } = props;
  const action = useSubmit();

  const remove = action.run(async () => {
    if (!window.confirm(`Delete ${user.email} and all their notes and posts?`)) return;
    await api(`/admin/users/${user._id}`, { method: 'DELETE' });
    props.onDeleted();
  });

  return (
    <tr>
      <td className="strong">{user.name}{props.isSelf && <span className="muted"> (you)</span>}</td>
      <td>{user.email}</td>
      <td><RoleBadge role={user.role} /></td>
      <td><Chips values={user.interests} /></td>
      <td>
        <div className="row">
          <button onClick={props.onEdit}>Edit</button>
          <Link to={`/admin/notes?owner=${user._id}`}>Notes</Link>
          <Link to={`/users/${user._id}/posts`}>Posts</Link>
          {!props.isSelf && (
            <button onClick={() => void remove()} disabled={action.busy} className="danger">Delete</button>
          )}
        </div>
        <ErrorText>{action.error}</ErrorText>
      </td>
    </tr>
  );
}

function EditRow(props: { user: User; isSelf: boolean; onCancel: () => void; onSaved: (user: User) => void }) {
  const { user } = props;
  const action = useSubmit();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<Role>(user.role);
  const [interests, setInterests] = useState(user.interests.join(', '));
  const [password, setPassword] = useState('');

  const save = action.run(async () => {
    const res = await api<{ user: User }>(`/admin/users/${user._id}`, {
      method: 'PATCH',
      body: {
        name,
        email,
        interests: parseInterests(interests),
        // Only send what really changed: a role or password change logs that user out.
        ...(role !== user.role ? { role } : {}),
        ...(password ? { password } : {}),
      },
    });
    props.onSaved(res.user);
  });

  return (
    <tr>
      <td><input value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" /></td>
      <td><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" /></td>
      <td>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={props.isSelf} aria-label="Role">
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </td>
      <td><input value={interests} onChange={(e) => setInterests(e.target.value)} aria-label="Interests" /></td>
      <td>
        <PasswordInput placeholder="New password (optional)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <div className="row">
          <button onClick={() => void save()} disabled={action.busy}>Save</button>
          <button onClick={props.onCancel}>Cancel</button>
        </div>
        <ErrorText>{action.error}</ErrorText>
      </td>
    </tr>
  );
}
