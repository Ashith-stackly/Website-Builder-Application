"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isApiConnectionError, verifyEmailOtp } from "@/lib/api";
import {
  createOtpChangeHandler,
  createOtpFocusHandler,
  createOtpKeyDownHandler,
  createOtpPasteHandler,
} from "@/lib/otpInputHandlers";
import { OTP_MAX_ATTEMPTS } from "@/lib/otpSession";
import { useOtpSession } from "@/lib/useOtpSession";
import { assetPath } from "@/lib/paths";
import ResetFlowBackButton from "@/components/ResetFlowBackButton";
import {
  VERIFY_OTP_INPUT_CLASS,
  VERIFY_OTP_LINK_CLASS,
  VERIFY_OTP_RESEND_CLASS,
} from "@/lib/verifyOtpStyles";
import { handleResetFlowInputMouseDown } from "@/lib/resetFlowInputHandlers";

const EMAIL_OTP_INPUT_PREFIX = "email-otp";

const MAX_ATTEMPTS_REACHED_MESSAGE = "Maximum attempts reached.";

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

  const {
    otpAttemptsUsed,
    cooldownSecondsLeft,
    restartSession,
    expireSession,
    updateAttemptsUsed,
  } = useOtpSession(contact, "email");

  const clearError = () => setError("");

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
        updateAttemptsUsed(Math.max(0, OTP_MAX_ATTEMPTS - attemptsLeft));
      } else {
        const normalized = message.toLowerCase();
        if (normalized.includes("max attempts")) {
          updateAttemptsUsed(OTP_MAX_ATTEMPTS);
          setInfo("");
        }
        if (normalized.includes("otp expired")) {
          updateAttemptsUsed(0);
          expireSession();
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
                  onFocus={createOtpFocusHandler()}
                  onMouseDown={handleResetFlowInputMouseDown}
                  className={VERIFY_OTP_INPUT_CLASS}
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
              Want to change your email address?{" "}
              <button
                type="button"
                onClick={() =>
                  router.push("/forgot-password?changeFrom=verify-email")
                }
                className={VERIFY_OTP_LINK_CLASS}
                style={{ color: "#F2B541" }}
              >
                Click here
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
                  restartSession();
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
