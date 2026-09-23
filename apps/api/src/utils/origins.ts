import { env } from '../config/env.js';

/** Configured storefront/admin origins (comma-separated values supported). */
export function configuredOrigins(): string[] {
  return [env.clientUrl, env.adminUrl]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(','))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function originOf(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * True when an Origin/Referer value is an explicitly configured storefront or
 * admin origin. In development, localhost origins are also accepted so the Vite
 * dev servers keep working without extra configuration.
 */
export function isAllowedOrigin(origin: string): boolean {
  if (configuredOrigins().includes(origin)) {
    return true;
  }

  if (!env.isProduction) {
    const parsed = originOf(origin);

    if (parsed) {
      const { hostname } = new URL(parsed);

      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return true;
      }
    }
  }

  return false;
}
