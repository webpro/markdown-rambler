import { h } from 'hastscript';
import { append } from './traversal';
import type { Plugin } from 'unified';
import type { Root } from 'hast';

type UnifiedPlugin<T> = Plugin<[T], Root>;

export const addInlineScript: UnifiedPlugin<{ type?: string; content: string }> =
  ({ type, content }) =>
  tree => {
    const script = h('script', { type }, content);
    return append(tree, 'body', script);
  };

export const addScript: UnifiedPlugin<{ src: string }> =
  ({ src }) =>
  tree => {
    const script = h('script', { src });
    return append(tree, 'body', script);
  };
