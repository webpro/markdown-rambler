import type { PluggableList, FrozenProcessor } from 'unified';
import { Options as RemarkRehypeOptions } from 'remark-rehype';
import type { Parent, Element } from 'hast';
import type { Thing, WithContext } from 'schema-dts';
import type { VFile } from 'vfile';

export type File = [string, string];
export type Files = File[];

export type { VFile };

export type Schema = WithContext<Thing>;

export type Tree = ReturnType<FrozenProcessor['parse']>;

export type Transformers = ((vFile: VFile) => PluggableList) | PluggableList;

export type PageType = 'page' | string;
export type PageTypes = PageType[];

export type FrontMatter = Partial<Meta>;

export type LayoutFn = (node: Parent['children'], meta: Meta) => Element | Element[];

declare module 'VFile' {
  interface VFileDataMap {
    matter: FrontMatter;
    tree: Tree;
    structuredContent: Schema;
    meta: Meta;
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

export interface RamblerOptions extends Partial<TransferrableOptions> {
  contentDir?: string | string[];
  contentFiles?: string | string[];
  outputDir?: string;
  watchDir?: string | string[];
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

export interface PageOptions {
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
  tags?: string | string[];
  logo: Logo;
  icon: Image;
}

export interface Meta extends PageOptions, TransferrableOptions {
  type: string;
  pathname: string;
  bundledStylesheets: string[];
  bundledScripts: string[];
}

type Feed = {
  pathname: string;
  title: string;
  description?: string;
  author?: string;
  filter?: (type: PageType, vFile: VFile) => boolean;
};

type Search = {
  outputDir?: string;
  filter?: (type: PageType, vFile: VFile) => boolean;
};

export interface Image {
  src: string;
  alt?: string;
}

export interface Logo extends Image {
  href: string;
}

export type Author = {
  name: string;
  href: string;
  twitter?: string;
};

export type Publisher = {
  name: string;
  href: string;
  logo: Image;
};

export type ParsedMeta = {
  title: string;
  type: PageType;
  pathname: string;
  frontMatter: FrontMatter;
};

export type DirectiveVisitor = (node: Element, index: number, parent: Parent, vFile: VFile) => Element;

export type Directives = Record<string, DirectiveVisitor>;

export type Matcher = (node: Element) => Boolean;
