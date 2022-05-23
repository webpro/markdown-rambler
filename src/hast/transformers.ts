import { extname } from 'node:path';
import urls from 'rehype-urls';
import slug from 'rehype-slug';
import autoLinkHeadings from 'rehype-autolink-headings';
import doc from 'rehype-document';
import { addInlineScript } from './plugins';
import { getMetaTags } from './metaTags';
import { getLinkTags } from './linkTags';
import { resolveTargetPathname } from '../util/fs';
import type { Transformers } from '../types';

const fixRelativeLinks = vFile => (url, node) => {
  const { href, pathname } = url;
  if (href.startsWith('.') && (extname(pathname) === '.md' || node.tagName === 'img')) {
    return resolveTargetPathname(vFile.history.at(0), href);
  }
  return url;
};

const defaultTransformers: Transformers = vFile => {
  const { data } = vFile;
  const { meta, structuredContent } = data;
  const { title, language, scripts, bundledScripts, pageScripts } = meta;
  const js = [...(bundledScripts ?? scripts ?? []), ...(pageScripts ?? [])];
  return [
    [() => urls(fixRelativeLinks(vFile))], // Hack to allow rehype-urls plugin again downstream
    slug,
    [autoLinkHeadings, { behavior: 'wrap', test: ['h2', 'h3', 'h4', 'h5', 'h6'] }],
    [doc, { title, language, meta: getMetaTags(meta), link: getLinkTags(meta), js }],
    [addInlineScript, { type: 'application/ld+json', content: JSON.stringify(structuredContent) }]
  ];
};

export default defaultTransformers;
