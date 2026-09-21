import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { Favicon } from '../components/Favicon';
import { Icon } from '../components/Icon';
import { EmptyState } from '../components/EmptyState';
import { sortBookmarks } from '../lib/sort';
import { SEARCH_ENGINES, openSearch } from '../lib/searchEngines';
import { formatRelative, greeting } from '../lib/time';
import type { Bookmark } from '../types';
import styles from './home.module.css';
import page from '../styles/page.module.css';
import ui from '../styles/ui.module.css';

function MiniRow({ bookmark, stamp }: { bookmark: Bookmark; stamp: string }) {
  const { categoryById } = useLibrary();
  const category = bookmark.categoryId ? categoryById.get(bookmark.categoryId) : undefined;

  return (
    <div className={styles.miniRow}>
      <Favicon domain={bookmark.domain} title={bookmark.title} />
      <div className={styles.miniBody}>
        <Link className={styles.miniTitle} to={`/bookmarks/${bookmark.id}`}>
          {bookmark.title}
        </Link>
        <div className={styles.miniMeta}>
          <span className={styles.miniDomain}>{bookmark.domain}</span>
          {category ? <span>· {category.name}</span> : null}
          {bookmark.notes.length > 0 ? (
            <span>
              · {bookmark.notes.length} {bookmark.notes.length === 1 ? 'note' : 'notes'}
            </span>
          ) : null}
        </div>
      </div>
      <span className={styles.miniWhen}>{stamp}</span>
    </div>
  );
}

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={page.section}>
      <div className={page.sectionHead}>
        <h2 className={page.sectionTitle}>{title}</h2>
        {href ? (
          <Link className={page.sectionLink} to={href}>
            {linkLabel ?? 'See all'}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function HomePage() {
  const { bookmarks, categories, tags, preferences } = useLibrary();
  const { openAddBookmark } = useUi();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const recentlyUpdated = useMemo(() => sortBookmarks(bookmarks, 'updated').slice(0, 5), [bookmarks]);
  const recentlyVisited = useMemo(
    () => sortBookmarks(bookmarks.filter((item) => item.lastVisitedAt), 'visited').slice(0, 4),
    [bookmarks],
  );
  const favorites = useMemo(
    () => sortBookmarks(bookmarks.filter((item) => item.isFavorite), 'updated').slice(0, 4),
    [bookmarks],
  );

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    bookmarks.forEach((bookmark) => {
      if (!bookmark.categoryId) return;
      counts.set(bookmark.categoryId, (counts.get(bookmark.categoryId) ?? 0) + 1);
    });
    return categories
      .map((category) => ({ category, count: counts.get(category.id) ?? 0 }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [bookmarks, categories]);

  const noteCount = bookmarks.reduce((total, bookmark) => total + bookmark.notes.length, 0);

  const engine = SEARCH_ENGINES[preferences.searchEngine] ?? SEARCH_ENGINES.google;

  const searchTheWeb = () => {
    if (!query.trim()) {
      navigate('/web');
      return;
    }
    openSearch(engine.id, query);
  };

  const submitSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    navigate(query.trim() ? `/bookmarks?q=${encodeURIComponent(query.trim())}` : '/bookmarks');
  };

  if (bookmarks.length === 0) {
    return (
      <>
        <div className={styles.hero}>
          <p className={styles.greeting}>{greeting()}</p>
          <h1 className={styles.heroTitle}>Your Web Library</h1>
        </div>
        <EmptyState
          title="Your library is empty."
          body="Save websites while you are browsing and they will appear here, with the categories, tags and notes you give them."
          action={
            <div className={styles.heroActions}>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => openAddBookmark()}>
                Add a website
              </button>
              <Link className={ui.btn} to="/web">
                Explore the web
              </Link>
            </div>
          }
        />
      </>
    );
  }

  return (
    <>
      <div className={styles.hero}>
        <p className={styles.greeting}>{greeting()}</p>
        <h1 className={styles.heroTitle}>Your Web Library</h1>
        <p className={styles.summary}>
          {bookmarks.length} websites · {categories.length} categories · {tags.length} tags · {noteCount}{' '}
          notes
        </p>
      </div>

      <form className={styles.searchForm} onSubmit={submitSearch} role="search">
        <div className={styles.searchField}>
          <span className={styles.searchIcon}>
            <Icon name="search" size={18} />
          </span>
          <input
            className={styles.searchInput}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your collection..."
            aria-label="Search your collection"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitSearch();
              }
            }}
          />
        </div>
        {/* Same query, two destinations: Return searches the library, this
            sends it out to the web. */}
        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary} ${styles.webButton}`}
          onClick={searchTheWeb}
          title={`Search ${engine.label} in a new tab`}
        >
          Search the web
          <Icon name="external" size={13} />
        </button>
      </form>

      <Section title="Recently updated" href="/recent">
        <div className={styles.miniList}>
          {recentlyUpdated.map((bookmark) => (
            <MiniRow key={bookmark.id} bookmark={bookmark} stamp={formatRelative(bookmark.updatedAt)} />
          ))}
        </div>
      </Section>

      {recentlyVisited.length > 0 ? (
        <Section title="Recently visited" href="/visited">
          <div className={styles.miniList}>
            {recentlyVisited.map((bookmark) => (
              <MiniRow
                key={bookmark.id}
                bookmark={bookmark}
                stamp={formatRelative(bookmark.lastVisitedAt)}
              />
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Favorites" href="/favorites">
        {favorites.length === 0 ? (
          <EmptyState
            title="No favorites yet."
            body="Star the websites you want one click away and they will collect here."
          />
        ) : (
          <div className={styles.miniList}>
            {favorites.map((bookmark) => (
              <MiniRow key={bookmark.id} bookmark={bookmark} stamp={formatRelative(bookmark.updatedAt)} />
            ))}
          </div>
        )}
      </Section>

      {categoryCounts.length > 0 ? (
        <Section title="Categories" href="/categories" linkLabel="Manage">
          <div className={page.index}>
            {categoryCounts.map(({ category, count }) => (
              <div key={category.id} className={page.indexRow}>
                <Link className={page.indexName} to={`/categories/${category.id}`}>
                  {category.name}
                </Link>
                <span className={page.indexCount}>{count}</span>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </>
  );
}
