import './util/at';
import { EOL } from 'os';
import { debuglog } from 'util';
import { join } from 'node:path';
import { globby } from 'globby';
import _ from 'lodash';
import { unified } from 'unified';
import { toVFile, readSync } from 'to-vfile';
import { VFile } from 'vfile';
import { matter } from 'vfile-matter';
import { rename } from 'vfile-rename';
import { mkdirp } from 'vfile-mkdirp';
import { rss } from 'xast-util-feed';
import { toXml } from 'xast-util-to-xml';
import MiniSearch from 'minisearch';
import defaultParsers from './mdast/parsers';
import { transformDirectives } from './mdast/parsers';
import formatters from './mdast/formatters';
import defaultConverters from './mdast/convert';
import { getDocumentTitle, removeDocumentTitle } from './mdast/helpers';
import defaultTransformers from './hast/transformers';
import defaultRenderers from './hast/render';
import { buildMetaData, groupByType } from './util';
import { write, copy, optimizeSVG, watchDir } from './util/fs';
import { getStructuredContent } from './util/structured-content';
import { layout } from './hast/layout';

import type { FrozenProcessor } from 'unified';
import type { File, Files, RamblerOptions } from './types';

const debug = debuglog('markdown-rambler');

const dbg = (vFile: VFile | string, text: string) => {
  const filename = typeof vFile === 'string' ? vFile : vFile.history.at(0);
  const padded = filename.length > 28 ? `...${filename.slice(-25)}` : filename.padStart(28);
  debug(`[${padded}] ${text}`);
};

export class MarkdownRambler {
  private options: RamblerOptions;
  private parser: FrozenProcessor;

  constructor(options: RamblerOptions = {}) {
    this.options = Object.freeze(this.setDefaultOptions(options));
    this.installParser(options);
  }

  setDefaultOptions(options) {
    return _.defaultsDeep(options, {
      contentDir: !options.contentFiles ? 'content' : '.',
      contentFiles: '**/*',
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

  installParser(options) {
    const parsers = options.parsers ?? defaultParsers;
    const additionalParsers = options.additionalParsers ?? [];
    this.parser = unified().use([...parsers, ...additionalParsers]);
  }

  getTransformers(vFile) {
    const { transformers = [] } = this.options;
    const plugins = [
      typeof defaultTransformers === 'function' ? defaultTransformers(vFile) : defaultTransformers,
      typeof transformers === 'function' ? transformers(vFile) : transformers
    ];
    return plugins.flat();
  }

  async run() {
    const files = await this.getContentFiles();
    const markdownFiles = files.filter(([dir, filename]) => filename.endsWith('.md'));
    const parsedVFiles = await this.parseMarkdownFiles(markdownFiles);
    const filteredVFiles = parsedVFiles.filter(vFile => !this.isDraft(vFile));
    if (this.options.linkFiles) {
      const files = groupByType(filteredVFiles);
      filteredVFiles.forEach(vFile => {
        vFile.data.vFiles = files;
      });
    }

    const renderedVFiles = await this.renderMarkdownFiles(filteredVFiles);

    renderedVFiles.map(async vFile => {
      dbg(vFile, `Writing ${vFile.history.at(-1)}`);
      this.verbose(`Writing ${vFile.history.at(-1)}`);
      await mkdirp(vFile);
      await toVFile.write(vFile);
    });

    const assetFiles = files.filter(([dir, filename]) => !filename.endsWith('.md'));
    await Promise.all(assetFiles.map(file => this.copyAsset(file)));

    console.log(`✔ ${renderedVFiles.length} HTML and ${assetFiles.length} asset files (in ${this.options.outputDir})`);

    if (this.options.feed) {
      const feed = await this.renderFeed(filteredVFiles);
      console.log(`✔ Feed (at ${feed})`);
    }

    if (this.options.sitemap) {
      const sitemap = await this.renderSitemap(filteredVFiles);
      console.log(`✔ Sitemap (at ${sitemap})`);
    }

    if (this.options.search) {
      const search = await this.renderSearchIndex(vFiles);
      console.log(`✔ Search index (at ${search})`);
    }

    if (this.options.watch) {
      this.watch(this.options.contentDir);
    }
  }

  async getContentFiles(): Promise<Files> {
    const dirs = ['public', this.options.contentDir].flat();
    const glob = [this.options.contentFiles].flat();
    const files = [];
    for (const cwd of dirs) {
      const result = await globby(glob, { cwd, ignore: ['**/node_modules'] });
      files.push(result.map(filename => [cwd ?? '', filename]));
    }
    return files.flat();
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
    const parser = this.parser;
    const outputDir = this.options.outputDir;
    const tree = parser.parse(vFile);

    if (options.formatMarkdown) {
      dbg(vFile, `Formatting`);
      const formattedVFile = await unified().use([defaultParsers[0]]).use(formatters).process(String(vFile));
      if (formattedVFile.value.toString() !== vFile.value.toString()) {
        this.verbose(`Formatting ${vFile.history.at(0)}`);
        await write(vFile.history.at(0), formattedVFile.value);
      }
    }

    // Rename to target file path
    const filename = vFile.history.at(0);
    const pathname = '/' + filename.replace(/(README|index)?\.md$/, '').replace(/(.+)\/$/, '$1');
    vFile = rename(vFile, { dirname: join(outputDir, pathname), stem: 'index', extname: '.html' });
    dbg(vFile, `Rendered file will be written to ${vFile.history.at(-1)}`);

    const type = typeof options.type === 'function' ? options.type(filename, vFile.data.matter) || 'page' : 'page';

    // Populate vFile.data
    matter(vFile);
    const meta = buildMetaData(vFile, type, options);
    vFile.data.markdown = String(vFile.value);
    vFile.data.tree = tree;
    vFile.data.meta = meta;
    vFile.data.meta.pathname = pathname;
    vFile.data.meta.title = meta.title ?? getDocumentTitle(tree);
    vFile.data.structuredContent = getStructuredContent(meta);
    dbg(vFile, `The ${type} "${meta.title}" will be served from ${pathname}`);
    return vFile;
  }

  parseMarkdownFiles(files: Files): Promise<VFile[]> {
    return Promise.all(files.map(file => this.parseMarkdownFile(file)));
  }

  isDraft(vFile) {
    return vFile.data.meta.draft && process.env.CI;
  }

  renderMarkdownFiles(vFiles: VFile[]) {
    return Promise.all(vFiles.map(vFile => this.renderMarkdownFile(vFile)));
  }

  async renderMarkdownFile(vFile: VFile): Promise<VFile> {
    dbg(vFile, `Rendering ${vFile.history.at(-1)}`);
    const { options } = this;

    const converters = options.converters ?? defaultConverters;
    const transformers = this.getTransformers(vFile);
    const renderers = options.renderers ?? defaultRenderers;

    const processor = unified()
      .use(transformDirectives, options.directives ? options.directives : false)
      .use(converters)
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

    const { filter } = this.options.feed;

    const filtered =
      typeof filter === 'function' ? vFiles.filter(vFile => filter(vFile.data.meta.type, vFile)) : [...vFiles];

    const items = await Promise.all(
      filtered
        .sort((a, b) => +new Date(b.data.meta.published) - +new Date(a.data.meta.published))
        .slice(0, 10)
        .map(async vFile => {
          const plugins = [removeDocumentTitle, ...defaultConverters, defaultRenderers[1]];
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
    const filename = join(this.options.outputDir, 'sitemap.txt');
    const items = vFiles.map(vFile => vFile.data.meta.pathname);
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

  public watch(dir: string | string[]) {
    const ignoreDir = this.options.outputDir;
    if (dir) {
      const watchDirs = [dir].flat();
      watchDirs.forEach(dir => {
        watchDir({ dir, cb: file => this.handleFile(file), ignoreDir });
      });
    }
  }

  verbose(text: string) {
    if (this.options.verbose) {
      console.log(text);
    }
  }
}
