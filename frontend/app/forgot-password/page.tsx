"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { forgotPassword, isApiConnectionError } from "@/lib/api";
import { getEmailValidationError } from "@/lib/emailValidation";
import { assetPath } from "@/lib/paths";
import { stripContactWhitespace } from "@/lib/resetFlowValidation";
import {
  capSimpleMobileContactInput,
  countMobileDigits,
  looksLikeMobileContactInput,
  isValidSimpleMobileContact,
  simpleMobileMaxLengthMessage,
  SIMPLE_MOBILE_MAX_DIGITS,
  validateSimpleMobileContact,
} from "@/lib/simpleMobileContact";

const EMAIL_MAX_LENGTH = 254;
const EMAIL_MAX_ERROR = `Email cannot exceed ${EMAIL_MAX_LENGTH} characters.`;

function clearOtpSessionForContact(
  contact: string,
  channel: "email" | "mobile",
) {
  const contactKey = encodeURIComponent(contact.trim());
  sessionStorage.removeItem(`stackly-otp-attempts-used-${channel}-${contactKey}`);
  sessionStorage.removeItem(`stackly-otp-expires-at-${channel}-${contactKey}`);
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contactInput, setContactInput] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const changeFrom = searchParams.get("changeFrom");

  const contactPlaceholder =
    changeFrom === "verify-email"
      ? "Alternative email address"
      : changeFrom === "verify-mobile"
        ? "Alternative mobile number"
        : "Email or mobile number";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmed = contactInput.trim();
    if (!trimmed) {
      setError("Enter a valid email or mobile number");
      return;
    }

    const isMobileFlow = looksLikeMobileContactInput(trimmed);
    let verifyRoute: "/verify-email" | "/verify-mobile";
    let apiInput: string;
    let verifyContact: string;

    if (isMobileFlow) {
      const mobileError = validateSimpleMobileContact(trimmed);
      if (mobileError) {
        setError(mobileError);
        return;
      }

      if (!isValidSimpleMobileContact(trimmed)) {
        setError("Enter a valid email or mobile number");
        return;
      }

      verifyRoute = "/verify-mobile";
      apiInput = trimmed;
      verifyContact = trimmed;
    } else {
      const emailError = getEmailValidationError(trimmed.toLowerCase());
      if (emailError) {
        setError(emailError);
        return;
      }

      verifyRoute = "/verify-email";
      apiInput = trimmed.toLowerCase();
      verifyContact = apiInput;
    }

    try {
      setIsSubmitting(true);
      const data = await forgotPassword({
        input: apiInput,
        isChange: Boolean(changeFrom),
        primaryUser: searchParams.get("primaryUser") || undefined,
      });

      setMessage(data.message || "OTP sent successfully.");

      clearOtpSessionForContact(
        verifyContact,
        verifyRoute === "/verify-email" ? "email" : "mobile",
      );

      router.push(
        `${verifyRoute}?contact=${encodeURIComponent(verifyContact)}`,
      );
    } catch (error) {
      if (isApiConnectionError(error)) {
        router.push("/backend-error");
        return;
      }
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not send OTP. Try again later.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-flow-page forgot-password-page min-h-[100dvh] bg-white flex flex-col justify-start lg:justify-center items-stretch lg:items-center overflow-y-auto px-0 py-0 lg:px-6 lg:py-6">
      <div className="w-full max-w-6xl mx-auto flex flex-1 flex-col lg:flex-none lg:flex-row items-stretch lg:items-center justify-start lg:justify-center gap-0 lg:gap-12 auth-layout">
        {/* LEFT: Illustration */}
        <div className="auth-image-col hidden lg:flex w-full lg:w-1/2 items-center justify-center order-2 lg:order-1">
          <img
            src={assetPath("/password.webp")}
            alt="Password reset illustration"
            className="auth-image w-[88%] max-w-[480px] object-contain"
          />
        </div>
        {/* RIGHT: Forgot password form card */}
        <div className="flex w-full flex-1 flex-col items-stretch justify-center order-1 lg:order-2 lg:w-1/2 lg:flex-none min-h-0">
          <div
            className="reset-flow-card forgot-password-card relative flex w-full max-w-[420px] flex-1 flex-col justify-center self-center overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:flex-none lg:min-h-0 lg:rounded-xl"
            style={{
              background:
                "linear-gradient(180deg, #4A76F3 0%, #2C4FAD 50%, #0A193F 100%)",
              boxShadow: "4px 4px 4px 0 rgba(0,0,0,0.25)",
            }}
          >
            <h1
              className="text-[20px] sm:text-[24px] font-bold text-center mb-3"
              style={{ color: "#FFFFFF" }}
            >
              Forgot Your Password?
            </h1>
            <p
              className="text-center text-[13px] sm:text-[14px] mb-5 leading-relaxed"
              style={{ color: "#FFFFFF" }}
            >
              Enter your email address or mobile number and we will send you
              instructions to reset your password.
            </p>
            <form onSubmit={handleSubmit} noValidate>
              <div className="flex flex-col items-center space-y-5">
                <div className="w-full max-w-[316px]">
                  <input
                    type="text"
                    inputMode="email"
                    placeholder={contactPlaceholder}
                    value={contactInput}
                    maxLength={EMAIL_MAX_LENGTH}
                    onChange={(e) => {
                      const cleaned = stripContactWhitespace(e.target.value);
                      const mobileInput = looksLikeMobileContactInput(cleaned);
                      if (mobileInput) {
                        const capped = capSimpleMobileContactInput(cleaned);
                        setContactInput(capped);
                        if (countMobileDigits(capped) >= SIMPLE_MOBILE_MAX_DIGITS) {
                          setError(simpleMobileMaxLengthMessage());
                        } else {
                          setError("");
                        }
                        return;
                      }
                      if (cleaned.length > EMAIL_MAX_LENGTH) {
                        setContactInput(cleaned.slice(0, EMAIL_MAX_LENGTH));
                        setError(EMAIL_MAX_ERROR);
                        return;
                      }
                      setContactInput(cleaned);
                      setError("");
                    }}
                    onBlur={() => {
                      setContactInput((prev) => prev.trim());
                    }}
                    className="forgot-input w-full h-12 px-5 rounded-[1000px] border text-[14px] text-center outline-none focus:border-white transition bg-transparent"
                    style={{
                      border: "1.5px solid #FFFFFF",
                      color: "#FFFFFF",
                      textAlign: "center",
                    }}
                  />
                  {error && (
                    <p className="auth-error-text mt-1 text-center">{error}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="reset-flow-primary-btn w-full max-w-[260px] cursor-pointer rounded-[1000px] text-[16px] sm:text-[17px] font-bold shadow-md disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center"
                  style={{ height: "48px" }}
                >
                  {isSubmitting ? "Sending..." : "Continue"}
                </button>
                {message && (
                  <p
                    className={`text-center text-xs ${
                      message.includes("account exists")
                        ? "text-white/95"
                        : "auth-error-text"
                    }`}
                  >
                    {message}
                  </p>
                )}
              </div>
            </form>
            <div className="w-full max-w-[316px] mx-auto mt-6 text-center">
              <Link
                href="/login"
                className="cursor-pointer text-[13px] hover:underline"
                style={{ color: "#FFFFFF" }}
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
