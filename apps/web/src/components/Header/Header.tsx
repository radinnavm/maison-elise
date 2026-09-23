import { useState } from 'react';
import { Link } from 'react-router';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from '@/components/icons/Icons';
import { IconButton, IconLink } from '@/components/IconButton/IconButton';
import { SearchOverlay } from '@/components/SearchOverlay/SearchOverlay';
import { primaryNav } from '@/data/navigation';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { openSearch } from '@/features/ui/uiSlice';
import { selectWishlistCount } from '@/features/wishlist/wishlistSlice';
import { useCart } from '@/hooks/useCart';

import { MobileMenu } from './MobileMenu';
import styles from './Header.module.css';

export function Header() {
  const dispatch = useAppDispatch();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { itemCount: cartCount } = useCart();
  const wishlistCount = useAppSelector(selectWishlistCount);

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.left}>
            <IconButton
              label="Open menu"
              className={styles.menuButton}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setIsMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>

            <nav className={styles.nav} aria-label="Primary">
              <ul className={styles.navList}>
                {primaryNav.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className={styles.navLink}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <Link to="/" className={styles.logo} aria-label="Maison Élise — home">
            Maison Élise
          </Link>

          <div className={styles.actions}>
            <IconButton
              label="Search"
              className={styles.desktopOnly}
              aria-haspopup="dialog"
              onClick={() => dispatch(openSearch())}
            >
              <SearchIcon />
            </IconButton>
            <IconLink to="/wishlist" label="Wishlist" badge={wishlistCount}>
              <HeartIcon />
            </IconLink>
            <IconLink to="/cart" label="Shopping bag" badge={cartCount}>
              <BagIcon />
            </IconLink>
            <IconLink
              to={isAuthenticated ? '/account' : '/login'}
              label={isAuthenticated ? 'Account' : 'Sign in'}
              className={styles.desktopOnly}
            >
              <UserIcon />
            </IconLink>
          </div>
        </div>
      </header>

      <MobileMenu open={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <SearchOverlay />
    </>
  );
}
