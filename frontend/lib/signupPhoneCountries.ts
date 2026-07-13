/** National significant number (digits only, no country calling code). */
export type SignupPhoneCountry = {
  id: string;
  name: string;
  /** ITU-T calling code digits only (no +). */
  dialCode: string;
  minDigits: number;
  maxDigits: number;
};

export const DEFAULT_SIGNUP_PHONE_COUNTRY_ID = "IN";

/** Curated rules for common countries (national length without leading + / country code). */
const RAW_SIGNUP_PHONE_COUNTRIES: SignupPhoneCountry[] = [
  { id: "AU", name: "Australia", dialCode: "61", minDigits: 9, maxDigits: 9 },
  { id: "BD", name: "Bangladesh", dialCode: "880", minDigits: 10, maxDigits: 10 },
  { id: "BE", name: "Belgium", dialCode: "32", minDigits: 9, maxDigits: 9 },
  { id: "BR", name: "Brazil", dialCode: "55", minDigits: 10, maxDigits: 11 },
  { id: "CA", name: "Canada", dialCode: "1", minDigits: 10, maxDigits: 10 },
  { id: "CH", name: "Switzerland", dialCode: "41", minDigits: 9, maxDigits: 9 },
  { id: "CN", name: "China", dialCode: "86", minDigits: 11, maxDigits: 11 },
  { id: "DE", name: "Germany", dialCode: "49", minDigits: 10, maxDigits: 11 },
  { id: "EG", name: "Egypt", dialCode: "20", minDigits: 10, maxDigits: 10 },
  { id: "ES", name: "Spain", dialCode: "34", minDigits: 9, maxDigits: 9 },
  { id: "FR", name: "France", dialCode: "33", minDigits: 9, maxDigits: 9 },
  { id: "GB", name: "United Kingdom", dialCode: "44", minDigits: 10, maxDigits: 10 },
  { id: "ID", name: "Indonesia", dialCode: "62", minDigits: 9, maxDigits: 12 },
  { id: "IN", name: "India", dialCode: "91", minDigits: 10, maxDigits: 10 },
  { id: "IT", name: "Italy", dialCode: "39", minDigits: 9, maxDigits: 10 },
  { id: "JP", name: "Japan", dialCode: "81", minDigits: 10, maxDigits: 11 },
  { id: "KE", name: "Kenya", dialCode: "254", minDigits: 9, maxDigits: 9 },
  { id: "KR", name: "South Korea", dialCode: "82", minDigits: 9, maxDigits: 11 },
  { id: "LK", name: "Sri Lanka", dialCode: "94", minDigits: 9, maxDigits: 9 },
  { id: "MX", name: "Mexico", dialCode: "52", minDigits: 10, maxDigits: 10 },
  { id: "MY", name: "Malaysia", dialCode: "60", minDigits: 9, maxDigits: 10 },
  { id: "NG", name: "Nigeria", dialCode: "234", minDigits: 10, maxDigits: 10 },
  { id: "NL", name: "Netherlands", dialCode: "31", minDigits: 9, maxDigits: 9 },
  { id: "NZ", name: "New Zealand", dialCode: "64", minDigits: 8, maxDigits: 10 },
  { id: "PH", name: "Philippines", dialCode: "63", minDigits: 10, maxDigits: 10 },
  { id: "PK", name: "Pakistan", dialCode: "92", minDigits: 10, maxDigits: 10 },
  { id: "SA", name: "Saudi Arabia", dialCode: "966", minDigits: 9, maxDigits: 9 },
  { id: "SG", name: "Singapore", dialCode: "65", minDigits: 8, maxDigits: 8 },
  { id: "TH", name: "Thailand", dialCode: "66", minDigits: 9, maxDigits: 9 },
  { id: "AE", name: "United Arab Emirates", dialCode: "971", minDigits: 9, maxDigits: 9 },
  { id: "US", name: "United States", dialCode: "1", minDigits: 10, maxDigits: 10 },
  { id: "VN", name: "Vietnam", dialCode: "84", minDigits: 9, maxDigits: 9 },
  { id: "ZA", name: "South Africa", dialCode: "27", minDigits: 9, maxDigits: 9 },
];

export const SIGNUP_PHONE_COUNTRIES: SignupPhoneCountry[] = [...RAW_SIGNUP_PHONE_COUNTRIES].sort(
  (a, b) => a.name.localeCompare(b.name)
);

/**
 * Upper bound for mobile numbers entered as international format on shared
 * inputs (e.g. Forgot Password) that do not have a country selector.
 * Computed as the longest national number plus the longest country dial code
 * plus 1 character for the optional leading "+".
 */
export const MAX_MOBILE_INPUT_LENGTH: number = (() => {
  const maxDial = SIGNUP_PHONE_COUNTRIES.reduce(
    (acc, c) => Math.max(acc, c.dialCode.length),
    0
  );
  const maxNational = SIGNUP_PHONE_COUNTRIES.reduce(
    (acc, c) => Math.max(acc, c.maxDigits),
    0
  );
  return 1 + maxDial + maxNational;
})();

const COUNTRIES_BY_DIAL_DESC = [...SIGNUP_PHONE_COUNTRIES].sort(
  (a, b) => b.dialCode.length - a.dialCode.length,
);

/**
 * National-number format rules (digits only, no country calling code).
 * Applied after length checks; unknown countries still reject leading zeros.
 */
const SIGNUP_NATIONAL_PATTERNS: Partial<Record<string, RegExp>> = {
  AU: /^4\d{8}$/,
  BD: /^1[3-9]\d{8}$/,
  BE: /^4\d{8}$/,
  BR: /^[1-9]\d{9,10}$/,
  CA: /^[2-9]\d{9}$/,
  CH: /^7[5-9]\d{7}$/,
  CN: /^1[3-9]\d{9}$/,
  DE: /^1[5-7]\d{8,9}$/,
  EG: /^1[0125]\d{8}$/,
  ES: /^[67]\d{8}$/,
  FR: /^[67]\d{8}$/,
  GB: /^7\d{9}$/,
  ID: /^8\d{8,11}$/,
  IN: /^[6-9]\d{9}$/,
  IT: /^3\d{8,9}$/,
  JP: /^[789]0\d{8}$/,
  KE: /^[17]\d{8}$/,
  KR: /^1\d{8,10}$/,
  LK: /^7\d{8}$/,
  MX: /^[1-9]\d{9}$/,
  MY: /^1\d{8,9}$/,
  NG: /^[789]\d{9}$/,
  NL: /^6\d{8}$/,
  NZ: /^2\d{7,9}$/,
  PH: /^9\d{9}$/,
  PK: /^3\d{9}$/,
  SA: /^5\d{8}$/,
  SG: /^[89]\d{7}$/,
  TH: /^[689]\d{8}$/,
  AE: /^5\d{8}$/,
  US: /^[2-9]\d{9}$/,
  VN: /^[35789]\d{8}$/,
  ZA: /^[6-8]\d{8}$/,
};

/** True when the contact field is being used as a mobile number (digits and optional + only). */
export function looksLikeMobileContactInput(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && /^\+?\d*$/.test(trimmed);
}

export function mobileContactMaxLengthMessage(): string {
  return `Mobile number cannot exceed ${MAX_MOBILE_INPUT_LENGTH} characters`;
}

/** Returns null when the mobile contact is valid for a supported country length. */
export function validateInternationalMobileContact(value: string): string | null {
  const trimmed = value.trim();
  if (!looksLikeMobileContactInput(trimmed)) {
    return null;
  }

  if (trimmed.length > MAX_MOBILE_INPUT_LENGTH) {
    return mobileContactMaxLengthMessage();
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) {
    return "Enter valid email or mobile number";
  }

  for (const country of COUNTRIES_BY_DIAL_DESC) {
    if (!digits.startsWith(country.dialCode)) {
      continue;
    }
    const national = digits.slice(country.dialCode.length);
    if (!national) {
      continue;
    }
    const err = validateSignupNationalDigits(national, country);
    if (!err) {
      return null;
    }
    return err;
  }

  for (const country of SIGNUP_PHONE_COUNTRIES) {
    if (validateSignupNationalDigits(digits, country) === null) {
      return null;
    }
  }

  const hint = getDefaultSignupPhoneCountry();
  return `Enter a valid mobile number (${nationalDigitsMessage(hint)} or include country code)`;
}

export function isValidMobileContact(value: string): boolean {
  return (
    looksLikeMobileContactInput(value) &&
    validateInternationalMobileContact(value) === null
  );
}

/** Returns E.164 (+country+national) for a valid international mobile input. */
export function normalizeInternationalMobileContact(value: string): string | null {
  const trimmed = value.trim();
  if (!isValidMobileContact(trimmed)) {
    return null;
  }

  const digits = trimmed.replace(/\D/g, "");

  for (const country of COUNTRIES_BY_DIAL_DESC) {
    if (!digits.startsWith(country.dialCode)) {
      continue;
    }
    const national = digits.slice(country.dialCode.length);
    if (!national) {
      continue;
    }
    if (validateSignupNationalDigits(national, country) === null) {
      return toE164Mobile(country, national);
    }
  }

  for (const country of SIGNUP_PHONE_COUNTRIES) {
    if (validateSignupNationalDigits(digits, country) === null) {
      return toE164Mobile(country, digits);
    }
  }

  return null;
}

export function getSignupPhoneCountry(id: string): SignupPhoneCountry | undefined {
  return SIGNUP_PHONE_COUNTRIES.find((c) => c.id === id);
}

export function getDefaultSignupPhoneCountry(): SignupPhoneCountry {
  return getSignupPhoneCountry(DEFAULT_SIGNUP_PHONE_COUNTRY_ID) ?? SIGNUP_PHONE_COUNTRIES[0];
}

export function nationalDigitsMessage(country: SignupPhoneCountry): string {
  if (country.minDigits === country.maxDigits) {
    return `Enter ${country.minDigits} digits for ${country.name}`;
  }
  return `Enter ${country.minDigits}-${country.maxDigits} digits for ${country.name}`;
}

export const SIGNUP_MOBILE_INVALID_MESSAGE = "Please enter a valid mobile number";

/** Rejects numbers where every digit is identical (e.g. 0000000000, 1111111111). */
export function hasRepeatingMobileDigits(digits: string): boolean {
  const n = digits.replace(/\D/g, "");
  return n.length > 1 && /^(\d)\1*$/.test(n);
}

function getNationalFormatError(digits: string, country: SignupPhoneCountry): string | null {
  if (digits.startsWith("0")) {
    return SIGNUP_MOBILE_INVALID_MESSAGE;
  }
  if (hasRepeatingMobileDigits(digits)) {
    return SIGNUP_MOBILE_INVALID_MESSAGE;
  }
  const pattern = SIGNUP_NATIONAL_PATTERNS[country.id];
  if (pattern && !pattern.test(digits)) {
    return SIGNUP_MOBILE_INVALID_MESSAGE;
  }
  return null;
}

/** Returns an error message string or null if length is valid. */
export function validateSignupNationalDigits(
  digits: string,
  country: SignupPhoneCountry
): string | null {
  const n = digits.replace(/\D/g, "");
  if (n.length < country.minDigits || n.length > country.maxDigits) {
    return nationalDigitsMessage(country);
  }
  return getNationalFormatError(n, country);
}

export function toE164Mobile(country: SignupPhoneCountry, nationalDigits: string): string {
  const n = nationalDigits.replace(/\D/g, "");
  return `+${country.dialCode}${n}`;
}
