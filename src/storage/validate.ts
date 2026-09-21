/**
 * Normalisers turn unknown input (stored JSON, imported files, hand-edited
 * localStorage) into valid records. Anything that cannot be repaired is
 * dropped rather than allowed to crash a render.
 */
import type {
  Bookmark,
  BookmarkNote,
  Category,
  Tag,
  Preferences,
  SortKey,
  ThemeChoice,
  ViewMode,
} from '../types';
import { createId, nowIso } from '../lib/id';
import { domainFromUrl, normaliseUrl } from '../lib/url';

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asIso(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  if (typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0)));
}

export function normaliseNote(raw: unknown): BookmarkNote | null {
  if (!isDict(raw)) return null;
  const content = asString(raw.content).trim();
  if (!content) return null;
  const createdAt = asIso(raw.createdAt, nowIso());
  return {
    id: asString(raw.id) || createId('note'),
    content,
    createdAt,
    updatedAt: asIso(raw.updatedAt, createdAt),
  };
}

export function normaliseBookmark(raw: unknown): Bookmark | null {
  if (!isDict(raw)) return null;
  const url = normaliseUrl(asString(raw.url));
  if (!url) return null;

  const domain = asString(raw.domain) || domainFromUrl(url);
  const createdAt = asIso(raw.createdAt, nowIso());
  const notes = Array.isArray(raw.notes)
    ? raw.notes.map(normaliseNote).filter((note): note is BookmarkNote => note !== null)
    : [];

  const bookmark: Bookmark = {
    id: asString(raw.id) || createId('bm'),
    url,
    title: asString(raw.title).trim() || domain || url,
    domain,
    description: asString(raw.description).trim() || undefined,
    categoryId: asString(raw.categoryId) || undefined,
    tagIds: asStringArray(raw.tagIds),
    isFavorite: raw.isFavorite === true,
    notes,
    createdAt,
    updatedAt: asIso(raw.updatedAt, createdAt),
  };

  if (typeof raw.lastVisitedAt === 'string' || typeof raw.lastVisitedAt === 'number') {
    bookmark.lastVisitedAt = asIso(raw.lastVisitedAt, createdAt);
  }
  return bookmark;
}

function normaliseNamed(raw: unknown, prefix: string): Category | null {
  if (!isDict(raw)) return null;
  const name = asString(raw.name).trim();
  if (!name) return null;
  const createdAt = asIso(raw.createdAt, nowIso());
  return {
    id: asString(raw.id) || createId(prefix),
    name,
    createdAt,
    updatedAt: asIso(raw.updatedAt, createdAt),
  };
}

export const normaliseCategory = (raw: unknown): Category | null => normaliseNamed(raw, 'cat');
export const normaliseTag = (raw: unknown): Tag | null => normaliseNamed(raw, 'tag');

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

export function normaliseBookmarks(raw: unknown): Bookmark[] {
  if (!Array.isArray(raw)) return [];
  return dedupeById(raw.map(normaliseBookmark).filter((item): item is Bookmark => item !== null));
}

export function normaliseCategories(raw: unknown): Category[] {
  if (!Array.isArray(raw)) return [];
  return dedupeById(raw.map(normaliseCategory).filter((item): item is Category => item !== null));
}

export function normaliseTags(raw: unknown): Tag[] {
  if (!Array.isArray(raw)) return [];
  return dedupeById(raw.map(normaliseTag).filter((item): item is Tag => item !== null));
}

const THEMES: ThemeChoice[] = ['system', 'light', 'dark'];
const VIEW_MODES: ViewMode[] = ['list', 'grid'];
const SORT_KEYS: SortKey[] = ['updated', 'added', 'visited', 'alpha', 'alphaReverse', 'notes'];

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'system',
  viewMode: 'list',
  sortKey: 'updated',
  loadRemoteFavicons: false,
  lastWebUrl: '',
};

export function normalisePreferences(raw: unknown): Preferences {
  if (!isDict(raw)) return { ...DEFAULT_PREFERENCES };
  const viewMode = VIEW_MODES.includes(raw.viewMode as ViewMode)
    ? (raw.viewMode as ViewMode)
    : DEFAULT_PREFERENCES.viewMode;
  const sortKey = SORT_KEYS.includes(raw.sortKey as SortKey)
    ? (raw.sortKey as SortKey)
    : DEFAULT_PREFERENCES.sortKey;
  return {
    theme: THEMES.includes(raw.theme as ThemeChoice) ? (raw.theme as ThemeChoice) : DEFAULT_PREFERENCES.theme,
    viewMode,
    sortKey,
    loadRemoteFavicons: raw.loadRemoteFavicons === true,
    lastWebUrl: asString(raw.lastWebUrl),
  };
}

/**
 * Drop references to categories and tags that no longer exist, so a deleted
 * category can never leave a bookmark pointing at nothing.
 */
export function reconcileReferences(
  bookmarks: Bookmark[],
  categories: Category[],
  tags: Tag[],
): Bookmark[] {
  const categoryIds = new Set(categories.map((item) => item.id));
  const tagIds = new Set(tags.map((item) => item.id));
  let changed = false;

  const next = bookmarks.map((bookmark) => {
    const keepCategory = bookmark.categoryId && categoryIds.has(bookmark.categoryId);
    const keptTags = bookmark.tagIds.filter((id) => tagIds.has(id));
    if (keepCategory === Boolean(bookmark.categoryId) && keptTags.length === bookmark.tagIds.length) {
      return bookmark;
    }
    changed = true;
    return {
      ...bookmark,
      categoryId: keepCategory ? bookmark.categoryId : undefined,
      tagIds: keptTags,
    };
  });

  return changed ? next : bookmarks;
}
