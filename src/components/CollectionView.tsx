import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Bookmark, Filters, SortKey } from '../types';
import { EMPTY_FILTERS } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { applyFilters, buildSearchable, hasActiveFilters, searchBookmarks, SORT_LABELS } from '../lib/search';
import type { MatchField } from '../lib/search';
import { sortBookmarks } from '../lib/sort';
import { SEARCH_ENGINES, openSearch } from '../lib/searchEngines';
import { BookmarkRow } from './BookmarkRow';
import { BookmarkTile } from './BookmarkTile';
import { NoteEditorDialog } from './NoteEditorDialog';
import { EmptyState } from './EmptyState';
import { Icon } from './Icon';
import styles from './collection.module.css';
import bookmarkStyles from './bookmarks.module.css';
import ui from '../styles/ui.module.css';

interface CollectionViewProps {
  bookmarks: Bookmark[];
  /** Views such as Recently visited pin their order and hide the sort control. */
  fixedSort?: SortKey;
  fixedSortNote?: string;
  lockedCategoryId?: string;
  lockedTagId?: string;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: ReactNode;
  searchPlaceholder?: string;
  /** Seeds the search box, so a search started on Home carries over. */
  initialQuery?: string;
}

const SORT_OPTIONS = Object.keys(SORT_LABELS) as SortKey[];

export function CollectionView({
  bookmarks,
  fixedSort,
  fixedSortNote,
  lockedCategoryId,
  lockedTagId,
  emptyTitle,
  emptyBody,
  emptyAction,
  searchPlaceholder = 'Search your collection...',
  initialQuery = '',
}: CollectionViewProps) {
  const { categories, tags, preferences, setPreferences, addNote } = useLibrary();
  const engine = SEARCH_ENGINES[preferences.searchEngine] ?? SEARCH_ENGINES.google;
  const { notify } = useUi();

  const [filters, setFilters] = useState<Filters>({ ...EMPTY_FILTERS, query: initialQuery });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [noteTarget, setNoteTarget] = useState<Bookmark | null>(null);

  useEffect(() => {
    setFilters((current) => (current.query === initialQuery ? current : { ...current, query: initialQuery }));
    // Only react to a new query arriving from outside, not to local typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  const sortKey = fixedSort ?? preferences.sortKey;

  const searchable = useMemo(
    () => buildSearchable(bookmarks, categories, tags),
    [bookmarks, categories, tags],
  );

  const { ordered, matchesById, total } = useMemo(() => {
    const found = searchBookmarks(searchable, filters.query);
    const filtered = applyFilters(found, filters);
    const matches = new Map<string, MatchField[]>();
    filtered.forEach((result) => matches.set(result.bookmark.id, result.matchedFields));
    return {
      ordered: sortBookmarks(
        filtered.map((result) => result.bookmark),
        sortKey,
      ),
      matchesById: matches,
      total: filtered.length,
    };
  }, [searchable, filters, sortKey]);

  // Only offer filters for taxonomy that actually appears in this scope.
  const scopedCategories = useMemo(() => {
    const present = new Set(bookmarks.map((bookmark) => bookmark.categoryId).filter(Boolean));
    return categories.filter((category) => present.has(category.id));
  }, [bookmarks, categories]);

  const scopedTags = useMemo(() => {
    const present = new Set(bookmarks.flatMap((bookmark) => bookmark.tagIds));
    return tags.filter((tag) => present.has(tag.id));
  }, [bookmarks, tags]);

  const activeCount =
    (filters.categoryId ? 1 : 0) +
    filters.tagIds.length +
    (filters.favoritesOnly ? 1 : 0) +
    (filters.hasNotes ? 1 : 0);

  const toggleTag = (id: string) => {
    setFilters((current) => ({
      ...current,
      tagIds: current.tagIds.includes(id)
        ? current.tagIds.filter((tagId) => tagId !== id)
        : [...current.tagIds, id],
    }));
  };

  const showCategoryFilter = !lockedCategoryId && scopedCategories.length > 1;
  const showTagFilter = scopedTags.filter((tag) => tag.id !== lockedTagId).length > 0;
  const nothingHere = bookmarks.length === 0;

  return (
    <section>
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <Icon name="search" />
          </span>
          <input
            type="search"
            className={styles.searchInput}
            value={filters.query}
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            placeholder={searchPlaceholder}
            aria-label="Search your collection"
          />
          {filters.query ? (
            <button
              type="button"
              className={`${ui.iconBtn} ${styles.searchClear}`}
              onClick={() => setFilters((current) => ({ ...current, query: '' }))}
              aria-label="Clear search"
            >
              <Icon name="close" />
            </button>
          ) : null}
        </div>

        <div className={styles.controls}>
          <span className={styles.resultCount}>
            {total} {total === 1 ? 'result' : 'results'}
            {filters.query ? ` for "${filters.query}"` : ''}
          </span>

          {showCategoryFilter || showTagFilter ? (
            <button
              type="button"
              className={ui.btn}
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
            >
              Filters
              {activeCount > 0 ? <span className={styles.badge}>{activeCount}</span> : null}
              <Icon name="chevronDown" size={13} />
            </button>
          ) : null}

          {fixedSort ? null : (
            <label>
              <span className="srOnly">Sort by</span>
              <select
                className={ui.select}
                style={{ width: 'auto' }}
                value={preferences.sortKey}
                onChange={(event) => setPreferences({ sortKey: event.target.value as SortKey })}
              >
                {SORT_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {SORT_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className={styles.viewToggle} role="group" aria-label="Layout">
            <button
              type="button"
              className={`${styles.viewButton} ${preferences.viewMode === 'list' ? styles.viewButtonOn : ''}`}
              onClick={() => setPreferences({ viewMode: 'list' })}
              aria-pressed={preferences.viewMode === 'list'}
              aria-label="List view"
              title="List view"
            >
              <Icon name="list" />
            </button>
            <button
              type="button"
              className={`${styles.viewButton} ${preferences.viewMode === 'grid' ? styles.viewButtonOn : ''}`}
              onClick={() => setPreferences({ viewMode: 'grid' })}
              aria-pressed={preferences.viewMode === 'grid'}
              aria-label="Grid view"
              title="Grid view"
            >
              <Icon name="grid" />
            </button>
          </div>
        </div>

        {filtersOpen ? (
          <div className={styles.filters}>
            {showCategoryFilter ? (
              <div className={styles.filterGroup}>
                <span className={ui.label}>Category</span>
                <select
                  className={ui.select}
                  style={{ width: 'auto', minWidth: '12rem' }}
                  value={filters.categoryId ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, categoryId: event.target.value || null }))
                  }
                  aria-label="Filter by category"
                >
                  <option value="">Any category</option>
                  {scopedCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {showTagFilter ? (
              <div className={styles.filterGroup}>
                <span className={ui.label}>Tags</span>
                <div className={styles.tagStrip}>
                  {scopedTags.map((tag) => {
                    const on = filters.tagIds.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`${ui.chip} ${on ? ui.chipOn : ''}`}
                        onClick={() => toggleTag(tag.id)}
                        aria-pressed={on}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
                <p className={ui.hint}>Selecting several tags shows websites that carry all of them.</p>
              </div>
            ) : null}

            <div className={styles.filterRow}>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnSmall} ${filters.favoritesOnly ? ui.btnPrimary : ''}`}
                onClick={() => setFilters((current) => ({ ...current, favoritesOnly: !current.favoritesOnly }))}
                aria-pressed={filters.favoritesOnly}
              >
                Favorites only
              </button>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnSmall} ${filters.hasNotes ? ui.btnPrimary : ''}`}
                onClick={() => setFilters((current) => ({ ...current, hasNotes: !current.hasNotes }))}
                aria-pressed={filters.hasNotes}
              >
                Has notes
              </button>
            </div>
          </div>
        ) : null}

        {hasActiveFilters(filters) ? (
          <div className={styles.activeSummary}>
            <span>Filtered view.</span>
            <button type="button" className={`${ui.btn} ${ui.btnSmall}`} onClick={() => setFilters(EMPTY_FILTERS)}>
              Clear all filters
            </button>
          </div>
        ) : null}

        {fixedSort && fixedSortNote ? <p className={ui.hint}>{fixedSortNote}</p> : null}
      </div>

      {nothingHere ? (
        <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />
      ) : ordered.length === 0 ? (
        <EmptyState
          title="Nothing matched"
          body="Search looks at titles, addresses, descriptions, categories, tags and every note. Try a shorter search, or take it to the web."
          action={
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {filters.query.trim() ? (
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnPrimary}`}
                  onClick={() => openSearch(engine.id, filters.query)}
                >
                  Search the web for "{filters.query.trim()}"
                  <Icon name="external" size={13} />
                </button>
              ) : null}
              <button type="button" className={ui.btn} onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear all filters
              </button>
            </div>
          }
        />
      ) : preferences.viewMode === 'grid' ? (
        <div className={bookmarkStyles.grid}>
          {ordered.map((bookmark) => (
            <BookmarkTile key={bookmark.id} bookmark={bookmark} />
          ))}
        </div>
      ) : (
        <div className={bookmarkStyles.list}>
          {ordered.map((bookmark) => (
            <BookmarkRow
              key={bookmark.id}
              bookmark={bookmark}
              matchedFields={filters.query ? matchesById.get(bookmark.id) ?? [] : []}
              onAddNote={setNoteTarget}
            />
          ))}
        </div>
      )}

      <NoteEditorDialog
        open={noteTarget !== null}
        mode="add"
        siteTitle={noteTarget?.title ?? ''}
        onSave={(content) => {
          if (!noteTarget) return;
          addNote(noteTarget.id, content);
          notify(`Note added to ${noteTarget.title}.`);
        }}
        onClose={() => setNoteTarget(null)}
      />
    </section>
  );
}
