"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaAddressBook, FaLock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { isApiConnectionError, login as loginApi } from "@/lib/api";
import { assetPath } from "@/lib/paths";

type LoginFormState = {
  email: string;
  password: string;
  rememberMe: boolean;
};

const isMobile = (value: string): boolean =>
  /^\+?[0-9]{6,15}$/.test(value.trim());

type LoginFormErrors = {
  email?: string;
  password?: string;
  form?: string;
};

const initialLoginState: LoginFormState = {
  email: "",
  password: "",
  rememberMe: false,
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormState>(initialLoginState);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const setOverflow = () => {
      // Keep page scroll available on desktop zoom (150-200%) to avoid clipped auth content.
      document.body.style.overflow = "";
    };
    setOverflow();
    mql.addEventListener("change", setOverflow);
    return () => {
      mql.removeEventListener("change", setOverflow);
      document.body.style.overflow = "";
    };
  }, []);

  // Mobile outer-scroll lock should apply only to login/signup screens.
  useEffect(() => {
    document.documentElement.classList.add("auth-visible");
    document.body.classList.add("auth-visible");
    return () => {
      document.documentElement.classList.remove("auth-visible");
      document.body.classList.remove("auth-visible");
    };
  }, []);

  useEffect(() => {
    const page = document.querySelector(".login-page.auth-page") as HTMLElement | null;
    if (!page) return;

    let startY = 0;
    let canPull = false;
    let triggered = false;
    const threshold = 88;

    const onTouchStart = (event: TouchEvent) => {
      if (window.innerWidth >= 1024 || event.touches.length !== 1) return;
      startY = event.touches[0].clientY;
      canPull = page.scrollTop <= 0;
      triggered = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!canPull || triggered || window.innerWidth >= 1024) return;
      const deltaY = event.touches[0].clientY - startY;
      if (deltaY > threshold && page.scrollTop <= 0) {
        triggered = true;
        window.location.reload();
      } else if (deltaY < 0) {
        canPull = false;
      }
    };

    const onTouchEnd = () => {
      canPull = false;
      triggered = false;
    };

    page.addEventListener("touchstart", onTouchStart, { passive: true });
    page.addEventListener("touchmove", onTouchMove, { passive: true });
    page.addEventListener("touchend", onTouchEnd);
    page.addEventListener("touchcancel", onTouchEnd);

    return () => {
      page.removeEventListener("touchstart", onTouchStart);
      page.removeEventListener("touchmove", onTouchMove);
      page.removeEventListener("touchend", onTouchEnd);
      page.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const validate = (values: LoginFormState): LoginFormErrors => {
    const newErrors: LoginFormErrors = {};

    const trimmedContact = values.email.trim();
    if (!trimmedContact) {
      newErrors.email = "Email or mobile number is required.";
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        trimmedContact.toLowerCase(),
      );
      const isMobileContact = isMobile(trimmedContact);
      if (!isEmail && !isMobileContact) {
        newErrors.email = "Enter valid email or mobile number.";
      }
    }

    if (!values.password || values.password.length < 8) {
      newErrors.password = "Enter valid password";
    }

    return newErrors;
  };

  const handleChange =
    (field: keyof LoginFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value =
        field === "rememberMe" ? event.target.checked : event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
    };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors((prev) => ({ ...prev, form: undefined }));

      const contact = form.email.trim();

      const isMobileContact = isMobile(contact);
      const result = await loginApi({
        ...(isMobileContact ? { mobile: contact } : { email: contact.toLowerCase() }),
        password: form.password,
      });

      if (result.token) {
        window.localStorage.setItem("stackly-auth-token", result.token);
      }

      setForm(initialLoginState);
      setErrors((prev) => ({ ...prev, form: "Login successful!" }));
      router.push("/landing");
    } catch (error) {
      if (isApiConnectionError(error)) {
        router.push("/backend-error");
        return;
      }
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="login-page auth-page min-h-[100dvh] lg:min-h-screen flex flex-col max-lg:bg-transparent bg-white px-0 py-0 lg:px-6 lg:py-4 overflow-y-auto">
      <div className="w-full max-lg:max-w-none max-w-6xl mx-auto flex flex-1 flex-col lg:flex-none lg:flex-row gap-0 lg:gap-8 auth-layout">
        {/* Card first on mobile (top), right on desktop */}
        <div className="flex w-full flex-1 flex-col items-stretch justify-center order-1 lg:order-2 lg:w-1/2 lg:flex-none">
          <div className="relative flex w-full max-w-[520px] flex-1 flex-col overflow-x-hidden overflow-y-visible self-center bg-gradient-to-b from-[#5f82e8] via-[#3f66c9] to-[#021a46] px-6 sm:px-10 max-lg:max-w-none max-lg:min-h-[100dvh] max-lg:min-h-[100svh] lg:flex-none lg:rounded-[10px] login-card auth-form-card">
            <div className="auth-inner-panel pointer-events-none absolute inset-y-0 left-1/2 w-[78%] -translate-x-1/2 bg-gradient-to-b from-white/10 via-black/10 to-black/35" />
            <div className="pointer-events-none absolute inset-0 rounded-none lg:rounded-[10px] shadow-[inset_20px_0_45px_rgba(0,0,0,0.55),inset_-20px_0_45px_rgba(0,0,0,0.55)]" />
            <div className="pointer-events-none absolute inset-0 rounded-none lg:rounded-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />

            <div className="relative z-10 flex flex-col flex-1 min-w-0 auth-card-content login-card-inner px-4 sm:px-6 pt-4 sm:pt-8 pb-4 sm:pb-8 lg:pt-14 lg:pb-10 text-white text-left justify-start lg:justify-center lg:min-h-0">
              <div>
                <div className="w-full flex justify-center flex-shrink-0 min-w-0">
                  <h1 className="font-welcome-heading text-lg sm:text-xl md:text-2xl lg:text-3xl text-center font-semibold mb-1 sm:mb-4 lg:mb-7 break-words tracking-widest">
                    WELCOME
                  </h1>
                </div>

                <div className="flex justify-center mb-8 sm:mb-4 lg:mb-8 flex-shrink-0">
                  <div className="bg-white w-[120px] h-[44px] sm:w-[160px] sm:h-[60px] lg:w-[200px] lg:h-[80px] rounded-[50%] flex items-center justify-center shadow-lg overflow-hidden">
                    <img
                      src={assetPath("/stackly-logo.webp")}
                      alt="Stackly Logo"
                      className="h-4 sm:h-5 lg:h-8 object-contain"
                    />
                  </div>
                </div>

                <form onSubmit={handleLogin} noValidate>
                  <div className="space-y-6 sm:space-y-4 lg:space-y-6 flex-shrink-0">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b border-white/60 pb-2 min-w-0">
                      <FaAddressBook className="login-email-icon mr-2 sm:mr-4 text-sm opacity-80 flex-shrink-0" />
                      <input
                        type="text"
                        placeholder="Email or Mobile number"
                        value={form.email}
                        onChange={handleChange("email")}
                        className="bg-transparent outline-none w-full min-w-0 placeholder-white text-sm tracking-tight login-email-input"
                        aria-invalid={!!errors.email}
                        aria-describedby={
                          errors.email ? "login-email-error" : undefined
                        }
                      />
                    </div>
                    {errors.email && (
                      <p
                        id="login-email-error"
                        className="auth-error-text mt-0.5 text-[11px] sm:text-xs"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center border-b border-white/60 pb-2 relative min-w-0">
                      <FaLock className="mr-2 sm:mr-4 text-sm opacity-80 flex-shrink-0" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange("password")}
                        className="bg-transparent outline-none w-full min-w-0 placeholder-white text-sm pr-9"
                        aria-invalid={!!errors.password}
                        aria-describedby={
                          errors.password ? "login-password-error" : undefined
                        }
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-1 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                        onClick={() => setShowPassword((p) => !p)}
                      >
                        {showPassword ? (
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-4 h-4 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p
                        id="login-password-error"
                        className="auth-error-text mt-0.5 text-[11px] sm:text-xs"
                      >
                        {errors.password}
                      </p>
                    )}
                  </div>
                </div>

                <div className="login-remember-forgot mt-5 sm:mt-4 text-xs opacity-90 w-full min-w-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.rememberMe}
                      onChange={handleChange("rememberMe")}
                      className="h-3.5 w-3.5 rounded border border-white/60 bg-transparent accent-[#2d8cf0]"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="forgot-password-link text-white no-underline hover:text-white hover:underline decoration-1 underline-offset-4 text-[13px]"
                  >
                    Forgot Password?
                  </Link>
                </div>

                {errors.form && (
                  <p
                    className={`mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-medium ${errors.form === "Login successful!" ? "text-green-300" : "auth-error-text"}`}
                  >
                    {errors.form}
                  </p>
                )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-6 sm:mt-6 lg:mt-8 w-full h-[42px] sm:h-[45px] bg-gradient-to-r from-[#2d8cf0] to-[#5a78c7] rounded-md text-sm font-medium shadow-md hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {isSubmitting ? "Checking..." : "Login"}
                  </button>
                </form>
              </div>

              <p className="text-center text-xs mt-4 sm:mt-2 text-white/80 flex-shrink-0">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-yellow-400 hover:text-yellow-300 font-medium">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Illustration below on mobile, left on desktop */}
        <div className="auth-image-col w-full lg:w-1/2 flex justify-center order-2 lg:order-1 mt-6 sm:mt-8 lg:mt-0">
          <img
            src={assetPath("/login.webp")}
            alt="Secure login illustration"
            className="auth-image w-[80%] sm:w-[70%] lg:w-[90%] max-w-[550px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
