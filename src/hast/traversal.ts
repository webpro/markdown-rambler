import { visit } from 'unist-util-visit';
import type { Parent, Node } from 'unist';
import type { Element, ElementContent } from 'hast';
import type { Test } from 'unist-util-is';

type VisitorCallback = (node: Parent, index: number, parent: Parent) => void;

export const findElement = (tree: Parent, test: Test, callback: VisitorCallback) => {
  const matcher: Test = typeof test === 'function' ? test : (node: Element) => node.tagName === test;
  visit(tree, 'element', (node, index, parent) => {
    if (matcher(node) && parent && index !== null) {
      return callback(node, index, parent);
    }
  });
};

export const append = (tree: Parent, test: Test, ...elements: ElementContent[]) => {
  findElement(tree, test, node => {
    node.children.push(...elements);
    return false;
  });
  return tree;
};

export const insertBefore = (tree: Parent, test: Test, element: Element) => {
  findElement(tree, test, (node, index, parent) => {
    parent?.children.splice(index, 0, element);
    return false;
  });
  return tree;
};

export const insertBeforeStylesheets = (tree: Parent, element: Element) => {
  const test = (node: Element) => {
    const rel = [node?.properties?.rel].flat();
    return node.tagName === 'link' && rel.includes('stylesheet');
  };
  return insertBefore(tree, test, element);
};
