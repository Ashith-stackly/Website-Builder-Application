/** Shared mobile rules for login / forgot-password (no country-specific messages). */

export const SIMPLE_MOBILE_MIN_DIGITS = 6;
export const SIMPLE_MOBILE_MAX_DIGITS = 16;

/** Optional leading + plus up to 16 digits. */
export const SIMPLE_MOBILE_MAX_INPUT_LENGTH =
  1 + SIMPLE_MOBILE_MAX_DIGITS;

export const SIMPLE_MOBILE_INVALID_MESSAGE =
  "Enter valid email or mobile number";

/** True when the field is digits with an optional leading + only. */
export function looksLikeMobileContactInput(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && /^\+?\d*$/.test(trimmed);
}

export function countMobileDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

export function validateSimpleMobileContact(value: string): string | null {
  const trimmed = value.trim();
  if (!looksLikeMobileContactInput(trimmed)) {
    return null;
  }

  const digits = countMobileDigits(trimmed);
  if (digits < SIMPLE_MOBILE_MIN_DIGITS || digits > SIMPLE_MOBILE_MAX_DIGITS) {
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

/** Keeps optional + and caps national digits to {@link SIMPLE_MOBILE_MAX_DIGITS}. */
export function capSimpleMobileContactInput(value: string): string {
  const trimmed = value.replace(/\s/g, "");
  if (!looksLikeMobileContactInput(trimmed)) {
    return trimmed;
  }

  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "").slice(0, SIMPLE_MOBILE_MAX_DIGITS);
  return hasPlus ? `+${digits}` : digits;
}
