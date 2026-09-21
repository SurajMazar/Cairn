/**
 * A small built-in directory of well known websites.
 *
 * The app has no backend, so it cannot read a search engine's results page.
 * Rather than pretend otherwise, typing a query matches against this local
 * list for instant starting points, and the same query is one click away from
 * a real web search in a new tab.
 */
export interface DirectorySite {
  title: string;
  url: string;
  description: string;
  keywords: string[];
}

export const DIRECTORY: DirectorySite[] = [
  { title: 'React', url: 'https://react.dev', description: 'The library for web and native user interfaces.', keywords: ['react', 'javascript', 'frontend', 'hooks', 'components', 'ui'] },
  { title: 'Next.js', url: 'https://nextjs.org', description: 'The React framework for the web.', keywords: ['next', 'react', 'framework', 'ssr', 'routing'] },
  { title: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: 'Reference for HTML, CSS, JavaScript and browser APIs.', keywords: ['mdn', 'javascript', 'css', 'html', 'reference', 'web workers', 'api'] },
  { title: 'TypeScript', url: 'https://www.typescriptlang.org', description: 'JavaScript with syntax for types.', keywords: ['typescript', 'types', 'javascript'] },
  { title: 'web.dev', url: 'https://web.dev', description: 'Guidance on performance, accessibility and modern web capabilities.', keywords: ['performance', 'core web vitals', 'accessibility', 'pwa', 'google'] },
  { title: 'CSS-Tricks', url: 'https://css-tricks.com', description: 'Articles and references on CSS and layout.', keywords: ['css', 'flexbox', 'grid', 'layout', 'frontend'] },
  { title: 'Can I use', url: 'https://caniuse.com', description: 'Browser support tables for web platform features.', keywords: ['browser', 'support', 'compatibility', 'css', 'javascript'] },
  { title: 'Node.js', url: 'https://nodejs.org', description: 'JavaScript runtime built on V8.', keywords: ['node', 'javascript', 'server', 'backend', 'runtime'] },
  { title: 'Vite', url: 'https://vitejs.dev', description: 'Frontend build tooling with instant server start.', keywords: ['vite', 'build', 'bundler', 'tooling', 'frontend'] },
  { title: 'Vercel', url: 'https://vercel.com', description: 'Deployment platform for frontend frameworks.', keywords: ['vercel', 'deploy', 'hosting', 'edge'] },
  { title: 'GitHub', url: 'https://github.com', description: 'Code hosting, issues and review.', keywords: ['github', 'git', 'repository', 'code', 'open source'] },
  { title: 'Stack Overflow', url: 'https://stackoverflow.com', description: 'Questions and answers for programmers.', keywords: ['stackoverflow', 'questions', 'answers', 'debugging', 'error'] },
  { title: 'Rust', url: 'https://www.rust-lang.org', description: 'A language empowering everyone to build reliable software.', keywords: ['rust', 'systems', 'language', 'cargo'] },
  { title: 'Python', url: 'https://www.python.org', description: 'The Python programming language.', keywords: ['python', 'language', 'scripting', 'data'] },
  { title: 'PostgreSQL', url: 'https://www.postgresql.org/docs/', description: 'Documentation for the PostgreSQL database.', keywords: ['postgres', 'sql', 'database', 'query'] },
  { title: 'Figma', url: 'https://www.figma.com', description: 'Collaborative interface design.', keywords: ['figma', 'design', 'ui', 'prototype', 'components'] },
  { title: 'Google Fonts', url: 'https://fonts.google.com', description: 'Open source type specimens and pairings.', keywords: ['fonts', 'typography', 'type', 'design'] },
  { title: 'Typewolf', url: 'https://www.typewolf.com', description: 'Typography inspiration and font recommendations.', keywords: ['typography', 'fonts', 'inspiration', 'design'] },
  { title: 'Dribbble', url: 'https://dribbble.com', description: 'Design work shared by designers.', keywords: ['design', 'inspiration', 'ui', 'portfolio'] },
  { title: 'Are.na', url: 'https://www.are.na', description: 'Collect and connect ideas and references.', keywords: ['research', 'inspiration', 'collection', 'reading'] },
  { title: 'Material Design', url: 'https://m3.material.io', description: 'Design system guidelines from Google.', keywords: ['design system', 'guidelines', 'components', 'design'] },
  { title: 'Anthropic Documentation', url: 'https://docs.anthropic.com', description: 'API reference and guides for Claude models.', keywords: ['ai', 'claude', 'anthropic', 'api', 'llm', 'prompting'] },
  { title: 'Hugging Face', url: 'https://huggingface.co', description: 'Models, datasets and demos for machine learning.', keywords: ['ai', 'machine learning', 'models', 'datasets', 'ml'] },
  { title: 'arXiv', url: 'https://arxiv.org', description: 'Open access preprints across the sciences.', keywords: ['papers', 'research', 'ai', 'science', 'preprints'] },
  { title: 'Papers with Code', url: 'https://paperswithcode.com', description: 'Machine learning papers alongside their implementations.', keywords: ['ai', 'papers', 'machine learning', 'benchmarks', 'code'] },
  { title: 'Wikipedia', url: 'https://www.wikipedia.org', description: 'The free encyclopedia.', keywords: ['reference', 'encyclopedia', 'learning', 'research'] },
  { title: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free lessons in maths, science and more.', keywords: ['learning', 'courses', 'education', 'maths'] },
  { title: 'Coursera', url: 'https://www.coursera.org', description: 'Courses and certificates from universities.', keywords: ['learning', 'courses', 'education', 'university'] },
  { title: 'freeCodeCamp', url: 'https://www.freecodecamp.org', description: 'Free coding curriculum and projects.', keywords: ['learning', 'coding', 'tutorial', 'javascript'] },
  { title: 'ARIA Authoring Practices', url: 'https://www.w3.org/WAI/ARIA/apg/', description: 'Accessible patterns for common interface components.', keywords: ['accessibility', 'aria', 'a11y', 'patterns', 'keyboard'] },
  { title: 'WebAIM', url: 'https://webaim.org', description: 'Practical accessibility guidance and tools.', keywords: ['accessibility', 'a11y', 'contrast', 'screen reader'] },
  { title: 'Linear', url: 'https://linear.app', description: 'Issue tracking for software teams.', keywords: ['productivity', 'issues', 'planning', 'tools'] },
  { title: 'Notion', url: 'https://www.notion.so', description: 'Notes, documents and databases in one workspace.', keywords: ['productivity', 'notes', 'documents', 'wiki'] },
  { title: 'Obsidian', url: 'https://obsidian.md', description: 'Local first notes with links between them.', keywords: ['notes', 'productivity', 'knowledge', 'markdown'] },
  { title: 'Hacker News', url: 'https://news.ycombinator.com', description: 'Technology news and discussion.', keywords: ['news', 'reading', 'technology', 'discussion'] },
  { title: 'Ahrefs Blog', url: 'https://ahrefs.com/blog', description: 'Search and content marketing research.', keywords: ['seo', 'marketing', 'content', 'reading'] },
];

/**
 * Ranks by how much of the query a site covers. A two word query such as
 * "react performance" still surfaces the sites that answer either half, with
 * the ones matching both first.
 */
export function searchDirectory(query: string): DirectorySite[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const scored = DIRECTORY.map((site) => {
    const haystack = `${site.title} ${site.url} ${site.description} ${site.keywords.join(' ')}`.toLowerCase();
    let score = 0;
    let matchedTerms = 0;
    for (const term of terms) {
      if (site.title.toLowerCase().includes(term)) score += 4;
      else if (site.keywords.some((keyword) => keyword.includes(term))) score += 3;
      else if (haystack.includes(term)) score += 1;
      else continue;
      matchedTerms += 1;
    }
    // Covering every term beats a strong match on only one of them.
    return { site, score: matchedTerms === terms.length ? score + 5 : score, matchedTerms };
  });

  return scored
    .filter((entry) => entry.matchedTerms > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.site)
    .slice(0, 8);
}

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
