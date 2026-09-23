import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// Vitest runs with the package directory (apps/web) as the working directory.
const robots = readFileSync(resolve(process.cwd(), 'public/robots.txt'), 'utf8');
const sitemap = readFileSync(resolve(process.cwd(), 'public/sitemap.xml'), 'utf8');

const PRIVATE_ROUTES = [
  '/account',
  '/cart',
  '/bag',
  '/checkout',
  '/login',
  '/register',
  '/forgot-password',
  '/order',
  '/wishlist',
  '/search',
];

describe('robots.txt', () => {
  it('allows public crawling', () => {
    expect(robots).toMatch(/^Allow: \/$/m);
  });

  it.each(PRIVATE_ROUTES)('disallows private route %s', (route) => {
    expect(robots).toContain(`Disallow: ${route}`);
  });
});

describe('sitemap.xml', () => {
  it('includes the public homepage and shop', () => {
    expect(sitemap).toContain('/shop</loc>');
  });

  it.each(PRIVATE_ROUTES)('never exposes private route %s', (route) => {
    expect(sitemap).not.toContain(`${route}<`);
  });
});
