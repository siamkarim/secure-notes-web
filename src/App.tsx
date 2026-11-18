import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { RoleBadge } from './components/ui';
import { AuthPage } from './pages/AuthPage';
import { NotesPage } from './pages/NotesPage';
import { ProfilePage } from './pages/ProfilePage';
import { PostsPage } from './pages/PostsPage';
import { InterestsPage } from './pages/InterestsPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminNotesPage } from './pages/AdminNotesPage';

/** Pages for logged-in users. Hiding pages here is only UX; the API enforces access. */
function Protected({ adminOnly = false }: { adminOnly?: boolean }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/notes" replace />;
  return <Outlet />;
}

function GuestOnly() {
  const { user } = useAuth();
  return user ? <Navigate to="/notes" replace /> : <Outlet />;
}

function Header() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <header>
      <div className="header-inner">
      <span className="brand">Secure Notes</span>
      <nav>
        <NavLink to="/notes">Notes</NavLink>
        <NavLink to="/posts">Posts</NavLink>
        <NavLink to="/interests">Interests</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        {user.role === 'admin' && (
          <>
            <NavLink to="/admin/users">Users</NavLink>
            <NavLink to="/admin/notes">All notes</NavLink>
          </>
        )}
      </nav>
      <div className="row user-menu">
        <span className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span>
        <span className="user-name">{user.name}</span>
        <RoleBadge role={user.role} />
        <button onClick={() => void logout()}>Log out</button>
      </div>
      </div>
    </header>
  );
}

export function App() {
  const { loading } = useAuth();
  if (loading) return <p className="muted center">Loading…</p>;

  return (
    <>
      <Header />
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
        </Route>
        <Route element={<Protected />}>
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/users/:id/posts" element={<PostsPage />} />
          <Route path="/interests" element={<InterestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route element={<Protected adminOnly />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/notes" element={<AdminNotesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/notes" replace />} />
      </Routes>
    </>
  );
}
