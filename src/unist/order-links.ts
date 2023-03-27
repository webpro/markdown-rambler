import { visit } from 'unist-util-visit';
import { is } from 'unist-util-is';
import { remove } from 'unist-util-remove';

function orderDefinitions() {
  return transformer;
}

function transformer(tree) {
  let id = 0;
  const refs = [];
  const defs = [];
  const store = [];

  visit(tree, ['linkReference', 'imageReference', 'definition'], node => {
    if (is(node, ['linkReference', 'imageReference'])) refs.push(node);
    if (is(node, 'definition')) defs.push(node);
  });

  refs.forEach(ref => {
    const def = defs.find(d => d.identifier === ref.identifier);
    const reusableDef = store.find(d => d.url === def.url);
    if (reusableDef) {
      ref.identifier = reusableDef.identifier;
      ref.label = reusableDef.identifier;
    } else {
      const identifier = isNaN(ref.identifier) ? ref.identifier : String(++id);
      ref.identifier = identifier;
      ref.label = identifier;
      store.push({
        type: 'definition',
        title: def.title,
        url: def.url,
        identifier,
        label: identifier
      });
    }
  });

  remove(tree, 'definition');

  store.sort(definitionSorter).forEach(def => {
    tree.children.push(def);
  });
}

function definitionSorter(a, b) {
  if (isNaN(a.identifier) && !isNaN(b.identifier)) return 1;
  if (!isNaN(a.identifier) && isNaN(b.identifier)) return -1;
  if (!isNaN(b.identifier) && !isNaN(a.identifier)) return Number(a.identifier) - Number(b.identifier);
  return a.identifier - b.identifier;
}

export default orderDefinitions;
