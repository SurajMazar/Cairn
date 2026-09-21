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

/*
  iOS puts a confirmation in the way ("Open in Brave?"), and an unregistered
  scheme raises an error alert. Both leave the page visible with no reliable
  event, so a timer cannot tell a refused handoff from one the user has simply
  not confirmed yet. The grace period is long enough to cover a deliberate tap.
*/
const HANDOFF_GRACE_MS = 2500;

/**
 * Attempt `link`, and report back if the page is still in front afterwards.
 *
 * Deliberately does not navigate on its own. An automatic fallback would race
 * the system confirmation dialog and yank the page out from under someone who
 * was about to accept it, so the caller is told instead and offers the choice.
 */
function handOff(link: string, onUnclaimed?: () => void): void {
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
    /* onUnclaimed covers it */
  }

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', markLeft);
    window.removeEventListener('pagehide', markLeft);
    window.removeEventListener('blur', markLeft);
    if (left || document.hidden) return;
    onUnclaimed?.();
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

export function requestBrave(rawUrl: string, onUnclaimed?: () => void): void {
  const url = parseUrl(rawUrl);
  if (!url) return;
  handOff(braveLinkFor(url.href), onUnclaimed);
}

/**
 * Push a link out to the system's own browser instead of the in-app web view.
 *
 * This matters inside an installed web app, which is its own browser container:
 * content blockers and logins from the real browser do not reach anything it
 * opens. On iOS the x-safari-https scheme targets Safari specifically, since no
 * scheme exists for "whatever the default browser is".
 */
export function openInSystemBrowser(rawUrl: string, onUnclaimed?: () => void): void {
  const url = parseUrl(rawUrl);
  if (!url) return;

  if (!isMobile()) {
    window.open(url.href, '_blank', 'noopener,noreferrer');
    return;
  }

  const link = isIos()
    ? `x-safari-${url.protocol.replace(':', '')}://${url.host}${url.pathname}${url.search}${url.hash}`
    : androidIntent(url);

  handOff(link, onUnclaimed);
}
