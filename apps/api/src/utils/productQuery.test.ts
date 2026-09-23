import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SortOption } from '@maison-elise/shared';

import { buildProductOrderBy, buildProductWhere, type ProductListQuery } from './productQuery.js';

function createQuery(overrides: Partial<ProductListQuery> = {}): ProductListQuery {
  return {
    sort: 'featured',
    page: 1,
    limit: 12,
    ...overrides,
  };
}

describe('buildProductWhere', () => {
  it('always scopes the query to active products', () => {
    assert.equal(buildProductWhere(createQuery()).status, 'ACTIVE');
  });

  it('filters by category slug', () => {
    const where = buildProductWhere(createQuery({ category: 'dresses' }));

    assert.deepEqual(where.category, { slug: 'dresses' });
  });

  it('filters by size and colour through variants', () => {
    const where = buildProductWhere(createQuery({ size: 'M', color: 'Black' }));

    assert.deepEqual(where.variants, { some: { size: 'M', color: 'Black' } });
  });

  it('filters by size only', () => {
    const where = buildProductWhere(createQuery({ size: 'L' }));

    assert.deepEqual(where.variants, { some: { size: 'L' } });
  });

  it('filters by price range', () => {
    const where = buildProductWhere(createQuery({ minPrice: 100, maxPrice: 300 }));

    assert.deepEqual(where.basePrice, { gte: 100, lte: 300 });
  });

  it('applies only the provided price bound', () => {
    const where = buildProductWhere(createQuery({ minPrice: 200 }));

    assert.deepEqual(where.basePrice, { gte: 200 });
  });

  it('filters by search term across name and description', () => {
    const where = buildProductWhere(createQuery({ search: 'satin' }));

    assert.deepEqual(where.OR, [
      { name: { contains: 'satin', mode: 'insensitive' } },
      { description: { contains: 'satin', mode: 'insensitive' } },
    ]);
  });

  it('omits the search clause when no term is provided', () => {
    assert.equal(buildProductWhere(createQuery()).OR, undefined);
  });
});

describe('buildProductOrderBy', () => {
  it('maps known sort options to whitelisted columns', () => {
    assert.deepEqual(buildProductOrderBy('price_asc'), [{ basePrice: 'asc' }]);
    assert.deepEqual(buildProductOrderBy('price_desc'), [{ basePrice: 'desc' }]);
    assert.deepEqual(buildProductOrderBy('name_asc'), [{ name: 'asc' }]);
    assert.deepEqual(buildProductOrderBy('newest'), [{ isNew: 'desc' }, { createdAt: 'desc' }]);
    assert.deepEqual(buildProductOrderBy('featured'), [
      { isFeatured: 'desc' },
      { createdAt: 'desc' },
    ]);
  });

  it('falls back to featured for an unknown sort value', () => {
    const orderBy = buildProductOrderBy('drop-table' as SortOption);

    assert.deepEqual(orderBy, [{ isFeatured: 'desc' }, { createdAt: 'desc' }]);
  });
});
