import { useEffect } from 'react';
import { useLibrary } from '../context/LibraryContext';

/** Applies the theme choice to the document, following the system when asked. */
export function ThemeController() {
  const { preferences } = useLibrary();

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && media.matches);
      root.setAttribute('data-theme', dark ? 'dark' : 'light');
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#191816' : '#f6f3ed');
    };

    apply();
    if (preferences.theme !== 'system') return undefined;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [preferences.theme]);

  return null;
}
