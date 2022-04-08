import { readSync } from 'to-vfile';
import { FrozenProcessor } from 'unified';
import { visit } from 'unist-util-visit';
import { matter } from 'vfile-matter';

export const getDocumentTitle = (tree): string => {
  let title = '';
  visit(tree, 'heading', node => {
    if (node.depth === 1) {
      title = node.children[0].value;
      return false;
    }
  });
  return title;
};

export const removeDocumentTitle = (tree): void => {
  visit(tree, 'heading', (node, index, parent) => {
    if (node.depth === 1) {
      parent?.children.splice(index, 1);
      return false;
    }
  });
};

export const getMarkdownParser = (processor: FrozenProcessor) => (filePath: string) => {
  const vFile = readSync(filePath);
  const tree = processor.parse(vFile);
  vFile.data.tree = tree;
  vFile.data.title = getDocumentTitle(tree);
  return matter(vFile);
};
