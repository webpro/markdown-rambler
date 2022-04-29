import { test } from 'uvu';
import assert from 'assert/strict';
import { resolveTargetPathname as resolve } from '../../src/util/fs';

test('should resolve relative pathname from source files', () => {
  assert.equal(resolve('README.md', './another.md'), '/another');
  assert.equal(resolve('index.md', './image.webp'), '/image.webp');
  assert.equal(resolve('articles/article.md', './another.md'), '/articles/another');
  assert.equal(resolve('articles/article.md', './another/index.md'), '/articles/another');
  assert.equal(resolve('articles/article.md', './another/deep/dir/index.md'), '/articles/another/deep/dir');
  assert.equal(resolve('articles/article/index.md', '../another.md'), '/articles/another');
  assert.equal(resolve('articles/article/index.md', '../another/index.md'), '/articles/another');
  assert.equal(resolve('articles/article/index.md', '../../articles/another/index.md'), '/articles/another');
  assert.equal(resolve('articles/article/index.md', '../another.md#hash'), '/articles/another#hash');
  assert.equal(resolve('articles/article/index.md', '../another.md?q=r'), '/articles/another?q=r');
});

test.run();
