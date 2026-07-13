"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isApiConnectionError, verifyEmailOtp } from "@/lib/api";
import {
  createOtpChangeHandler,
  createOtpKeyDownHandler,
  createOtpPasteHandler,
} from "@/lib/otpInputHandlers";
import { assetPath } from "@/lib/paths";
import ResetFlowBackButton from "@/components/ResetFlowBackButton";

const EMAIL_OTP_INPUT_PREFIX = "email-otp";

const OTP_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 3;
const MAX_ATTEMPTS_REACHED_MESSAGE = "Maximum attempts reached.";

const VERIFY_OTP_LINK_CLASS =
  "underline font-semibold cursor-pointer transition-colors duration-200 hover:text-white focus-visible:text-white focus-visible:outline-none";

const VERIFY_OTP_RESEND_CLASS =
  "text-[12px] sm:text-[13px] underline font-semibold transition-colors duration-200 enabled:cursor-pointer enabled:hover:text-[#F2B541] focus-visible:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:no-underline";

const resetFlowCardStyle = {
  background:
    "linear-gradient(180deg, #4A76F3 0%, #2C4FAD 50%, #0A193F 100%)",
  boxShadow: "4px 4px 4px 0 rgba(0,0,0,0.25)",
} as const;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contact = searchParams.get("contact") || "email@example.com";
  const [code, setCode] = useState(["", "", "", ""]);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");
  const isCodeComplete = code.every((digit) => digit !== "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const contactKey = useMemo(() => encodeURIComponent(contact.trim()), [contact]);
  const otpAttemptsUsedKey = `stackly-otp-attempts-used-email-${contactKey}`;
  const otpExpiresAtKey = `stackly-otp-expires-at-email-${contactKey}`;

  const [otpAttemptsUsed, setOtpAttemptsUsed] = useState(0);
  const [cooldownExpiresAt, setCooldownExpiresAt] = useState<number | null>(null);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState(OTP_COOLDOWN_SECONDS);

  const clearError = () => setError("");

  useEffect(() => {
    // Use sessionStorage so a simple refresh doesn't wipe the timer/attempt count.
    const now = Date.now();
    const storedAttempts = Number(sessionStorage.getItem(otpAttemptsUsedKey) || "0");
    setOtpAttemptsUsed(
      Number.isFinite(storedAttempts)
        ? Math.min(storedAttempts, OTP_MAX_ATTEMPTS)
        : 0,
    );

    const storedExpiresAt = Number(sessionStorage.getItem(otpExpiresAtKey) || "0");
    let nextExpiresAt = storedExpiresAt;
    if (!storedExpiresAt || storedExpiresAt <= now) {
      nextExpiresAt = now + OTP_COOLDOWN_SECONDS * 1000;
      sessionStorage.setItem(otpExpiresAtKey, String(nextExpiresAt));
    }

    setCooldownExpiresAt(nextExpiresAt);
  }, [otpAttemptsUsedKey, otpExpiresAtKey]);

  useEffect(() => {
    if (cooldownExpiresAt == null) return;

    const tick = () => {
      const remaining = Math.ceil((cooldownExpiresAt - Date.now()) / 1000);
      setCooldownSecondsLeft(Math.max(0, remaining));
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [cooldownExpiresAt]);

  const hasReachedMaxAttempts = otpAttemptsUsed >= OTP_MAX_ATTEMPTS;
  const canResend =
    cooldownSecondsLeft <= 0 && !hasReachedMaxAttempts && !isResending;
  const otpExpiryLabel =
    cooldownSecondsLeft > 0
      ? `OTP expires in ${cooldownSecondsLeft}s`
      : "OTP expired";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isCodeComplete) {
      setError("Please enter the complete 4-digit code.");
      return;
    }
    if (hasReachedMaxAttempts) {
      setError(MAX_ATTEMPTS_REACHED_MESSAGE);
      return;
    }
    if (cooldownSecondsLeft <= 0) {
      setError("OTP expired. Please resend code.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await verifyEmailOtp({
        email: contact,
        otp: code.join(""),
      });
      if (result.token) {
        window.sessionStorage.setItem("stackly-reset-token", result.token);
      }
      router.push(`/verified?contact=${encodeURIComponent(contact)}`);
    } catch (err) {
      if (isApiConnectionError(err)) {
        router.push("/backend-error");
        return;
      }
      const message = err instanceof Error
        ? err.message
        : "Verification failed. Please try again.";

      const attemptsLeft =
        err instanceof Error
          ? (err as unknown as { attemptsLeft?: number }).attemptsLeft
          : undefined;
      if (typeof attemptsLeft === "number") {
        const nextAttemptsUsed = Math.max(0, OTP_MAX_ATTEMPTS - attemptsLeft);
        setOtpAttemptsUsed(nextAttemptsUsed);
        sessionStorage.setItem(otpAttemptsUsedKey, String(nextAttemptsUsed));
      } else {
        const normalized = message.toLowerCase();
        if (normalized.includes("max attempts")) {
          setOtpAttemptsUsed(OTP_MAX_ATTEMPTS);
          sessionStorage.setItem(otpAttemptsUsedKey, String(OTP_MAX_ATTEMPTS));
          setInfo("");
        }
        if (normalized.includes("otp expired")) {
          setOtpAttemptsUsed(0);
          sessionStorage.setItem(otpAttemptsUsedKey, "0");
          setCooldownExpiresAt(Date.now());
          setCooldownSecondsLeft(0);
          sessionStorage.setItem(otpExpiresAtKey, String(Date.now()));
        }
      }
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-flow-page relative min-h-[100dvh] flex flex-col justify-start lg:justify-center items-stretch overflow-y-auto px-0 py-0 lg:px-6 lg:py-6 max-lg:bg-transparent bg-white">
      <ResetFlowBackButton onClick={() => router.back()} />
      <div className="flex w-full flex-1 flex-col items-stretch justify-center max-lg:max-w-none max-w-[480px] lg:mx-auto min-h-0">
        <div
          className="reset-flow-card relative flex w-full flex-1 flex-col justify-center overflow-hidden px-6 py-8 sm:px-10 sm:py-10 text-center lg:flex-none lg:min-h-0 lg:rounded-xl"
          style={resetFlowCardStyle}
        >
          <div className="flex justify-center mb-4 sm:mb-6">
            <img
              src={assetPath("/email.webp")}
              alt="Email verification"
              className="w-[96px] h-[96px] object-contain"
            />
          </div>
          <h1 className="text-[20px] sm:text-[24px] font-bold mb-2" style={{ color: "#FFFFFF" }}>
            Verify your email
          </h1>
          <p className="text-[12px] sm:text-[13px] leading-relaxed mb-6" style={{ color: "#FFFFFF" }}>
            Please enter the 4 digit code sent to your<br />
            Registered email {contact}
          </p>

          <form onSubmit={handleConfirm} className="space-y-6">
            <div className="flex justify-center gap-3 sm:gap-4">
              {code.map((value, idx) => (
                <input
                  key={idx}
                  id={`email-otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={value}
                  onChange={createOtpChangeHandler(
                    idx,
                    code.length,
                    EMAIL_OTP_INPUT_PREFIX,
                    setCode,
                    clearError
                  )}
                  onKeyDown={createOtpKeyDownHandler(
                    idx,
                    code,
                    EMAIL_OTP_INPUT_PREFIX,
                    setCode,
                    clearError
                  )}
                  onPaste={createOtpPasteHandler(
                    idx,
                    code.length,
                    EMAIL_OTP_INPUT_PREFIX,
                    setCode,
                    clearError
                  )}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded border bg-transparent text-center text-lg text-white outline-none focus:border-white/80"
                  style={{
                    border: "1px solid rgba(255,255,255,0.7)",
                  }}
                />
              ))}
            </div>

            <p
              className="text-[12px] sm:text-[13px]"
              style={{ color: "#FFFFFF" }}
            >
              Want to change your Email Address?{" "}
              <button
                type="button"
                onClick={() =>
                  router.push("/forgot-password?changeFrom=verify-email")
                }
                className={VERIFY_OTP_LINK_CLASS}
                style={{ color: "#F2B541" }}
              >
                Change Here
              </button>
            </p>

            <button
              type="submit"
              disabled={
                !isCodeComplete || isSubmitting || hasReachedMaxAttempts
              }
              className="reset-flow-primary-btn w-full max-w-[260px] mx-auto cursor-pointer rounded-[1000px] text-[16px] sm:text-[17px] font-bold shadow-md flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
              style={{ height: "48px" }}
            >
              {isSubmitting ? "Verifying..." : "Confirm"}
            </button>

            <div className="flex flex-col items-center gap-1 -mt-4">
              <p className="text-[11px] sm:text-[12px]" style={{ color: "#FFFFFF" }}>
                {otpExpiryLabel}
              </p>

              {error && (
                <p className="text-[12px]" style={{ color: "#F2B541" }}>
                  {error}
                </p>
              )}

              <p className="text-[11px] sm:text-[12px]" style={{ color: "#F2B541" }}>
                Attempts used: {otpAttemptsUsed}/{OTP_MAX_ATTEMPTS}
              </p>

              {hasReachedMaxAttempts ? (
                <p className="text-[12px] sm:text-[13px]" style={{ color: "#F2B541" }}>
                  {MAX_ATTEMPTS_REACHED_MESSAGE}
                </p>
              ) : (
            <button
              type="button"
              disabled={!canResend}
              onClick={async () => {
                if (hasReachedMaxAttempts) {
                  setError(MAX_ATTEMPTS_REACHED_MESSAGE);
                  return;
                }
                if (cooldownSecondsLeft > 0) return;

                setIsResending(true);
                setInfo("");
                setError("");
                setCode(["", "", "", ""]);
                try {
                  const result = await verifyEmailOtp({
                    email: contact,
                    action: "resend",
                  });
                  setInfo(result.message || "Code resent successfully.");

                  const nextExpiresAt =
                    Date.now() + OTP_COOLDOWN_SECONDS * 1000;
                  sessionStorage.setItem(otpExpiresAtKey, String(nextExpiresAt));
                  setCooldownExpiresAt(nextExpiresAt);

                  setOtpAttemptsUsed(0);
                  sessionStorage.setItem(otpAttemptsUsedKey, "0");
                } catch (err) {
                  if (isApiConnectionError(err)) {
                    router.push("/backend-error");
                    return;
                  }
                  setError(err instanceof Error ? err.message : "Could not resend code.");
                } finally {
                  setIsResending(false);
                }
              }}
              className={VERIFY_OTP_RESEND_CLASS}
              style={{ color: "#FFFFFF" }}
            >
              {cooldownSecondsLeft > 0
                ? `Resend CODE (${cooldownSecondsLeft}s)`
                : isResending
                  ? "Resending..."
                  : "Resend CODE"}
            </button>
              )}
              {info && !hasReachedMaxAttempts && (
                <p className="text-[11px] sm:text-[12px]" style={{ color: "#FFFFFF" }}>
                  {info}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
