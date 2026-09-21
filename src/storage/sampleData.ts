import type { Bookmark, Category, LibraryData, Tag } from '../types';
import { domainFromUrl } from '../lib/url';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const iso = (offsetMs: number): string => new Date(Date.now() - offsetMs).toISOString();

interface SampleBookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  favorite?: boolean;
  createdAgo: number;
  updatedAgo: number;
  visitedAgo?: number;
  notes?: Array<{ content: string; createdAgo: number; updatedAgo?: number }>;
}

const CATEGORIES = ['Development', 'Design', 'AI', 'Learning', 'Productivity'];

const TAGS = [
  'react',
  'typescript',
  'frontend',
  'reference',
  'documentation',
  'performance',
  'css',
  'design-systems',
  'inspiration',
  'tooling',
  'reading',
  'accessibility',
];

const BOOKMARKS: SampleBookmark[] = [
  {
    id: 'bm_sample_react',
    url: 'https://react.dev',
    title: 'React Documentation',
    description: 'The official React documentation, guides and API reference.',
    category: 'Development',
    tags: ['react', 'frontend', 'reference', 'documentation'],
    favorite: true,
    createdAgo: 46 * DAY,
    updatedAgo: 12 * MINUTE,
    visitedAgo: 3 * HOUR,
    notes: [
      {
        content:
          'Server Components reference lives under Learn. The caching section is the part worth rereading before the next refactor.',
        createdAgo: 12 * MINUTE,
      },
      {
        content: 'Read the compiler documentation before deciding whether to keep the manual memoization.',
        createdAgo: 2 * DAY,
      },
      {
        content: 'useSyncExternalStore is the right primitive for the storage layer subscription.',
        createdAgo: 9 * DAY,
      },
    ],
  },
  {
    id: 'bm_sample_mdn',
    url: 'https://developer.mozilla.org',
    title: 'MDN Web Docs',
    description: 'Reference for web platform APIs, HTML, CSS and JavaScript.',
    category: 'Development',
    tags: ['reference', 'documentation', 'frontend'],
    favorite: true,
    createdAgo: 120 * DAY,
    updatedAgo: 5 * HOUR,
    visitedAgo: 5 * HOUR,
    notes: [
      {
        content:
          'Web Workers are useful for background processing when a large import blocks the main thread. Check the structured clone limits first.',
        createdAgo: 5 * HOUR,
      },
    ],
  },
  {
    id: 'bm_sample_next',
    url: 'https://nextjs.org/docs',
    title: 'Next.js Documentation',
    description: 'The React framework for the web, including routing and rendering guides.',
    category: 'Development',
    tags: ['react', 'frontend', 'documentation'],
    createdAgo: 40 * DAY,
    updatedAgo: 5 * DAY,
    visitedAgo: 6 * DAY,
  },
  {
    id: 'bm_sample_ts',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
    title: 'TypeScript Handbook',
    description: 'Language handbook covering types, generics and narrowing.',
    category: 'Development',
    tags: ['typescript', 'reference', 'documentation'],
    createdAgo: 88 * DAY,
    updatedAgo: 8 * DAY,
    visitedAgo: 8 * DAY,
    notes: [
      {
        content: 'The narrowing chapter explains why the discriminated union in the storage layer works the way it does.',
        createdAgo: 8 * DAY,
      },
    ],
  },
  {
    id: 'bm_sample_webdev',
    url: 'https://web.dev/performance',
    title: 'Performance - web.dev',
    description: 'Practical guidance on Core Web Vitals and loading performance.',
    category: 'Development',
    tags: ['performance', 'frontend', 'reference'],
    createdAgo: 33 * DAY,
    updatedAgo: 11 * DAY,
    visitedAgo: 11 * DAY,
    notes: [
      {
        content: 'Interaction to Next Paint replaced First Input Delay. Measure with the field data, not the lab run.',
        createdAgo: 11 * DAY,
      },
    ],
  },
  {
    id: 'bm_sample_csstricks',
    url: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
    title: 'A Complete Guide to CSS Grid',
    description: 'The reference that answers most grid layout questions in one page.',
    category: 'Development',
    tags: ['css', 'frontend', 'reference'],
    favorite: true,
    createdAgo: 200 * DAY,
    updatedAgo: 20 * DAY,
    visitedAgo: 2 * DAY,
  },
  {
    id: 'bm_sample_github',
    url: 'https://github.com',
    title: 'GitHub',
    description: 'Repositories, issues and code review.',
    category: 'Development',
    tags: ['tooling'],
    createdAgo: 300 * DAY,
    updatedAgo: 30 * DAY,
    visitedAgo: 40 * MINUTE,
  },
  {
    id: 'bm_sample_figma',
    url: 'https://www.figma.com',
    title: 'Figma',
    description: 'Interface design files and shared component libraries.',
    category: 'Design',
    tags: ['design-systems', 'tooling'],
    createdAgo: 150 * DAY,
    updatedAgo: 14 * DAY,
    visitedAgo: 26 * HOUR,
  },
  {
    id: 'bm_sample_fonts',
    url: 'https://fonts.google.com',
    title: 'Google Fonts',
    description: 'Type specimens and pairings for interface work.',
    category: 'Design',
    tags: ['inspiration', 'design-systems'],
    createdAgo: 60 * DAY,
    updatedAgo: 26 * DAY,
    visitedAgo: 27 * DAY,
    notes: [
      {
        content: 'Fraunces with Karla holds up well at small sizes. Keep the optical size axis below 40 for body copy.',
        createdAgo: 26 * DAY,
      },
    ],
  },
  {
    id: 'bm_sample_typewolf',
    url: 'https://www.typewolf.com',
    title: 'Typewolf',
    description: 'Typography reference and site of the day archive.',
    category: 'Design',
    tags: ['inspiration', 'reading'],
    createdAgo: 95 * DAY,
    updatedAgo: 35 * DAY,
    visitedAgo: 35 * DAY,
  },
  {
    id: 'bm_sample_anthropic',
    url: 'https://docs.anthropic.com',
    title: 'Anthropic Documentation',
    description: 'API reference and prompting guidance for Claude models.',
    category: 'AI',
    tags: ['documentation', 'reference'],
    favorite: true,
    createdAgo: 24 * DAY,
    updatedAgo: 3 * HOUR,
    visitedAgo: 3 * HOUR,
    notes: [
      {
        content: 'Prompt caching is per prefix. Put the stable system content first so the cache actually hits.',
        createdAgo: 3 * HOUR,
      },
      {
        content: 'Tool use examples are the fastest way into the API surface.',
        createdAgo: 20 * DAY,
      },
    ],
  },
  {
    id: 'bm_sample_papers',
    url: 'https://arxiv.org/list/cs.LG/recent',
    title: 'Machine Learning - Recent Submissions',
    description: 'Recent preprints, scanned weekly rather than read in full.',
    category: 'AI',
    tags: ['reading', 'reference'],
    createdAgo: 70 * DAY,
    updatedAgo: 18 * DAY,
    visitedAgo: 18 * DAY,
  },
  {
    id: 'bm_sample_a11y',
    url: 'https://www.w3.org/WAI/ARIA/apg/patterns/',
    title: 'ARIA Authoring Practices Patterns',
    description: 'Keyboard and role patterns for dialogs, menus and listboxes.',
    category: 'Learning',
    tags: ['accessibility', 'reference', 'frontend'],
    createdAgo: 52 * DAY,
    updatedAgo: 4 * DAY,
    visitedAgo: 4 * DAY,
    notes: [
      {
        content: 'Dialog pattern: focus moves to the dialog, Escape closes it, focus returns to the trigger.',
        createdAgo: 4 * DAY,
      },
    ],
  },
  {
    id: 'bm_sample_linear',
    url: 'https://linear.app/method',
    title: 'The Linear Method',
    description: 'How a small team keeps planning light and shipping steady.',
    category: 'Productivity',
    tags: ['reading', 'inspiration'],
    createdAgo: 110 * DAY,
    updatedAgo: 44 * DAY,
    visitedAgo: 44 * DAY,
  },
  {
    id: 'bm_sample_vercel',
    url: 'https://vercel.com/docs',
    title: 'Vercel Documentation',
    description: 'Deployment, edge runtime and caching behaviour.',
    category: 'Development',
    tags: ['documentation', 'tooling', 'performance'],
    createdAgo: 29 * DAY,
    updatedAgo: 16 * DAY,
    visitedAgo: 16 * DAY,
  },
];

/**
 * Realistic starting content so an empty browser does not open onto an empty
 * product. Every screen still works with none of this present.
 */
export function buildSampleData(): LibraryData {
  const categories: Category[] = CATEGORIES.map((name, index) => ({
    id: `cat_sample_${name.toLowerCase()}`,
    name,
    createdAt: iso(300 * DAY - index * HOUR),
    updatedAt: iso(300 * DAY - index * HOUR),
  }));

  const tags: Tag[] = TAGS.map((name, index) => ({
    id: `tag_sample_${name}`,
    name,
    createdAt: iso(290 * DAY - index * HOUR),
    updatedAt: iso(290 * DAY - index * HOUR),
  }));

  const categoryByName = new Map(categories.map((item) => [item.name, item.id]));
  const tagByName = new Map(tags.map((item) => [item.name, item.id]));

  const bookmarks: Bookmark[] = BOOKMARKS.map((sample) => ({
    id: sample.id,
    url: sample.url,
    title: sample.title,
    domain: domainFromUrl(sample.url),
    description: sample.description,
    categoryId: categoryByName.get(sample.category),
    tagIds: sample.tags.map((name) => tagByName.get(name)).filter((id): id is string => Boolean(id)),
    isFavorite: sample.favorite === true,
    notes: (sample.notes ?? []).map((note, index) => ({
      id: `${sample.id}_note_${index}`,
      content: note.content,
      createdAt: iso(note.createdAgo),
      updatedAt: iso(note.updatedAgo ?? note.createdAgo),
    })),
    createdAt: iso(sample.createdAgo),
    updatedAt: iso(sample.updatedAgo),
    lastVisitedAt: sample.visitedAgo === undefined ? undefined : iso(sample.visitedAgo),
  }));

  return { bookmarks, categories, tags };
}
