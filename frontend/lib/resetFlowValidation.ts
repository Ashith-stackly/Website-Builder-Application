/** Contact fields (email / mobile) must not contain any whitespace. */
export const CONTACT_WHITESPACE_ERROR =
  "Email or mobile number cannot contain spaces";

export function stripContactWhitespace(value: string): string {
  return value.replace(/\s/g, "");
}

/** Password fields must not contain leading, trailing, or internal spaces. */
export const PASSWORD_WHITESPACE_ERROR = "Password cannot contain spaces";

export function passwordContainsWhitespace(value: string): boolean {
  return /\s/.test(value);
}
