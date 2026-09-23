// Generates apps/web/public/sitemap.xml from the public API.
//
// Usage (before a production build/deploy):
//   SITE_URL=https://www.example.com \
//   SITEMAP_API_URL=https://api.example.com/api/v1 \
//   node apps/web/scripts/generate-sitemap.mjs
//
// Only public, indexable routes are emitted. Private routes (account, cart,
// checkout, auth, order, wishlist, search) are never included. The script is
// intentionally non-fatal: if the API is unreachable it still writes a
// static-only sitemap so a build never breaks.

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const STATIC_PATHS = ['/', '/shop'];
const MAX_PRODUCT_PAGES = 50;

const siteUrl = (process.env.SITE_URL ?? '').replace(/\/+$/, '');
const apiUrl = (process.env.SITEMAP_API_URL ?? process.env.VITE_API_URL ?? '').replace(/\/+$/, '');

if (!siteUrl) {
  console.warn('[sitemap] SITE_URL is not set; emitting a static-only sitemap.');
}

async function getJson(url) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function collectCatalogPaths() {
  if (!/^https?:\/\//i.test(apiUrl)) {
    console.warn('[sitemap] No absolute SITEMAP_API_URL/VITE_API_URL; skipping catalogue URLs.');
    return [];
  }

  const paths = [];

  const categories = await getJson(`${apiUrl}/categories`);
  for (const category of categories) {
    paths.push(`/shop/${category.slug}`);
  }

  for (let page = 1; page <= MAX_PRODUCT_PAGES; page += 1) {
    const result = await getJson(`${apiUrl}/products?page=${page}&limit=48`);

    for (const product of result.data) {
      paths.push(`/product/${product.slug}`);
    }

    if (page >= (result.meta?.totalPages ?? 1)) {
      break;
    }
  }

  return paths;
}

function renderSitemap(paths) {
  const urls = [...new Set(paths)]
    .map((path) => `  <url>\n    <loc>${siteUrl}${path}</loc>\n  </url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

let paths = [...STATIC_PATHS];

try {
  paths = [...paths, ...(await collectCatalogPaths())];
} catch (error) {
  console.warn(`[sitemap] Could not fetch catalogue URLs: ${error.message}`);
}

const outputPath = fileURLToPath(new URL('../public/sitemap.xml', import.meta.url));
writeFileSync(outputPath, renderSitemap(paths), 'utf8');

console.log(`[sitemap] Wrote ${new Set(paths).size} URLs to ${outputPath}`);
