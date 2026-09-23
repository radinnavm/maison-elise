import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { Seo } from './Seo';

function metaContent(attribute: 'name' | 'property', key: string): string | null {
  return (
    document.head.querySelector(`meta[${attribute}="${key}"]`)?.getAttribute('content') ?? null
  );
}

afterEach(() => {
  document.head
    .querySelectorAll('meta[data-seo-managed], link[data-seo-managed], script[data-seo-jsonld]')
    .forEach((node) => node.remove());
  document.title = '';
});

describe('Seo', () => {
  it('applies title, description, canonical and Open Graph tags for public pages', () => {
    render(
      <Seo title="Shop the Collection" description="Browse the collection" canonicalPath="/shop" />,
    );

    expect(document.title).toBe('Shop the Collection — Maison Élise');
    expect(metaContent('name', 'description')).toBe('Browse the collection');
    expect(metaContent('name', 'robots')).toBe('index, follow');
    expect(metaContent('property', 'og:title')).toBe('Shop the Collection — Maison Élise');
    expect(metaContent('property', 'og:type')).toBe('website');

    const canonical = document.head.querySelector('link[rel="canonical"]')?.getAttribute('href');
    expect(canonical).toBe(`${window.location.origin}/shop`);
  });

  it('marks private pages as noindex', () => {
    render(<Seo title="Shopping Bag" robots="noindex" />);

    expect(metaContent('name', 'robots')).toBe('noindex, nofollow');
  });

  it('injects product JSON-LD and removes it on unmount', () => {
    const { unmount } = render(
      <Seo
        title="Aurelia Satin Dress"
        canonicalPath="/product/aurelia-satin-dress"
        ogType="product"
        jsonLd={{ '@context': 'https://schema.org', '@type': 'Product', name: 'Aurelia' }}
      />,
    );

    const script = document.head.querySelector('script[data-seo-jsonld]');
    expect(script?.textContent).toContain('"@type":"Product"');

    unmount();
    expect(document.head.querySelector('script[data-seo-jsonld]')).toBeNull();
  });
});
