import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * A stable identity for the deployed build.
 *
 * The service worker is registered with this as a query parameter, because the
 * browser decides whether a worker has changed by byte-comparing the script.
 * sw.js is a static file whose contents never differ between builds, so without
 * this no update would ever be detected and the app could only be updated by
 * reinstalling it.
 */
function buildId(): string {
  const fromCi = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA;
  if (fromCi) return fromCi.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return Date.now().toString(36);
  }
}

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_ID__: JSON.stringify(buildId()),
  },
  server: { port: 5173 },
});
