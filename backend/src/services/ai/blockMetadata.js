/**
 * Server-safe mirror of the `ai` metadata in frontend/lib/blockRegistry.ts.
 *
 * The frontend registry is TypeScript/React code and is intentionally not
 * executed by the API server. This allowlisted catalog preserves its semantic
 * descriptions and example prop shapes without trusting prompt descriptions
 * supplied by a browser. Keep this catalog aligned when a block spec changes.
 */
const BLOCK_METADATA = Object.freeze({
  hero: {
    description: 'A full-width hero section with a bold headline, supporting description, and a call-to-action button.',
    exampleOutput: { title: 'Build better websites', description: 'Launch a polished site without the usual complexity.', cta: { label: 'Get started', href: '#contact' } },
  },
  navigation: {
    description: 'A top navigation bar with a brand name, nav links array, and a CTA button.',
    exampleOutput: { brand: 'Stackly', links: [{ label: 'About', href: '#about' }], cta: { label: 'Contact us', href: '#contact' } },
  },
  'feature-item': {
    description: 'A single feature card with an icon, title, description, and optional CTA. Used inside a columns layout for feature grids.',
    exampleOutput: { icon: 'Sparkles', title: 'Fast to launch', description: 'Move from idea to published page quickly.', cta: { label: 'Learn more', href: '#features' } },
  },
  contact: {
    description: 'An email capture section with a title, subtitle, email input, and a submit button.',
    exampleOutput: { title: 'Stay in the loop', description: 'Get useful updates in your inbox.', inputPlaceholder: 'Email address', cta: { label: 'Subscribe', href: '#' } },
  },
  features: {
    description: 'A features grid section containing an array of titled cards, each with a title and description. Optional heading above the grid.',
    exampleOutput: { title: 'Everything you need', description: 'Tools that keep work moving.', items: [{ title: 'Simple editing', description: 'Update your site with confidence.' }] },
  },
  video: {
    description: 'An embedded video block supporting YouTube and Vimeo URLs with configurable aspect ratio.',
    exampleOutput: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'Product Demo', aspectRatio: '16/9' },
  },
  heading: {
    description: 'A heading content block.',
    exampleOutput: { content: 'Build a better page', tag: 'h1' },
  },
  text: {
    description: 'A text content block.',
    exampleOutput: { content: 'Write a clear supporting message for your visitors.' },
  },
  button: {
    description: 'A button content block.',
    exampleOutput: { content: 'Get started', href: '#contact' },
  },
  image: {
    description: 'An image block with source URL and alt text.',
    exampleOutput: { src: '/showcase.webp', alt: 'Builder image' },
  },
  icon: {
    description: 'A Lucide icon block.',
    exampleOutput: { name: 'Star' },
  },
  columns: {
    description: 'A responsive column container.',
    exampleOutput: { columns: '3' },
  },
  input: {
    description: 'A form input content block.',
    exampleOutput: { label: 'Email address', placeholder: 'you@example.com', type: 'email' },
  },
  divider: {
    description: 'A horizontal divider line.',
    exampleOutput: {},
  },
  gallery: {
    description: 'A gallery of images with captions.',
    exampleOutput: { items: [{ src: '/showcase.webp', caption: 'Website image' }] },
  },
  container: {
    description: 'A generic container section for nested blocks.',
    exampleOutput: {},
  },
  map: {
    description: 'An embedded Google map for an address.',
    exampleOutput: { address: 'New York, NY', zoom: 13, height: '360px' },
  },
  accordion: {
    description: 'Expandable FAQ/content accordion.',
    exampleOutput: { items: [{ title: 'What is included?', content: 'Everything needed to get started.' }] },
  },
  tabs: {
    description: 'Tabbed content panels.',
    exampleOutput: { items: [{ label: 'Overview', content: 'A short overview of this option.' }] },
  },
  spacer: {
    description: 'Adjustable vertical space.',
    exampleOutput: { height: '60px' },
  },
  'social-links': {
    description: 'A row of social media links.',
    exampleOutput: { links: [{ platform: 'LinkedIn', url: 'https://www.linkedin.com' }] },
  },
  countdown: {
    description: 'A launch/event countdown timer.',
    exampleOutput: { label: 'Coming Soon', targetDate: '2027-01-01' },
  },
  'pricing-table': {
    description: 'A multi-tier pricing table.',
    exampleOutput: { title: 'Simple pricing', tiers: [{ name: 'Starter', price: '$19', period: '/mo', features: ['Core tools'], cta: 'Choose Starter' }] },
  },
  testimonial: {
    description: 'Customer testimonial cards.',
    exampleOutput: { title: 'Loved by teams', items: [{ quote: 'A great experience.', name: 'Alex Kim', role: 'Founder' }] },
  },
  footer: {
    description: 'A footer with columns and social links.',
    exampleOutput: { brand: 'Stackly', columns: [{ title: 'Product', links: [{ label: 'Features', href: '#features' }] }], copyright: '© 2026 Stackly' },
  },
  form: {
    description: 'A contact/signup form with configurable fields.',
    exampleOutput: { title: 'Let\'s talk', description: 'Tell us a little about your project.', submitLabel: 'Send message', fields: [{ label: 'Name', type: 'text', placeholder: 'Your name' }] },
  },
  row: {
    description: 'A row container with configurable column layout.',
    exampleOutput: { columns: 2 },
  },
});

const FALLBACK_BLOCK_METADATA = Object.freeze({
  description: 'A Stackly website content block. Create concise, useful copy that can be pasted into the requested field.',
  exampleOutput: { content: 'Clear website copy' },
});

function getBlockMetadata(blockType) {
  return BLOCK_METADATA[blockType] || FALLBACK_BLOCK_METADATA;
}

module.exports = {
  BLOCK_METADATA,
  FALLBACK_BLOCK_METADATA,
  getBlockMetadata,
};
