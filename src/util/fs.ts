import { watch, constants } from 'fs';
import { access, mkdir, readFile, writeFile, copyFile, appendFile } from 'node:fs/promises';
import { resolve, dirname, join, relative, isAbsolute } from 'node:path';
import { optimize } from 'svgo';

const isFloating = pathname => !/^[\.\/]/.test(pathname);

const isIndex = filename => /(README|index)\.md$/.test(filename);

export const resolveTargetPathname = (from, to) => {
  const fromPathname = resolvePathname(from);
  const [, filename, suffix] = to.match(/(?<filename>[^\?#]*)(?<suffix>.*)/);
  const toPathname = resolve(fromPathname, ...[isIndex(from) ? '.' : '..'], resolvePathname(filename));
  return toPathname + suffix;
};

export const resolvePathname = filename => {
  return (isFloating(filename) ? '/' : '') + filename.replace(/(README|index)?\.md$/, '').replace(/(.+)\/$/, '$1');
};

export const ensureDir = async target => {
  const dir = dirname(target);
  try {
    await access(dir, constants.W_OK);
  } catch (error) {
    await mkdir(dir, { recursive: true });
  }
};

export const isDir = async dir => {
  try {
    await access(dir, constants.W_OK);
    return true;
  } catch (error) {
    return false;
  }
};

export const write = async (target, output) => {
  await ensureDir(target);
  writeFile(target, output);
};

export const copy = async (source, target) => {
  await ensureDir(target);
  copyFile(source, target);
};

export const append = async (source, target) => {
  await appendFile(target, await readFile(source));
};

export const optimizeSVG = async (source, target) => {
  const optimized = optimize(await readFile(source), {
    path: source,
    plugins: ['removeDimensions', { name: 'removeAttrs', params: { attrs: 'content' } }]
  });
  await ensureDir(target);
  await writeFile(target, optimized.data, 'utf8');
};

export const watchDir = async ({ dir, cb, ignoreDir }) => {
  const callback = (eventType: string, filename: string): void => {
    const file = join(dir, filename);
    if (file.startsWith(ignoreDir) || file.startsWith('.') || file.startsWith('node_modules')) return;
    if (eventType === 'change') {
      if (filename) {
        cb([dir, filename]);
      } else {
        console.warn('Filename not provided for', eventType, filename);
      }
    }
  };
  if (await isDir(dir)) {
    watch(dir, { recursive: true }, callback);
    return dir;
  }
};
