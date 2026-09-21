/**
 * URL handling. The app never fetches remote pages, so titles and favicons are
 * derived from the URL itself rather than scraped.
 */

const SEARCH_ENGINE = 'https://www.google.com/search?q=';

export function normaliseUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z]+:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isProbablyUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  if (trimmed.startsWith('localhost')) return true;
  return /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(trimmed);
}

export function parseUrl(input: string): URL | null {
  try {
    return new URL(normaliseUrl(input));
  } catch {
    return null;
  }
}

export function domainFromUrl(input: string): string {
  const url = parseUrl(input);
  if (!url) return '';
  return url.hostname.replace(/^www\./, '');
}

export function searchUrl(query: string): string {
  return `${SEARCH_ENGINE}${encodeURIComponent(query)}`;
}

/** Turn an address bar entry into either a destination URL or a web search. */
export function resolveAddressBarInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return isProbablyUrl(trimmed) ? normaliseUrl(trimmed) : searchUrl(trimmed);
}

const WORD_OVERRIDES: Record<string, string> = {
  api: 'API',
  css: 'CSS',
  html: 'HTML',
  js: 'JS',
  ts: 'TS',
  ui: 'UI',
  ux: 'UX',
  sdk: 'SDK',
  cli: 'CLI',
  ai: 'AI',
  faq: 'FAQ',
  mdn: 'MDN',
  npm: 'npm',
};

function titleiseWord(word: string): string {
  const lower = word.toLowerCase();
  if (WORD_OVERRIDES[lower]) return WORD_OVERRIDES[lower];
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function titleiseSlug(slug: string): string {
  return slug
    .replace(/\.(html?|php|aspx?)$/i, '')
    .split(/[-_+.]/)
    .filter(Boolean)
    .map(titleiseWord)
    .join(' ');
}

/**
 * Best-effort title suggested from a URL. Cross-origin pages cannot be read
 * from the browser, so the UI presents this as a suggestion the user can edit.
 */
export function suggestTitleFromUrl(input: string): string {
  const url = parseUrl(input);
  if (!url) return '';

  const segments = url.pathname.split('/').filter(Boolean);
  const host = url.hostname.replace(/^www\./, '');
  const hostLabel = titleiseSlug(host.split('.')[0] ?? host);

  if (segments.length === 0) return hostLabel;

  const last = segments[segments.length - 1];
  const leaf = titleiseSlug(decodeURIComponent(last));
  if (!leaf || /^\d+$/.test(leaf)) return hostLabel;
  return `${leaf} - ${hostLabel}`;
}

/** Two letters used for the built-in monogram shown in place of a favicon. */
export function monogramFor(domainOrTitle: string): string {
  const cleaned = domainOrTitle.replace(/^www\./, '').trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/[\s.\-_]+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Remote favicon lookup is opt-in: it tells a third party which sites are in
 * the library, so it stays off until the user turns it on in Settings.
 */
export function remoteFaviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

export function prettyUrl(input: string): string {
  const url = parseUrl(input);
  if (!url) return input;
  const path = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '');
  return `${url.hostname.replace(/^www\./, '')}${path}`;
}
