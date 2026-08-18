/** Shared mobile rules for login / forgot-password (no country-specific messages). */

export const SIMPLE_MOBILE_MIN_DIGITS = 6;
export const SIMPLE_MOBILE_MAX_DIGITS = 16;

/** Optional leading + plus up to 16 digits. */
export const SIMPLE_MOBILE_MAX_INPUT_LENGTH =
  1 + SIMPLE_MOBILE_MAX_DIGITS;

export const SIMPLE_MOBILE_INVALID_MESSAGE =
  "Please enter a valid mobile number";

/** Determines if an input value is intended as a mobile number rather than an email. */
export function looksLikeMobileContactInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes("@")) return false;
  if (trimmed.startsWith("+")) return true;

  const hasLetters = /[a-zA-Z]/.test(trimmed);
  const hasDigits = /\d/.test(trimmed);

  if (!hasLetters && (hasDigits || /^[\d\+\-\(\)\s#\*]+$/.test(trimmed))) {
    return true;
  }

  return false;
}

export function countMobileDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

export function validateSimpleMobileContact(value: string): string | null {
  const trimmed = value.trim();
  if (!looksLikeMobileContactInput(trimmed)) {
    return null;
  }

  const isValidFormat = /^\+?\d+$/.test(trimmed);
  const digits = countMobileDigits(trimmed);

  if (!isValidFormat || digits < SIMPLE_MOBILE_MIN_DIGITS || digits > SIMPLE_MOBILE_MAX_DIGITS) {
    return SIMPLE_MOBILE_INVALID_MESSAGE;
  }

  return null;
}

export function isValidSimpleMobileContact(value: string): boolean {
  return (
    looksLikeMobileContactInput(value) &&
    validateSimpleMobileContact(value) === null
  );
}

export function simpleMobileMaxLengthMessage(): string {
  return `Mobile number cannot exceed ${SIMPLE_MOBILE_MAX_DIGITS} digits`;
}

/** Keeps raw input up to {@link SIMPLE_MOBILE_MAX_INPUT_LENGTH} characters. */
export function capSimpleMobileContactInput(value: string): string {
  const trimmed = value.replace(/\s/g, "");
  if (trimmed.length > SIMPLE_MOBILE_MAX_INPUT_LENGTH) {
    return trimmed.slice(0, SIMPLE_MOBILE_MAX_INPUT_LENGTH);
  }
  return trimmed;
}
