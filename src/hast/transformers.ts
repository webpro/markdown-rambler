import doc from 'rehype-document';
import { addInlineScript } from './plugins';
import { getMetaTags } from './metaTags';
import { getLinkTags } from './linkTags';
import type { Transformers } from '../types';

const defaultTransformers: Transformers = vFile => {
  const { data } = vFile;
  const { meta, structuredContent } = data;
  return [
    [doc, { title: meta.title, meta: getMetaTags(meta), link: getLinkTags(meta), js: meta.scripts }],
    [addInlineScript, { type: 'application/ld+json', content: JSON.stringify(structuredContent) }]
  ];
};

export default defaultTransformers;
