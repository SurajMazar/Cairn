import { useCallback } from 'react';
import type { Bookmark } from '../types';
import { useLibrary } from '../context/LibraryContext';
import { useUi } from '../context/UiContext';
import { copyText } from '../lib/clipboard';
import { requestBrave } from '../lib/externalBrowser';

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
   * The handoff cannot be confirmed, so the address goes to the clipboard at
   * the same time and the message says so rather than claiming success.
   */
  const openInBrave = useCallback(
    async (bookmark: Bookmark) => {
      const copied = await copyText(bookmark.url);
      recordVisit(bookmark.id);
      requestBrave(bookmark.url);
      notify(
        copied
          ? 'Handing the link to Brave. It is on your clipboard if nothing opens.'
          : 'Handing the link to Brave.',
      );
    },
    [notify, recordVisit],
  );

  return { copyLink, openInBrave };
}
