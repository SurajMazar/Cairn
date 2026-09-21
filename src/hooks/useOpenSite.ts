import { useCallback } from 'react';
import type { Bookmark } from '../types';
import { useLibrary } from '../context/LibraryContext';

/**
 * Opening a saved site records the visit. `lastVisitedAt` moves, `updatedAt`
 * does not, because reading something is not editing it.
 */
export function useOpenSite() {
  const { recordVisit } = useLibrary();
  return useCallback(
    (bookmark: Bookmark) => {
      recordVisit(bookmark.id);
      window.open(bookmark.url, '_blank', 'noopener,noreferrer');
    },
    [recordVisit],
  );
}
