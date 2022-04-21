import { visit } from 'unist-util-visit';

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
