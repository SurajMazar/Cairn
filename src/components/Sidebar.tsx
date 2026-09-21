import { NavLink } from 'react-router-dom';
import type { ThemeChoice } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { Icon } from './Icon';
import styles from './shell.module.css';
import ui from '../styles/ui.module.css';

interface SidebarItem {
  to: string;
  label: string;
  count?: number;
  end?: boolean;
}

interface SidebarProps {
  open: boolean;
  onNavigate: () => void;
}

const THEMES: Array<{ value: ThemeChoice; label: string; title: string }> = [
  { value: 'system', label: 'Auto', title: 'Follow the system setting' },
  { value: 'light', label: 'Light', title: 'Always light' },
  { value: 'dark', label: 'Dark', title: 'Always dark' },
];

export function Sidebar({ open, onNavigate }: SidebarProps) {
  const { bookmarks, categories, tags, preferences, setPreferences } = useLibrary();
  const { openAddBookmark } = useUi();

  const favorites = bookmarks.filter((bookmark) => bookmark.isFavorite).length;
  const visited = bookmarks.filter((bookmark) => bookmark.lastVisitedAt).length;

  const groups: Array<{ label: string; items: SidebarItem[] }> = [
    {
      label: 'Library',
      items: [
        { to: '/', label: 'Home', end: true },
        { to: '/bookmarks', label: 'All bookmarks', count: bookmarks.length },
        { to: '/favorites', label: 'Favorites', count: favorites },
        { to: '/recent', label: 'Recently updated' },
        { to: '/visited', label: 'Recently visited', count: visited },
      ],
    },
    {
      label: 'Organize',
      items: [
        { to: '/categories', label: 'Categories', count: categories.length },
        { to: '/tags', label: 'Tags', count: tags.length },
      ],
    },
    {
      label: 'Explore',
      items: [
        { to: '/web', label: 'Web' },
        { to: '/settings', label: 'Settings' },
      ],
    },
  ];

  return (
    <nav
      id="sidebar"
      className={`${styles.sidebar} ${open ? styles.sidebarOpen : ''}`}
      aria-label="Library sections"
    >
      <div className={styles.brand}>
        <span className={styles.brandName}>Cairn</span>
        <span className={styles.brandNote}>Stored in this browser</span>
      </div>

      <button
        type="button"
        className={`${ui.btn} ${ui.btnPrimary} ${ui.btnBlock}`}
        onClick={() => {
          openAddBookmark();
          onNavigate();
        }}
      >
        <Icon name="plus" />
        Add website
      </button>

      <div className={styles.nav}>
        {groups.map((group) => (
          <div key={group.label} className={styles.navGroup}>
            <h2 className={styles.navLabel}>{group.label}</h2>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
                }
              >
                <span>{item.label}</span>
                {item.count === undefined ? null : (
                  <span className={styles.navCount}>{item.count}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </div>

      <div className={styles.themeRow}>
        <span className={styles.themeLabel}>Theme</span>
        <div className={styles.themeToggle} role="group" aria-label="Theme">
          {THEMES.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.themeButton} ${
                preferences.theme === option.value ? styles.themeButtonOn : ''
              }`}
              onClick={() => setPreferences({ theme: option.value })}
              aria-pressed={preferences.theme === option.value}
              title={option.title}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.sidebarFooter}>
        {bookmarks.length} {bookmarks.length === 1 ? 'website' : 'websites'} saved
      </p>
    </nav>
  );
}
