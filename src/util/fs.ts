import { watch, constants } from 'fs';
import { access, mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { relative, dirname, join } from 'node:path';
import { optimize } from 'svgo';

export const ensureDir = async target => {
  const dir = dirname(target);
  try {
    await access(dir, constants.W_OK);
  } catch (error) {
    await mkdir(dir, { recursive: true });
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

export const optimizeSVG = async (source, target) => {
  const optimized = optimize(await readFile(source), {
    path: source,
    plugins: ['removeDimensions', { name: 'removeAttrs', params: { attrs: 'content' } }]
  });
  await ensureDir(target);
  await writeFile(target, optimized.data, 'utf8');
};

export const watchDir = (dir, cb) => {
  const callback = (eventType: string, filename: string): void => {
    if (filename) {
      cb([dir, filename]);
    } else {
      console.warn('Filename not provided for', eventType, filename);
    }
  };
  watch(dir, { recursive: true }, callback);
  console.log('Watching', dir, 'for changes...');
};
