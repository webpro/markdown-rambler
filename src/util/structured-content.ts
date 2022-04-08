import _ from 'lodash';
import { iso } from '.';
import type { Schema, Meta } from '../types';

const getPage = (meta: Meta, base) =>
  _.merge({}, base, {
    '@type': 'WebSite',
    sameAs: meta.sameAs,
    datePublished: iso(meta.published),
    dateModified: iso(meta.modified),
    mainEntityOfPage: { '@id': meta.host + meta.pathname }
  });

const getArticle = (meta: Meta, base) =>
  _.merge({}, base, {
    '@type': 'Article',
    headline: meta.title,
    description: meta.description,
    datePublished: iso(meta.published),
    dateModified: iso(meta.modified),
    mainEntityOfPage: { '@id': meta.host + meta.pathname },
    image: [meta.image.src || meta.publisher.logo.src]
  });

export const getStructuredContent = (meta: Meta): Schema => {
  const base: Schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    mainEntityOfPage: { '@type': 'WebPage' }
  };

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
