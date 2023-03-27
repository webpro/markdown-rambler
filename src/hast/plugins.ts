import { h } from 'hastscript';
import { append } from './traversal';

export const addInlineScript =
  ({ type, content }) =>
  tree => {
    const script = h('script', { type }, content);
    return append(tree, 'body', script);
  };

export const addScript =
  ({ src }) =>
  tree => {
    const script = h('script', { src });
    return append(tree, 'body', script);
  };
