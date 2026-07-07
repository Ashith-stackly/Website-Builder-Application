/**
 * Shared HTML utilities used by exportHtml.ts and individual block specs.
 * Kept in one place so escaping logic is never duplicated.
 */

/** Escapes special HTML characters to prevent XSS in exported markup. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
