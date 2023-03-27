import type { PluggableList, FrozenProcessor } from 'unified';
import type { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { Parent } from 'unist';
import type { Thing, WithContext } from 'schema-dts';
import type { VFile } from 'vfile';
import type { Result } from 'hastscript';

export type File = [string, string];
export type Files = File[];

export type { VFile };

export type Schema = WithContext<Thing>;

export type Tree = ReturnType<FrozenProcessor['parse']>;

export type Transformers = ((vFile: VFile) => PluggableList) | PluggableList;

export type PageType = 'page' | string;

export type FrontMatter = Partial<Meta>;

export type LayoutFn = (children: Parent['children'], meta: Meta) => Result | Result[];

declare module 'VFile' {
  interface VFileDataMap {
    matter: FrontMatter;
    tree: Tree;
    structuredContent: Schema;
    meta: Meta;
    pathname: string;
    vFiles: Record<PageType, VFile[]>;
  }
}

export type BuildMetaData = (vFile: VFile, type: PageType, options: RamblerOptions) => Meta;

interface TransferrableOptions {
  host: string;
  name: string;
  language: string;
  sitemap: boolean;
  manifest: false | string;
  feed: false | Feed;
}

type IgnorePattern = string | RegExp | ((file: string) => Boolean);

export interface RamblerOptions extends Partial<TransferrableOptions> {
  contentDir?: string | string[];
  contentFiles?: string | string[];
  publicDir?: string;
  outputDir?: string;
  watchDir?: string | string[];
  ignorePattern?: IgnorePattern | IgnorePattern[];
  verbose?: boolean;
  watch?: boolean;
  search?: boolean | Search;

  formatMarkdown?: boolean;

  linkFiles?: boolean;

  type?: (filename: string, matter: FrontMatter) => PageType;

  parsers?: PluggableList;
  remarkPlugins?: PluggableList;
  remarkRehypeOptions?: RemarkRehypeOptions;
  rehypePlugins?: Transformers;
  renderers?: PluggableList;

  directives?: Record<string, any>;
  defaults?: Record<PageType, Partial<PageOptions>>;
}

interface PageOptions {
  layout: LayoutFn;
  author: Author;
  publisher: Publisher;
  title: string;
  description?: string;
  prefetch?: string;
  published?: Date;
  modified?: Date;
  stylesheets: string[];
  scripts: string[];
  sameAs?: string[];
  draft?: boolean;
  image?: Image;
  tags?: string[];
  logo: Logo;
  icon: Image;
  structuredContent?: {
    '@type': 'WebSite' | 'Article';
  };
  [key: string]: unknown;
}

export interface Meta extends PageOptions, TransferrableOptions {
  type: string;
  pathname: string;
  href: string;
  bundledStylesheets: string[];
  bundledScripts: string[];
  pageStylesheets: string[];
  pageScripts: string[];
}

type Feed = {
  pathname: string;
  title: string;
  description?: string;
  author?: string;
  tags?: string[];
  filter?: (type: PageType, vFile: VFile) => boolean;
};

type Search = {
  outputDir?: string;
  filter?: (type: PageType, vFile: VFile) => boolean;
};

interface Image {
  src: string;
  alt?: string;
}

interface Logo extends Image {
  href: string;
}

type Author = {
  name: string;
  href: string;
  twitter?: string;
};

type Publisher = {
  name: string;
  href: string;
  logo: Image;
};

export type DirectiveVisitor = (node: Element, index: number, parent: Parent, vFile: VFile) => Element;

export type Directives = Record<string, DirectiveVisitor>;
