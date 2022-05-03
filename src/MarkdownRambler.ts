import './util/at';
import { EOL } from 'os';
import { debuglog } from 'util';
import { join, extname } from 'node:path';
import { globby } from 'globby';
import _ from 'lodash';
import { unified } from 'unified';
import { toVFile, readSync } from 'to-vfile';
import { VFile } from 'vfile';
import { matter } from 'vfile-matter';
import { rename } from 'vfile-rename';
import { mkdirp } from 'vfile-mkdirp';
import remark2rehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { rss } from 'xast-util-feed';
import { toXml } from 'xast-util-to-xml';
import MiniSearch from 'minisearch';
import defaultParsers from './mdast/parsers';
import { transformDirectives } from './mdast/parsers';
import formatters from './mdast/formatters';
import { getDocumentTitle, removeDocumentTitle } from './mdast/helpers';
import defaultTransformers from './hast/transformers';
import defaultRenderers from './hast/render';
import { buildMetaData, groupByType, unique, ucFirst } from './util';
import { resolvePathname, write, copy, append, optimizeSVG, watchDir } from './util/fs';
import { getStructuredContent } from './util/structured-content';
import { layout } from './hast/layout';

import type { File, Files, RamblerOptions, PageType } from './types';

const debug = debuglog('markdown-rambler');

const dbg = (vFile: VFile | string, text: string) => {
  const filename = typeof vFile === 'string' ? vFile : vFile.history.at(0);
  const padded = filename.length > 28 ? `...${filename.slice(-25)}` : filename.padStart(28);
  debug(`[${padded}] ${text}`);
};

export class MarkdownRambler {
  private options: RamblerOptions;

  constructor(options: RamblerOptions = {}) {
    this.options = Object.freeze(this.setDefaultOptions(options));
  }

  setDefaultOptions(options) {
    return _.defaultsDeep(options, {
      contentDir: !options.contentFiles ? 'content' : '.',
      contentFiles: '**/*',
      publicDir: 'public',
      outputDir: 'dist',
      host: '',
      name: '',
      language: 'en',
      manifest: false,
      sitemap: true,
      feed: false,
      search: false
    });
  }

  getTransformers(vFile) {
    const { rehypePlugins = [] } = this.options;
    const plugins = [
      typeof defaultTransformers === 'function' ? defaultTransformers(vFile) : defaultTransformers,
      typeof rehypePlugins === 'function' ? rehypePlugins(vFile) : rehypePlugins
    ];
    return plugins.flat();
  }

  async run() {
    const files = await this.getContentFiles();

    if (!this.options.watch && this.options.publicDir) {
      await this.bundleAssets('stylesheets');
      await this.bundleAssets('scripts');
    }

    const markdownFiles = files.filter(([dir, filename]) => filename.endsWith('.md'));
    const parsedVFiles = await this.parseMarkdownFiles(markdownFiles);

    if (this.options.linkFiles) {
      const files = groupByType(parsedVFiles);
      parsedVFiles.forEach(vFile => {
        vFile.data.vFiles = files;
      });
    }

    const vFiles = await this.renderMarkdownFiles(parsedVFiles);

    vFiles.map(async vFile => {
      dbg(vFile, `Writing ${vFile.history.at(-1)}`);
      this.verbose(`Writing ${vFile.history.at(-1)}`);
      await mkdirp(vFile);
      await toVFile.write(vFile);
    });

    const assetFiles = files.filter(([dir, filename]) => !filename.endsWith('.md'));
    await Promise.all(assetFiles.map(file => this.copyAsset(file)));

    console.log(`✔ ${vFiles.length} pages and ${assetFiles.length} asset files (in ${this.options.outputDir})`);

    const publishedVFiles = vFiles.filter(vFile => !vFile.data.meta.draft);

    if (this.options.feed) {
      const feed = await this.renderFeed(publishedVFiles);
      if (feed) console.log(`✔ Feed (at ${feed})`);
    }

    if (this.options.sitemap) {
      const sitemap = await this.renderSitemap(publishedVFiles);
      if (sitemap) console.log(`✔ Sitemap (at ${sitemap})`);
    }

    if (this.options.search) {
      const search = await this.renderSearchIndex(publishedVFiles);
      if (search) console.log(`✔ Search index (at ${search})`);
    }

    if (this.options.watch) {
      const watchDirs = await this.watch([this.options.contentDir, this.options.publicDir].flat().filter(unique));
      watchDirs.forEach(dir => console.log(`▶︎ Watching for changes in ./${dir}`));
    }
  }

  async getContentFiles(): Promise<Files> {
    const dirs = [this.options.publicDir, this.options.contentDir].flat().filter(unique);
    const glob = [this.options.contentFiles].flat().filter(unique);
    const files = [];
    for (const cwd of dirs) {
      const result = await globby(glob, { cwd, ignore: ['**/node_modules'] });
      files.push(result.map(filename => [cwd ?? '', filename]));
    }
    return files.flat();
  }

  async bundleAssets(assetType) {
    const bundled = `bundled${ucFirst(assetType)}`;
    const pageTypes = Object.keys(this.options.defaults);
    const orderedPageTypes = ['page', ...pageTypes].filter(unique);
    const assets: Record<PageType, string[]> = {};
    for (const pageType of orderedPageTypes) {
      assets[pageType] = assets[pageType] ?? [];
      if (this.options.defaults[pageType][assetType]) {
        for (const asset of this.options.defaults[pageType][assetType]) {
          if (!assets[pageType].includes(asset)) {
            const source = join(this.options.publicDir, asset);
            const ext = extname(source);
            const bundle = join(asset, `../${pageType}.bundle${ext}`);
            const target = join(this.options.outputDir, bundle);
            if (pageType !== 'page' && assets.page.includes(asset)) {
              // Skip when asset already in `page` assets
            } else if (assets[pageType].length === 0) {
              dbg(source, `Copying ${target} (${asset})`);
              this.verbose(`Copying ${target} (${asset})`);
              await copy(source, target);
              assets[pageType].push(asset);
              if (pageType === 'page') {
                this.options.defaults[pageType][bundled] = [bundle];
              } else {
                this.options.defaults[pageType][bundled] = [this.options.defaults.page[bundled], bundle];
              }
            } else {
              dbg(source, `Appending ${source} to ${target}`);
              this.verbose(`Appending ${source} to ${target}`);
              await append(source, target);
              assets[pageType].push(asset);
            }
          }
        }
      }
    }
  }

  async copyAsset(file: File) {
    const [dir, filename] = file;
    const source = join(dir, filename);
    const target = join(this.options.outputDir, filename);

    if (filename.endsWith('.svg')) {
      dbg(source, `Optimizing to ${target}`);
      this.verbose(`Optimizing ${target}`);
      await optimizeSVG(source, target);
    } else {
      dbg(source, `Copying to ${target}`);
      this.verbose(`Copying ${target}`);
      await copy(source, target);
    }
  }

  async handleFile(file: File) {
    const [dir, filename] = file;
    if (filename.endsWith('.md')) {
      const parsedVFile = await this.parseMarkdownFile(file);
      const vFile = await this.renderMarkdownFile(parsedVFile);
      dbg(vFile, `Writing ${vFile.history.at(-1)}`);
      this.verbose(`Writing ${vFile.history.at(-1)}`);
      await mkdirp(vFile);
      await toVFile.write(vFile);
    } else {
      this.copyAsset(file);
    }
  }

  async parseMarkdownFile([dir, filename]: File) {
    const source = join(dir, filename);
    const vFile = readSync(source);
    vFile.history.unshift(filename);
    return this.parseMarkdownVFile(vFile);
  }

  async parseMarkdownVFile(vFile: VFile) {
    dbg(vFile, `Parsing source file`);

    const options = this.options;
    const outputDir = options.outputDir;

    const parsers = options.parsers ?? defaultParsers;
    const remarkPlugins = options.remarkPlugins ?? [];
    const parser = unified().use([...parsers, ...remarkPlugins]);
    const tree = parser.parse(vFile);

    if (options.formatMarkdown) {
      dbg(vFile, `Formatting`);
      const plugins = [defaultParsers[0], defaultParsers[1], ...formatters];
      const formattedVFile = await unified().use(plugins).process(String(vFile));
      if (formattedVFile.value.toString() !== vFile.value.toString()) {
        this.verbose(`Formatting ${vFile.history.at(-1)}`);
        await write(vFile.history.at(-1), formattedVFile.value);
      }
    }

    // Rename to target file path
    const filename = vFile.history.at(0);
    const pathname = resolvePathname(filename);
    vFile = rename(vFile, { dirname: join(outputDir, pathname), stem: 'index', extname: '.html' });
    dbg(vFile, `Rendered file will be written to ${vFile.history.at(-1)}`);

    const type = typeof options.type === 'function' ? options.type(filename, vFile.data.matter) || 'page' : 'page';

    // Populate vFile.data
    matter(vFile);
    vFile.data.pathname = pathname;
    const meta = buildMetaData(vFile, type, options);
    vFile.data.markdown = String(vFile.value);
    vFile.data.tree = tree;
    vFile.data.meta = meta;
    vFile.data.meta.title = meta.title ?? getDocumentTitle(tree);
    vFile.data.structuredContent = getStructuredContent(meta);
    dbg(vFile, `The ${type} "${meta.title}" will be served from ${pathname}`);
    return vFile;
  }

  parseMarkdownFiles(files: Files): Promise<VFile[]> {
    return Promise.all(files.map(file => this.parseMarkdownFile(file)));
  }

  renderMarkdownFiles(vFiles: VFile[]) {
    return Promise.all(vFiles.map(vFile => this.renderMarkdownFile(vFile)));
  }

  async renderMarkdownFile(vFile: VFile): Promise<VFile> {
    dbg(vFile, `Rendering ${vFile.history.at(-1)}`);
    const { options } = this;

    const transformers = this.getTransformers(vFile);
    const renderers = options.renderers ?? defaultRenderers;

    const processor = unified()
      .use(transformDirectives, options.directives ? options.directives : false)
      .use(remark2rehype, options.remarkRehypeOptions ?? {})
      .use(layout, vFile.data.meta.layout ? { layout: vFile.data.meta.layout } : false)
      .use(transformers)
      .use(renderers);

    const tree = await processor.run(vFile.data.tree, vFile);

    // @ts-ignore
    vFile.value = processor.stringify(tree);
    return vFile;
  }

  async renderFeed(vFiles: VFile[]) {
    if (!this.options.feed) return;

    if (!this.options.host) {
      this.verbose('Unable to render RSS feed without `host`');
      return;
    }

    const { filter } = this.options.feed;

    const filtered =
      typeof filter === 'function' ? vFiles.filter(vFile => filter(vFile.data.meta.type, vFile)) : [...vFiles];

    const items = await Promise.all(
      filtered
        .sort((a, b) => +new Date(b.data.meta.published) - +new Date(a.data.meta.published))
        .slice(0, 10)
        .map(async vFile => {
          const plugins = [removeDocumentTitle, remark2rehype, rehypeStringify];
          const processor = unified().use(plugins);
          const tree = await processor.run(vFile.data.tree);
          const html = processor.stringify(tree) as string;
          const { meta } = vFile.data;
          return {
            title: meta.title,
            description: meta.description,
            descriptionHtml: html,
            author: meta.author,
            url: join(this.options.host, meta.pathname),
            modified: meta.modified,
            published: meta.published
          };
        })
    );

    const filename = join(this.options.outputDir, this.options.feed.pathname);

    const title = this.options.feed.title ?? this.options.name;
    const description = this.options.feed.description ?? this.options.defaults.page.description;
    const author = this.options.feed.author ?? this.options.defaults.page.author.name;

    const contents = rss(
      {
        title,
        description,
        author,
        tags: [],
        url: this.options.host,
        lang: this.options.language,
        feedUrl: join(this.options.host, this.options.feed.pathname)
      },
      items
    );

    await write(filename, toXml(contents));

    return filename;
  }

  async renderSitemap(vFiles: VFile[]) {
    if (!this.options.host) {
      this.verbose('Unable to render sitemap without `host`');
      return;
    }

    const { host } = this.options;
    const filename = join(this.options.outputDir, 'sitemap.txt');
    const items = vFiles.map(vFile => host + vFile.data.meta.pathname);
    await write(filename, items.sort().join(EOL) + EOL);
    return filename;
  }

  async renderSearchIndex(vFiles: VFile[]) {
    const defaults = { outputDir: '_search', filter: () => true };
    const options = this.options.search === true ? defaults : _.defaults(this.options.search, defaults);
    const documents = vFiles
      .filter(vFile => options.filter(vFile.data.meta.type, vFile))
      .map((vFile, index) => ({
        id: index,
        title: vFile.data.meta.title,
        description: vFile.data.meta.description,
        pathname: vFile.data.meta.pathname,
        content: vFile.data.markdown
      }));

    const miniSearch = new MiniSearch({
      fields: ['title', 'description', 'content'],
      storeFields: ['title', 'description', 'pathname']
    });

    await miniSearch.addAllAsync(documents);

    const filename = join(this.options.outputDir, options.outputDir, 'index.json');
    await write(filename, JSON.stringify(miniSearch.toJSON()));
    return filename;
  }

  public async watch(dirs: string[]) {
    const ignoreDir = this.options.outputDir;
    if (dirs) {
      const watchDirs = await Promise.all(
        dirs.map(dir => watchDir({ dir, cb: file => this.handleFile(file), ignoreDir }))
      );
      return watchDirs.filter(Boolean);
    }
    return [];
  }

  verbose(text: string) {
    if (this.options.verbose) {
      console.log(text);
    }
  }
}
