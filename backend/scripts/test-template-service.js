const assert = require('node:assert/strict');
const Template = require('../src/models/Template');

const {
  createBaseTemplateBuilderData,
  normalizeTemplateBuilderData,
  serializeTemplate,
} = require('../src/services/templateService');

const schemaTemplate = new Template({
  name: 'Schema Template',
  slug: 'schema-template',
  category: 'store',
});
assert.equal(schemaTemplate.validateSync(), undefined);
assert.deepEqual(
  schemaTemplate.pages.map(({ id, name, path }) => ({ id, name, path })),
  [{ id: 'home', name: 'Home', path: '/' }],
  'template records should receive one normalized homepage by default'
);

const baseTemplate = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Store Starter',
  slug: 'store-starter',
  category: 'store',
  style: 'Modern',
  description: 'A test storefront.',
  thumbnail: '/landing-optimized/ecommerce.webp',
  premium: false,
  tags: ['store'],
  usageCount: 2,
  sections: ['navigation', 'hero', 'features', 'gallery', 'contact', 'footer'],
  components: [],
  designTokens: {},
  builderData: {},
};

const starter = createBaseTemplateBuilderData(baseTemplate);
assert.equal(starter.schemaVersion, 1);
assert.equal(starter.canvasMode, 'flow');
assert.ok(starter.components.length >= 6, 'starter templates need editable Builder components');
assert.deepEqual(
  starter.components.map((component) => component.type),
  ['navigation', 'hero', 'features', 'gallery', 'contact', 'footer']
);
assert.equal(starter.components[1].props.media.src, baseTemplate.thumbnail);

const normalizedLegacy = normalizeTemplateBuilderData(baseTemplate);
assert.notStrictEqual(normalizedLegacy, starter, 'normalization returns an isolated document');
assert.equal(normalizedLegacy.components.length, starter.components.length);
normalizedLegacy.components[0].props.brand = 'Changed copy';
assert.equal(
  createBaseTemplateBuilderData(baseTemplate).components[0].props.brand,
  baseTemplate.name,
  'template starter data must not share mutable component references'
);

const storedBuilderData = {
  schemaVersion: 1,
  projectName: 'Saved source',
  canvasMode: 'freeform',
  components: [{ id: 'saved-heading', type: 'heading', content: 'Saved', styles: {}, children: [], order: 0 }],
  seo: { title: 'Saved source', description: 'Saved', ogTitle: '', ogDescription: '', ogImage: '' },
};
const normalizedStored = normalizeTemplateBuilderData({
  ...baseTemplate,
  builderData: storedBuilderData,
});
assert.equal(normalizedStored.canvasMode, 'freeform');
assert.equal(normalizedStored.projectName, 'Saved source');
assert.deepEqual(normalizedStored.components, storedBuilderData.components);
assert.deepEqual(normalizedStored.seo, storedBuilderData.seo);

const detail = serializeTemplate({
  ...baseTemplate,
  premium: true,
  builderData: {},
}, { includeBuilderData: true });
assert.equal(detail.category, 'store');
assert.equal(detail.isPremium, true);
assert.equal(detail.pages[0].path, '/');
assert.equal(detail.componentCount, starter.components.length);
assert.ok(detail.builderData.components.length > 0);

console.log('Template service normalization checks passed.');
