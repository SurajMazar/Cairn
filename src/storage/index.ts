import type { Bookmark, Category, Preferences, Tag } from '../types';
import { StorageKeys, readKey, writeKey, clearAll, isStorageAvailable } from './core';
import {
  normaliseBookmarks,
  normaliseCategories,
  normalisePreferences,
  normaliseTags,
} from './validate';

export const bookmarkStorage = {
  load: (): Bookmark[] => readKey(StorageKeys.bookmarks, normaliseBookmarks),
  save: (bookmarks: Bookmark[]): boolean => writeKey(StorageKeys.bookmarks, bookmarks),
};

export const categoryStorage = {
  load: (): Category[] => readKey(StorageKeys.categories, normaliseCategories),
  save: (categories: Category[]): boolean => writeKey(StorageKeys.categories, categories),
};

export const tagStorage = {
  load: (): Tag[] => readKey(StorageKeys.tags, normaliseTags),
  save: (tags: Tag[]): boolean => writeKey(StorageKeys.tags, tags),
};

export const preferencesStorage = {
  load: (): Preferences => readKey(StorageKeys.preferences, normalisePreferences),
  save: (preferences: Preferences): boolean => writeKey(StorageKeys.preferences, preferences),
};

/**
 * Sample data is written once. If the user empties their library we must not
 * helpfully refill it, so the flag survives independently of the data itself.
 */
export const seedFlag = {
  isSeeded: (): boolean => readKey(StorageKeys.seeded, (raw) => raw === true),
  mark: (): void => {
    writeKey(StorageKeys.seeded, true);
  },
};

export { clearAll, isStorageAvailable, StorageKeys };
export { STORAGE_VERSION } from './core';
