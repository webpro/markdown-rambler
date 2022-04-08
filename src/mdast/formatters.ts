import remarkPrettier from 'remark-prettier';
import remarkReferenceLinks from 'remark-reference-links';
import orderDefinitions from '../unist/order-links';

export default [remarkPrettier, remarkReferenceLinks, orderDefinitions];
