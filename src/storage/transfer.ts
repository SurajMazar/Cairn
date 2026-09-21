/**
 * Import and export. Imported files are treated as untrusted input: every
 * record is re-normalised, ids are remapped when they would collide, and the
 * user chooses between merging and replacing before anything is written.
 */
import type { Bookmark, Category, LibraryData, LibraryExport, Tag } from '../types';
import { STORAGE_VERSION } from './core';
import { normaliseBookmarks, normaliseCategories, normaliseTags } from './validate';
import { createId, nowIso } from '../lib/id';

export interface ImportReport {
  ok: boolean;
  error?: string;
  data?: LibraryData;
  warnings: string[];
  counts: { bookmarks: number; categories: number; tags: number; notes: number };
}

export function buildExport(data: LibraryData): LibraryExport {
  return {
    version: STORAGE_VERSION,
    exportedAt: nowIso(),
    bookmarks: data.bookmarks,
    categories: data.categories,
    tags: data.tags,
  };
}

export function exportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `cairn-${stamp}.json`;
}

export function parseImport(text: string): ImportReport {
  const empty = { bookmarks: 0, categories: 0, tags: 0, notes: 0 };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That file is not valid JSON.', warnings: [], counts: empty };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'The file does not look like a library export.', warnings: [], counts: empty };
  }

  const record = parsed as Record<string, unknown>;
  const warnings: string[] = [];

  if (typeof record.version !== 'number') {
    warnings.push('No version field was present. The file was read as the current format.');
  } else if (record.version > STORAGE_VERSION) {
    return {
      ok: false,
      error: `This file was written by a newer version (v${record.version}). This app reads up to v${STORAGE_VERSION}.`,
      warnings,
      counts: empty,
    };
  }

  if (!Array.isArray(record.bookmarks)) {
    return { ok: false, error: 'The file contains no bookmarks array.', warnings, counts: empty };
  }

  const rawBookmarkCount = record.bookmarks.length;
  const categories = normaliseCategories(record.categories);
  const tags = normaliseTags(record.tags);
  const bookmarks = normaliseBookmarks(record.bookmarks);

  if (bookmarks.length < rawBookmarkCount) {
    warnings.push(`${rawBookmarkCount - bookmarks.length} bookmark entries were skipped because required fields were missing.`);
  }
  if (record.categories !== undefined && !Array.isArray(record.categories)) {
    warnings.push('The categories field was not a list and was ignored.');
  }
  if (record.tags !== undefined && !Array.isArray(record.tags)) {
    warnings.push('The tags field was not a list and was ignored.');
  }

  const knownCategories = new Set(categories.map((item) => item.id));
  const knownTags = new Set(tags.map((item) => item.id));
  let danglingCategories = 0;
  let danglingTags = 0;

  const cleaned = bookmarks.map((bookmark) => {
    const keepCategory = bookmark.categoryId && knownCategories.has(bookmark.categoryId);
    if (bookmark.categoryId && !keepCategory) danglingCategories += 1;
    const keptTags = bookmark.tagIds.filter((id) => knownTags.has(id));
    danglingTags += bookmark.tagIds.length - keptTags.length;
    return {
      ...bookmark,
      categoryId: keepCategory ? bookmark.categoryId : undefined,
      tagIds: keptTags,
    };
  });

  if (danglingCategories > 0) {
    warnings.push(`${danglingCategories} bookmarks referenced a category that was not in the file. The category was cleared.`);
  }
  if (danglingTags > 0) {
    warnings.push(`${danglingTags} tag references pointed at tags that were not in the file and were dropped.`);
  }

  return {
    ok: true,
    data: { bookmarks: cleaned, categories, tags },
    warnings,
    counts: {
      bookmarks: cleaned.length,
      categories: categories.length,
      tags: tags.length,
      notes: cleaned.reduce((total, bookmark) => total + bookmark.notes.length, 0),
    },
  };
}

interface NamedRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** Match by name so a merge does not create "Design" twice. */
function mergeNamed<T extends NamedRecord>(current: T[], incoming: T[]): { merged: T[]; idMap: Map<string, string> } {
  const merged = [...current];
  const idMap = new Map<string, string>();
  const byName = new Map(current.map((item) => [item.name.trim().toLowerCase(), item]));
  const usedIds = new Set(current.map((item) => item.id));

  for (const item of incoming) {
    const key = item.name.trim().toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      idMap.set(item.id, existing.id);
      continue;
    }
    const id = usedIds.has(item.id) ? createId(item.id.split('_')[0] || 'item') : item.id;
    const next = { ...item, id } as T;
    usedIds.add(id);
    byName.set(key, next);
    idMap.set(item.id, id);
    merged.push(next);
  }

  return { merged, idMap };
}

export interface MergeResult extends LibraryData {
  added: number;
  updated: number;
}

/**
 * Merge keeps whichever copy of a bookmark was modified most recently, and
 * unions their notes so annotations are never silently lost.
 */
export function mergeLibraries(current: LibraryData, incoming: LibraryData): MergeResult {
  const categoryMerge = mergeNamed(current.categories, incoming.categories);
  const tagMerge = mergeNamed(current.tags, incoming.tags);

  const byId = new Map(current.bookmarks.map((item) => [item.id, item]));
  const byUrl = new Map(current.bookmarks.map((item) => [item.url.toLowerCase(), item]));
  const result: Bookmark[] = [...current.bookmarks];
  let added = 0;
  let updated = 0;

  for (const raw of incoming.bookmarks) {
    const remapped: Bookmark = {
      ...raw,
      categoryId: raw.categoryId ? categoryMerge.idMap.get(raw.categoryId) ?? raw.categoryId : undefined,
      tagIds: raw.tagIds.map((id) => tagMerge.idMap.get(id) ?? id),
    };

    const existing = byId.get(raw.id) ?? byUrl.get(raw.url.toLowerCase());
    if (!existing) {
      result.push(remapped);
      byId.set(remapped.id, remapped);
      byUrl.set(remapped.url.toLowerCase(), remapped);
      added += 1;
      continue;
    }

    const incomingIsNewer = new Date(remapped.updatedAt).getTime() > new Date(existing.updatedAt).getTime();
    const noteIds = new Set(existing.notes.map((note) => note.id));
    const mergedNotes = [...existing.notes, ...remapped.notes.filter((note) => !noteIds.has(note.id))];

    const winner = incomingIsNewer ? remapped : existing;
    const next: Bookmark = {
      ...winner,
      id: existing.id,
      notes: mergedNotes.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      isFavorite: existing.isFavorite || remapped.isFavorite,
      tagIds: Array.from(new Set([...existing.tagIds, ...remapped.tagIds])),
      createdAt:
        new Date(existing.createdAt).getTime() <= new Date(remapped.createdAt).getTime()
          ? existing.createdAt
          : remapped.createdAt,
      updatedAt: incomingIsNewer ? remapped.updatedAt : existing.updatedAt,
    };

    const index = result.findIndex((item) => item.id === existing.id);
    if (index >= 0) result[index] = next;
    byId.set(next.id, next);
    byUrl.set(next.url.toLowerCase(), next);
    if (incomingIsNewer || mergedNotes.length !== existing.notes.length) updated += 1;
  }

  return {
    bookmarks: result,
    categories: categoryMerge.merged as Category[],
    tags: tagMerge.merged as Tag[],
    added,
    updated,
  };
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
