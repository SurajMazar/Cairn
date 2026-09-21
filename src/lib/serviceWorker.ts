/**
 * Service worker registration and the update handshake.
 *
 * A new worker installs in the background and then waits. Nothing is swapped
 * until the user accepts, at which point the waiting worker is told to take
 * over and the page reloads once it has. That avoids a half-updated app, and
 * it means an update never interrupts what someone is in the middle of.
 */
export const BUILD_ID = __BUILD_ID__;

type UpdateListener = (ready: boolean) => void;

const listeners = new Set<UpdateListener>();
let registration: ServiceWorkerRegistration | null = null;
let waiting: ServiceWorker | null = null;
let reloading = false;

/** Re-check this often while the app stays open. */
const POLL_MS = 60 * 60 * 1000;

function announce(ready: boolean): void {
  listeners.forEach((listener) => listener(ready));
}

export function onUpdateReady(listener: UpdateListener): () => void {
  listeners.add(listener);
  if (waiting) listener(true);
  return () => {
    listeners.delete(listener);
  };
}

export function isUpdateReady(): boolean {
  return waiting !== null;
}

function trackWaiting(worker: ServiceWorker | null): void {
  // An update only matters if a worker is already in control. On a first ever
  // visit the new worker is the only one, and there is nothing to replace.
  if (!worker || !navigator.serviceWorker.controller) return;
  waiting = worker;
  announce(true);
}

export function isSupported(): boolean {
  return 'serviceWorker' in navigator;
}

export async function registerServiceWorker(): Promise<void> {
  if (!isSupported()) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });

  try {
    // The build id in the URL is what makes a new deploy visible to the
    // browser, which otherwise byte-compares an unchanged sw.js and concludes
    // there is nothing to do.
    const reg = await navigator.serviceWorker.register(
      `${import.meta.env.BASE_URL}sw.js?v=${encodeURIComponent(BUILD_ID)}`,
    );
    registration = reg;
    trackWaiting(reg.waiting);

    reg.addEventListener('updatefound', () => {
      const installing = reg.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed') trackWaiting(installing);
      });
    });

    window.setInterval(() => {
      void reg.update();
    }, POLL_MS);

    // Coming back to a backgrounded app is the natural moment to look again.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void reg.update();
    });
  } catch {
    // Offline support is a bonus; the app works fine without it.
  }
}

export type UpdateCheck = 'unsupported' | 'update' | 'current' | 'failed';

export async function checkForUpdate(): Promise<UpdateCheck> {
  if (!isSupported()) return 'unsupported';
  if (!registration) return 'unsupported';
  try {
    await registration.update();
    if (registration.waiting) trackWaiting(registration.waiting);
    return waiting ? 'update' : 'current';
  } catch {
    return 'failed';
  }
}

/** Hand over to the waiting worker. The controllerchange listener reloads. */
export function applyUpdate(): void {
  if (!waiting) {
    window.location.reload();
    return;
  }
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

export function dismissUpdate(): void {
  announce(false);
}

if (import.meta.env.DEV) {
  // Lets the update bar be exercised without a production build, where
  // service workers are not registered at all.
  window.addEventListener('cairn:simulate-update', () => announce(true));
}

/**
 * Last resort for a copy that is stuck on an old build: drop every cache,
 * unregister the worker and reload from the network. The library is in
 * localStorage and is not touched.
 */
export async function hardRefresh(): Promise<void> {
  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if (isSupported()) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((item) => item.unregister()));
    }
  } catch {
    /* reload anyway */
  }
  reloading = true;
  window.location.reload();
}
