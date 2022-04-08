import { visit } from 'unist-util-visit';
import type { Root, Parent, Element, ElementContent } from 'hast';
import type { VisitorResult } from 'unist-util-visit';
import type { Matcher } from '../types';

type VisitorCallback = (node: Element, index: number, parent: Parent) => void;

export const findElement = (tree: Root, tagName: string | Matcher, callback: VisitorCallback): VisitorResult => {
  const matcher: Matcher = typeof tagName === 'string' ? node => node.tagName === tagName : tagName;
  visit(tree, 'element', (node, index, parent) => {
    if (matcher(node) && parent && index !== null) {
      return callback(node, index, parent);
    }
  });
};

export const append = (tree: Root, tagName: string, ...elements: ElementContent[]): Root => {
  findElement(tree, tagName, node => {
    node.children.push(...elements);
    return false;
  });
  return tree;
};

export const insertBefore = (tree: Root, tagName: string | Matcher, element: ElementContent): Root => {
  findElement(tree, tagName, (node, index, parent) => {
    parent?.children.splice(index, 0, element);
    return false;
  });
  return tree;
};

export const insertBeforeStylesheets = (tree: Root, element: ElementContent): Root => {
  const matcher: Matcher = node => {
    const rel = [node?.properties?.rel].flat();
    return node.tagName === 'link' && rel.includes('stylesheet');
  };
  return insertBefore(tree, matcher, element);
};
