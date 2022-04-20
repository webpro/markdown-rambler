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

| Option              | Type                            | Default value                       | Description                                                                         |
| ------------------- | ------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| `contentDir`        | `string \| string[]`            | `['public', 'content']`             | `'content'` is only added when `contentFiles` is not provided.                      |
| `contentFiles`      | `string \| string[]`            | `'**/*'`                            | Should include assets (non-Markdown files) as well.                                 |
| `outputDir`         | `string`                        | `'dist'`                            | All HTML and assets are written into this directory                                 |
| `verbose`           | `boolean`                       | `false`                             | Logs more output about the process                                                  |
| `watch`             | `boolean`                       | `false`                             | Adds a watch to re-processes modified files again                                   |
| `host`              | `string`                        | `''`                                | Provide this for canonical url's and in meta data, etc.                             |
| `name`              | `string`                        | `''`                                | Website name (e.g. `<meta property="og:site_name" content="{name}">`)               |
| `language`          | `string`                        | `'en'`                              | Website language (e.g. `'fr-BE'`)                                                   |
| `manifest`          | `false \| string`               | `false`                             | Adds `<link rel="manifest" href="{manifest}">`                                      |
| `sitemap`           | `boolean`                       | `true`                              | Adds `sitemap.txt`                                                                  |
| `feed`              | `false \| Feed`                 | `false`                             | Generates RSS XML file and `<link rel="alternate" type="application/rss+xml" ...>`  |
| `formatMarkdown`    | `boolean`                       | `false`                             | Formats source Markdown files (using Prettier)                                      |
| `type`              | `(filename: string) => string`  | `page`                              | Adds `type` property to meta data for use in layouts and plugins (e.g. `'article'`) |
| `parsers`           | `Pluggable[]`                   | `[parse, matter, table, directive]` | Remark parsers                                                                      |
| `additionalParsers` | `Pluggable[]`                   | `[]`                                | Additional remark parsers (on top of `parsers`)                                     |
| `converters`        | `Pluggable[]`                   | `[remark-rehype]`                   | Plugin to convert mdast (1) to hast (2)                                             |
| `transformers`      | `Pluggable[]`                   | `[rehype-document, ld+json]`        | Transformers applied to the hast                                                    |
| `renderers`         | `Pluggable[]`                   | `[rehype-format, rehype-stringify]` | Plugins to render (stringify) the hast                                              |
| `directives`        | `Record<string, any>`           | `undefined`                         | Directives to extend Markdown syntax (e.g. `::TOC` or `:::div.wrapper`)             |
| `defaults`          | `Record<PageType, PageOptions>` | `undefined`                         | Default meta data for each document of any page type                                |

1. mdast: Markdown Abstract Syntax Tree
2. hast: HyperText (HTML) AST

### Feed

```typescript
type Feed = {
  pathname: string;
  title: string;
  description?: string;
  author?: string;
};
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

```typescript
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
