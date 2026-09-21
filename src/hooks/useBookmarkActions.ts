import { useCallback } from 'react';
import type { Bookmark } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { copyText } from '../lib/clipboard';
import { openInSystemBrowser, requestBrave } from '../lib/externalBrowser';

export function useBookmarkActions() {
  const { recordVisit } = useLibrary();
  const { notify } = useUi();

  const copyLink = useCallback(
    async (bookmark: Bookmark) => {
      const ok = await copyText(bookmark.url);
      notify(ok ? 'Link copied.' : 'This browser would not give access to the clipboard.');
    },
    [notify],
  );

  /**
   * Nothing confirms a handoff, so instead of guessing, an unclaimed link comes
   * back here and is offered plainly rather than opened behind the user's back.
   */
  const offerFallback = useCallback(
    (bookmark: Bookmark, target: string) => {
      notify(`${target} did not take the link.`, {
        label: 'Open here',
        onClick: () => {
          window.location.href = bookmark.url;
        },
      });
    },
    [notify],
  );

  const openInBrave = useCallback(
    (bookmark: Bookmark) => {
      recordVisit(bookmark.id);
      requestBrave(bookmark.url, () => offerFallback(bookmark, 'Brave'));
    },
    [recordVisit, offerFallback],
  );

  const openInDefaultBrowser = useCallback(
    (bookmark: Bookmark) => {
      recordVisit(bookmark.id);
      openInSystemBrowser(bookmark.url, () => offerFallback(bookmark, 'Your browser'));
    },
    [recordVisit, offerFallback],
  );

  return { copyLink, openInBrave, openInDefaultBrowser };
}
