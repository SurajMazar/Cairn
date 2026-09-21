import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { useOpenSite } from '../hooks/useOpenSite';
import { Favicon } from '../components/Favicon';
import { Icon } from '../components/Icon';
import { DIRECTORY, refusesEmbedding, searchDirectory, type DirectorySite } from '../lib/directory';
import { domainFromUrl, isProbablyUrl, normaliseUrl, searchUrl, suggestTitleFromUrl } from '../lib/url';
import { sortBookmarks } from '../lib/sort';
import { buildSearchable, searchBookmarks } from '../lib/search';
import styles from './web.module.css';
import page from '../styles/page.module.css';
import ui from '../styles/ui.module.css';

type Entry = { kind: 'site'; url: string } | { kind: 'search'; query: string };

type FrameState = 'loading' | 'loaded' | 'blocked';

const EMBED_TIMEOUT_MS = 6000;

export function WebPage() {
  const { bookmarks, categories, tags, preferences, setPreferences, findBookmarkByUrl } = useLibrary();
  const { openAddBookmark } = useUi();
  const openSite = useOpenSite();

  const [history, setHistory] = useState<Entry[]>(() =>
    preferences.lastWebUrl ? [{ kind: 'site', url: preferences.lastWebUrl }] : [],
  );
  const [index, setIndex] = useState(() => (preferences.lastWebUrl ? 0 : -1));
  const [address, setAddress] = useState(preferences.lastWebUrl);
  const [frameState, setFrameState] = useState<FrameState>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<HTMLIFrameElement>(null);

  /**
   * A frame refused by X-Frame-Options or a frame-ancestors policy still fires
   * `load`, but it is left sitting on about:blank, which stays same-origin and
   * therefore readable. A frame that really loaded is cross-origin and throws.
   */
  const frameLoadedSomething = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return false;
    try {
      const doc = frame.contentDocument;
      if (!doc) return true;
      if (doc.location.href === 'about:blank') return false;
      return (doc.body?.childElementCount ?? 0) > 0;
    } catch {
      return true;
    }
  }, []);

  const entry = index >= 0 && index < history.length ? history[index] : null;
  const currentUrl = entry?.kind === 'site' ? entry.url : '';
  const currentDomain = currentUrl ? domainFromUrl(currentUrl) : '';
  const savedBookmark = currentUrl ? findBookmarkByUrl(currentUrl) : undefined;
  const embeddable = Boolean(currentUrl) && !refusesEmbedding(currentDomain);

  // A site that refuses framing must not leave an empty rectangle behind, so
  // the known list is checked first and a timeout catches the rest.
  useEffect(() => {
    window.clearTimeout(timerRef.current);
    if (!currentUrl) return undefined;
    if (!embeddable) {
      setFrameState('blocked');
      return undefined;
    }
    setFrameState('loading');
    timerRef.current = window.setTimeout(() => setFrameState('blocked'), EMBED_TIMEOUT_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [currentUrl, embeddable, reloadKey]);

  useEffect(() => {
    if (entry?.kind === 'site' && entry.url !== preferences.lastWebUrl) {
      setPreferences({ lastWebUrl: entry.url });
    }
  }, [entry, preferences.lastWebUrl, setPreferences]);

  const push = useCallback(
    (next: Entry) => {
      setHistory((current) => [...current.slice(0, index + 1), next]);
      setIndex((current) => current + 1);
      setAddress(next.kind === 'site' ? next.url : next.query);
    },
    [index],
  );

  const go = (offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= history.length) return;
    setIndex(target);
    const next = history[target];
    setAddress(next.kind === 'site' ? next.url : next.query);
  };

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const value = address.trim();
    if (!value) return;
    push(isProbablyUrl(value) ? { kind: 'site', url: normaliseUrl(value) } : { kind: 'search', query: value });
  };

  const openExternally = (url: string) => {
    const saved = findBookmarkByUrl(url);
    if (saved) {
      openSite(saved);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const saveSite = (url: string, title?: string) => {
    openAddBookmark({ url, title: title ?? suggestTitleFromUrl(url) });
  };

  const directoryResults = useMemo(
    () => (entry?.kind === 'search' ? searchDirectory(entry.query) : []),
    [entry],
  );

  const libraryResults = useMemo(() => {
    if (entry?.kind !== 'search') return [];
    const searchable = buildSearchable(bookmarks, categories, tags);
    return searchBookmarks(searchable, entry.query).slice(0, 5);
  }, [entry, bookmarks, categories, tags]);

  const recentlyVisited = useMemo(
    () => sortBookmarks(bookmarks.filter((item) => item.lastVisitedAt), 'visited').slice(0, 5),
    [bookmarks],
  );

  const startingPoints = useMemo(() => DIRECTORY.slice(0, 8), []);

  const renderResult = (site: DirectorySite) => {
    const saved = findBookmarkByUrl(site.url);
    return (
      <article key={site.url} className={styles.result}>
        <div>
          <a
            className={styles.resultTitle}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => {
              event.preventDefault();
              push({ kind: 'site', url: site.url });
            }}
          >
            {site.title}
          </a>
          <p className={styles.resultUrl}>{domainFromUrl(site.url)}</p>
          <p className={styles.resultDescription}>{site.description}</p>
        </div>
        <div className={styles.resultActions}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSmall}`}
            onClick={() => openExternally(site.url)}
          >
            Open
            <Icon name="external" size={12} />
          </button>
          {saved ? (
            <Link className={`${ui.btn} ${ui.btnSmall}`} to={`/bookmarks/${saved.id}`}>
              In library
            </Link>
          ) : (
            <button
              type="button"
              className={`${ui.btn} ${ui.btnSmall} ${ui.btnPrimary}`}
              onClick={() => saveSite(site.url, site.title)}
            >
              Save
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.navButtons}>
          <button
            type="button"
            className={ui.iconBtn}
            onClick={() => go(-1)}
            disabled={index <= 0}
            aria-label="Back"
            title="Back"
          >
            <Icon name="back" />
          </button>
          <button
            type="button"
            className={ui.iconBtn}
            onClick={() => go(1)}
            disabled={index >= history.length - 1}
            aria-label="Forward"
            title="Forward"
          >
            <Icon name="forward" />
          </button>
          <button
            type="button"
            className={ui.iconBtn}
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={!currentUrl}
            aria-label="Reload"
            title="Reload"
          >
            <Icon name="refresh" />
          </button>
        </div>

        <form className={styles.addressForm} onSubmit={submit} role="search">
          <Icon name="search" size={14} />
          <input
            className={styles.address}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Search the web or enter a URL"
            aria-label="Search the web or enter a URL"
            autoComplete="off"
            spellCheck={false}
            inputMode="url"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </form>

        <div className={styles.barActions}>
          {currentUrl ? (
            <>
              <button
                type="button"
                className={ui.iconBtn}
                onClick={() => openExternally(currentUrl)}
                aria-label="Open in a new tab"
                title="Open in a new tab"
              >
                <Icon name="external" />
              </button>
              {savedBookmark ? (
                <Link className={`${ui.btn} ${ui.btnSmall}`} to={`/bookmarks/${savedBookmark.id}`}>
                  <Icon name="check" size={13} />
                  Saved
                </Link>
              ) : (
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnSmall} ${ui.btnPrimary}`}
                  onClick={() => saveSite(currentUrl)}
                >
                  Save
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.stage}>
        {entry === null ? (
          <div className={styles.panel}>
            <header className={page.header}>
              <h1 className={page.title}>Web</h1>
              <p className={page.lede}>
                Search or type an address above. Websites that allow it open here; the rest open in a
                new tab. Either way you can save them to your library in one step.
              </p>
            </header>

            <section className={page.section}>
              <div className={page.sectionHead}>
                <h2 className={page.sectionTitle}>Starting points</h2>
              </div>
              <div className={styles.results}>{startingPoints.map(renderResult)}</div>
            </section>

            {recentlyVisited.length > 0 ? (
              <section className={page.section}>
                <div className={page.sectionHead}>
                  <h2 className={page.sectionTitle}>Back to what you were reading</h2>
                  <Link className={page.sectionLink} to="/visited">
                    See all
                  </Link>
                </div>
                <div className={styles.results}>
                  {recentlyVisited.map((bookmark) => (
                    <article key={bookmark.id} className={styles.result}>
                      <div>
                        <Link className={styles.resultTitle} to={`/bookmarks/${bookmark.id}`}>
                          {bookmark.title}
                        </Link>
                        <p className={styles.resultUrl}>{bookmark.domain}</p>
                        {bookmark.description ? (
                          <p className={styles.resultDescription}>{bookmark.description}</p>
                        ) : null}
                      </div>
                      <div className={styles.resultActions}>
                        <button
                          type="button"
                          className={`${ui.btn} ${ui.btnSmall}`}
                          onClick={() => push({ kind: 'site', url: bookmark.url })}
                        >
                          Open here
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : entry.kind === 'search' ? (
          <div className={styles.panel}>
            <header className={page.header}>
              <p className={page.kicker}>Search</p>
              <h1 className={page.title}>{entry.query}</h1>
            </header>

            <div className={styles.searchOut}>
              <p className={styles.searchOutText}>
                This app has no server, so it cannot read a search engine's results page. Run the search
                in a new tab and come back here to save whatever you find.
              </p>
              <a
                className={`${ui.btn} ${ui.btnPrimary}`}
                href={searchUrl(entry.query)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Search Google
                <Icon name="external" size={13} />
              </a>
            </div>

            {libraryResults.length > 0 ? (
              <section className={page.section}>
                <div className={page.sectionHead}>
                  <h2 className={page.sectionTitle}>Already in your library</h2>
                </div>
                <div className={styles.results}>
                  {libraryResults.map((result) => (
                    <article key={result.bookmark.id} className={styles.result}>
                      <div>
                        <Link className={styles.resultTitle} to={`/bookmarks/${result.bookmark.id}`}>
                          {result.bookmark.title}
                        </Link>
                        <p className={styles.resultUrl}>{result.bookmark.domain}</p>
                        {result.bookmark.description ? (
                          <p className={styles.resultDescription}>{result.bookmark.description}</p>
                        ) : null}
                      </div>
                      <div className={styles.resultActions}>
                        <button
                          type="button"
                          className={`${ui.btn} ${ui.btnSmall}`}
                          onClick={() => openSite(result.bookmark)}
                        >
                          Open
                          <Icon name="external" size={12} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section className={page.section}>
              <div className={page.sectionHead}>
                <h2 className={page.sectionTitle}>From the built-in directory</h2>
              </div>
              {directoryResults.length === 0 ? (
                <p className={ui.hint}>
                  Nothing in the built-in list matches that. Run the search above, then save the result
                  you want to keep.
                </p>
              ) : (
                <div className={styles.results}>{directoryResults.map(renderResult)}</div>
              )}
            </section>
          </div>
        ) : frameState === 'blocked' ? (
          <div className={styles.panel}>
            <div className={styles.blocked}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <Favicon domain={currentDomain} large />
                <div>
                  <p className={styles.blockedTitle}>{currentDomain}</p>
                  <p className={ui.mono}>{currentUrl}</p>
                </div>
              </div>
              <p className={styles.blockedBody}>
                This website cannot be displayed inside the application. Most large sites send a header
                that tells browsers to refuse being embedded in another page. Saving it to your library
                works exactly the same either way.
              </p>
              <div className={styles.blockedActions}>
                <button
                  type="button"
                  className={`${ui.btn} ${ui.btnPrimary}`}
                  onClick={() => openExternally(currentUrl)}
                >
                  Open in a new tab
                  <Icon name="external" size={13} />
                </button>
                {savedBookmark ? (
                  <Link className={ui.btn} to={`/bookmarks/${savedBookmark.id}`}>
                    <span className={styles.savedFlag}>
                      <Icon name="check" size={13} />
                      Already in your library
                    </span>
                  </Link>
                ) : (
                  <button type="button" className={ui.btn} onClick={() => saveSite(currentUrl)}>
                    Save to library
                  </button>
                )}
                {embeddable ? (
                  <button
                    type="button"
                    className={ui.btn}
                    onClick={() => {
                      setFrameState('loading');
                      setReloadKey((key) => key + 1);
                    }}
                  >
                    Try embedding again
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.frameNotice}>
              <span>
                Embedded preview of {currentDomain}. If the area below stays blank, the website refused
                to be embedded.
              </span>
              <button
                type="button"
                className={`${ui.btn} ${ui.btnSmall}`}
                style={{ marginLeft: 'auto' }}
                onClick={() => openExternally(currentUrl)}
              >
                Open in a new tab
              </button>
            </div>
            <iframe
              key={`${currentUrl}-${reloadKey}`}
              ref={frameRef}
              className={styles.frame}
              src={currentUrl}
              title={`Preview of ${currentDomain}`}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => {
                window.clearTimeout(timerRef.current);
                setFrameState(frameLoadedSomething() ? 'loaded' : 'blocked');
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
