import parse from 'remark-parse';
import front from 'remark-frontmatter';
import directives from 'remark-directive';
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import { table } from './table';
import type { Directives, Tree } from '../types';

export default [parse, front, table, directives];

export const transformDirectives: Plugin<[Directives], Tree> = directives => (tree, vFile) => {
  const visitor = (node, index, parent) => {
    if (node.type === 'textDirective' || node.type === 'leafDirective' || node.type === 'containerDirective') {
      // Ignore inline text directives not prefixed with a space (e.g. `unexpected:span`)
      const previousSibling = node.type === 'textDirective' && parent.children[index - 1];
      if (node.type === 'textDirective' && previousSibling && !previousSibling.value.endsWith(' ')) {
        node.type = 'text';
        node.value = `:${node.name}`;
        return;
      }

      if (node.name in directives) {
        const hast = directives[node.name](node, index, parent, vFile);
        const data = node.data || (node.data = {});
        data.hName = hast.tagName;
        data.hProperties = hast.properties;
        data.hChildren = hast.children;
      } else {
        const hast = h(node.name, node.attributes);
        const data = node.data || (node.data = {});
        data.hName = hast.tagName;
        data.hProperties = hast.properties;
      }
    }
  };
  visit(tree, visitor);
};
