import type { VFile, BuildMetaData, FrontMatter } from '../types';

export const groupByType = (vFiles: VFile[]) =>
  vFiles.reduce((group, vFile) => {
    const { type } = vFile.data;
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

const resolveFrontMatter = (matter): FrontMatter => {
  const obj = {};
  for (const key in matter) {
    switch (key) {
      case 'tags':
        const tags = typeof matter[key] === 'string' ? matter[key].split(/[ ,]+/) : matter[key];
        obj[key] = tags;
        break;
      case 'image':
        const image = typeof matter[key] === 'string' ? { src: matter[key] } : matter[key];
        obj[key] = image;
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
  const matter = resolveFrontMatter(vFile.data.matter);
  const base = {
    type,
    host: options.host,
    name: options.name,
    language: options.language,
    manifest: options.manifest,
    feed: options.feed
  };
  return Object.assign(base, defaults, matter);
};

export const iso = (value?: string | Date): string =>
  !value ? undefined : (typeof value === 'string' ? new Date(value) : value).toISOString();
