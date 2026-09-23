interface AppEnv {
  apiUrl: string;
  isDevelopment: boolean;
  /** Absolute public origin of the storefront, used for canonical/OG URLs. */
  siteUrl: string;
  /** Global indexing kill switch (set VITE_ALLOW_INDEXING=false for staging). */
  allowIndexing: boolean;
}

const apiUrl = import.meta.env.VITE_API_URL ?? '/api/v1';

const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');
const siteUrl =
  configuredSiteUrl && configuredSiteUrl.length > 0
    ? configuredSiteUrl
    : typeof window !== 'undefined'
      ? window.location.origin
      : '';

export const env: AppEnv = {
  apiUrl,
  isDevelopment: import.meta.env.DEV,
  siteUrl,
  allowIndexing: import.meta.env.VITE_ALLOW_INDEXING !== 'false',
};
