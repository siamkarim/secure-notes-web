import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ErrorText, useSubmit } from '../components/ui';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const { busy, error, run } = useSubmit();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isRegister = mode === 'register';

  const submit = run(async () => {
    if (isRegister) await register(name, email, password);
    else await login(email, password);
    navigate('/notes');
  });

  return (
    <main className="auth">
      <div className="auth-card">
        <p className="brand">Secure Notes</p>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{isRegister ? 'Start writing private notes in seconds.' : 'Log in to see your notes.'}</p>
      <form onSubmit={submit} className="stack">
        {isRegister && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
          </label>
        )}
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={isRegister ? 8 : 1}
            maxLength={128}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </label>
        {isRegister && <p className="muted">At least 8 characters.</p>}
        <ErrorText>{error}</ErrorText>
        <button type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isRegister ? 'Register' : 'Log in'}
        </button>
      </form>
      <p className="auth-switch">
        {isRegister ? (
          <>Already have an account? <Link to="/login">Log in</Link></>
        ) : (
          <>No account yet? <Link to="/register">Register</Link></>
        )}
      </p>
      </div>
    </main>
  );
}
