"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { isApiConnectionError, resetPassword } from "@/lib/api";
import { assetPath } from "@/lib/paths";
import {
  PASSWORD_WHITESPACE_ERROR,
  passwordContainsWhitespace,
} from "@/lib/resetFlowValidation";
import ResetFlowBackButton from "@/components/ResetFlowBackButton";

const resetFlowCardStyle = {
  background:
    "linear-gradient(180deg, #4A76F3 0%, #2C4FAD 50%, #0A193F 100%)",
  boxShadow: "4px 4px 4px 0 rgba(0,0,0,0.25)",
} as const;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 60;
const PASSWORD_LENGTH_ERROR = "Password must be 8-60 characters.";
const PASSWORD_MAX_ERROR = "Password cannot exceed 60 characters.";
const PASSWORD_UPDATE_ERROR =
  "Cannot update password. Please follow password requirements.";

function CreateNewPasswordContent() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requirementText =
    "Password must be 8-60 characters and include uppercase, lowercase, number, and symbol.";
  const isPasswordValidationError = Boolean(error);

  const applyPasswordInput = (
    raw: string,
    setter: (value: string) => void
  ): void => {
    if (passwordContainsWhitespace(raw)) {
      setError(PASSWORD_WHITESPACE_ERROR);
      return;
    }
    if (raw.length > PASSWORD_MAX_LENGTH) {
      setter(raw.slice(0, PASSWORD_MAX_LENGTH));
      setError(PASSWORD_MAX_ERROR);
      return;
    }
    setter(raw);
    setError("");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (
      passwordContainsWhitespace(newPassword) ||
      passwordContainsWhitespace(confirmPassword)
    ) {
      setError(PASSWORD_WHITESPACE_ERROR);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (
      newPassword.length < PASSWORD_MIN_LENGTH ||
      newPassword.length > PASSWORD_MAX_LENGTH ||
      confirmPassword.length > PASSWORD_MAX_LENGTH
    ) {
      setError(PASSWORD_LENGTH_ERROR);
      return;
    }
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSymbol = /[^A-Za-z0-9]/.test(newPassword);
    if (!hasUpper || !hasLower || !hasNumber || !hasSymbol) {
      setError(PASSWORD_UPDATE_ERROR);
      return;
    }

    const token = window.sessionStorage.getItem("stackly-reset-token");
    if (!token) {
      setError("Verification session expired. Please verify OTP again.");
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await resetPassword({
        newPassword,
        confirmPassword,
        token,
      });
      window.sessionStorage.removeItem("stackly-reset-token");
      setMessage(
        result.message || "Password reset successfully."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err) {
      if (isApiConnectionError(err)) {
        router.push("/backend-error");
        return;
      }
      setError(err instanceof Error ? err.message : "Could not update password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="reset-flow-page relative min-h-[100dvh] flex flex-col justify-start lg:justify-center items-stretch overflow-y-auto px-0 py-0 lg:px-6 lg:py-6 max-lg:bg-transparent bg-white">
      <ResetFlowBackButton onClick={() => router.push("/verified")} />
      <div className="w-full max-w-6xl mx-auto flex flex-1 flex-col lg:flex-none lg:flex-row items-stretch lg:items-center justify-start lg:justify-center gap-0 lg:gap-12 auth-layout">
        <div className="reset-flow-illustration hidden lg:flex w-full lg:w-1/2 items-center justify-center order-2 lg:order-1">
          <img
            src={assetPath("/new.webp")}
            alt="Create new password"
            className="w-[85%] sm:w-[80%] lg:w-[88%] max-w-[480px] object-contain"
          />
        </div>
        {/* Right: Create New Password form card */}
        <div className="flex w-full flex-1 flex-col items-stretch justify-center order-1 lg:order-2 lg:w-1/2 lg:flex-none min-h-0">
          <div
            className="reset-flow-card relative flex w-full max-w-[420px] flex-1 flex-col justify-center self-center overflow-hidden px-6 py-8 sm:px-10 sm:py-10 max-lg:max-w-none lg:flex-none lg:min-h-0 lg:rounded-xl"
            style={resetFlowCardStyle}
          >
            <h1
              className="text-[20px] sm:text-[24px] font-bold text-center mb-6"
              style={{ color: "#FFFFFF" }}
            >
              Create New Password
            </h1>
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-[13px] sm:text-[14px] mb-2"
                  style={{ color: "#FFFFFF" }}
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    onChange={(e) => applyPasswordInput(e.target.value, setNewPassword)}
                    aria-invalid={!!error}
                    aria-describedby={error ? "create-password-error" : undefined}
                    className="w-full h-12 pl-4 pr-12 rounded border text-[14px] outline-none focus:border-white/80 transition bg-transparent"
                    style={{
                      border: isPasswordValidationError
                        ? "1.5px solid #FFFFFF"
                        : "1px solid rgba(255,255,255,0.5)",
                      color: "#FFFFFF",
                      boxShadow: isPasswordValidationError
                        ? "0 0 0 2px rgba(255,255,255,0.2)"
                        : "none",
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white flex-shrink-0 w-5 h-5 flex items-center justify-center"
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-[13px] sm:text-[14px] mb-2"
                  style={{ color: "#FFFFFF" }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    minLength={PASSWORD_MIN_LENGTH}
                    maxLength={PASSWORD_MAX_LENGTH}
                    onChange={(e) =>
                      applyPasswordInput(e.target.value, setConfirmPassword)
                    }
                    aria-invalid={!!error}
                    aria-describedby={error ? "create-password-error" : undefined}
                    className="w-full h-12 pl-4 pr-12 rounded border text-[14px] outline-none focus:border-white/80 transition bg-transparent"
                    style={{
                      border: isPasswordValidationError
                        ? "1.5px solid #FFFFFF"
                        : "1px solid rgba(255,255,255,0.5)",
                      color: "#FFFFFF",
                      boxShadow: isPasswordValidationError
                        ? "0 0 0 2px rgba(255,255,255,0.2)"
                        : "none",
                    }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white flex-shrink-0 w-5 h-5 flex items-center justify-center"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>
              <p
                className="text-[11px] sm:text-[12px] leading-relaxed"
                style={{ color: "#FFFFFF" }}
              >
                {requirementText}
              </p>
              {error && (
                <p
                  id="create-password-error"
                  className="text-[12px] mt-2"
                  style={{ color: "#ff6b6b" }}
                  role="alert"
                >
                  {error}
                </p>
              )}
              {message && (
                <p
                  className="text-[13px] text-left font-medium mt-2"
                  style={{ color: "#22c55e" }}
                >
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="reset-flow-primary-btn w-full max-w-[240px] mx-auto cursor-pointer rounded-lg text-[12px] sm:text-[13px] font-bold uppercase shadow-md flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
                style={{ height: "36px" }}
              >
                {isSubmitting ? "UPDATING..." : "UPDATE PASSWORD"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateNewPasswordPage() {
  return (
    <Suspense fallback={null}>
      <CreateNewPasswordContent />
    </Suspense>
  );
}
