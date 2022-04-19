import type { Pluggable, PluggableList } from 'unified';
import type { FrozenProcessor } from 'unified';
import type { Parent, Element } from 'hast';
import type { Thing, WithContext } from 'schema-dts';
import type { VFile } from 'vfile';

export type File = [string, string];
export type Files = File[];

export type { VFile };

export type Schema = WithContext<Thing>;

export type Tree = ReturnType<FrozenProcessor['parse']>;

export type Transformers = ((vFile: VFile) => PluggableList) | PluggableList;

export type FrontMatter = Partial<Meta>;

export type LayoutFn = (node: Parent['children'], meta: Meta) => Element | Element[];

declare module 'VFile' {
  interface VFileDataMap {
    matter: FrontMatter;
    tree: Tree;
    structuredContent: Schema;
    meta: Meta;
  }
  interface VFileDataRegistry {
    tree: Tree;
    matter: FrontMatter;
    structuredContent: Schema;
    meta: Meta;
  }
}

export type BuildMetaData = (vFile: VFile, options: RamblerOptions) => Meta;

export type PageType = 'page' | string;
export type PageTypes = PageType[];

type Feed =
  | false
  | {
      pathname: string;
      title: string;
      description?: string;
      author?: string;
    };

interface TransferrableOptions {
  host: string;
  name: string;
  lang: string;
  sitemap: boolean;
  manifest: false | string;
  feed: Feed;
}

export interface RamblerOptions extends Partial<TransferrableOptions> {
  contentDir?: string | string[];
  contentFiles?: string | string[];
  outputDir?: string;
  watchDir?: string | string[];
  verbose?: boolean;
  watch?: boolean;

  formatMarkdown?: boolean;

  linkFiles?: boolean;

  type?: (filename: string) => PageType;

  buildMetaData?: BuildMetaData;

  parsers?: PluggableList;
  additionalParsers?: PluggableList;
  converters?: PluggableList;
  transformers?: Transformers;
  renderers?: Pluggable[];

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
  published?: string;
  modified?: string;
  stylesheets: string[];
  sameAs?: string[];
  draft?: boolean;
  image?: Image;
  tags?: string | string[];
  logo: Logo;
  icon: Image;
}

export interface Meta extends PageOptions, TransferrableOptions {
  pathname: string;
}

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
