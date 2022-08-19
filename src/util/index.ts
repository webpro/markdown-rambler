import { isAbsolute, join } from 'path';
import type { VFile, BuildMetaData, FrontMatter } from '../types';

export const groupByType = (vFiles: VFile[]) =>
  vFiles.reduce((group, vFile) => {
    const { type } = vFile.data.meta;
    group[type] = group[type] ?? [];
    group[type].push(vFile);
    return group;
  }, {});

const getDefaults = (type, defaults) => {
  if (!type || type === 'page' || !(type in defaults)) {
    return defaults?.page ?? {};
  }
  return { ...defaults.page, ...defaults[type] };
};

const resolveFrontMatter = (matter, vFile): FrontMatter => {
  const obj = {};
  for (const key in matter) {
    switch (key) {
      case 'tags':
        const tags = typeof matter[key] === 'string' ? matter[key].split(/[ ,]+/) : matter[key];
        obj[key] = tags;
        break;
      case 'image':
        const image = typeof matter[key] === 'string' ? { src: matter[key] } : matter[key];
        image.src = isAbsolute(image.src) ? image.src : join(vFile.data.pathname, image.src);
        obj[key] = image;
        break;
      case 'published':
      case 'modified':
        obj[key] = new Date(matter[key]);
        break;
      default:
        obj[key] = matter[key];
        break;
    }
  }
  return obj;
};

export const buildMetaData: BuildMetaData = (vFile, type, options) => {
  const defaults = getDefaults(type, options.defaults);
  const { pathname } = vFile.data;
  const base = {
    type,
    host: options.host,
    pathname,
    href: options.host + pathname,
    name: options.name,
    language: options.language,
    manifest: options.manifest,
    feed: options.feed
  };
  const matter = resolveFrontMatter(vFile.data.matter, vFile);

  const pageStylesheets = typeof matter.stylesheets === 'string' ? [matter.stylesheets] : matter.stylesheets ?? [];
  const pageScripts = typeof matter.scripts === 'string' ? [matter.scripts] : matter.scripts ?? [];
  delete matter.stylesheets; // The pageStylesheets will be added separately (unbundled)
  delete matter.scripts; // the pageScripts will be added separately (unbundled)

  return Object.assign(base, defaults, matter, {
    pageStylesheets: pageStylesheets.map(sheet => join(pathname, sheet)),
    pageScripts: pageScripts.map(script => join(pathname, script))
  });
};

export const iso = (value?: string | Date): string =>
  !value ? undefined : (typeof value === 'string' ? new Date(value) : value).toISOString();

export const unique = (value, index, self) => self.indexOf(value) === index;

export const ucFirst = (value: string) => value[0].toUpperCase() + value.slice(1);
