import { useEffect } from 'react';

import { env } from '@/config/env';

import { absoluteUrl, withBrandSuffix, type SeoConfig } from './metadata';

const MANAGED_ATTRIBUTE = 'data-seo-managed';

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string | undefined,
): void {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);

  if (!content) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    element.setAttribute(MANAGED_ATTRIBUTE, 'true');
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertCanonical(href: string | undefined): void {
  const element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!href) {
    element?.remove();
    return;
  }

  const link = element ?? document.createElement('link');

  if (!element) {
    link.setAttribute('rel', 'canonical');
    link.setAttribute(MANAGED_ATTRIBUTE, 'true');
    document.head.appendChild(link);
  }

  link.setAttribute('href', href);
}

function replaceJsonLd(data: SeoConfig['jsonLd']): HTMLScriptElement | undefined {
  document.head.querySelectorAll('script[data-seo-jsonld]').forEach((node) => node.remove());

  if (!data) {
    return undefined;
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-seo-jsonld', 'true');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);

  return script;
}

/**
 * Applies per-route document metadata (title, description, canonical, Open Graph,
 * Twitter card, JSON-LD). This is a client-rendered SPA, so metadata is applied on
 * the client; the static index.html defaults to `noindex` as a safety net and the
 * `VITE_ALLOW_INDEXING` flag can force noindex for staging.
 */
export function Seo({
  title,
  description,
  canonicalPath,
  robots = 'index',
  ogType = 'website',
  ogImage,
  jsonLd,
}: SeoConfig) {
  const fullTitle = withBrandSuffix(title);
  const canonical = canonicalPath ? absoluteUrl(env.siteUrl, canonicalPath) : undefined;
  const indexable = env.allowIndexing && robots === 'index';
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : '';

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', indexable ? 'index, follow' : 'noindex, nofollow');
    upsertCanonical(canonical);

    upsertMeta('property', 'og:site_name', 'Maison Élise');
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonical);
    upsertMeta('property', 'og:type', ogType);
    upsertMeta('property', 'og:image', ogImage);

    upsertMeta('name', 'twitter:card', ogImage ? 'summary_large_image' : 'summary');
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', description);

    const script = replaceJsonLd(
      jsonLdString ? (JSON.parse(jsonLdString) as SeoConfig['jsonLd']) : undefined,
    );

    return () => {
      script?.remove();
    };
  }, [fullTitle, description, canonical, indexable, ogType, ogImage, jsonLdString]);

  return null;
}
