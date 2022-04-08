import parse from 'remark-parse';
import front from 'remark-frontmatter';
import directives from 'remark-directive';
import { gfmTable } from 'micromark-extension-gfm-table';
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table';
import { h } from 'hastscript';
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import type { Directives, Tree } from '../types';

function table() {
  const data = this.data();
  add('micromarkExtensions', gfmTable);
  add('fromMarkdownExtensions', gfmTableFromMarkdown);
  add('toMarkdownExtensions', gfmTableToMarkdown);
  function add(field, value) {
    data[field] = data[field] || [];
    data[field].push(value);
  }
}

export default [parse, front, table, directives];

export const transformDirectives: Plugin<[Directives], Tree> = directives => (tree, vFile) => {
  const visitor = (node, index, parent) => {
    if (node.type === 'textDirective' || node.type === 'leafDirective' || node.type === 'containerDirective') {
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
