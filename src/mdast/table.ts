import { gfmTable } from 'micromark-extension-gfm-table';
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table';

export function table() {
  const data = this.data();
  add('micromarkExtensions', gfmTable);
  add('fromMarkdownExtensions', gfmTableFromMarkdown);
  add('toMarkdownExtensions', gfmTableToMarkdown);
  function add(field, value) {
    data[field] = data[field] || [];
    data[field].push(value);
  }
}
