import { NavLink, Outlet, useNavigate } from 'react-router';

import { useLogoutMutation } from '@/api/authApi';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/Button';
import { selectCurrentUser } from '@/features/auth/authSlice';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/orders', label: 'Orders', end: false },
  { to: '/products', label: 'Products', end: false },
  { to: '/categories', label: 'Categories', end: false },
  { to: '/inventory', label: 'Inventory', end: false },
  { to: '/customers', label: 'Customers', end: false },
];

export function AdminLayout() {
  const user = useAppSelector(selectCurrentUser);
  const [logout, { isLoading }] = useLogoutMutation();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // Credentials are cleared regardless.
    }

    navigate('/login', { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          Maison Élise
          <small>Administration</small>
        </div>

        <nav className="admin-nav" aria-label="Admin">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">Internal back office</div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <span className="admin-header-user">
            {user ? `${user.name} · ${user.email}` : 'Administrator'}
          </span>
          <Button variant="secondary" onClick={handleLogout} disabled={isLoading}>
            {isLoading ? 'Signing out…' : 'Sign out'}
          </Button>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
