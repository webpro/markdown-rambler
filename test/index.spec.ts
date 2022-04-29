import { test } from 'uvu';
import assert from 'assert/strict';
import { h } from 'hastscript';
import { MarkdownRambler, html } from '../src';
import { VFile } from 'vfile';

test('should parse basic Markdown and render minimal HTML document from vFile', async () => {
  const rambler = new MarkdownRambler();
  const markdown = '# Hello, world!';
  const vFile = new VFile({ path: 'test.md', value: markdown });
  const parsedVFile = await rambler.parseMarkdownVFile(vFile);
  const renderedVFile = await rambler.renderMarkdownFile(parsedVFile);

  assert.equal(
    renderedVFile.value,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Hello, world!</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:type" content="website">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  </head>
  <body>
    <h1 id="hello-world">Hello, world!</h1>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","mainEntityOfPage":{"@type":"WebPage","@id":"/test"}}</script>
  </body>
</html>
`
  );
});

test('should parse Markdown and renderHTML document from vFile', async () => {
  const rambler = new MarkdownRambler({
    directives: {
      QUOTE: (node, index, parent, vFile) => {
        return h('figure', [
          h('blockquote', { class: 'quote', cite: node.attributes.source }, [h('p', node.children[0].value)]),
          h('figcaption', node.attributes.by)
        ]);
      },
      COPYRIGHT: (node, index, parent, vFile) => {
        const [year] = vFile.data.meta.published.split('-');
        const publisher = vFile.data.meta.publisher;
        return h('footer', h('p', [`© ${year}, `, h('a', { href: publisher.href }, publisher.name)]));
      }
    },
    host: 'https://example.org',
    name: 'Just Doe It',
    feed: { pathname: '/rss.xml', title: 'Latest Does' },
    manifest: '/manifest.json',
    defaults: {
      page: {
        layout: (node, meta) =>
          html`<header><img src="${meta.logo.src}" alt="${meta.logo.alt}" /></header>
            <main>${node}</main>`,
        author: { name: 'John Doe', href: 'https://john.doe.com' },
        publisher: { name: 'PBLSHR', href: 'https://publisher.co', logo: { src: 'https://cdn.publisher.co/logo.bmp' } },
        title: 'Title',
        description: 'Descriptive Copy',
        prefetch: '/prefetch',
        published: '2000-02-30',
        modified: '2030-01-20',
        stylesheets: ['/css/stylesheet.css', '/css/fonts.css'],
        sameAs: ['https://john.doe.org', 'https://social.doe.com'],
        draft: false,
        image: { src: 'https://cdn.doe.org/banner.tiff', alt: 'logo' },
        logo: { href: '/', src: 'https://cdn.doe.org/logo.png', alt: 'logo' },
        icon: { src: '/icon.png' }
      }
    }
  });
  const markdown = `# Title

Introduction

::QUOTE[Famous quote]{source="https://my.quotes.book" by="Yours truly"}

:::article{.wrapper}

Text with :abbr[HTML]{title="HyperText Markup Language"}.

Table:

| col1 | col2 |
| ---- | ---- |
| A1   | B1   |
| A2   | B2   |

:::

::COPYRIGHT
`;
  const vFile = new VFile({ path: 'test.md', value: markdown });
  const parsedVFile = await rambler.parseMarkdownVFile(vFile);
  const renderedVFile = await rambler.renderMarkdownFile(parsedVFile);

  assert.equal(
    renderedVFile.value,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Title</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta property="og:type" content="website">
    <meta name="description" property="og:description" content="Descriptive Copy">
    <meta property="og:site_name" content="Just Doe It">
    <meta property="og:url" content="https://example.org/test">
    <meta name="author" content="John Doe">
    <meta property="article:published_time" content="2000-03-01T00:00:00.000Z">
    <meta property="article:modified_time" content="2030-01-20T00:00:00.000Z">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="manifest" href="/manifest.json">
    <link rel="canonical" href="https://example.org/test">
    <link rel="stylesheet" href="/css/stylesheet.css">
    <link rel="stylesheet" href="/css/fonts.css">
    <link rel="icon" href="/icon.png" type="image/png">
    <link rel="prefetch" href="/prefetch">
    <link rel="alternate" type="application/rss+xml" href="https:/example.org/rss.xml" title="Latest Does">
  </head>
  <body>
    <header>
      <img src="https://cdn.doe.org/logo.png" alt="logo">
    </header>
    <main>
      <h1 id="title">Title</h1>
      <p>Introduction</p>
      <figure>
        <blockquote class="quote" cite="https://my.quotes.book">
          <p>Famous quote</p>
        </blockquote>
        <figcaption>Yours truly</figcaption>
      </figure>
      <article class="wrapper">
        <p>Text with <abbr title="HyperText Markup Language">HTML</abbr>.</p>
        <p>Table:</p>
        <table>
          <thead>
            <tr>
              <th>col1</th>
              <th>col2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>A1</td>
              <td>B1</td>
            </tr>
            <tr>
              <td>A2</td>
              <td>B2</td>
            </tr>
          </tbody>
        </table>
      </article>
      <footer>
        <p>© 2000, <a href="https://publisher.co/">PBLSHR</a></p>
      </footer>
    </main>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","mainEntityOfPage":{"@type":"WebPage","@id":"https://example.org/test"},"author":{"@type":"Person","name":"John Doe","url":"https://john.doe.com"},"publisher":{"@type":"Organization","@id":"https://publisher.co/#organization","name":"PBLSHR","logo":{"@type":"ImageObject","url":"https://cdn.publisher.co/logo.bmp"}},"sameAs":["https://john.doe.org","https://social.doe.com"],"datePublished":"2000-03-01T00:00:00.000Z","dateModified":"2030-01-20T00:00:00.000Z"}</script>
  </body>
</html>
`
  );
});

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
    <meta property="article:published_time" content="2022-03-05T00:00:00.000Z">
    <link rel="icon" href="/favicon.ico" sizes="any">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  </head>
  <body>
    <h1 id="essential-matters">Essential Matters</h1>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite","mainEntityOfPage":{"@type":"WebPage","@id":"/test"},"datePublished":"2022-03-05T00:00:00.000Z"}</script>
  </body>
</html>
`
  );
});

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
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","mainEntityOfPage":{"@type":"WebPage","@id":"/test"},"headline":"An Article"}</script>
  </body>
</html>
`
  );
});

test.run();
