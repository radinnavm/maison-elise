import { useCallback, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { CloseIcon, SearchIcon } from '@/components/icons/Icons';
import { IconButton } from '@/components/IconButton/IconButton';
import { closeSearch, selectIsSearchOpen } from '@/features/ui/uiSlice';
import { useDialog } from '@/hooks/useDialog';

import styles from './SearchOverlay.module.css';

export function SearchOverlay() {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsSearchOpen);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  const handleClose = useCallback(() => {
    dispatch(closeSearch());
    setQuery('');
  }, [dispatch]);

  const panelRef = useDialog<HTMLDivElement>(isOpen, handleClose, inputRef);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    handleClose();
    navigate(trimmed ? `/shop?search=${encodeURIComponent(trimmed)}` : '/shop');
  }

  const overlayClasses = [styles.overlay, isOpen ? styles.open : ''].filter(Boolean).join(' ');

  return (
    <div className={overlayClasses} aria-hidden={!isOpen}>
      <div className={styles.backdrop} aria-hidden="true" onClick={handleClose} />
      <div
        ref={panelRef}
        id="search-overlay"
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
      >
        <div className={`container ${styles.inner}`}>
          <form className={styles.form} role="search" onSubmit={handleSubmit}>
            <SearchIcon className={styles.icon} />
            <label htmlFor="site-search" className="visually-hidden">
              Search the collection
            </label>
            <input
              id="site-search"
              ref={inputRef}
              type="search"
              className={styles.input}
              placeholder="Search the collection"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoComplete="off"
            />
            <IconButton label="Close search" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </form>
          <p className={styles.hint}>Press Enter to search the collection.</p>
        </div>
      </div>
    </div>
  );
}
