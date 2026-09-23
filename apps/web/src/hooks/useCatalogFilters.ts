import { useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';

import type { CatalogFilters } from '@/types/catalog';
import { parseFilters, toSearchParams } from '@/utils/catalog';

export interface CatalogFiltersResult {
  filters: CatalogFilters;
  update: (changes: Partial<CatalogFilters>) => void;
  clear: () => void;
}

export function useCatalogFilters(): CatalogFiltersResult {
  const { category: categorySlug } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const filters = useMemo(
    () => parseFilters(searchParams, categorySlug),
    [searchParams, categorySlug],
  );

  const update = useCallback(
    (changes: Partial<CatalogFilters>) => {
      const next: CatalogFilters = {
        ...filters,
        ...changes,
        page: changes.page ?? 1,
      };

      const categoryChanged = changes.category !== filters.category;
      const needsPathSync =
        categoryChanged || (next.category !== undefined && categorySlug === undefined);

      if (needsPathSync) {
        const pathname = next.category ? `/shop/${next.category}` : '/shop';
        navigate({ pathname, search: toSearchParams(next).toString() });
        return;
      }

      setSearchParams(toSearchParams(next));
    },
    [filters, categorySlug, navigate, setSearchParams],
  );

  const clear = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return { filters, update, clear };
}
