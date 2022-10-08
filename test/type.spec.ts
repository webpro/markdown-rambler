import { test } from 'uvu';
import assert from 'assert/strict';
import { MarkdownRambler, html } from '../src';
import { VFile } from 'vfile';

test('should add article type, and use for default values with layout', async () => {
  const rambler = new MarkdownRambler({
    type: () => 'article',
    defaults: {
      article: {
        stylesheets: ['/styles.css'],
        layout: (node, meta) => html`<article class="${meta.type}">${node}</article>`
      }
    }
  });
  const markdown = '# An Article\n\nParagraphs and such.\n\n## Another Section\n\nWords are here.';
  const vFile = new VFile({ path: 'test.md', value: markdown });
  const parsedVFile = await rambler.parseMarkdownVFile(vFile);
  const renderedVFile = await rambler.renderMarkdownFile(parsedVFile);

  assert.equal(
    renderedVFile.value,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>An Article</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:type" content="article">
    <meta property="og:url" content="/test">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <article class="article">
      <h1 id="an-article">An Article</h1>
      <p>Paragraphs and such.</p>
      <h2 id="another-section"><a href="#another-section">Another Section</a></h2>
      <p>Words are here.</p>
    </article>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","mainEntityOfPage":{"@type":"WebPage","@id":"/test"},"inLanguage":"en","headline":"An Article"}</script>
  </body>
</html>
`
  );
});

test.run();
