import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  Bookmark,
  Category,
  LibraryData,
  Preferences,
  Tag,
} from '../types';
import {
  bookmarkStorage,
  categoryStorage,
  clearAll,
  isStorageAvailable,
  preferencesStorage,
  tagStorage,
} from '../storage';
import { DEFAULT_PREFERENCES, reconcileReferences } from '../storage/validate';
import { buildSampleData } from '../storage/sampleData';
import { mergeLibraries } from '../storage/transfer';
import { createId, nowIso } from '../lib/id';
import { domainFromUrl, normaliseUrl } from '../lib/url';

export interface BookmarkDraft {
  url: string;
  title: string;
  description?: string;
  categoryId?: string;
  tagIds: string[];
  isFavorite: boolean;
}

export type ImportMode = 'merge' | 'replace';

interface LibraryContextValue extends LibraryData {
  preferences: Preferences;
  storageAvailable: boolean;
  categoryById: Map<string, Category>;
  tagById: Map<string, Tag>;

  createBookmark: (draft: BookmarkDraft) => Bookmark;
  updateBookmark: (id: string, patch: Partial<BookmarkDraft>) => void;
  deleteBookmark: (id: string) => void;
  toggleFavorite: (id: string) => void;
  recordVisit: (id: string) => void;

  addNote: (bookmarkId: string, content: string) => void;
  updateNote: (bookmarkId: string, noteId: string, content: string) => void;
  deleteNote: (bookmarkId: string, noteId: string) => void;

  createCategory: (name: string) => Category | null;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;

  createTag: (name: string) => Tag | null;
  renameTag: (id: string, name: string) => void;
  deleteTag: (id: string) => void;
  ensureTags: (names: string[]) => string[];

  setPreferences: (patch: Partial<Preferences>) => void;
  importLibrary: (data: LibraryData, mode: ImportMode) => { added: number; updated: number };
  resetLibrary: () => void;
  loadSampleData: () => void;

  findBookmarkByUrl: (url: string) => Bookmark | undefined;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function touch(bookmark: Bookmark): Bookmark {
  return { ...bookmark, updatedAt: nowIso() };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const storageAvailable = isStorageAvailable();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => bookmarkStorage.load());
  const [categories, setCategories] = useState<Category[]>(() => categoryStorage.load());
  const [tags, setTags] = useState<Tag[]>(() => tagStorage.load());
  const [preferences, setPreferencesState] = useState<Preferences>(() => preferencesStorage.load());

  useEffect(() => {
    bookmarkStorage.save(bookmarks);
  }, [bookmarks]);
  useEffect(() => {
    categoryStorage.save(categories);
  }, [categories]);
  useEffect(() => {
    tagStorage.save(tags);
  }, [tags]);
  useEffect(() => {
    preferencesStorage.save(preferences);
  }, [preferences]);

  const categoryById = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const tagById = useMemo(() => new Map(tags.map((item) => [item.id, item])), [tags]);

  const mutateBookmark = useCallback((id: string, fn: (bookmark: Bookmark) => Bookmark) => {
    setBookmarks((current) => current.map((item) => (item.id === id ? fn(item) : item)));
  }, []);

  const createBookmark = useCallback((draft: BookmarkDraft): Bookmark => {
    const url = normaliseUrl(draft.url);
    const timestamp = nowIso();
    const bookmark: Bookmark = {
      id: createId('bm'),
      url,
      title: draft.title.trim() || domainFromUrl(url) || url,
      domain: domainFromUrl(url),
      description: draft.description?.trim() || undefined,
      categoryId: draft.categoryId || undefined,
      tagIds: draft.tagIds,
      isFavorite: draft.isFavorite,
      notes: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setBookmarks((current) => [bookmark, ...current]);
    return bookmark;
  }, []);

  const updateBookmark = useCallback(
    (id: string, patch: Partial<BookmarkDraft>) => {
      mutateBookmark(id, (bookmark) => {
        const url = patch.url === undefined ? bookmark.url : normaliseUrl(patch.url);
        return touch({
          ...bookmark,
          url,
          domain: patch.url === undefined ? bookmark.domain : domainFromUrl(url),
          title: patch.title === undefined ? bookmark.title : patch.title.trim() || bookmark.title,
          description:
            patch.description === undefined ? bookmark.description : patch.description.trim() || undefined,
          categoryId: patch.categoryId === undefined ? bookmark.categoryId : patch.categoryId || undefined,
          tagIds: patch.tagIds === undefined ? bookmark.tagIds : patch.tagIds,
          isFavorite: patch.isFavorite === undefined ? bookmark.isFavorite : patch.isFavorite,
        });
      });
    },
    [mutateBookmark],
  );

  const deleteBookmark = useCallback((id: string) => {
    setBookmarks((current) => current.filter((item) => item.id !== id));
  }, []);

  const toggleFavorite = useCallback(
    (id: string) => {
      mutateBookmark(id, (bookmark) => touch({ ...bookmark, isFavorite: !bookmark.isFavorite }));
    },
    [mutateBookmark],
  );

  /** Opening a site is not an edit, so this deliberately leaves updatedAt alone. */
  const recordVisit = useCallback(
    (id: string) => {
      mutateBookmark(id, (bookmark) => ({ ...bookmark, lastVisitedAt: nowIso() }));
    },
    [mutateBookmark],
  );

  const addNote = useCallback(
    (bookmarkId: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const timestamp = nowIso();
      mutateBookmark(bookmarkId, (bookmark) =>
        touch({
          ...bookmark,
          notes: [
            { id: createId('note'), content: trimmed, createdAt: timestamp, updatedAt: timestamp },
            ...bookmark.notes,
          ],
        }),
      );
    },
    [mutateBookmark],
  );

  const updateNote = useCallback(
    (bookmarkId: string, noteId: string, content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      mutateBookmark(bookmarkId, (bookmark) =>
        touch({
          ...bookmark,
          notes: bookmark.notes.map((note) =>
            note.id === noteId ? { ...note, content: trimmed, updatedAt: nowIso() } : note,
          ),
        }),
      );
    },
    [mutateBookmark],
  );

  const deleteNote = useCallback(
    (bookmarkId: string, noteId: string) => {
      mutateBookmark(bookmarkId, (bookmark) =>
        touch({ ...bookmark, notes: bookmark.notes.filter((note) => note.id !== noteId) }),
      );
    },
    [mutateBookmark],
  );

  const createCategory = useCallback((name: string): Category | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const timestamp = nowIso();
    const category: Category = { id: createId('cat'), name: trimmed, createdAt: timestamp, updatedAt: timestamp };
    let created: Category | null = null;
    setCategories((current) => {
      const existing = current.find((item) => item.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        created = existing;
        return current;
      }
      created = category;
      return [...current, category];
    });
    return created ?? category;
  }, []);

  const renameCategory = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((current) =>
      current.map((item) => (item.id === id ? { ...item, name: trimmed, updatedAt: nowIso() } : item)),
    );
  }, []);

  /** Cascade deletes clear the reference but leave updatedAt alone, so the
   *  whole library does not jump to the top of Recently updated. */
  const deleteCategory = useCallback((id: string) => {
    setCategories((current) => current.filter((item) => item.id !== id));
    setBookmarks((current) =>
      current.map((item) => (item.categoryId === id ? { ...item, categoryId: undefined } : item)),
    );
  }, []);

  const createTag = useCallback((name: string): Tag | null => {
    const trimmed = name.trim().replace(/^#/, '');
    if (!trimmed) return null;
    const timestamp = nowIso();
    const tag: Tag = { id: createId('tag'), name: trimmed, createdAt: timestamp, updatedAt: timestamp };
    let created: Tag | null = null;
    setTags((current) => {
      const existing = current.find((item) => item.name.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        created = existing;
        return current;
      }
      created = tag;
      return [...current, tag];
    });
    return created ?? tag;
  }, []);

  const renameTag = useCallback((id: string, name: string) => {
    const trimmed = name.trim().replace(/^#/, '');
    if (!trimmed) return;
    setTags((current) =>
      current.map((item) => (item.id === id ? { ...item, name: trimmed, updatedAt: nowIso() } : item)),
    );
  }, []);

  const deleteTag = useCallback((id: string) => {
    setTags((current) => current.filter((item) => item.id !== id));
    setBookmarks((current) =>
      current.map((item) =>
        item.tagIds.includes(id) ? { ...item, tagIds: item.tagIds.filter((tagId) => tagId !== id) } : item,
      ),
    );
  }, []);

  /**
   * Resolve tag names typed into the add/edit form, creating the ones that do
   * not exist yet. Returns ids in the order they were given.
   */
  const ensureTags = useCallback((names: string[]): string[] => {
    const cleaned = names.map((name) => name.trim().replace(/^#/, '')).filter(Boolean);
    if (cleaned.length === 0) return [];

    const ids: string[] = [];
    setTags((current) => {
      const next = [...current];
      const byName = new Map(next.map((item) => [item.name.toLowerCase(), item]));
      for (const name of cleaned) {
        const key = name.toLowerCase();
        const existing = byName.get(key);
        if (existing) {
          if (!ids.includes(existing.id)) ids.push(existing.id);
          continue;
        }
        const timestamp = nowIso();
        const tag: Tag = { id: createId('tag'), name, createdAt: timestamp, updatedAt: timestamp };
        next.push(tag);
        byName.set(key, tag);
        ids.push(tag.id);
      }
      return next;
    });
    return ids;
  }, []);

  const setPreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferencesState((current) => ({ ...current, ...patch }));
  }, []);

  const importLibrary = useCallback(
    (data: LibraryData, mode: ImportMode) => {
      if (mode === 'replace') {
        const reconciled = reconcileReferences(data.bookmarks, data.categories, data.tags);
        setBookmarks(reconciled);
        setCategories(data.categories);
        setTags(data.tags);
        return { added: reconciled.length, updated: 0 };
      }
      const result = mergeLibraries({ bookmarks, categories, tags }, data);
      setBookmarks(reconcileReferences(result.bookmarks, result.categories, result.tags));
      setCategories(result.categories);
      setTags(result.tags);
      return { added: result.added, updated: result.updated };
    },
    [bookmarks, categories, tags],
  );

  const resetLibrary = useCallback(() => {
    clearAll();
    setBookmarks([]);
    setCategories([]);
    setTags([]);
    setPreferencesState({ ...DEFAULT_PREFERENCES });
  }, []);

  const loadSampleData = useCallback(() => {
    const sample = buildSampleData();
    const result = mergeLibraries({ bookmarks, categories, tags }, sample);
    setBookmarks(result.bookmarks);
    setCategories(result.categories);
    setTags(result.tags);
  }, [bookmarks, categories, tags]);

  const findBookmarkByUrl = useCallback(
    (url: string) => {
      const target = normaliseUrl(url).toLowerCase().replace(/\/$/, '');
      return bookmarks.find((item) => item.url.toLowerCase().replace(/\/$/, '') === target);
    },
    [bookmarks],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      bookmarks,
      categories,
      tags,
      preferences,
      storageAvailable,
      categoryById,
      tagById,
      createBookmark,
      updateBookmark,
      deleteBookmark,
      toggleFavorite,
      recordVisit,
      addNote,
      updateNote,
      deleteNote,
      createCategory,
      renameCategory,
      deleteCategory,
      createTag,
      renameTag,
      deleteTag,
      ensureTags,
      setPreferences,
      importLibrary,
      resetLibrary,
      loadSampleData,
      findBookmarkByUrl,
    }),
    [
      bookmarks,
      categories,
      tags,
      preferences,
      storageAvailable,
      categoryById,
      tagById,
      createBookmark,
      updateBookmark,
      deleteBookmark,
      toggleFavorite,
      recordVisit,
      addNote,
      updateNote,
      deleteNote,
      createCategory,
      renameCategory,
      deleteCategory,
      createTag,
      renameTag,
      deleteTag,
      ensureTags,
      setPreferences,
      importLibrary,
      resetLibrary,
      loadSampleData,
      findBookmarkByUrl,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used inside LibraryProvider');
  return context;
}
