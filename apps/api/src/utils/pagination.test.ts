import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildPaginationMeta, parsePagination } from './pagination.js';

describe('pagination', () => {
  it('computes skip and take from page and limit', () => {
    const pagination = parsePagination(3, 10);

    assert.equal(pagination.page, 3);
    assert.equal(pagination.limit, 10);
    assert.equal(pagination.skip, 20);
    assert.equal(pagination.take, 10);
  });

  it('clamps the limit to the maximum page size', () => {
    const pagination = parsePagination(1, 1000);

    assert.equal(pagination.limit, 48);
  });

  it('normalises invalid page values to the first page', () => {
    const pagination = parsePagination(0, 12);

    assert.equal(pagination.page, 1);
    assert.equal(pagination.skip, 0);
  });

  it('builds pagination meta', () => {
    assert.deepEqual(buildPaginationMeta(25, 2, 10), {
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });

  it('reports at least one page when there are no results', () => {
    assert.equal(buildPaginationMeta(0, 1, 12).totalPages, 1);
  });
});
