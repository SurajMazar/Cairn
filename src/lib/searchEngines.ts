/**
 * Web search targets.
 *
 * Google is the default, with a caveat worth knowing on a phone: the Google
 * iOS and Android apps claim google.com/search as a deep link, so the system
 * can hand a search to the app instead of opening a browser tab, and a page
 * has no way to refuse that. The other engines here are not claimed by an
 * installed app, so they always land in a tab.
 */
export type SearchEngineId = 'google' | 'brave' | 'duckduckgo' | 'startpage';

interface SearchEngine {
  id: SearchEngineId;
  label: string;
  prefix: string;
  /** True when an installed app may intercept the search on a phone. */
  appIntercepts: boolean;
}

export const SEARCH_ENGINES: Record<SearchEngineId, SearchEngine> = {
  google: {
    id: 'google',
    label: 'Google',
    prefix: 'https://www.google.com/search?q=',
    appIntercepts: true,
  },
  brave: {
    id: 'brave',
    label: 'Brave Search',
    prefix: 'https://search.brave.com/search?q=',
    appIntercepts: false,
  },
  duckduckgo: {
    id: 'duckduckgo',
    label: 'DuckDuckGo',
    prefix: 'https://duckduckgo.com/?q=',
    appIntercepts: false,
  },
  startpage: {
    id: 'startpage',
    label: 'Startpage',
    prefix: 'https://www.startpage.com/sp/search?query=',
    appIntercepts: false,
  },
};

export const SEARCH_ENGINE_IDS = Object.keys(SEARCH_ENGINES) as SearchEngineId[];

export function buildSearchUrl(engine: SearchEngineId, query: string): string {
  const target = SEARCH_ENGINES[engine] ?? SEARCH_ENGINES.google;
  return `${target.prefix}${encodeURIComponent(query.trim())}`;
}

/**
 * Open a web search in a new browser tab.
 *
 * `noopener` keeps the new page from reaching back into this one, and matters
 * more than usual here because the destination is arbitrary.
 */
export function openSearch(engine: SearchEngineId, query: string): void {
  window.open(buildSearchUrl(engine, query), '_blank', 'noopener,noreferrer');
}
