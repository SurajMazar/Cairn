import type { Bookmark, Category, Filters, SortKey, Tag } from '../types';

export type MatchField = 'title' | 'url' | 'description' | 'category' | 'tags' | 'notes';

export interface SearchableBookmark {
  bookmark: Bookmark;
  haystack: Record<MatchField, string>;
}

export interface SearchResult {
  bookmark: Bookmark;
  matchedFields: MatchField[];
}

export function buildSearchable(
  bookmarks: Bookmark[],
  categories: Category[],
  tags: Tag[],
): SearchableBookmark[] {
  const categoryNames = new Map(categories.map((item) => [item.id, item.name.toLowerCase()]));
  const tagNames = new Map(tags.map((item) => [item.id, item.name.toLowerCase()]));

  return bookmarks.map((bookmark) => ({
    bookmark,
    haystack: {
      title: bookmark.title.toLowerCase(),
      url: `${bookmark.url} ${bookmark.domain}`.toLowerCase(),
      description: (bookmark.description ?? '').toLowerCase(),
      category: bookmark.categoryId ? categoryNames.get(bookmark.categoryId) ?? '' : '',
      tags: bookmark.tagIds.map((id) => tagNames.get(id) ?? '').join(' '),
      notes: bookmark.notes.map((note) => note.content).join(' \n ').toLowerCase(),
    },
  }));
}

const FIELDS: MatchField[] = ['title', 'url', 'description', 'category', 'tags', 'notes'];

/**
 * Every term has to match somewhere, but not necessarily in the same field, so
 * "react memoization" finds a React bookmark annotated with a note about
 * memoization.
 */
export function searchBookmarks(items: SearchableBookmark[], query: string): SearchResult[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return items.map((item) => ({ bookmark: item.bookmark, matchedFields: [] }));
  }

  const results: SearchResult[] = [];
  for (const item of items) {
    const matched = new Set<MatchField>();
    const allTermsMatch = terms.every((term) => {
      let found = false;
      for (const field of FIELDS) {
        if (item.haystack[field].includes(term)) {
          matched.add(field);
          found = true;
        }
      }
      return found;
    });
    if (allTermsMatch) {
      results.push({ bookmark: item.bookmark, matchedFields: FIELDS.filter((field) => matched.has(field)) });
    }
  }
  return results;
}

export function applyFilters(results: SearchResult[], filters: Filters): SearchResult[] {
  return results.filter(({ bookmark }) => {
    if (filters.favoritesOnly && !bookmark.isFavorite) return false;
    if (filters.hasNotes && bookmark.notes.length === 0) return false;
    if (filters.categoryId && bookmark.categoryId !== filters.categoryId) return false;
    if (filters.tagIds.length > 0) {
      const has = filters.tagIds.every((id) => bookmark.tagIds.includes(id));
      if (!has) return false;
    }
    return true;
  });
}

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.categoryId !== null ||
    filters.tagIds.length > 0 ||
    filters.favoritesOnly ||
    filters.hasNotes
  );
}

export const SORT_LABELS: Record<SortKey, string> = {
  updated: 'Recently updated',
  added: 'Recently added',
  visited: 'Recently visited',
  alpha: 'Alphabetical',
  alphaReverse: 'Reverse alphabetical',
  notes: 'Most notes',
};

export const MATCH_FIELD_LABELS: Record<MatchField, string> = {
  title: 'Title',
  url: 'Domain',
  description: 'Description',
  category: 'Category',
  tags: 'Tags',
  notes: 'Notes',
};
