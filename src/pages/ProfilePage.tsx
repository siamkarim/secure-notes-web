import { useState } from 'react';
import { api, setAccessToken } from '../api/client';
import type { User } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorText, parseInterests, useSubmit } from '../components/ui';

type UpdateResponse = { user: User; accessToken?: string };

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const profile = useSubmit();
  const passwordForm = useSubmit();
  const [name, setName] = useState(user?.name ?? '');
  const [interests, setInterests] = useState(user?.interests.join(', ') ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState('');

  if (!user) return null;

  const saveProfile = profile.run(async () => {
    setSaved('');
    const res = await api<UpdateResponse>('/users/me', {
      method: 'PATCH',
      body: { name, interests: parseInterests(interests) },
    });
    setUser(res.user);
    setInterests(res.user.interests.join(', '));
    setSaved('Profile saved.');
  });

  const changePassword = passwordForm.run(async () => {
    setSaved('');
    const res = await api<UpdateResponse>('/users/me', {
      method: 'PATCH',
      body: { currentPassword, newPassword },
    });
    // Old tokens are revoked by the server; it sends a fresh one for this session.
    if (res.accessToken) setAccessToken(res.accessToken);
    setCurrentPassword('');
    setNewPassword('');
    setSaved('Password changed. Other devices have been logged out.');
  });

  return (
    <main className="narrow">
      <h1>My profile</h1>
      <p className="muted">{user.email} · role: {user.role}</p>
      {saved && <p className="success">{saved}</p>}

      <form onSubmit={saveProfile} className="stack card">
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
        </label>
        <label>
          Interests (comma separated)
          <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="chess, reading" />
        </label>
        <ErrorText>{profile.error}</ErrorText>
        <button type="submit" disabled={profile.busy}>Save profile</button>
      </form>

      <form onSubmit={changePassword} className="stack card">
        <h3>Change password</h3>
        <label>
          Current password
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
        </label>
        <label>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} maxLength={128} autoComplete="new-password" />
        </label>
        <ErrorText>{passwordForm.error}</ErrorText>
        <button type="submit" disabled={passwordForm.busy}>Change password</button>
      </form>
    </main>
  );
}
