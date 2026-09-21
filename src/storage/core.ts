/**
 * Low level persistence helpers.
 *
 * Every value written by the app goes through this module so that versioning,
 * corrupted data and unavailable storage are handled in exactly one place.
 * Nothing else in the codebase should touch `localStorage` directly.
 */

export const STORAGE_VERSION = 1;

/**
 * The `weblibrary.` prefix predates the Cairn name and is deliberately frozen:
 * renaming these keys would orphan every library already saved in a browser.
 */
export const StorageKeys = {
  bookmarks: 'weblibrary.bookmarks',
  categories: 'weblibrary.categories',
  tags: 'weblibrary.tags',
  preferences: 'weblibrary.preferences',
  /* Written by older versions that seeded sample data on first run. Nothing
     reads it now; it stays listed so clearAll still removes it. */
  seeded: 'weblibrary.seeded',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

interface Envelope<T> {
  version: number;
  data: T;
}

let storageAvailable: boolean | null = null;

/** Private browsing and locked-down browsers can throw on access. */
export function isStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const probe = '__weblibrary_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

function isEnvelope(value: unknown): value is Envelope<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'version' in value &&
    'data' in value &&
    typeof (value as Envelope<unknown>).version === 'number'
  );
}

/**
 * Bring a stored payload up to the current version. Older releases only ever
 * wrote version 1, so this is a pass-through today; the switch exists so future
 * shape changes have an obvious home.
 */
function migrate<T>(envelope: Envelope<unknown>): unknown {
  let { version, data } = envelope;
  while (version < STORAGE_VERSION) {
    switch (version) {
      default:
        version = STORAGE_VERSION;
    }
  }
  return data as T;
}

/**
 * Read a key and hand the raw payload to `normalise`, which is responsible for
 * turning anything at all (including `undefined` and hostile input) into a
 * valid value. Any failure falls back to the normalised empty state instead of
 * breaking the app.
 */
export function readKey<T>(key: StorageKey, normalise: (raw: unknown) => T): T {
  if (!isStorageAvailable()) return normalise(undefined);
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return normalise(undefined);
  }
  if (raw === null) return normalise(undefined);

  try {
    const parsed: unknown = JSON.parse(raw);
    const payload = isEnvelope(parsed) ? migrate(parsed) : parsed;
    return normalise(payload);
  } catch {
    // Corrupted JSON: keep a copy for the curious, then start clean.
    try {
      window.localStorage.setItem(`${key}.corrupt`, raw);
      window.localStorage.removeItem(key);
    } catch {
      /* nothing else to do */
    }
    return normalise(undefined);
  }
}

export function writeKey<T>(key: StorageKey, data: T): boolean {
  if (!isStorageAvailable()) return false;
  try {
    const envelope: Envelope<T> = { version: STORAGE_VERSION, data };
    window.localStorage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: StorageKey): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function clearAll(): void {
  Object.values(StorageKeys).forEach((key) => removeKey(key));
}
