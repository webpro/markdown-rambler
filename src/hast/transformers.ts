import slug from 'rehype-slug';
import autoLinkHeadings from 'rehype-autolink-headings';
import doc from 'rehype-document';
import { addInlineScript } from './plugins';
import { getMetaTags } from './metaTags';
import { getLinkTags } from './linkTags';
import type { Transformers } from '../types';

const defaultTransformers: Transformers = vFile => {
  const { data } = vFile;
  const { meta, structuredContent } = data;
  return [
    slug,
    [autoLinkHeadings, { behavior: 'wrap', test: ['h2', 'h3', 'h4', 'h5', 'h6'] }],
    [
      doc,
      { title: meta.title, meta: getMetaTags(meta), link: getLinkTags(meta), js: meta.scripts, language: meta.language }
    ],
    [addInlineScript, { type: 'application/ld+json', content: JSON.stringify(structuredContent) }]
  ];
};

export default defaultTransformers;
