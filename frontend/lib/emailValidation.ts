const EMAIL_MAX_LENGTH = 254;
const LOCAL_MAX_LENGTH = 64;

/** Local part: standard chars; no leading/trailing dots or consecutive dots. */
const LOCAL_PART_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;

/** Domain label (RFC 1035 style). */
const DOMAIN_LABEL_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

/**
 * Common real TLDs for signup (rejects typos / fake endings like .om, .cm, .con).
 * Longest compound suffixes are checked first (e.g. co.in before in).
 */
const VALID_MULTI_PART_TLDS = [
  "co.in",
  "com.in",
  "org.in",
  "net.in",
  "ac.in",
  "edu.in",
  "gov.in",
  "res.in",
  "gen.in",
  "firm.in",
  "ind.in",
  "co.uk",
  "org.uk",
  "ac.uk",
  "me.uk",
  "ltd.uk",
  "plc.uk",
  "com.au",
  "net.au",
  "org.au",
  "edu.au",
  "co.nz",
  "co.za",
  "co.jp",
  "co.kr",
  "com.br",
  "com.mx",
  "com.ar",
  "com.sg",
  "com.hk",
  "com.tw",
  "com.my",
  "com.ph",
  "com.tr",
  "com.pl",
  "com.es",
  "com.fr",
  "com.de",
  "com.it",
  "com.nl",
  "com.be",
  "com.ch",
  "com.at",
  "com.pt",
  "com.gr",
  "com.ru",
  "com.cn",
  "com.vn",
  "com.bd",
  "com.pk",
  "com.sa",
  "com.ae",
  "com.eg",
  "com.ng",
  "com.co",
] as const;

const VALID_SINGLE_TLDS = new Set(
  [
    "com",
    "in",
    "org",
    "net",
    "edu",
    "gov",
    "mil",
    "int",
    "co",
    "io",
    "ai",
    "app",
    "dev",
    "me",
    "info",
    "biz",
    "name",
    "pro",
    "xyz",
    "tech",
    "online",
    "site",
    "store",
    "cloud",
    "uk",
    "us",
    "ca",
    "au",
    "de",
    "fr",
    "es",
    "it",
    "nl",
    "be",
    "at",
    "ch",
    "se",
    "no",
    "dk",
    "fi",
    "ie",
    "pt",
    "gr",
    "pl",
    "cz",
    "ro",
    "hu",
    "sk",
    "br",
    "mx",
    "ar",
    "cl",
    "pe",
    "ve",
    "jp",
    "kr",
    "cn",
    "tw",
    "hk",
    "sg",
    "my",
    "th",
    "id",
    "vn",
    "ph",
    "pk",
    "bd",
    "lk",
    "np",
    "ae",
    "sa",
    "qa",
    "kw",
    "bh",
    "il",
    "tr",
    "ru",
    "ua",
    "za",
    "ke",
    "ng",
    "eg",
    "ma",
    "nz",
  ].map((tld) => tld.toLowerCase()),
);

const MULTI_PART_TLDS_DESC = [...VALID_MULTI_PART_TLDS].sort(
  (a, b) => b.length - a.length,
);

export const EMAIL_REQUIRED_ERROR = "Email is required";
export const EMAIL_INVALID_ERROR = "Please enter a valid email address";
export const EMAIL_MAX_ERROR = `Email cannot exceed ${EMAIL_MAX_LENGTH} characters`;

function labelsAreValid(labels: string[]): boolean {
  return labels.every((label) => label && DOMAIN_LABEL_PATTERN.test(label));
}

/** Returns hostname labels before the recognized TLD, or null if TLD is not allowed. */
function splitDomainHostAndTld(domain: string): string[] | null {
  const lower = domain.toLowerCase();

  for (const multiTld of MULTI_PART_TLDS_DESC) {
    const suffix = `.${multiTld}`;
    if (lower === multiTld || lower.endsWith(suffix)) {
      const hostPart = lower === multiTld ? "" : lower.slice(0, -suffix.length);
      const hostLabels = hostPart ? hostPart.split(".") : [];
      const tldLabels = multiTld.split(".");
      if (!labelsAreValid([...hostLabels, ...tldLabels])) {
        return null;
      }
      return hostLabels;
    }
  }

  const labels = lower.split(".");
  if (labels.length < 2) {
    return null;
  }

  const tld = labels[labels.length - 1];
  if (!VALID_SINGLE_TLDS.has(tld)) {
    return null;
  }

  if (!labelsAreValid(labels)) {
    return null;
  }

  return labels.slice(0, -1);
}

/**
 * Validates a normalized email (lowercase, no whitespace).
 */
export function isValidEmailAddress(email: string): boolean {
  return getEmailValidationError(email) === undefined;
}

/** Allowed domains for signup (aligned with backend register). */
export const SIGNUP_ALLOWED_EMAIL_DOMAINS = [
  "gmail.com",
  "yahoo.in",
  "outlook.com",
  "thestackly.com",
] as const;

const SIGNUP_ALLOWED_DOMAIN_SET = new Set<string>(
  SIGNUP_ALLOWED_EMAIL_DOMAINS.map((domain) => domain.toLowerCase()),
);

export const SIGNUP_EMAIL_DOMAIN_ERROR =
  "Only Gmail, Yahoo, Outlook, and Stackly email addresses are allowed";

/** Provider-style host labels are letters only (rejects typos like 123gmail.com). */
function isPlausibleEmailProviderDomain(domain: string): boolean {
  const hostLabels = splitDomainHostAndTld(domain);
  if (hostLabels === null || hostLabels.length === 0) {
    return false;
  }
  return hostLabels.every((label) => /^[a-zA-Z]{2,}$/.test(label));
}

/**
 * Signup email: structural checks plus allowed provider domains only.
 */
export function getSignupEmailValidationError(
  email: string,
  options?: { required?: boolean },
): string | undefined {
  const structuralError = getEmailValidationError(email, options);
  if (structuralError) {
    return structuralError;
  }

  if (!email) {
    return undefined;
  }

  const atIndex = email.indexOf("@");
  const domain = email.slice(atIndex + 1).toLowerCase();
  if (!SIGNUP_ALLOWED_DOMAIN_SET.has(domain)) {
    if (!isPlausibleEmailProviderDomain(domain)) {
      return EMAIL_INVALID_ERROR;
    }
    return SIGNUP_EMAIL_DOMAIN_ERROR;
  }

  return undefined;
}

export function isValidSignupEmailAddress(email: string): boolean {
  return getSignupEmailValidationError(email) === undefined;
}

/** Run signup email validation once the address looks complete enough to check. */
export function shouldValidateSignupEmailLive(email: string): boolean {
  const atIndex = email.indexOf("@");
  if (atIndex <= 0) {
    return false;
  }
  const domain = email.slice(atIndex + 1);
  return domain.includes(".") && domain.indexOf(".") < domain.length - 1;
}

export function getEmailValidationError(
  email: string,
  options?: { required?: boolean },
): string | undefined {
  const required = options?.required !== false;

  if (!email) {
    return required ? EMAIL_REQUIRED_ERROR : undefined;
  }

  if (email.length > EMAIL_MAX_LENGTH) {
    return EMAIL_MAX_ERROR;
  }

  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) {
    return EMAIL_INVALID_ERROR;
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (!local || !domain || local.length > LOCAL_MAX_LENGTH) {
    return EMAIL_INVALID_ERROR;
  }

  if (
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    !LOCAL_PART_PATTERN.test(local)
  ) {
    return EMAIL_INVALID_ERROR;
  }

  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return EMAIL_INVALID_ERROR;
  }

  const hostLabels = splitDomainHostAndTld(domain);
  if (hostLabels === null) {
    return EMAIL_INVALID_ERROR;
  }

  if (hostLabels.length === 0) {
    return EMAIL_INVALID_ERROR;
  }

  if (hostLabels.some((label) => label.length < 2)) {
    return EMAIL_INVALID_ERROR;
  }

  return undefined;
}
