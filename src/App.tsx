import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LibraryProvider } from './context/LibraryContext';
import { UiProvider } from './context/UiContext';
import { AppShell } from './components/AppShell';
import { ThemeController } from './components/ThemeController';
import { HomePage } from './pages/HomePage';
import {
  AllBookmarksPage,
  CategoryPage,
  FavoritesPage,
  RecentlyUpdatedPage,
  RecentlyVisitedPage,
  TagPage,
} from './pages/CollectionPages';
import { CategoriesPage, TagsPage } from './pages/TaxonomyPages';
import { BookmarkDetailPage } from './pages/BookmarkDetailPage';
import { WebPage } from './pages/WebPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <LibraryProvider>
      <ThemeController />
      <UiProvider>
        {/* Hash routing keeps deep links working from any static host. */}
        <HashRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/bookmarks" element={<AllBookmarksPage />} />
              <Route path="/bookmarks/:bookmarkId" element={<BookmarkDetailPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/recent" element={<RecentlyUpdatedPage />} />
              <Route path="/visited" element={<RecentlyVisitedPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/categories/:categoryId" element={<CategoryPage />} />
              <Route path="/tags" element={<TagsPage />} />
              <Route path="/tags/:tagId" element={<TagPage />} />
              <Route path="/web" element={<WebPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/index.html" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </UiProvider>
    </LibraryProvider>
  );
}
