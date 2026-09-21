import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { CollectionView } from '../components/CollectionView';
import { Icon } from '../components/Icon';
import page from '../styles/page.module.css';
import ui from '../styles/ui.module.css';

function Header({
  kicker,
  title,
  lede,
  back,
}: {
  kicker?: string;
  title: string;
  lede?: string;
  back?: { to: string; label: string };
}) {
  return (
    <header className={page.header}>
      {back ? (
        <Link className={page.backLink} to={back.to}>
          <Icon name="back" size={13} />
          {back.label}
        </Link>
      ) : null}
      {kicker ? <p className={page.kicker}>{kicker}</p> : null}
      <h1 className={page.title}>{title}</h1>
      {lede ? <p className={page.lede}>{lede}</p> : null}
    </header>
  );
}

function AddButton() {
  const { openAddBookmark } = useUi();
  return (
    <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => openAddBookmark()}>
      Add a website
    </button>
  );
}

export function AllBookmarksPage() {
  const { bookmarks } = useLibrary();
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';

  return (
    <>
      <Header
        title="All bookmarks"
        lede="Everything you have saved. Search reaches titles, addresses, descriptions, categories, tags and the text of every note."
      />
      <CollectionView
        bookmarks={bookmarks}
        initialQuery={query}
        emptyTitle="Your library is empty."
        emptyBody="Save websites while you are browsing and they will appear here."
        emptyAction={<AddButton />}
      />
    </>
  );
}

export function FavoritesPage() {
  const { bookmarks } = useLibrary();
  const favorites = useMemo(() => bookmarks.filter((bookmark) => bookmark.isFavorite), [bookmarks]);

  return (
    <>
      <Header title="Favorites" lede="The websites you keep coming back to." />
      <CollectionView
        bookmarks={favorites}
        emptyTitle="No favorites yet."
        emptyBody="Star websites you want quick access to and they will collect here."
        emptyAction={
          <Link className={ui.btn} to="/bookmarks">
            Browse all bookmarks
          </Link>
        }
      />
    </>
  );
}

export function RecentlyUpdatedPage() {
  const { bookmarks } = useLibrary();

  return (
    <>
      <Header
        title="Recently updated"
        lede="What you have been working with lately. Editing a website or writing a note moves it back to the top."
      />
      <CollectionView
        bookmarks={bookmarks}
        fixedSort="updated"
        fixedSortNote="Ordered by when each website was last changed."
        emptyTitle="Nothing here yet."
        emptyBody="Once you save a website or write a note, it will appear at the top of this list."
        emptyAction={<AddButton />}
      />
    </>
  );
}

export function RecentlyVisitedPage() {
  const { bookmarks } = useLibrary();
  const visited = useMemo(() => bookmarks.filter((bookmark) => bookmark.lastVisitedAt), [bookmarks]);

  return (
    <>
      <Header
        title="Recently visited"
        lede="Websites you have opened from the library. Opening something does not count as changing it, so this list is separate from Recently updated."
      />
      <CollectionView
        bookmarks={visited}
        fixedSort="visited"
        fixedSortNote="Ordered by when you last opened each website."
        emptyTitle="Nothing opened yet."
        emptyBody="Open a saved website and it will be listed here so you can pick up where you left off."
        emptyAction={
          <Link className={ui.btn} to="/bookmarks">
            Browse all bookmarks
          </Link>
        }
      />
    </>
  );
}

export function CategoryPage() {
  const { categoryId = '' } = useParams();
  const { bookmarks, categoryById } = useLibrary();
  const category = categoryById.get(categoryId);
  const scoped = useMemo(
    () => bookmarks.filter((bookmark) => bookmark.categoryId === categoryId),
    [bookmarks, categoryId],
  );

  if (!category) {
    return (
      <>
        <Header title="Category not found" back={{ to: '/categories', label: 'Categories' }} />
        <p className={page.lede}>This category is no longer in your library.</p>
      </>
    );
  }

  return (
    <>
      <Header
        kicker="Category"
        title={category.name}
        lede={`${scoped.length} ${scoped.length === 1 ? 'website' : 'websites'} in this category.`}
        back={{ to: '/categories', label: 'Categories' }}
      />
      <CollectionView
        bookmarks={scoped}
        lockedCategoryId={categoryId}
        emptyTitle="This category is empty."
        emptyBody="Assign a website to this category from the add or edit form."
        emptyAction={<AddButton />}
      />
    </>
  );
}

export function TagPage() {
  const { tagId = '' } = useParams();
  const { bookmarks, tagById } = useLibrary();
  const tag = tagById.get(tagId);
  const scoped = useMemo(
    () => bookmarks.filter((bookmark) => bookmark.tagIds.includes(tagId)),
    [bookmarks, tagId],
  );

  if (!tag) {
    return (
      <>
        <Header title="Tag not found" back={{ to: '/tags', label: 'Tags' }} />
        <p className={page.lede}>This tag is no longer in your library.</p>
      </>
    );
  }

  return (
    <>
      <Header
        kicker="Tag"
        title={tag.name}
        lede={`${scoped.length} ${scoped.length === 1 ? 'website carries' : 'websites carry'} this tag.`}
        back={{ to: '/tags', label: 'Tags' }}
      />
      <CollectionView
        bookmarks={scoped}
        lockedTagId={tagId}
        emptyTitle="Nothing carries this tag."
        emptyBody="Add the tag to a website from the add or edit form."
        emptyAction={<AddButton />}
      />
    </>
  );
}
