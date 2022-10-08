import { test } from 'uvu';
import assert from 'assert/strict';
import { MarkdownRambler } from '../src';
import { VFile } from 'vfile';

test('should parse Front Matter and merge with meta data', async () => {
  const rambler = new MarkdownRambler();
  const markdown =
    '---\ndescription: Markdown matters\npublished: 2022-03-05\nlanguage: en-US\ndraft: true\n---\n\n# Essential Matters';
  const vFile = new VFile({ path: 'test.md', value: markdown });
  const parsedVFile = await rambler.parseMarkdownVFile(vFile);
  const renderedVFile = await rambler.renderMarkdownFile(parsedVFile);

  assert.equal(
    renderedVFile.value,
    `<!doctype html>
<html lang="en-US">
  <head>
    <meta charset="utf-8">
    <title>Essential Matters</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:type" content="website">
    <meta name="robots" content="noindex">
    <meta name="description" property="og:description" content="Markdown matters">
    <meta property="og:url" content="/test">
    <meta property="article:published_time" content="2022-03-05T00:00:00.000Z">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  </head>
  <body>
    <h1 id="essential-matters">Essential Matters</h1>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","mainEntityOfPage":{"@type":"WebPage","@id":"/test"},"datePublished":"2022-03-05T00:00:00.000Z","inLanguage":"en-US"}</script>
  </body>
</html>
`
  );
});

test.run();
