import { iso } from '../util';
import type { Meta } from '../types';

type MetaTag = {
  name?: string;
  property?: string;
  content: string;
};

export const getMetaTags = (meta: Meta): MetaTag[] => {
  const tags: MetaTag[] = [];
  const type = meta.type === 'article' ? 'article' : 'website';

  tags.push({ property: 'og:type', content: type });

  if (meta.draft) tags.push({ name: 'robots', content: 'noindex' });

  if (meta.description) tags.push({ name: 'description', property: 'og:description', content: meta.description });
  if (meta.name) tags.push({ property: 'og:site_name', content: meta.name });
  if (meta.host && meta.pathname) tags.push({ property: 'og:url', content: meta.host + meta.pathname });

  if (meta.author) tags.push({ name: 'author', content: meta.author.name });
  if (meta.published) tags.push({ property: 'article:published_time', content: iso(meta.published) });
  if (meta.modified) tags.push({ property: 'article:modified_time', content: iso(meta.modified) });

  if (meta.author?.twitter) {
    tags.push(
      { name: 'twitter:title', property: 'og:title', content: meta.title },
      { name: 'twitter:description', content: meta.description },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:image', property: 'og:image', content: meta.host + meta.image.src },
      { name: 'twitter:site', content: meta.author.twitter },
      { name: 'twitter:creator', content: meta.author.twitter },
      { name: 'twitter:image:alt', content: meta.title }
    );
  }

  return tags;
};
