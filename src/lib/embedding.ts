/**
 * Sites known to refuse being framed.
 *
 * A page cannot reliably detect that a frame was refused: the browser fires
 * `load` either way and keeps the frame cross-origin, so there is nothing to
 * read. This list therefore front-runs the common cases, and the preview
 * always carries a visible way out for anything it misses.
 */
const NEVER_EMBEDS = [
  'google.com',
  'www.google.com',
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'x.com',
  'twitter.com',
  'linkedin.com',
  'github.com',
  'amazon.com',
  'reddit.com',
  'medium.com',
  'notion.so',
  'figma.com',
  'netflix.com',
  'stackoverflow.com',
  'developer.mozilla.org',
  'react.dev',
  'nextjs.org',
  'vercel.com',
  'chatgpt.com',
  'claude.ai',
  'docs.anthropic.com',
  'linear.app',
  'slack.com',
  'openai.com',
  'apple.com',
  'nytimes.com',
  'google.co.uk',
];

export function refusesEmbedding(domain: string): boolean {
  const host = domain.toLowerCase();
  return NEVER_EMBEDS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`));
}
