import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/Icons';

import styles from './Pagination.module.css';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className={styles.nav} aria-label="Pagination">
      <button
        type="button"
        className={styles.control}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeftIcon />
      </button>

      <ul className={styles.list}>
        {pages.map((pageNumber) => (
          <li key={pageNumber}>
            <button
              type="button"
              className={[styles.page, pageNumber === page ? styles.active : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => onChange(pageNumber)}
              aria-label={`Page ${pageNumber}`}
              aria-current={pageNumber === page ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={styles.control}
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRightIcon />
      </button>
    </nav>
  );
}
