import htm from 'htm';
import { h } from 'hastscript';
import type { Parent } from 'hast';
import type { Plugin } from 'unified';
import type { LayoutFn } from '../types';

type Options = {
  layout: LayoutFn;
};

export const html = htm.bind(h);

export const layout: Plugin<[Options], Parent> = options => (node, vFile) => {
  const children = options.layout(node.children, vFile.data.meta);
  return { ...node, children: Array.isArray(children) ? children : [children] };
};
