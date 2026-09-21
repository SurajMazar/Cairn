import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { Sidebar } from './Sidebar';
import { Icon } from './Icon';
import styles from './shell.module.css';
import ui from '../styles/ui.module.css';

const TITLES: Record<string, string> = {
  '/': 'Home',
  '/bookmarks': 'All bookmarks',
  '/favorites': 'Favorites',
  '/recent': 'Recently updated',
  '/visited': 'Recently visited',
  '/categories': 'Categories',
  '/tags': 'Tags',
  '/web': 'Web',
  '/settings': 'Settings',
};

export function AppShell() {
  const location = useLocation();
  const { storageAvailable } = useLibrary();
  const { openAddBookmark } = useUi();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const isWeb = location.pathname === '/web';
  const title = TITLES[location.pathname] ?? 'Cairn';

  return (
    <div className={styles.app}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>

      <Sidebar open={navOpen} onNavigate={() => setNavOpen(false)} />
      {navOpen ? (
        <button
          type="button"
          className={styles.scrim}
          aria-label="Close navigation"
          onClick={() => setNavOpen(false)}
        />
      ) : null}

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={ui.iconBtn}
            aria-label="Open navigation"
            aria-expanded={navOpen}
            aria-controls="sidebar"
            onClick={() => setNavOpen(true)}
          >
            <Icon name="menu" size={18} />
          </button>
          <span className={styles.topbarTitle}>{title}</span>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnPrimary} ${ui.btnSmall}`}
            onClick={() => openAddBookmark()}
          >
            <Icon name="plus" size={13} />
            Add
          </button>
        </header>

        {storageAvailable ? null : (
          <p className={styles.warning}>
            This browser is blocking local storage, so nothing you save here will survive a refresh.
            Private browsing windows are the usual cause.
          </p>
        )}

        <main id="main" className={isWeb ? styles.contentWide : styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
