import { useRef, useState } from 'react';

import { Button } from '@/components/Button/Button';
import { FilterPanel } from '@/components/Filters/FilterPanel';
import { CloseIcon } from '@/components/icons/Icons';
import { IconButton } from '@/components/IconButton/IconButton';
import { useDialog } from '@/hooks/useDialog';
import type { CatalogFilters } from '@/types/catalog';
import type { CategoryDto } from '@/types/product';

import styles from './FilterDrawer.module.css';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: CatalogFilters;
  categories: CategoryDto[];
  onApply: (changes: Partial<CatalogFilters>) => void;
}

interface FilterDrawerFormProps {
  filters: CatalogFilters;
  categories: CategoryDto[];
  onApply: (changes: Partial<CatalogFilters>) => void;
}

function FilterDrawerForm({ filters, categories, onApply }: FilterDrawerFormProps) {
  const [draft, setDraft] = useState<CatalogFilters>(filters);

  return (
    <>
      <div className={styles.body}>
        <FilterPanel
          filters={draft}
          categories={categories}
          idPrefix="drawer"
          onChange={(changes) => setDraft((current) => ({ ...current, ...changes }))}
        />
      </div>
      <div className={styles.footer}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          fullWidth
          onClick={() =>
            setDraft({
              ...filters,
              size: undefined,
              color: undefined,
              minPrice: undefined,
              maxPrice: undefined,
            })
          }
        >
          Clear
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          onClick={() => onApply({ ...draft, page: 1 })}
        >
          Apply
        </Button>
      </div>
    </>
  );
}

export function FilterDrawer({ open, onClose, filters, categories, onApply }: FilterDrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useDialog<HTMLDivElement>(open, onClose, closeButtonRef);
  const overlayClasses = [styles.overlay, open ? styles.open : ''].filter(Boolean).join(' ');

  return (
    <div className={overlayClasses} aria-hidden={!open}>
      <div className={styles.backdrop} aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        id="filter-drawer"
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div className={styles.header}>
          <span className={styles.title}>Filters</span>
          <IconButton ref={closeButtonRef} label="Close filters" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>

        {open ? (
          <FilterDrawerForm
            filters={filters}
            categories={categories}
            onApply={(changes) => {
              onApply(changes);
              onClose();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
