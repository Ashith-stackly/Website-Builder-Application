export const OTP_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 3;

type OtpChannel = "email" | "mobile";

function getOtpSessionKeys(contact: string, channel: OtpChannel) {
  const contactKey = encodeURIComponent(contact.trim());
  return {
    contactKey,
    attemptsUsedKey: `stackly-otp-attempts-used-${channel}-${contactKey}`,
    expiresAtKey: `stackly-otp-expires-at-${channel}-${contactKey}`,
    expiredKey: `stackly-otp-expired-${channel}-${contactKey}`,
  };
}

export type OtpSessionState = {
  attemptsUsed: number;
  expiresAt: number | null;
  secondsLeft: number;
  isExpired: boolean;
};

export function startOtpSession(
  contact: string,
  channel: OtpChannel,
  cooldownSeconds = OTP_COOLDOWN_SECONDS,
): number {
  const { attemptsUsedKey, expiresAtKey, expiredKey } = getOtpSessionKeys(
    contact,
    channel,
  );
  const expiresAt = Date.now() + cooldownSeconds * 1000;
  sessionStorage.removeItem(expiredKey);
  sessionStorage.setItem(attemptsUsedKey, "0");
  sessionStorage.setItem(expiresAtKey, String(expiresAt));
  return expiresAt;
}

export function clearOtpSession(contact: string, channel: OtpChannel): void {
  const { attemptsUsedKey, expiresAtKey, expiredKey } = getOtpSessionKeys(
    contact,
    channel,
  );
  sessionStorage.removeItem(attemptsUsedKey);
  sessionStorage.removeItem(expiresAtKey);
  sessionStorage.removeItem(expiredKey);
}

export function markOtpSessionExpired(
  contact: string,
  channel: OtpChannel,
): void {
  const { expiresAtKey, expiredKey } = getOtpSessionKeys(contact, channel);
  sessionStorage.setItem(expiredKey, "1");
  sessionStorage.setItem(expiresAtKey, String(Date.now()));
}

export function setOtpAttemptsUsed(
  contact: string,
  channel: OtpChannel,
  attemptsUsed: number,
): void {
  const { attemptsUsedKey } = getOtpSessionKeys(contact, channel);
  sessionStorage.setItem(attemptsUsedKey, String(attemptsUsed));
}

export function readOtpSessionState(
  contact: string,
  channel: OtpChannel,
  maxAttempts = OTP_MAX_ATTEMPTS,
): OtpSessionState {
  if (typeof window === "undefined") {
    return {
      attemptsUsed: 0,
      expiresAt: null,
      secondsLeft: 0,
      isExpired: true,
    };
  }

  const { attemptsUsedKey, expiresAtKey, expiredKey } = getOtpSessionKeys(
    contact,
    channel,
  );
  const now = Date.now();
  const storedAttempts = Number(sessionStorage.getItem(attemptsUsedKey) || "0");
  const storedExpiresAt = Number(sessionStorage.getItem(expiresAtKey) || "0");
  const isExplicitlyExpired = sessionStorage.getItem(expiredKey) === "1";
  const attemptsUsed = Number.isFinite(storedAttempts)
    ? Math.min(storedAttempts, maxAttempts)
    : 0;

  if (!storedExpiresAt) {
    return {
      attemptsUsed,
      expiresAt: null,
      secondsLeft: 0,
      isExpired: true,
    };
  }

  const secondsLeft = Math.max(
    0,
    Math.ceil((storedExpiresAt - now) / 1000),
  );
  const isExpired = isExplicitlyExpired || secondsLeft <= 0;

  return {
    attemptsUsed,
    expiresAt: storedExpiresAt,
    secondsLeft: isExpired ? 0 : secondsLeft,
    isExpired,
  };
}
