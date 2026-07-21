const { cleanString } = require('./PromptBuilder');

const LAYOUT_PROFILES = Object.freeze({
  portfolio: [
    ['navigation', 'Navigation', 'Help visitors jump between your work and contact details.'],
    ['hero', 'Portfolio hero', 'Introduce the creator and their distinctive point of view.'],
    ['gallery', 'Selected work', 'Show a focused collection of recent projects.'],
    ['testimonial', 'Client feedback', 'Add social proof after the work samples.'],
    ['contact', 'Contact CTA', 'Make the next step clear and low friction.'],
    ['footer', 'Footer', 'Close with navigation and contact details.'],
  ],
  store: [
    ['navigation', 'Navigation', 'Surface categories, shopping and support.'],
    ['hero', 'Store hero', 'Lead with a seasonal offer or key product promise.'],
    ['features', 'Why shop with us', 'Explain quality, delivery and returns succinctly.'],
    ['gallery', 'Featured collection', 'Use product imagery to invite exploration.'],
    ['testimonial', 'Customer proof', 'Reassure shoppers with credible feedback.'],
    ['contact', 'Email capture', 'Offer useful updates or a first-order incentive.'],
    ['footer', 'Footer', 'Include policies and help links.'],
  ],
  restaurant: [
    ['navigation', 'Navigation', 'Direct visitors to menu, story and reservation details.'],
    ['hero', 'Restaurant hero', 'Make the cuisine, atmosphere and location immediately clear.'],
    ['features', 'Signature experience', 'Highlight menu, ingredients and hospitality.'],
    ['gallery', 'Food and space', 'Let the imagery carry the mood of the venue.'],
    ['contact', 'Reservations CTA', 'Make booking or calling effortless.'],
    ['footer', 'Footer', 'Close with hours, address and social links.'],
  ],
  service: [
    ['navigation', 'Navigation', 'Guide visitors to services, proof and contact.'],
    ['hero', 'Value proposition', 'State who the service is for and the outcome it creates.'],
    ['features', 'Services', 'Explain the highest-value services in scannable cards.'],
    ['testimonial', 'Results and trust', 'Use customer perspective to reinforce credibility.'],
    ['accordion', 'Common questions', 'Resolve objections before the visitor contacts you.'],
    ['contact', 'Primary CTA', 'Invite an enquiry, quote request or consultation.'],
    ['footer', 'Footer', 'Include practical next steps and legal links.'],
  ],
  startup: [
    ['navigation', 'Navigation', 'Focus attention on product, pricing and sign-up.'],
    ['hero', 'Product hero', 'Name the outcome and give one strong reason to act.'],
    ['video', 'Product demo', 'Show how the product works in a short walkthrough.'],
    ['features', 'Product capabilities', 'Turn core capabilities into customer benefits.'],
    ['pricing-table', 'Pricing', 'Let people evaluate plans without hunting for details.'],
    ['accordion', 'FAQ', 'Address onboarding, billing and security questions.'],
    ['contact', 'Final CTA', 'Offer a trial, demo or waitlist signup.'],
    ['footer', 'Footer', 'Link to product, company and policy pages.'],
  ],
});

const PALETTES = Object.freeze([
  { primary: '#1d4ed8', secondary: '#0f172a', accent: '#22c55e', background: '#f8fafc', text: '#0f172a' },
  { primary: '#7c3aed', secondary: '#312e81', accent: '#f97316', background: '#faf5ff', text: '#221a3d' },
  { primary: '#0f766e', secondary: '#134e4a', accent: '#f59e0b', background: '#f0fdfa', text: '#12312e' },
  { primary: '#be123c', secondary: '#4c0519', accent: '#fb7185', background: '#fff1f2', text: '#4c0519' },
]);

function normaliseServices(value) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return [...new Set(raw.map((item) => cleanString(item, 80)).filter(Boolean))].slice(0, 8);
}

function normaliseLayoutRequest(payload = {}) {
  const contentLength = ['short', 'medium', 'long'].includes(payload.contentLength)
    ? payload.contentLength
    : 'medium';
  return {
    businessType: cleanString(payload.businessType, 120),
    industry: cleanString(payload.industry, 120),
    goal: cleanString(payload.goal, 160),
    services: normaliseServices(payload.services),
    contentLength,
  };
}

function findProfile(request) {
  const haystack = [request.businessType, request.industry, request.goal, ...request.services]
    .join(' ')
    .toLowerCase();

  if (/portfolio|photograph|designer|creative|artist|architect/.test(haystack)) return 'portfolio';
  if (/store|shop|ecommerce|e-commerce|retail|product/.test(haystack)) return 'store';
  if (/restaurant|cafe|café|bakery|food|bar|dining/.test(haystack)) return 'restaurant';
  if (/startup|saas|software|app|platform|technology/.test(haystack)) return 'startup';
  return 'service';
}

function choosePalette(seed) {
  const index = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % PALETTES.length;
  return PALETTES[index];
}

function makeContentHint(type, request) {
  const business = request.businessType || request.industry || 'your business';
  const serviceLine = request.services.length ? ` Focus on ${request.services.slice(0, 3).join(', ')}.` : '';
  const lengthLine = request.contentLength === 'short'
    ? ' Keep copy to a minimum.'
    : request.contentLength === 'long'
      ? ' Leave room for supporting detail and proof.'
      : ' Balance scanability with useful detail.';

  const base = {
    hero: `Explain the clearest value ${business} offers and guide visitors to one next action.`,
    features: `Translate ${business}'s strongest offerings into customer-facing benefits.`,
    gallery: `Choose imagery that makes ${business} feel tangible and trustworthy.`,
    testimonial: 'Use specific, verifiable customer perspective where available.',
    contact: 'Use an action-oriented, low-friction invitation to get in touch.',
    accordion: 'Answer the questions that could prevent a visitor from acting.',
    'pricing-table': 'Present plans or packages so visitors can compare without friction.',
    video: 'Use a short demo or story that confirms the promised outcome.',
  }[type] || `Make this ${type} section support the visitor's decision journey.`;

  return `${base}${serviceLine}${lengthLine}`;
}

function sectionProps(type, request) {
  const business = request.businessType || request.industry || 'Your business';
  switch (type) {
    case 'hero':
      return { title: `A better way to experience ${business}`, description: makeContentHint(type, request), ctaLabel: 'Get started' };
    case 'features':
      return { title: `Why choose ${business}`, description: makeContentHint(type, request) };
    case 'contact':
      return { title: 'Ready when you are', description: makeContentHint(type, request), ctaLabel: 'Get in touch' };
    case 'testimonial':
      return { title: 'Trusted by people like you' };
    default:
      return {};
  }
}

function generateLayoutSuggestion(payload = {}) {
  const request = normaliseLayoutRequest(payload);
  const profile = findProfile(request);
  const sections = LAYOUT_PROFILES[profile].map(([type, label, purpose], index) => ({
    id: `${type}-${index + 1}`,
    type,
    label,
    purpose,
    contentHint: makeContentHint(type, request),
    props: sectionProps(type, request),
  }));

  return {
    title: `${profile.charAt(0).toUpperCase()}${profile.slice(1)} conversion flow`,
    rationale: `A ${profile} structure that moves visitors from understanding ${request.businessType || request.industry || 'the offer'} to a clear next action.`,
    sections,
    // `components` is retained as a UI-friendly alias for integrations that
    // apply suggestions directly through the builder store.
    components: sections,
    colorPalette: choosePalette(`${request.businessType}:${request.industry}:${profile}`),
  };
}

module.exports = {
  normaliseLayoutRequest,
  generateLayoutSuggestion,
};
