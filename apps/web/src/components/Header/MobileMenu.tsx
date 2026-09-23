import { useRef } from 'react';
import { Link } from 'react-router';

import { useAppSelector } from '@/app/hooks';
import { CloseIcon } from '@/components/icons/Icons';
import { IconButton } from '@/components/IconButton/IconButton';
import { primaryNav } from '@/data/navigation';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { useDialog } from '@/hooks/useDialog';

import styles from './MobileMenu.module.css';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useDialog<HTMLDivElement>(open, onClose, closeButtonRef);
  const overlayClasses = [styles.overlay, open ? styles.open : ''].filter(Boolean).join(' ');

  return (
    <div className={overlayClasses} aria-hidden={!open}>
      <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        id="mobile-menu"
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Menu</span>
          <IconButton ref={closeButtonRef} label="Close menu" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        <nav aria-label="Mobile primary">
          <ul className={styles.navList}>
            {primaryNav.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className={styles.navLink} onClick={onClose}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.secondary}>
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            className={styles.secondaryLink}
            onClick={onClose}
          >
            {isAuthenticated ? 'Account' : 'Sign In'}
          </Link>
          <Link to="/search" className={styles.secondaryLink} onClick={onClose}>
            Search
          </Link>
          <Link to="/wishlist" className={styles.secondaryLink} onClick={onClose}>
            Wishlist
          </Link>
          <Link to="/cart" className={styles.secondaryLink} onClick={onClose}>
            Bag
          </Link>
        </div>
      </div>
    </div>
  );
}
