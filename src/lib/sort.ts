import type { Bookmark, SortKey } from '../types';

const time = (iso?: string): number => {
  if (!iso) return 0;
  const value = new Date(iso).getTime();
  return Number.isNaN(value) ? 0 : value;
};

const byTitle = (a: Bookmark, b: Bookmark): number =>
  a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });

const COMPARATORS: Record<SortKey, (a: Bookmark, b: Bookmark) => number> = {
  updated: (a, b) => time(b.updatedAt) - time(a.updatedAt),
  added: (a, b) => time(b.createdAt) - time(a.createdAt),
  visited: (a, b) => time(b.lastVisitedAt) - time(a.lastVisitedAt) || time(b.updatedAt) - time(a.updatedAt),
  alpha: byTitle,
  alphaReverse: (a, b) => byTitle(b, a),
  notes: (a, b) => b.notes.length - a.notes.length || time(b.updatedAt) - time(a.updatedAt),
};

/**
 * Sorting is a presentation concern: this always returns a new array and never
 * reorders the stored collection.
 */
export function sortBookmarks(bookmarks: readonly Bookmark[], key: SortKey): Bookmark[] {
  return [...bookmarks].sort(COMPARATORS[key] ?? COMPARATORS.updated);
}
