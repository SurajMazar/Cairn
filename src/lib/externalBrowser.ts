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
