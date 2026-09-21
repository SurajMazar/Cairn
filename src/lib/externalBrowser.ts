/**
 * Handing a link to Brave.
 *
 * A web page cannot choose which browser opens a link. What it can do is ask
 * the operating system to handle a Brave specific URL, which works when the
 * current browser is willing to pass it on (Brave on iOS, an Android intent,
 * or a non Chromium browser on the desktop). Chromium based browsers block
 * navigation to their own internal schemes, so the attempt quietly does
 * nothing there.
 *
 * Because success cannot be detected, every caller also puts the plain URL on
 * the clipboard, so there is always a way to finish the job by hand.
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

/**
 * Navigate without tripping the popup blocker or the "address is invalid"
 * alert an unhandled scheme can raise. A hidden frame absorbs both.
 */
function tryScheme(link: string): void {
  const frame = document.createElement('iframe');
  frame.style.display = 'none';
  frame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(frame);
  try {
    if (frame.contentWindow) frame.contentWindow.location.href = link;
    else window.location.href = link;
  } catch {
    /* the caller's fallback handles it */
  }
  window.setTimeout(() => frame.remove(), 1500);
}

export function braveLinkFor(rawUrl: string): string {
  const url = parseUrl(rawUrl);
  if (!url) return rawUrl;

  if (isAndroid()) {
    const withoutScheme = `${url.host}${url.pathname}${url.search}${url.hash}`;
    return (
      `intent://${withoutScheme}#Intent;scheme=${url.protocol.replace(':', '')};` +
      `package=com.brave.browser;S.browser_fallback_url=${encodeURIComponent(url.href)};end`
    );
  }

  return `brave://open-url?url=${encodeURIComponent(url.href)}`;
}

/** Best effort. There is no way to learn whether the handoff succeeded. */
export function requestBrave(rawUrl: string): void {
  const link = braveLinkFor(rawUrl);
  const frame = document.createElement('iframe');
  frame.style.display = 'none';
  frame.setAttribute('aria-hidden', 'true');
  document.body.appendChild(frame);
  try {
    if (frame.contentWindow) frame.contentWindow.location.href = link;
    else window.location.href = link;
  } catch {
    try {
      window.location.href = link;
    } catch {
      /* the clipboard copy is the fallback */
    }
  }
  window.setTimeout(() => frame.remove(), 1500);
}

/**
 * Push a link out to the system's own browser instead of the in-app web view.
 *
 * This matters inside an installed web app. On iOS a Home Screen app is its own
 * WebKit container, so Safari's content blockers do not apply to anything it
 * opens; getting the link into Safari proper is what makes an ad blocker work
 * again. There is no standard API for it, so each platform gets the nearest
 * thing it has:
 *
 * - iOS: the x-safari-https scheme, which the system routes to Safari.
 * - Android: an intent with no package named, so the system hands it to
 *   whichever browser is set as default.
 * - Everywhere else: a normal new tab, which is already the default browser.
 *
 * None of these report success, so if the page is still in front after a
 * moment, the handoff is assumed to have failed and the link is opened
 * normally. Same-window navigation is used for that fallback because a
 * deferred window.open is treated as a popup and blocked.
 */
export function openInSystemBrowser(rawUrl: string): void {
  const url = parseUrl(rawUrl);
  if (!url) return;

  if (!isIos() && !isAndroid()) {
    window.open(url.href, '_blank', 'noopener,noreferrer');
    return;
  }

  const rest = `${url.host}${url.pathname}${url.search}${url.hash}`;
  const link = isIos()
    ? `x-safari-${url.protocol.replace(':', '')}://${rest}`
    : `intent://${rest}#Intent;scheme=${url.protocol.replace(':', '')};` +
      `S.browser_fallback_url=${encodeURIComponent(url.href)};end`;

  let handedOff = false;
  const markHandedOff = () => {
    handedOff = true;
  };
  document.addEventListener('visibilitychange', markHandedOff, { once: true });
  window.addEventListener('pagehide', markHandedOff, { once: true });

  tryScheme(link);

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', markHandedOff);
    window.removeEventListener('pagehide', markHandedOff);
    if (handedOff || document.hidden) return;
    window.location.href = url.href;
  }, 1200);
}
