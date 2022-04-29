import { isAbsolute } from 'path';
import urls from 'rehype-urls';
import slug from 'rehype-slug';
import autoLinkHeadings from 'rehype-autolink-headings';
import doc from 'rehype-document';
import { addInlineScript } from './plugins';
import { getMetaTags } from './metaTags';
import { getLinkTags } from './linkTags';
import { resolveTargetPathname } from '../util/fs';
import type { Transformers } from '../types';

const fixRelativeLinks = vFile => url => {
  if (url.href.startsWith('http') || url.href.startsWith('mailto') || isAbsolute(url.href) || !url.pathname) return url;
  return resolveTargetPathname(vFile.history.at(0), url.href);
};

const defaultTransformers: Transformers = vFile => {
  const { data } = vFile;
  const { meta, structuredContent } = data;
  const { title, language, scripts: js } = meta;
  return [
    [urls, fixRelativeLinks(vFile)],
    slug,
    [autoLinkHeadings, { behavior: 'wrap', test: ['h2', 'h3', 'h4', 'h5', 'h6'] }],
    [doc, { title, language, meta: getMetaTags(meta), link: getLinkTags(meta), js }],
    [addInlineScript, { type: 'application/ld+json', content: JSON.stringify(structuredContent) }]
  ];
};

export default defaultTransformers;
