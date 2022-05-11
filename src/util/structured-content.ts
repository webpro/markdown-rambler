import _ from 'lodash';
import { iso } from '.';
import type { Schema, Meta } from '../types';

const getPage = (meta: Meta, base) =>
  _.merge({}, base, {
    '@type': 'WebSite',
    sameAs: meta.sameAs
  });

const getArticle = (meta: Meta, base) => {
  const image = meta.image?.src || meta.publisher?.logo?.src;
  return _.merge(
    {},
    base,
    {
      '@type': 'Article',
      headline: meta.title,
      description: meta.description
    },
    image ? { image } : {}
  );
};

export const getStructuredContent = (meta: Meta): Schema => {
  const base: Schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    mainEntityOfPage: { '@type': 'WebPage', '@id': meta.href },
    datePublished: iso(meta.published),
    dateModified: iso(meta.modified),
    inLanguage: meta.language
  };

  if (meta.tags?.length > 0) {
    base.keywords = meta.tags.join(',');
  }

  if (meta.author) {
    base.author = { '@type': 'Person', name: meta.author.name, url: meta.author.href };
  }

  if (meta.publisher) {
    base.publisher = {
      '@type': 'Organization',
      '@id': `${meta.publisher.href}/#organization`,
      name: meta.publisher.name,
      logo: { '@type': 'ImageObject', url: meta.publisher.logo.src }
    };
  }

  switch (meta.type) {
    case 'article':
      return getArticle(meta, base);
    default:
      return getPage(meta, base);
  }
};
