import { test } from 'uvu';
import assert from 'assert/strict';
import { MarkdownRambler } from '../src';
import { VFile } from 'vfile';

test('should add custom page stylesheets and scripts', async () => {
  const rambler = new MarkdownRambler();
  const markdown = '---\nstylesheets: ./custom.css\nscripts: ./custom.js\n---\n\n# Custom Styles and Scripts';
  const vFile = new VFile({ path: 'test.md', value: markdown });
  const parsedVFile = await rambler.parseMarkdownVFile(vFile);
  const renderedVFile = await rambler.renderMarkdownFile(parsedVFile);

  assert.equal(
    renderedVFile.value,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Custom Styles and Scripts</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:type" content="website">
    <meta property="og:url" content="/test">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="stylesheet" href="/test/custom.css">
  </head>
  <body>
    <h1 id="custom-styles-and-scripts">Custom Styles and Scripts</h1>
    <script src="/test/custom.js"></script>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","mainEntityOfPage":{"@type":"WebPage","@id":"/test"},"inLanguage":"en"}</script>
  </body>
</html>
`
  );
});

test.run();
