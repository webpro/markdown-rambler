# Markdown Rambler

Yet another opinionated & powerful static site generator.

Turns directories with Markdown files into static websites.

- Based on the remark and rehype ecosystems.
- Powerful and extensible plugins.
- Zero-config with sane defaults to get started.
- Directory structure and file names determine the url's.
- Easily build layouts around the Markdown-based content.
- **Front Matter** in Markdown to override defaults.
- Use a page `type` to enable different layouts and plugins.
- **Optimize SEO** with HTML documents including (OpenGraph) meta tags and structured content (`application/ld+json`).
- Mark **drafts** to exclude from being published.
- Includes **SVGO** to optimize SVGs assets.
- Writes **sitemap.txt**.
- Writes **RSS feed**.
- Writes **search index** (using MiniMatch).

## Input

```
.
└── content
    ├── articles
    │   ├── starting-a-blog.md
    │   ├── writing-a-blogpost.md
    │   └── yet-another-article
    │       ├── index.md
    │       └── image.webp
    ├── blog.md
    └── index.md
```

## Build Script

```js
const rambler = new MarkdownRambler();
rambler.run();
```

## Output

```
.
└── dist
    ├── articles
    │   ├── starting-a-blog
    │   │   └── index.html
    │   ├── writing-a-blogpost
    │   │   └── index.html
    │   └── yet-another-article
    │       ├── index.html
    │       └── image.webp
    ├── blog
    │   └── index.html
    ├── index.html
    └── sitemap.txt
```

And all pathnames in `/sitemap.txt`:

```
/
/articles/starting-a-blog
/articles/writing-a-blogpost
/articles/yet-another-article
/blog
```

## Options

### Overview

#### File Structure & Output

| Option         | Type                 | Default value           | Description                                                                        |
| -------------- | -------------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `contentFiles` | `string \| string[]` | `'**/*'`                | Should include assets (non-Markdown files) as well.                                |
| `contentDir`   | `string \| string[]` | `['public', 'content']` | `'content'` is only added when `contentFiles` is not provided.                     |
| `outputDir`    | `string`             | `'dist'`                | All pages and assets are written into this directory                               |
| `sitemap`      | `boolean`            | `true`                  | Adds `sitemap.txt`                                                                 |
| `feed`         | [`Feed`](#feed)      | `false`                 | Generates RSS XML file and `<link rel="alternate" type="application/rss+xml" ...>` |
| `search`       | [`Search`](#search)  | `false`                 | Generates MiniSearch index                                                         |

#### Flags

| Option                               | Type      | Default value | Description                                    |
| ------------------------------------ | --------- | ------------- | ---------------------------------------------- |
| `verbose`                            | `boolean` | `false`       | Logs more output about the process             |
| `watch`                              | `boolean` | `false`       | Add watcher to re-process modified files       |
| [`formatMarkdown`](#format-markdown) | `boolean` | `false`       | Formats source Markdown files (using Prettier) |

#### Content

| Option                  | Type                            | Default value | Description                                                                         |
| ----------------------- | ------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `host`                  | `string`                        | `''`          | Provide this for canonical url's and in meta data, etc.                             |
| `name`                  | `string`                        | `''`          | Website name (e.g. `<meta property="og:site_name" content="{name}">`)               |
| `language`              | `string`                        | `'en'`        | Website language (e.g. `'fr-BE'`)                                                   |
| `manifest`              | `false \| string`               | `false`       | Adds `<link rel="manifest" href="{manifest}">`                                      |
| `type`                  | [`TypeFn`](#type)               | `page`        | Adds `type` property to meta data for use in layouts and plugins (e.g. `'article'`) |
| [`defaults`](#defaults) | `Record<PageType, PageOptions>` | `undefined`   | Default meta data for each document of any page type                                |

#### Plugins

| Option                          | Type                  | Default value                   | Description                                                             |
| ------------------------------- | --------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| [`parsers`](#parsers)           | `Pluggable[]`         | [`parsers`](#parsers)           | Remark parsers                                                          |
| [`additionalParsers`](#parsers) | `Pluggable[]`         | [`additionalParsers`](#parsers) | Additional remark parsers (on top of `parsers`)                         |
| [`converters`](#converters)     | `Pluggable[]`         | [`converters`](#converters)     | Plugin to convert mdast (1) to hast (2)                                 |
| [`transformers`](#transformers) | `Pluggable[]`         | [`transformers`](#transformers) | Transformers applied to the hast                                        |
| [`renderers`](#renderers)       | `Pluggable[]`         | [`renderers`](#renderers)       | Plugins to render (stringify) the hast                                  |
| [`directives`](#directives)     | `Record<string, any>` | `undefined`                     | Directives to extend Markdown syntax (e.g. `::TOC` or `:::div.wrapper`) |

1. mdast: Markdown Abstract Syntax Tree
2. hast: HyperText (HTML) AST

### Feed

```ts
type Feed = {
  pathname: string;
  title: string;
  description?: string;
  author?: string;
  filter?: (type: string, vFile: VFile) => boolean;
};
```

### Search

```ts
type Search = {
  outputDir: string;
  filter?: (type: string, vFile: VFile) => boolean;
};
```

Generates a [MiniSearch](https://lucaong.github.io/minisearch/) index file to be used in your client. Here's a minimal
example of a client script to use the search index:

```js
(async () => {
  await import('https://cdn.jsdelivr.net/npm/minisearch@4.0.3/dist/umd/index.min.js');
  const searchIndex = await fetch('/_search/index.json').then(response => response.text());
  const index = MiniSearch.loadJSON(searchIndex, { fields: ['title', 'content'] });
  const searchBox = document.querySelector('input[type=search]');
  const search = query => {
    const results = index.search(query, { prefix: true, fuzzy: 0.3 });
    console.log(results);
  };
  searchBox.addEventListener('input', event => {
    search(event.target.value);
  });
})();
```

The script(s) can be added to e.g. the `public` folder and added to the `defaults.page.scripts` array.

### Type

```ts
type TypeFn = (filename: string, matter: FrontMatter) => PageType;
```

Example:

```ts
{
  type: filename => (filename.match(/^blog\//) ? 'article' : 'page');
}
```

### Unified Plugins

#### Parsers

- [remark-parse](https://github.com/remarkjs/remark/tree/main/packages/remark-parse)
- [remark-frontmatter](https://github.com/remarkjs/remark-frontmatter)
- [table](./src/mdast/table.ts)
- [remark-directive](https://github.com/remarkjs/remark-directive) (also see [Directives](#directives))

These can be replaced with different `parsers`, or extended using `additionalParsers`.

#### Converters

- [remark-rehype](https://github.com/remarkjs/remark-rehype)

Use the `converters` option to replace this default converter plugin.

#### Transformers

- [rehype-autolink-headings](https://github.com/rehypejs/rehype-autolink-headings) (only wraps h2-h6)
- [rehype-slug](https://github.com/rehypejs/rehype-slug)
- [rehype-document](https://github.com/rehypejs/rehype-document)
- [JSON-LD](./src/util/structured-content.ts) (structured content) in a
  [<script type="application/ld+json">{}</script>](./src/hast/transformers.ts).

Use the `transformers` option to add transformer plugins.

#### Renderers

- [rehype-format](https://github.com/rehypejs/rehype-format)
- [rehype-stringify](https://github.com/rehypejs/rehype/tree/main/packages/rehype-stringify)

Use the `renderers` option to replace these default render plugins.

### Directives

Directives are a powerful way to extend the Markdown syntax. The (implemented) proposal consists of inline (`:`), leaf
(`::`) and container (`:::`) block directives.

```md
::ASIDE

# Header

:::div{.wrapper}

Content with :abbr[HTML]{title="HyperText Markup Language"}

:::
```

The inline and container directives are readily available. To use a leaf block directive, pass an object with the
directive as a key, and a function that returns a `hast` node. The function is much like an AST visitor function, and
adds the `vFile` argument for convenience:

```ts
type DirectiveVisitor = (node: Element, index: number, parent: Parent, vFile: VFile) => Element;
```

```ts
const insertAside = (node, index, parent, vFile) => {
  return h('aside', { class: 'custom' }, 'news');
};

const directives = {
  ASIDE: insertAside
};
```

This will result in this HTML output:

```html
<aside class="custom">news</aside>
<h1>Header</h1>
<div class="wrapper">Content with <abbr title="HyperText Markup Language">HTML</abbr></div>
```

### Defaults

Sets default for each type of apge. By default there's only the `page` type. Example:

```js
const options = {
  defaults: {
    page: {
      stylesheets: ['/css/stylesheet.css'],
      author: {
        name: 'Lars Kappert',
        href: 'https://www.webpro.nl',
        twitter: '@webprolific'
      },
      publisher: {
        name: 'Lars Kappert',
        href: 'https://www.webpro.nl',
        logo: {
          src: 'https://www.webpro.nl/img/logo-512x512.png'
        }
      },
      icon: {
        src: '/img/logo.svg'
      },
      logo: {
        alt: 'Blog Logo',
        src: '/img/logo.svg',
        href: '/'
      },
      sameAs: ['https://github.com/webpro'],
      layout: () => {},
      prefetch: '/blog'
    }
  }
};
```

Any Front Matter in the Markdown augments or overrides these defaults.

```md
---
published: 2022-03-05
modified: 2022-04-20
image: /articles/yet-another-article/image.webp
draft: true
---

# Yet Another Article

Lorem ipsum
```

The merged meta data will be used in the meta tags and structured content, and is available in layouts and directives.

- The `published` date adds `<meta property="article:published_time" content="2022-03-05T00:00:00Z">`
- The `author.name` adds `<meta name="author" content="Lars Kappert">`
- The `prefetch` value will add `<link rel="prefetch" href="/blog">`

### Layouts

Each page type can have its own layout to wrap the content. Render `${node}` somewhere, and use all of the page's meta
data that was provided by Markdown Rambler and yourself:

```ts
import { html } from 'markdown-rambler';

export default (node, meta) => {
  const { logo } = meta;
  return html`
    <header>
      <a href="${logo.href}">
        <img src="${logo.src}" alt="${logo.alt}" />
      </a>
    </header>
    <main class=${meta.class}>${node}</main>
    <footer>© 2022, Lars Kappert</footer>
  `;
};
```

## Format Markdown

Set `formatMarkdown: true` and the following plugins will be applied to the Markdown source files:

- [remark-prettier](https://github.com/remcohaszing/remark-prettier) to format the document
- [remark-reference-links](https://github.com/remarkjs/remark-reference-links) to turn `[text](url)` into `[text][ref]`
  (and add definitions to the end)
- [order-links](./src/unist/order-links.ts) to order the definitions
