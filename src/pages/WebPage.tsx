import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { useOpenSite } from '../hooks/useOpenSite';
import { Favicon } from '../components/Favicon';
import { Icon } from '../components/Icon';
import { refusesEmbedding } from '../lib/embedding';
import { SEARCH_ENGINES, openSearch } from '../lib/searchEngines';
import { domainFromUrl, isProbablyUrl, normaliseUrl, suggestTitleFromUrl } from '../lib/url';
import { sortBookmarks } from '../lib/sort';
import styles from './web.module.css';
import page from '../styles/page.module.css';
import ui from '../styles/ui.module.css';

type FrameState = 'loading' | 'loaded' | 'blocked';

const EMBED_TIMEOUT_MS = 6000;

export function WebPage() {
  const { bookmarks, preferences, setPreferences, findBookmarkByUrl } = useLibrary();
  const { openAddBookmark } = useUi();
  const openSite = useOpenSite();

  const [history, setHistory] = useState<string[]>(() =>
    preferences.lastWebUrl ? [preferences.lastWebUrl] : [],
  );
  const [index, setIndex] = useState(() => (preferences.lastWebUrl ? 0 : -1));
  const [address, setAddress] = useState(preferences.lastWebUrl);
  const [frameState, setFrameState] = useState<FrameState>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const timerRef = useRef<number | undefined>(undefined);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const engine = SEARCH_ENGINES[preferences.searchEngine] ?? SEARCH_ENGINES.google;
  const currentUrl = index >= 0 && index < history.length ? history[index] : '';
  const currentDomain = currentUrl ? domainFromUrl(currentUrl) : '';
  const savedBookmark = currentUrl ? findBookmarkByUrl(currentUrl) : undefined;
  const embeddable = Boolean(currentUrl) && !refusesEmbedding(currentDomain);

  /**
   * A frame refused by X-Frame-Options or a frame-ancestors policy still fires
   * `load`, but is left on about:blank, which stays same-origin and readable.
   * A frame that really loaded is cross-origin and throws.
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
    if (currentUrl && currentUrl !== preferences.lastWebUrl) {
      setPreferences({ lastWebUrl: currentUrl });
    }
  }, [currentUrl, preferences.lastWebUrl, setPreferences]);

  const preview = useCallback(
    (url: string) => {
      setHistory((current) => [...current.slice(0, index + 1), url]);
      setIndex((current) => current + 1);
      setAddress(url);
    },
    [index],
  );

  const go = (offset: number) => {
    const target = index + offset;
    if (target < 0 || target >= history.length) return;
    setIndex(target);
    setAddress(history[target]);
  };

  /** Search always leaves for a real browser tab; this app cannot read results. */
  const search = useCallback(() => {
    const value = address.trim();
    if (!value) {
      inputRef.current?.focus();
      return;
    }
    openSearch(engine.id, value);
  }, [address, engine.id]);

  const submit = (event?: React.FormEvent) => {
    event?.preventDefault();
    const value = address.trim();
    if (!value) return;
    if (isProbablyUrl(value)) preview(normaliseUrl(value));
    else openSearch(engine.id, value);
  };

  const openExternally = (url: string) => {
    const saved = findBookmarkByUrl(url);
    if (saved) {
      openSite(saved);
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const recentlyVisited = useMemo(
    () => sortBookmarks(bookmarks.filter((item) => item.lastVisitedAt), 'visited').slice(0, 6),
    [bookmarks],
  );

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
            ref={inputRef}
            className={styles.address}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder={`Search ${engine.label} or enter a URL`}
            aria-label={`Search ${engine.label} or enter a URL`}
            autoComplete="off"
            spellCheck={false}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </form>

        <button
          type="button"
          className={`${ui.btn} ${ui.btnPrimary} ${styles.searchButton}`}
          onClick={search}
          title={`Search ${engine.label} in a new tab`}
        >
          Search
          <Icon name="external" size={12} />
        </button>

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
                  className={`${ui.btn} ${ui.btnSmall}`}
                  onClick={() => openAddBookmark({ url: currentUrl, title: suggestTitleFromUrl(currentUrl) })}
                >
                  Save
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className={styles.stage}>
        {!currentUrl ? (
          <div className={styles.panel}>
            <header className={page.header}>
              <h1 className={page.title}>Web</h1>
              <p className={page.lede}>
                Type anything above and press Return. A search opens in a new browser tab, because
                this app has no server and cannot read a results page. A link opens here as a preview
                you can save from.
              </p>
            </header>

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
                          onClick={() => preview(bookmark.url)}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className={`${ui.btn} ${ui.btnSmall}`}
                          onClick={() => openSite(bookmark)}
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
                  <button
                    type="button"
                    className={ui.btn}
                    onClick={() => openAddBookmark({ url: currentUrl, title: suggestTitleFromUrl(currentUrl) })}
                  >
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
