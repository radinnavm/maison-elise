import { useMemo, useState } from 'react';

import { Button, ButtonLink } from '@/components/Button/Button';
import { EmptyState } from '@/components/EmptyState/EmptyState';
import { FilterDrawer } from '@/components/Filters/FilterDrawer';
import { FilterPanel } from '@/components/Filters/FilterPanel';
import { SortSelect } from '@/components/Filters/SortSelect';
import { FilterIcon } from '@/components/icons/Icons';
import { Pagination } from '@/components/Pagination/Pagination';
import { ProductGrid } from '@/components/ProductGrid/ProductGrid';
import { Seo } from '@/components/Seo/Seo';
import { buildShopSeo, truncate } from '@/components/Seo/metadata';
import { ErrorState } from '@/components/StateMessage/ErrorState';
import { LoadingState } from '@/components/StateMessage/LoadingState';
import { useCatalogCategories, useCatalogProducts } from '@/data/catalogSource';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { buildProductQuery, formatCount } from '@/utils/catalog';

import styles from './ShopPage.module.css';

const INTRO =
  'Discover considered silhouettes, refined textures and timeless pieces designed for the modern wardrobe.';

interface ActiveFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

export function ShopPage() {
  const { filters, update, clear } = useCatalogFilters();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const query = useMemo(() => buildProductQuery(filters), [filters]);
  const { data, isLoading, isFetching, isError, refetch } = useCatalogProducts(query);
  const { data: categories = [] } = useCatalogCategories();

  const activeCategory = filters.category
    ? categories.find((category) => category.slug === filters.category)
    : undefined;
  const isUnknownCategory = Boolean(filters.category) && categories.length > 0 && !activeCategory;

  const products = data?.data ?? [];
  const meta = data?.meta;

  const shopSeo = buildShopSeo({
    categoryName: activeCategory?.name,
    categorySlug: filters.category,
    search: filters.search,
    size: filters.size,
    color: filters.color,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort,
    page: filters.page,
  });
  const seoDescription = activeCategory
    ? `Shop ${activeCategory.name} at Maison Élise. ${INTRO}`
    : `Shop the Maison Élise collection. ${INTRO}`;

  const activeFilters: ActiveFilter[] = [];

  if (filters.search) {
    activeFilters.push({
      key: 'search',
      label: `Search: ${filters.search}`,
      onRemove: () => update({ search: undefined }),
    });
  }

  if (filters.category) {
    activeFilters.push({
      key: 'category',
      label: activeCategory?.name ?? filters.category,
      onRemove: () => update({ category: undefined }),
    });
  }

  if (filters.size) {
    activeFilters.push({
      key: 'size',
      label: `Size: ${filters.size}`,
      onRemove: () => update({ size: undefined }),
    });
  }

  if (filters.color) {
    activeFilters.push({
      key: 'color',
      label: `Colour: ${filters.color}`,
      onRemove: () => update({ color: undefined }),
    });
  }

  if (filters.minPrice !== undefined) {
    activeFilters.push({
      key: 'minPrice',
      label: `From €${filters.minPrice}`,
      onRemove: () => update({ minPrice: undefined }),
    });
  }

  if (filters.maxPrice !== undefined) {
    activeFilters.push({
      key: 'maxPrice',
      label: `Up to €${filters.maxPrice}`,
      onRemove: () => update({ maxPrice: undefined }),
    });
  }

  if (isUnknownCategory) {
    return (
      <div className={`container ${styles.page}`}>
        <Seo
          title="Category not found"
          description="The category you are looking for may have moved or no longer exists."
          canonicalPath="/shop"
          robots="noindex"
        />
        <header className={styles.pageHeader}>
          <p className={styles.eyebrow}>Shop</p>
          <h1 className={styles.title}>Shop the Collection</h1>
          <p className={styles.intro}>{INTRO}</p>
        </header>
        <EmptyState
          title="We couldn't find that category."
          description="The category you are looking for may have moved or no longer exists. Browse the full collection instead."
          action={
            <ButtonLink to="/shop" variant="primary" size="md">
              Browse the collection
            </ButtonLink>
          }
        />
      </div>
    );
  }

  const heading = activeCategory?.name ?? 'Shop the Collection';

  return (
    <div className={`container ${styles.page}`}>
      <Seo
        title={shopSeo.title}
        description={truncate(seoDescription)}
        canonicalPath={shopSeo.canonicalPath}
        robots={shopSeo.robots}
      />
      <header className={styles.pageHeader}>
        <p className={styles.eyebrow}>Shop</p>
        <h1 className={styles.title}>{heading}</h1>
        <p className={styles.intro}>{INTRO}</p>
      </header>

      <div className={styles.toolbar}>
        <p className={styles.count} aria-live="polite">
          {meta ? formatCount(meta.total) : ''}
          {isFetching && !isLoading ? <span className={styles.updating}> · Updating…</span> : null}
        </p>
        <div className={styles.toolbarControls}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className={styles.filterButton}
            aria-expanded={isDrawerOpen}
            aria-controls="filter-drawer"
            onClick={() => setIsDrawerOpen(true)}
          >
            <FilterIcon className={styles.filterIcon} />
            Filters
          </Button>
          <SortSelect value={filters.sort} onChange={(sort) => update({ sort })} />
        </div>
      </div>

      {activeFilters.length > 0 ? (
        <div className={styles.activeFilters}>
          <ul className={styles.chips}>
            {activeFilters.map((filter) => (
              <li key={filter.key}>
                <button
                  type="button"
                  className={styles.chip}
                  onClick={filter.onRemove}
                  aria-label={`Remove filter ${filter.label}`}
                >
                  {filter.label}
                  <span aria-hidden="true" className={styles.chipIcon}>
                    ×
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className={styles.clearAll} onClick={clear}>
            Clear all
          </button>
        </div>
      ) : null}

      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label="Product filters">
          <FilterPanel
            filters={filters}
            categories={categories}
            onChange={update}
            idPrefix="sidebar"
          />
        </aside>

        <div
          className={[styles.results, isFetching && !isLoading ? styles.resultsBusy : '']
            .filter(Boolean)
            .join(' ')}
          aria-busy={isFetching && !isLoading}
        >
          {isLoading ? (
            <LoadingState label="Loading products" />
          ) : isError ? (
            <ErrorState
              title="We couldn't load the collection."
              description="Please check your connection and try again."
              action={
                <Button type="button" variant="secondary" size="md" onClick={() => void refetch()}>
                  Try again
                </Button>
              }
            />
          ) : products.length > 0 && meta ? (
            <>
              <ProductGrid products={products} priorityCount={4} />
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onChange={(next) => update({ page: next })}
              />
            </>
          ) : (
            <EmptyState
              title="Nothing matches your selection."
              description="Try adjusting your filters to discover more pieces."
              action={
                <Button type="button" variant="secondary" size="md" onClick={clear}>
                  Clear filters
                </Button>
              }
            />
          )}
        </div>
      </div>

      <FilterDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        filters={filters}
        categories={categories}
        onApply={update}
      />
    </div>
  );
}
