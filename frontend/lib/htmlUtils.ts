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

/** Converts a style object into an inline CSS style attribute string. */
export const styleToString = (styles?: Record<string, unknown> | null): string => {
  if (!styles || typeof styles !== "object") return "";
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => {
      const kebab = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
      return `${kebab}:${value}`;
    })
    .join(";");
};

