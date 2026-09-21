import type { SearchEngineId } from './lib/searchEngines';

export interface BookmarkNote {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  domain: string;
  description?: string;
  categoryId?: string;
  tagIds: string[];
  isFavorite: boolean;
  notes: BookmarkNote[];
  createdAt: string;
  updatedAt: string;
  lastVisitedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'list' | 'grid';

export type SortKey =
  | 'updated'
  | 'added'
  | 'visited'
  | 'alpha'
  | 'alphaReverse'
  | 'notes';

export type ThemeChoice = 'system' | 'light' | 'dark';

export type OpenLinksIn = 'newTab' | 'sameTab' | 'systemBrowser';

export type { SearchEngineId } from './lib/searchEngines';

export interface Preferences {
  theme: ThemeChoice;
  openLinksIn: OpenLinksIn;
  searchEngine: SearchEngineId;
  viewMode: ViewMode;
  sortKey: SortKey;
  loadRemoteFavicons: boolean;
  lastWebUrl: string;
}

export interface LibraryData {
  bookmarks: Bookmark[];
  categories: Category[];
  tags: Tag[];
}

/** Shape written to disk by the export action. */
export interface LibraryExport extends LibraryData {
  version: number;
  exportedAt: string;
}

export interface Filters {
  query: string;
  categoryId: string | null;
  tagIds: string[];
  favoritesOnly: boolean;
  hasNotes: boolean;
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  categoryId: null,
  tagIds: [],
  favoritesOnly: false,
  hasNotes: false,
};
