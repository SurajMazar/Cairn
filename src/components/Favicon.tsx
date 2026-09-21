import { useEffect, useState } from 'react';
import { useLibrary } from '../context/LibraryContext';
import { monogramFor, remoteFaviconUrl } from '../lib/url';
import ui from '../styles/ui.module.css';

interface FaviconProps {
  domain: string;
  title?: string;
  large?: boolean;
}

/**
 * Shows a letter mark by default. Fetching a real favicon tells a third party
 * which sites are saved, so it only happens when the user opts in.
 */
export function Favicon({ domain, title, large = false }: FaviconProps) {
  const { preferences } = useLibrary();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [domain, preferences.loadRemoteFavicons]);

  const showRemote = preferences.loadRemoteFavicons && domain && !failed;

  return (
    <span className={`${ui.mark} ${large ? ui.markLarge : ''}`} aria-hidden="true">
      {showRemote ? (
        <img
          className={ui.markImg}
          src={remoteFaviconUrl(domain)}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        monogramFor(domain || title || '?')
      )}
    </span>
  );
}
