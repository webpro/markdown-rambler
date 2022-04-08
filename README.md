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
    │   ├── writing-a-blogpost.md
    │   └── yet-another-article.md
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
    │   ├── writing-a-blogpost
    │   │   └── index.html
    │   └── yet-another-article
    │       └── index.html
    ├── blog
    │   └── index.html
    ├── index.html
    └── sitemap.txt
```
