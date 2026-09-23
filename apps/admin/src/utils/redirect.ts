export function getSafeRedirect(value: string | null, fallback = '/'): string {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}
