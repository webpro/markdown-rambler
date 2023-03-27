import htm from 'htm';
import { h } from 'hastscript';
import type { VFile } from 'vfile';
import type { Parent } from 'unist';
import type { LayoutFn } from '../types';

type Options = {
  layout: LayoutFn;
};

export const html = htm.bind(h);

export const layout = (options: Options) => (node: Parent, vFile: VFile) => {
  const children = options.layout(node.children, vFile.data.meta);
  return { ...node, children: Array.isArray(children) ? children : [children] };
};
