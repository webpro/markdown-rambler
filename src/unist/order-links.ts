import { visit } from 'unist-util-visit';
import { is } from 'unist-util-is';
import { remove } from 'unist-util-remove';

function orderDefinitions() {
  return transformer;
}

function transformer(tree) {
  const refs = [];
  const defs = [];
  const ordered = [];

  visit(tree, ['linkReference', 'imageReference', 'definition'], node => {
    if (is(node, ['linkReference', 'imageReference'])) refs.push(node);
    if (is(node, 'definition')) defs.push(node);
  });

  refs.forEach(ref => {
    const def = ordered.find(d => d.identifier === ref.identifier);
    if (!def) {
      ordered.push(defs.find(d => d.identifier === ref.identifier));
      const id = String(ordered.length);
      ref.identifier = id;
      ref.label = id;
    } else {
      ref.identifier = def.identifier;
      ref.label = def.identifier;
    }
  });

  remove(tree, 'definition');

  ordered.forEach((def, index) => {
    const id = String(index + 1);
    tree.children.push({
      type: 'definition',
      title: def.title,
      url: def.url,
      identifier: id,
      label: id
    });
  });
}

export default orderDefinitions;
