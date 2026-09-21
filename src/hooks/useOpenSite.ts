import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import type { Bookmark } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { openInSystemBrowser } from '../lib/externalBrowser';

/** True when running as an installed app rather than inside a browser tab. */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    // iOS reports installed web apps here rather than through display-mode.
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Opening a saved site records the visit. `lastVisitedAt` moves, `updatedAt`
 * does not, because reading something is not editing it.
 *
 * Where the site opens is the user's choice, because it matters most when the
 * library is installed as an app: a new tab hands off to an in-app browser on
 * both Android and current iOS, while navigating in place keeps a single
 * window and relies on the back gesture to return.
 */
export function useOpenSite() {
  const { recordVisit, preferences } = useLibrary();

  return useCallback(
    (bookmark: Bookmark) => {
      if (preferences.openLinksIn === 'systemBrowser') {
        // Same reason as below: the window may be handed away before a normal
        // render would have committed the visit.
        flushSync(() => recordVisit(bookmark.id));
        openInSystemBrowser(bookmark.url);
        return;
      }
      if (preferences.openLinksIn === 'sameTab') {
        // Force the visit to reach localStorage before the window is handed
        // to another page, since this render may otherwise never commit.
        flushSync(() => recordVisit(bookmark.id));
        window.location.href = bookmark.url;
        return;
      }
      recordVisit(bookmark.id);
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    },
    [recordVisit, preferences.openLinksIn],
  );
}
