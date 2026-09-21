import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import styles from './taxonomy.module.css';
import page from '../styles/page.module.css';
import ui from '../styles/ui.module.css';

interface PendingDelete {
  id: string;
  name: string;
  count: number;
}

export function CategoriesPage() {
  const { bookmarks, categories, createCategory, renameCategory, deleteCategory } = useLibrary();
  const { notify } = useUi();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    bookmarks.forEach((bookmark) => {
      if (!bookmark.categoryId) return;
      map.set(bookmark.categoryId, (map.get(bookmark.categoryId) ?? 0) + 1);
    });
    return map;
  }, [bookmarks]);

  const uncategorised = bookmarks.filter((bookmark) => !bookmark.categoryId).length;
  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
    [categories],
  );

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    createCategory(draft);
    notify(`Category "${draft.trim()}" is ready to use.`);
    setDraft('');
  };

  return (
    <>
      <header className={page.header}>
        <h1 className={page.title}>Categories</h1>
        <p className={page.lede}>
          One category per website, for the broad shelf it belongs on. Use tags for everything finer
          grained.
        </p>
      </header>

      <form className={styles.createRow} onSubmit={create}>
        <input
          className={ui.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="New category name"
          aria-label="New category name"
        />
        <button type="submit" className={ui.btn} disabled={!draft.trim()}>
          Create
        </button>
      </form>

      {sorted.length === 0 ? (
        <EmptyState
          title="No categories yet."
          body="Create a category above, or add one while saving a website."
        />
      ) : (
        <div>
          {sorted.map((category) => {
            const count = counts.get(category.id) ?? 0;
            const isEditing = editingId === category.id;
            return (
              <div key={category.id} className={styles.manageRow}>
                {isEditing ? (
                  <form
                    className={styles.editRow}
                    onSubmit={(event) => {
                      event.preventDefault();
                      renameCategory(category.id, editValue);
                      setEditingId(null);
                    }}
                  >
                    <input
                      className={ui.input}
                      value={editValue}
                      onChange={(event) => setEditValue(event.target.value)}
                      aria-label={`Rename ${category.name}`}
                      autoFocus
                    />
                    <button type="submit" className={`${ui.btn} ${ui.btnSmall}`}>
                      Save
                    </button>
                    <button
                      type="button"
                      className={`${ui.btn} ${ui.btnSmall}`}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </form>
                ) : (
                  <>
                    <div className={styles.manageMain}>
                      <Link className={page.indexName} to={`/categories/${category.id}`}>
                        {category.name}
                      </Link>
                      <span className={page.indexCount}>
                        {count} {count === 1 ? 'website' : 'websites'}
                      </span>
                    </div>
                    <div className={styles.manageActions}>
                      <button
                        type="button"
                        className={`${ui.btn} ${ui.btnSmall}`}
                        onClick={() => {
                          setEditingId(category.id);
                          setEditValue(category.name);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`}
                        onClick={() => setPending({ id: category.id, name: category.name, count })}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {uncategorised > 0 ? (
        <p className={ui.hint} style={{ marginTop: 'var(--space-4)' }}>
          {uncategorised} {uncategorised === 1 ? 'website has' : 'websites have'} no category.
        </p>
      ) : null}

      <ConfirmDialog
        open={pending !== null}
        title="Delete category?"
        description={
          pending
            ? `"${pending.name}" will be removed. The ${pending.count} ${
                pending.count === 1 ? 'website' : 'websites'
              } filed under it stay in your library without a category.`
            : ''
        }
        confirmLabel="Delete category"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) {
            deleteCategory(pending.id);
            notify(`Category "${pending.name}" was deleted.`);
          }
          setPending(null);
        }}
      />
    </>
  );
}

export function TagsPage() {
  const { bookmarks, tags, createTag, renameTag, deleteTag } = useLibrary();
  const { notify } = useUi();
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pending, setPending] = useState<PendingDelete | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    bookmarks.forEach((bookmark) => {
      bookmark.tagIds.forEach((id) => map.set(id, (map.get(id) ?? 0) + 1));
    });
    return map;
  }, [bookmarks]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return [...tags]
      .filter((tag) => (needle ? tag.name.toLowerCase().includes(needle) : true))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [tags, query]);

  const popular = useMemo(
    () =>
      [...tags]
        .map((tag) => ({ tag, count: counts.get(tag.id) ?? 0 }))
        .filter((entry) => entry.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 16),
    [tags, counts],
  );

  const create = (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    createTag(draft);
    notify(`Tag "${draft.trim().replace(/^#/, '')}" is ready to use.`);
    setDraft('');
  };

  return (
    <>
      <header className={page.header}>
        <h1 className={page.title}>Tags</h1>
        <p className={page.lede}>
          Tags cut across categories. A website can carry as many as it needs, and filtering by
          several shows only the websites that carry all of them.
        </p>
      </header>

      {popular.length > 0 ? (
        <div className={styles.tagCloud}>
          {popular.map(({ tag, count }) => (
            <Link key={tag.id} className={styles.tagCloudItem} to={`/tags/${tag.id}`}>
              {tag.name}
              <span className={styles.tagCloudCount}>{count}</span>
            </Link>
          ))}
        </div>
      ) : null}

      <form className={styles.createRow} onSubmit={create}>
        <input
          className={ui.input}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="New tag name"
          aria-label="New tag name"
        />
        <button type="submit" className={ui.btn} disabled={!draft.trim()}>
          Create
        </button>
      </form>

      {tags.length === 0 ? (
        <EmptyState title="No tags yet." body="Create a tag above, or add tags while saving a website." />
      ) : (
        <>
          <div className={styles.createRow}>
            <input
              className={ui.input}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tags"
              aria-label="Search tags"
            />
          </div>

          {visible.length === 0 ? (
            <p className={ui.hint}>No tag matches that search.</p>
          ) : (
            <div>
              {visible.map((tag) => {
                const count = counts.get(tag.id) ?? 0;
                const isEditing = editingId === tag.id;
                return (
                  <div key={tag.id} className={styles.manageRow}>
                    {isEditing ? (
                      <form
                        className={styles.editRow}
                        onSubmit={(event) => {
                          event.preventDefault();
                          renameTag(tag.id, editValue);
                          setEditingId(null);
                        }}
                      >
                        <input
                          className={ui.input}
                          value={editValue}
                          onChange={(event) => setEditValue(event.target.value)}
                          aria-label={`Rename ${tag.name}`}
                          autoFocus
                        />
                        <button type="submit" className={`${ui.btn} ${ui.btnSmall}`}>
                          Save
                        </button>
                        <button
                          type="button"
                          className={`${ui.btn} ${ui.btnSmall}`}
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className={styles.manageMain}>
                          <Link className={ui.mono} to={`/tags/${tag.id}`} style={{ fontSize: 'var(--text-sm)' }}>
                            {tag.name}
                          </Link>
                          <span className={page.indexCount}>{count}</span>
                        </div>
                        <div className={styles.manageActions}>
                          <button
                            type="button"
                            className={`${ui.btn} ${ui.btnSmall}`}
                            onClick={() => {
                              setEditingId(tag.id);
                              setEditValue(tag.name);
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            className={`${ui.btn} ${ui.btnSmall} ${ui.btnDanger}`}
                            onClick={() => setPending({ id: tag.id, name: tag.name, count })}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={pending !== null}
        title="Delete tag?"
        description={
          pending
            ? `"${pending.name}" will be removed from the ${pending.count} ${
                pending.count === 1 ? 'website' : 'websites'
              } carrying it. The websites themselves stay in your library.`
            : ''
        }
        confirmLabel="Delete tag"
        danger
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) {
            deleteTag(pending.id);
            notify(`Tag "${pending.name}" was deleted.`);
          }
          setPending(null);
        }}
      />
    </>
  );
}
