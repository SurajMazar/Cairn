import { useEffect, useId, useMemo, useState } from 'react';
import type { Bookmark } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { Dialog } from './Dialog';
import { Favicon } from './Favicon';
import { TagInput } from './TagInput';
import { domainFromUrl, isProbablyUrl, normaliseUrl, suggestTitleFromUrl } from '../lib/url';
import styles from './form.module.css';
import ui from '../styles/ui.module.css';

export interface BookmarkFormPrefill {
  url?: string;
  title?: string;
  description?: string;
}

interface BookmarkFormDialogProps {
  open: boolean;
  bookmark: Bookmark | null;
  prefill?: BookmarkFormPrefill;
  onClose: () => void;
  onSaved: (message: string) => void;
}

const NEW_CATEGORY = '__new__';

export function BookmarkFormDialog({
  open,
  bookmark,
  prefill,
  onClose,
  onSaved,
}: BookmarkFormDialogProps) {
  const { categories, tags, createBookmark, updateBookmark, createCategory, ensureTags } = useLibrary();
  const fieldId = useId();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState('');

  const tagNameById = useMemo(() => new Map(tags.map((tag) => [tag.id, tag.name])), [tags]);

  // Reset the form each time it opens rather than leaving stale values behind.
  useEffect(() => {
    if (!open) return;
    setError('');
    if (bookmark) {
      setUrl(bookmark.url);
      setTitle(bookmark.title);
      setTitleTouched(true);
      setDescription(bookmark.description ?? '');
      setCategoryId(bookmark.categoryId ?? '');
      setTagNames(bookmark.tagIds.map((id) => tagNameById.get(id)).filter((name): name is string => Boolean(name)));
      setIsFavorite(bookmark.isFavorite);
    } else {
      setUrl(prefill?.url ?? '');
      setTitle(prefill?.title ?? (prefill?.url ? suggestTitleFromUrl(prefill.url) : ''));
      setTitleTouched(Boolean(prefill?.title));
      setDescription(prefill?.description ?? '');
      setCategoryId('');
      setTagNames([]);
      setIsFavorite(false);
    }
    setNewCategory('');
  }, [open, bookmark, prefill, tagNameById]);

  const domain = domainFromUrl(url);

  /** Titles cannot be read from a cross-origin page, so they are suggested
   *  from the URL until the user types their own. */
  const onUrlBlur = () => {
    if (!url.trim() || titleTouched || title.trim()) return;
    const suggested = suggestTitleFromUrl(url);
    if (suggested) setTitle(suggested);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('A URL is required.');
      return;
    }
    if (!isProbablyUrl(trimmedUrl)) {
      setError('That does not look like a web address. Try something like example.com/page.');
      return;
    }

    let resolvedCategory = categoryId;
    if (categoryId === NEW_CATEGORY) {
      const created = createCategory(newCategory);
      if (!created) {
        setError('Give the new category a name, or choose an existing one.');
        return;
      }
      resolvedCategory = created.id;
    }

    const tagIds = ensureTags(tagNames);
    const finalTitle = title.trim() || suggestTitleFromUrl(trimmedUrl) || domainFromUrl(trimmedUrl);

    if (bookmark) {
      updateBookmark(bookmark.id, {
        url: normaliseUrl(trimmedUrl),
        title: finalTitle,
        description,
        categoryId: resolvedCategory,
        tagIds,
        isFavorite,
      });
      onSaved(`Saved changes to ${finalTitle}.`);
    } else {
      createBookmark({
        url: normaliseUrl(trimmedUrl),
        title: finalTitle,
        description,
        categoryId: resolvedCategory,
        tagIds,
        isFavorite,
      });
      onSaved(`${finalTitle} was added to your library.`);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      variant="side"
      title={bookmark ? 'Edit website' : 'Add website'}
      subtitle={
        bookmark
          ? 'Changes move this website to the top of Recently updated.'
          : 'Saved to this browser only. Nothing is sent anywhere.'
      }
      footer={
        <>
          <button type="button" className={ui.btn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" form={`${fieldId}-form`} className={`${ui.btn} ${ui.btnPrimary}`}>
            {bookmark ? 'Save changes' : 'Save website'}
          </button>
        </>
      }
    >
      <form id={`${fieldId}-form`} className={styles.form} onSubmit={submit} noValidate>
        <div className={ui.field}>
          <label className={ui.label} htmlFor={`${fieldId}-url`}>
            URL
          </label>
          <input
            id={`${fieldId}-url`}
            className={ui.input}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onBlur={onUrlBlur}
            placeholder="https://example.com"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            required
          />
          {error ? <p className={ui.error}>{error}</p> : null}
        </div>

        {domain ? (
          <div className={styles.preview}>
            <Favicon domain={domain} title={title} />
            <div className={styles.previewText}>
              <div className={styles.previewTitle}>{title || 'Untitled'}</div>
              <div className={styles.previewDomain}>{domain}</div>
            </div>
          </div>
        ) : null}

        <div className={ui.field}>
          <label className={ui.label} htmlFor={`${fieldId}-title`}>
            Title
          </label>
          <input
            id={`${fieldId}-title`}
            className={ui.input}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleTouched(true);
            }}
            placeholder="Example Website"
          />
          <p className={ui.hint}>Suggested from the address. Edit it to whatever you will search for later.</p>
        </div>

        <div className={ui.field}>
          <label className={ui.label} htmlFor={`${fieldId}-description`}>
            Description
          </label>
          <textarea
            id={`${fieldId}-description`}
            className={ui.textarea}
            style={{ minHeight: '4.5rem' }}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What is this website useful for?"
          />
        </div>

        <div className={ui.field}>
          <label className={ui.label} htmlFor={`${fieldId}-category`}>
            Category
          </label>
          <select
            id={`${fieldId}-category`}
            className={ui.select}
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
            <option value={NEW_CATEGORY}>Create a new category</option>
          </select>
          {categoryId === NEW_CATEGORY ? (
            <div className={styles.inlineCreate}>
              <input
                className={ui.input}
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Category name"
                aria-label="New category name"
                autoFocus
              />
            </div>
          ) : null}
        </div>

        <div className={ui.field}>
          <label className={ui.label} htmlFor={`${fieldId}-tags`}>
            Tags
          </label>
          <TagInput id={`${fieldId}-tags`} value={tagNames} onChange={setTagNames} />
        </div>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={isFavorite}
            onChange={(event) => setIsFavorite(event.target.checked)}
          />
          <span>
            <span className={styles.checkboxLabel}>Favorite</span>
            <br />
            <span className={styles.checkboxHint}>Keep this website one click away.</span>
          </span>
        </label>
      </form>
    </Dialog>
  );
}
