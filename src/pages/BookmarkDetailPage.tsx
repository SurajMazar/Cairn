import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { BookmarkNote } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { useOpenSite } from '../hooks/useOpenSite';
import { useBookmarkActions } from '../hooks/useBookmarkActions';
import { Favicon } from '../components/Favicon';
import { Icon } from '../components/Icon';
import { EmptyState } from '../components/EmptyState';
import { NoteEditorDialog } from '../components/NoteEditorDialog';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { formatDate, formatDateTime, formatRelative } from '../lib/time';
import styles from './detail.module.css';
import page from '../styles/page.module.css';
import ui from '../styles/ui.module.css';

export function BookmarkDetailPage() {
  const { bookmarkId = '' } = useParams();
  const navigate = useNavigate();
  const { bookmarks, categoryById, tagById, toggleFavorite, deleteBookmark, addNote, updateNote, deleteNote } =
    useLibrary();
  const { openEditBookmark, notify } = useUi();
  const { copyLink, openInBrave } = useBookmarkActions();
  const openSite = useOpenSite();

  const [noteOpen, setNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<BookmarkNote | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<BookmarkNote | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bookmark = bookmarks.find((item) => item.id === bookmarkId);

  if (!bookmark) {
    return (
      <>
        <Link className={page.backLink} to="/bookmarks">
          <Icon name="back" size={13} />
          All bookmarks
        </Link>
        <h1 className={page.title}>Bookmark not found</h1>
        <p className={page.lede}>
          This website is no longer in your library. It may have been deleted, or the link came from a
          different browser.
        </p>
      </>
    );
  }

  const category = bookmark.categoryId ? categoryById.get(bookmark.categoryId) : undefined;
  const tags = bookmark.tagIds.map((id) => tagById.get(id)).filter((tag) => tag !== undefined);

  return (
    <>
      <Link className={page.backLink} to="/bookmarks">
        <Icon name="back" size={13} />
        All bookmarks
      </Link>

      <div className={styles.head}>
        <Favicon domain={bookmark.domain} title={bookmark.title} large />
        <div className={styles.headText}>
          <h1 className={styles.title}>{bookmark.title}</h1>
          <a
            className={styles.urlLink}
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => openSite(bookmark)}
          >
            {bookmark.url}
          </a>
        </div>
      </div>

      <div className={styles.actions}>
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => openSite(bookmark)}>
          Open website
          <Icon name="external" size={13} />
        </button>
        <button type="button" className={ui.btn} onClick={() => openEditBookmark(bookmark)}>
          Edit
        </button>
        <button
          type="button"
          className={ui.btn}
          onClick={() => toggleFavorite(bookmark.id)}
          aria-pressed={bookmark.isFavorite}
        >
          <Icon name={bookmark.isFavorite ? 'starFilled' : 'star'} size={14} />
          {bookmark.isFavorite ? 'Favorited' : 'Favorite'}
        </button>
        <button
          type="button"
          className={ui.btn}
          onClick={() => {
            setEditingNote(null);
            setNoteOpen(true);
          }}
        >
          Add note
        </button>
        <button type="button" className={ui.btn} onClick={() => void copyLink(bookmark)}>
          <Icon name="copy" size={13} />
          Copy link
        </button>
        <button
          type="button"
          className={ui.btn}
          onClick={() => void openInBrave(bookmark)}
          title="Asks your system to open this link in Brave"
        >
          Open in Brave
        </button>
      </div>

      {category || tags.length > 0 ? (
        <div className={styles.taxonomy}>
          {category ? (
            <Link className={styles.categoryLink} to={`/categories/${category.id}`}>
              {category.name}
            </Link>
          ) : null}
          {tags.map((tag) => (
            <Link key={tag!.id} className={ui.chip} to={`/tags/${tag!.id}`}>
              {tag!.name}
            </Link>
          ))}
        </div>
      ) : null}

      {bookmark.description ? (
        <div className={styles.block}>
          <div className={styles.blockHead}>
            <h2 className={styles.blockTitle}>Description</h2>
          </div>
          <p className={styles.description}>{bookmark.description}</p>
        </div>
      ) : null}

      <div className={styles.block}>
        <div className={styles.blockHead}>
          <h2 className={styles.blockTitle}>
            Notes
            {bookmark.notes.length > 0 ? (
              <span className={ui.count}> ({bookmark.notes.length})</span>
            ) : null}
          </h2>
          <button
            type="button"
            className={`${ui.btn} ${ui.btnSmall}`}
            onClick={() => {
              setEditingNote(null);
              setNoteOpen(true);
            }}
          >
            Add note
          </button>
        </div>

        {bookmark.notes.length === 0 ? (
          <EmptyState
            title="No notes yet."
            body="Add a note to remember why this website is useful. Notes are searchable, so you can find a website by what you wrote about it."
          />
        ) : (
          <div className={styles.notes}>
            {bookmark.notes.map((note) => (
              <article key={note.id} className={styles.note}>
                <p className={styles.noteBody}>{note.content}</p>
                <div className={styles.noteFoot}>
                  <span>
                    Written {formatRelative(note.createdAt)}
                    {note.updatedAt !== note.createdAt ? ` · edited ${formatRelative(note.updatedAt)}` : ''}
                  </span>
                  <span className={styles.noteActions}>
                    <button
                      type="button"
                      className={`${ui.btn} ${ui.btnSmall}`}
                      onClick={() => {
                        setEditingNote(note);
                        setNoteOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`}
                      onClick={() => setNoteToDelete(note)}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className={styles.facts}>
        <div>
          <p className={styles.factLabel}>Created</p>
          <p className={styles.factValue}>{formatDate(bookmark.createdAt)}</p>
          <p className={styles.factHint}>When you first saved it</p>
        </div>
        <div>
          <p className={styles.factLabel}>Last updated</p>
          <p className={styles.factValue}>{formatDateTime(bookmark.updatedAt)}</p>
          <p className={styles.factHint}>Last edit to the website or its notes</p>
        </div>
        <div>
          <p className={styles.factLabel}>Last visited</p>
          <p className={styles.factValue}>
            {bookmark.lastVisitedAt ? formatDateTime(bookmark.lastVisitedAt) : 'Not opened yet'}
          </p>
          <p className={styles.factHint}>Opening a website does not count as an edit</p>
        </div>
      </div>

      <div className={styles.danger}>
        <button type="button" className={`${ui.btn} ${ui.btnDanger}`} onClick={() => setConfirmDelete(true)}>
          Delete bookmark
        </button>
      </div>

      <NoteEditorDialog
        open={noteOpen}
        mode={editingNote ? 'edit' : 'add'}
        siteTitle={bookmark.title}
        initialContent={editingNote?.content ?? ''}
        onSave={(content) => {
          if (editingNote) {
            updateNote(bookmark.id, editingNote.id, content);
            notify('Note updated.');
          } else {
            addNote(bookmark.id, content);
            notify(`Note added to ${bookmark.title}.`);
          }
        }}
        onClose={() => {
          setNoteOpen(false);
          setEditingNote(null);
        }}
      />

      <ConfirmDialog
        open={noteToDelete !== null}
        title="Delete note?"
        description="This note will be removed from your local library. The website stays saved."
        confirmLabel="Delete note"
        danger
        onCancel={() => setNoteToDelete(null)}
        onConfirm={() => {
          if (noteToDelete) {
            deleteNote(bookmark.id, noteToDelete.id);
            notify('Note deleted.');
          }
          setNoteToDelete(null);
        }}
      />

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
          deleteBookmark(bookmark.id);
          notify(`${bookmark.title} was deleted.`);
          navigate('/bookmarks');
        }}
      />
    </>
  );
}
