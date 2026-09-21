import { Link } from 'react-router-dom';
import type { Bookmark } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { useBookmarkActions } from '../hooks/useBookmarkActions';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { Menu } from './Menu';
import { formatRelative } from '../lib/time';
import styles from './bookmarks.module.css';
import ui from '../styles/ui.module.css';

export function BookmarkTile({ bookmark }: { bookmark: Bookmark }) {
  const { categoryById, toggleFavorite } = useLibrary();
  const { openEditBookmark } = useUi();
  const { copyLink, openInBrave } = useBookmarkActions();
  const category = bookmark.categoryId ? categoryById.get(bookmark.categoryId) : undefined;

  return (
    <article className={styles.tile}>
      <div className={styles.tileHead}>
        <Favicon domain={bookmark.domain} title={bookmark.title} />
        <span style={{ display: 'inline-flex' }}>
          <button
            type="button"
            className={`${ui.iconBtn} ${bookmark.isFavorite ? ui.starOn : ui.star}`}
            onClick={() => toggleFavorite(bookmark.id)}
            aria-pressed={bookmark.isFavorite}
            aria-label={bookmark.isFavorite ? `Remove ${bookmark.title} from favorites` : `Add ${bookmark.title} to favorites`}
          >
            <Icon name={bookmark.isFavorite ? 'starFilled' : 'star'} />
          </button>
          <Menu
            label={`More actions for ${bookmark.title}`}
            items={[
              { label: 'Copy link', onSelect: () => void copyLink(bookmark) },
              { label: 'Open in Brave', onSelect: () => void openInBrave(bookmark) },
              { label: 'Edit', onSelect: () => openEditBookmark(bookmark), separatorBefore: true },
            ]}
          />
        </span>
      </div>

      <div>
        <Link className={styles.tileTitle} to={`/bookmarks/${bookmark.id}`}>
          {bookmark.title}
        </Link>
        <p className={styles.domain}>{bookmark.domain}</p>
      </div>

      <div className={styles.tileFoot}>
        <span>{category?.name ?? 'Uncategorized'}</span>
        <span>
          {bookmark.notes.length > 0
            ? `${bookmark.notes.length} ${bookmark.notes.length === 1 ? 'note' : 'notes'}`
            : formatRelative(bookmark.updatedAt)}
        </span>
      </div>
    </article>
  );
}
