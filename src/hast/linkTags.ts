import { join, extname } from 'path';
import type { Meta } from '../types';

const mimeTypes = {
  '.ico': 'image/vnd.microsoft.icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

type LinkTag = {
  rel: string;
  href: string;
  type?: string;
  title?: string;
  sizes?: string;
};

export const getLinkTags = (meta: Meta): LinkTag[] => {
  const tags: LinkTag[] = [
    { rel: 'icon', href: '/favicon.ico', sizes: 'any' },
    { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' }
  ];

  if (meta.manifest) tags.push({ rel: 'manifest', href: meta.manifest });

  if (meta.host && meta.pathname) tags.push({ rel: 'canonical', href: meta.host + meta.pathname });

  const stylesheets = meta.bundledStylesheets ?? meta.stylesheets;
  if (stylesheets) tags.push(...stylesheets.map(href => ({ rel: 'stylesheet', href })));

  if (meta.icon) {
    const ext = extname(meta.icon.src);
    const type = mimeTypes[ext];
    tags.push({ rel: 'icon', href: meta.icon.src, type });
  }

  if (meta.prefetch) {
    tags.push({ rel: 'prefetch', href: meta.prefetch });
  }

  if (meta.feed) {
    tags.push({
      rel: 'alternate',
      type: 'application/rss+xml',
      href: join(meta.host, meta.feed.pathname),
      title: meta.feed.title
    });
  }

  return tags;
};
