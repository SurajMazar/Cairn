/**
 * Handing a link to another browser.
 *
 * A web page cannot choose which browser opens a link. What it can do is ask
 * the operating system to handle a browser-specific URL and hope something
 * claims it. Two things decide whether that works at all:
 *
 * - The navigation has to be top level and inside the user gesture. WebKit and
 *   Chromium both block custom scheme navigation from a hidden iframe, which is
 *   the technique most of the snippets on the web still use.
 * - Chromium based browsers refuse navigation to their own internal schemes
 *   from web content, so `brave://` cannot work from inside Brave or Chrome on
 *   the desktop. Nothing can be done about that.
 *
 * Success is not observable, so every handoff arms a fallback: if the page is
 * still in front shortly afterwards, nothing claimed the link and it is opened
 * normally instead. That way the action is never a no-op.
 */
import { parseUrl } from './url';

function isAndroid(): boolean {
  return /android/i.test(navigator.userAgent);
}

function isIos(): boolean {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
  // iPadOS reports itself as a Mac, and is told apart by the touch points.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
}

export function isMobile(): boolean {
  return isIos() || isAndroid();
}

const HANDOFF_GRACE_MS = 1200;

/**
 * Attempt `link`, and fall back to `fallbackUrl` if the page never goes away.
 * The fallback navigates rather than calling window.open, because by then the
 * user gesture has expired and a popup would be blocked.
 */
function handOff(link: string, fallbackUrl: string): void {
  let left = false;
  const markLeft = () => {
    left = true;
  };
  document.addEventListener('visibilitychange', markLeft, { once: true });
  window.addEventListener('pagehide', markLeft, { once: true });
  window.addEventListener('blur', markLeft, { once: true });

  try {
    window.location.href = link;
  } catch {
    /* the fallback below covers it */
  }

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', markLeft);
    window.removeEventListener('pagehide', markLeft);
    window.removeEventListener('blur', markLeft);
    if (left || document.hidden) return;
    window.location.href = fallbackUrl;
  }, HANDOFF_GRACE_MS);
}

/** An Android intent, optionally pinned to one browser package. */
function androidIntent(url: URL, packageName?: string): string {
  const rest = `${url.host}${url.pathname}${url.search}${url.hash}`;
  const scheme = url.protocol.replace(':', '');
  const pkg = packageName ? `package=${packageName};` : '';
  return (
    `intent://${rest}#Intent;scheme=${scheme};${pkg}` +
    `S.browser_fallback_url=${encodeURIComponent(url.href)};end`
  );
}

export function braveLinkFor(rawUrl: string): string {
  const url = parseUrl(rawUrl);
  if (!url) return rawUrl;
  if (isAndroid()) return androidIntent(url, 'com.brave.browser');
  return `brave://open-url?url=${encodeURIComponent(url.href)}`;
}

/**
 * Brave cannot be reached from a Chromium based desktop browser, since it
 * blocks navigation to brave:// from web content. The menu uses this to avoid
 * offering an action that provably cannot work.
 */
export function canRequestBrave(): boolean {
  return isMobile();
}

export function requestBrave(rawUrl: string): void {
  const url = parseUrl(rawUrl);
  if (!url) return;
  handOff(braveLinkFor(url.href), url.href);
}

/**
 * Push a link out to the system's own browser instead of the in-app web view.
 *
 * This matters inside an installed web app, which is its own browser container:
 * content blockers and logins from the real browser do not reach anything it
 * opens. On iOS the x-safari-https scheme targets Safari specifically, since no
 * scheme exists for "whatever the default browser is".
 */
export function openInSystemBrowser(rawUrl: string): void {
  const url = parseUrl(rawUrl);
  if (!url) return;

  if (!isMobile()) {
    window.open(url.href, '_blank', 'noopener,noreferrer');
    return;
  }

  const link = isIos()
    ? `x-safari-${url.protocol.replace(':', '')}://${url.host}${url.pathname}${url.search}${url.hash}`
    : androidIntent(url);

  handOff(link, url.href);
}
