import { NavLink, Outlet } from 'react-router';

import { useAppSelector } from '@/app/hooks';
import { Seo } from '@/components/Seo/Seo';
import { selectCurrentUser } from '@/features/auth/authSlice';

import styles from './Account.module.css';

const navItems = [
  { label: 'Account', to: '/account', end: true },
  { label: 'Orders', to: '/account/orders', end: false },
  { label: 'Wishlist', to: '/wishlist', end: false },
  { label: 'Account Settings', to: '/account/settings', end: false },
];

export function AccountLayout() {
  const user = useAppSelector(selectCurrentUser);

  return (
    <div className={`container ${styles.page}`}>
      <Seo
        title="My Account"
        description="Manage your Maison Élise account."
        canonicalPath="/account"
        robots="noindex"
      />
      <header className={styles.header}>
        <p className={styles.eyebrow}>My Account</p>
        <h1 className={styles.title}>{user ? `Hello, ${user.firstName}` : 'My Account'}</h1>
      </header>

      <div className={styles.layout}>
        <nav aria-label="Account">
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
