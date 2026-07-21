const { cleanString } = require('./PromptBuilder');

const ALLOWED_IMAGE_SIZES = new Set(['1024x1024', '1536x1024', '1024x1536']);

function resolveImageSize({ aspectRatio, size } = {}) {
  if (ALLOWED_IMAGE_SIZES.has(size)) return size;

  switch (aspectRatio) {
    case '16:9':
    case '4:3':
    case 'landscape':
      return '1536x1024';
    case '9:16':
    case '3:4':
    case 'portrait':
      return '1024x1536';
    default:
      return '1024x1024';
  }
}

function resolveImageQuality(size) {
  if (size === 'small') return 'low';
  if (size === 'large') return 'high';
  return 'medium';
}

function buildImagePrompt(payload = {}) {
  const subject = cleanString(payload.prompt, 1000);
  const style = cleanString(payload.style, 80) || 'modern editorial';

  return [
    'Create an original, polished website visual.',
    `Subject: ${subject}.`,
    `Visual style: ${style}.`,
    'Use a clean composition with room for page copy where practical.',
    'Do not include readable text, watermarks, brand logos, UI chrome, or copyrighted characters.',
  ].join(' ');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function placeholderPalette(seed) {
  const palettes = [
    ['#102a43', '#2f80ed', '#e3f2fd'],
    ['#1d3557', '#e76f51', '#fef3e2'],
    ['#264653', '#2a9d8f', '#e9f5f2'],
    ['#3c1642', '#9d4edd', '#f7eefe'],
    ['#3b2f2f', '#d4a373', '#fff7ed'],
  ];
  const index = [...seed].reduce((total, char) => total + char.charCodeAt(0), 0) % palettes.length;
  return palettes[index];
}

/**
 * Local SVG placeholders let users continue building when an external image
 * provider is unavailable. The browser stores the returned data URL exactly
 * like an uploaded asset, so it works in export and preview flows.
 */
function createPlaceholderImage(payload = {}) {
  const subject = cleanString(payload.prompt, 120) || 'Website visual';
  const style = cleanString(payload.style, 48) || 'Placeholder';
  const [dark, accent, light] = placeholderPalette(`${subject}:${style}`);
  const label = escapeXml(subject.length > 48 ? `${subject.slice(0, 45)}…` : subject);
  const size = resolveImageSize(payload);
  const [width, height] = size.split('x').map(Number);
  const labelY = Math.round(height * 0.78);
  const captionY = Math.round(height * 0.85);
  const insetX = Math.round(width * 0.07);
  const insetY = Math.round(height * 0.11);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${label}"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${dark}"/><stop offset="1" stop-color="${accent}"/></linearGradient><filter id="blur"><feGaussianBlur stdDeviation="18"/></filter></defs><rect width="${width}" height="${height}" fill="url(#bg)"/><circle cx="${Math.round(width * 0.8)}" cy="${Math.round(height * 0.18)}" r="${Math.round(Math.min(width, height) * 0.22)}" fill="${light}" opacity=".23" filter="url(#blur)"/><circle cx="${Math.round(width * 0.18)}" cy="${Math.round(height * 0.78)}" r="${Math.round(Math.min(width, height) * 0.3)}" fill="${light}" opacity=".12" filter="url(#blur)"/><path d="M0 ${Math.round(height * 0.76)}C${Math.round(width * 0.16)} ${Math.round(height * 0.56)} ${Math.round(width * 0.3)} ${Math.round(height * 0.94)} ${Math.round(width * 0.49)} ${Math.round(height * 0.72)}s${Math.round(width * 0.28)}-${Math.round(height * 0.24)} ${Math.round(width * 0.51)}-${Math.round(height * 0.08)}v${Math.round(height * 0.36)}H0Z" fill="${light}" opacity=".16"/><rect x="${insetX}" y="${insetY}" width="${width - insetX * 2}" height="${height - insetY * 2}" rx="42" fill="#ffffff" opacity=".08" stroke="#ffffff" stroke-opacity=".26" stroke-width="2"/><text x="${Math.round(width * 0.095)}" y="${labelY}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${Math.max(34, Math.round(Math.min(width, height) * 0.064))}" font-weight="700">${label}</text><text x="${Math.round(width * 0.097)}" y="${captionY}" fill="#ffffff" fill-opacity=".78" font-family="Arial, sans-serif" font-size="${Math.max(16, Math.round(Math.min(width, height) * 0.028))}" letter-spacing="4">STACKLY PLACEHOLDER</text></svg>`;

  return {
    imageUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    mimeType: 'image/svg+xml',
    alt: subject,
    source: 'placeholder',
  };
}

module.exports = {
  ALLOWED_IMAGE_SIZES,
  resolveImageSize,
  resolveImageQuality,
  buildImagePrompt,
  createPlaceholderImage,
};
