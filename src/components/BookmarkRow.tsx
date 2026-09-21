import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Bookmark } from '../types';
import type { MatchField } from '../lib/search';
import { MATCH_FIELD_LABELS } from '../lib/search';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { useOpenSite } from '../hooks/useOpenSite';
import { useBookmarkActions } from '../hooks/useBookmarkActions';
import { canRequestBrave } from '../lib/externalBrowser';
import { Favicon } from './Favicon';
import { Icon } from './Icon';
import { Menu } from './Menu';
import { ConfirmDialog } from './ConfirmDialog';
import { formatRelative } from '../lib/time';
import { prettyUrl } from '../lib/url';
import styles from './bookmarks.module.css';
import ui from '../styles/ui.module.css';

interface BookmarkRowProps {
  bookmark: Bookmark;
  matchedFields?: MatchField[];
  onAddNote: (bookmark: Bookmark) => void;
}

export function BookmarkRow({ bookmark, matchedFields = [], onAddNote }: BookmarkRowProps) {
  const { categoryById, tagById, toggleFavorite, deleteBookmark } = useLibrary();
  const { openEditBookmark, notify } = useUi();
  const { copyLink, openInBrave, openInDefaultBrowser } = useBookmarkActions();
  const openSite = useOpenSite();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const category = bookmark.categoryId ? categoryById.get(bookmark.categoryId) : undefined;
  const tags = bookmark.tagIds.map((id) => tagById.get(id)).filter((tag) => tag !== undefined);

  return (
    <article className={styles.row}>
      <Favicon domain={bookmark.domain} title={bookmark.title} />

      <div className={styles.rowBody}>
        <div className={styles.titleLine}>
          <Link className={styles.title} to={`/bookmarks/${bookmark.id}`}>
            {bookmark.title}
          </Link>
          <span className={styles.domain}>{prettyUrl(bookmark.url)}</span>
        </div>

        {bookmark.description ? <p className={styles.description}>{bookmark.description}</p> : null}

        {category || tags.length > 0 ? (
          <div className={styles.taxonomy}>
            {category ? (
              <Link className={styles.category} to={`/categories/${category.id}`}>
                {category.name}
              </Link>
            ) : null}
            {category && tags.length > 0 ? <span className={styles.separator}>/</span> : null}
            {tags.map((tag, index) => (
              <span key={tag!.id}>
                <Link className={styles.tagLink} to={`/tags/${tag!.id}`}>
                  {tag!.name}
                </Link>
                {index < tags.length - 1 ? <span className={styles.separator}> ·</span> : null}
              </span>
            ))}
          </div>
        ) : null}

        <div className={styles.metaLine}>
          {bookmark.notes.length > 0 ? (
            <>
              <span>
                {bookmark.notes.length} {bookmark.notes.length === 1 ? 'note' : 'notes'}
              </span>
              <span className={styles.separator}>·</span>
            </>
          ) : null}
          <span>Updated {formatRelative(bookmark.updatedAt)}</span>
          {bookmark.lastVisitedAt ? (
            <>
              <span className={styles.separator}>·</span>
              <span>Visited {formatRelative(bookmark.lastVisitedAt)}</span>
            </>
          ) : null}
        </div>

        {matchedFields.length > 0 ? (
          <p className={styles.matches}>
            Matched{' '}
            {matchedFields.map((field, index) => (
              <span key={field}>
                <span className={styles.matchesStrong}>{MATCH_FIELD_LABELS[field]}</span>
                {index < matchedFields.length - 1 ? ' · ' : ''}
              </span>
            ))}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSmall}`}
            onClick={() => openSite(bookmark)}
          >
            Open
            <Icon name="external" size={12} />
          </button>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSmall}`}
            onClick={() => onAddNote(bookmark)}
          >
            Add note
          </button>
          <Link className={`${ui.btn} ${ui.btnSmall}`} to={`/bookmarks/${bookmark.id}`}>
            Details
          </Link>
        </div>
      </div>

      <div className={styles.rowAside}>
        <button
          type="button"
          className={`${ui.iconBtn} ${bookmark.isFavorite ? ui.starOn : ui.star}`}
          onClick={() => toggleFavorite(bookmark.id)}
          aria-pressed={bookmark.isFavorite}
          aria-label={bookmark.isFavorite ? `Remove ${bookmark.title} from favorites` : `Add ${bookmark.title} to favorites`}
          title={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Icon name={bookmark.isFavorite ? 'starFilled' : 'star'} />
        </button>

        <Menu
          label={`More actions for ${bookmark.title}`}
          items={[
            { label: 'Copy link', onSelect: () => void copyLink(bookmark) },
            { label: 'Open in default browser', onSelect: () => openInDefaultBrowser(bookmark) },
            ...(canRequestBrave()
              ? [{ label: 'Open in Brave', onSelect: () => openInBrave(bookmark) }]
              : []),
            { label: 'Edit', onSelect: () => openEditBookmark(bookmark), separatorBefore: true },
            { label: 'Delete', onSelect: () => setConfirmDelete(true), danger: true },
          ]}
        />
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete bookmark?"
        description={`This will remove ${bookmark.title} and its ${bookmark.notes.length} ${
          bookmark.notes.length === 1 ? 'note' : 'notes'
        } from your local library. This cannot be undone.`}
        confirmLabel="Delete bookmark"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          deleteBookmark(bookmark.id);
          notify(`${bookmark.title} was deleted.`);
        }}
      />
    </article>
  );
}
