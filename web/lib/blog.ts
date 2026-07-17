// Bench Gazette — markdown posts in content/blog/, parsed at build time.
// Frontmatter is deliberately minimal: title / description / date.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { marked } from 'marked';

const DIR = resolve(process.cwd(), 'content', 'blog');

export type Post = { slug: string; title: string; description: string; date: string; html: string };

export const posts: Post[] = existsSync(DIR)
  ? readdirSync(DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => {
        const raw = readFileSync(join(DIR, f), 'utf8');
        const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
        const meta: Record<string, string> = {};
        (m?.[1] ?? '').split('\n').forEach((l) => {
          const i = l.indexOf(':');
          if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
        });
        return {
          slug: f.replace(/\.md$/, ''),
          title: meta.title ?? f,
          description: meta.description ?? '',
          date: meta.date ?? '',
          html: marked.parse(m?.[2] ?? raw, { async: false }) as string,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  : [];
