const STORAGE_PREFIX = 'maison-elise';

function withPrefix(key: string): string {
  return `${STORAGE_PREFIX}:${key}`;
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(withPrefix(key));

    if (raw === null) {
      return fallback;
    }

    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(withPrefix(key), JSON.stringify(value));
  } catch {
    // Storage can be unavailable (private mode, quota). Fail silently.
  }
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(withPrefix(key));
  } catch {
    // Ignore storage errors.
  }
}
