"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaUser, FaEnvelope, FaPhone, FaLock } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { isApiConnectionError, register as registerApi } from "@/lib/api";
import { assetPath } from "@/lib/paths";
import {
  DEFAULT_SIGNUP_PHONE_COUNTRY_ID,
  SIGNUP_PHONE_COUNTRIES,
  getDefaultSignupPhoneCountry,
  getSignupPhoneCountry,
  validateSignupNationalDigits,
  toE164Mobile,
} from "@/lib/signupPhoneCountries";

type SignupFormState = {
  name: string;
  email: string;
  phoneCountryId: string;
  mobileNumber: string;
  password: string;
  confirmPassword: string;
};

type SignupFormErrors = {
  name?: string;
  email?: string;
  mobileNumber?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

const initialSignupState: SignupFormState = {
  name: "",
  email: "",
  phoneCountryId: DEFAULT_SIGNUP_PHONE_COUNTRY_ID,
  mobileNumber: "",
  password: "",
  confirmPassword: "",
};

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupFormState>(initialSignupState);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!countryDropdownOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = countryDropdownRef.current;
      if (el && !el.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCountryDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [countryDropdownOpen]);

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
    const page = document.querySelector(".auth-page") as HTMLElement | null;
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


  const validate = (values: SignupFormState): SignupFormErrors => {
    const newErrors: SignupFormErrors = {};

    if (!values.name.trim()) {
      newErrors.name = "Name is required.";
    } else if (values.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    } else if (!/^[a-zA-Z\s]+$/.test(values.name.trim())) {
      newErrors.name = "Name must contain only letters.";
    }

    if (!values.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim().toLowerCase())
    ) {
      newErrors.email = "Please enter a valid email address.";
    }

    const phoneCountry =
      getSignupPhoneCountry(values.phoneCountryId) ?? getDefaultSignupPhoneCountry();
    if (!values.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required.";
    } else {
      const mobileErr = validateSignupNationalDigits(values.mobileNumber.trim(), phoneCountry);
      if (mobileErr) {
        newErrors.mobileNumber = mobileErr;
      }
    }

    if (!values.password) {
      newErrors.password = "Password is required.";
    } else if (values.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters.";
    } else {
      const hasLower = /[a-z]/.test(values.password);
      const hasUpper = /[A-Z]/.test(values.password);
      const hasNumber = /[0-9]/.test(values.password);
      const hasSpecial = /[!@#$%^&*(),.?\x3a{}|<>]/.test(values.password);
      if (!hasLower) {
        newErrors.password = "Password must include a lowercase letter.";
      } else if (!hasUpper) {
        newErrors.password = "Password must include an uppercase letter.";
      } else if (!hasNumber) {
        newErrors.password = "Password must include a number.";
      } else if (!hasSpecial) {
        newErrors.password = "Password must include a special character (!@#$%^&* etc.).";
      }
    }

    if (!values.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (values.password !== values.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    return newErrors;
  };

  const handleChange =
    (field: keyof SignupFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      if (field === "mobileNumber") {
        setForm((prev) => {
          const country = getSignupPhoneCountry(prev.phoneCountryId) ?? getDefaultSignupPhoneCountry();
          const digits = raw.replace(/\D/g, "").slice(0, country.maxDigits);
          return { ...prev, mobileNumber: digits };
        });
      } else {
        setForm((prev) => ({ ...prev, [field]: raw }));
      }
      setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
    };

  const selectPhoneCountry = (id: string) => {
    const country = getSignupPhoneCountry(id) ?? getDefaultSignupPhoneCountry();
    setForm((prev) => ({
      ...prev,
      phoneCountryId: id,
      mobileNumber: prev.mobileNumber.replace(/\D/g, "").slice(0, country.maxDigits),
    }));
    setErrors((prev) => ({ ...prev, mobileNumber: undefined, form: undefined }));
    setCountryDropdownOpen(false);
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors((prev) => ({ ...prev, form: undefined }));

      const phoneCountry =
        getSignupPhoneCountry(form.phoneCountryId) ?? getDefaultSignupPhoneCountry();
      await registerApi({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: toE164Mobile(phoneCountry, form.mobileNumber.trim()),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      setForm(initialSignupState);
      setErrors((prev) => ({ ...prev, form: "Signup successful!" }));
      router.push("/login");
    } catch (error) {
      if (isApiConnectionError(error)) {
        router.push("/backend-error");
        return;
      }
      const message =
        error instanceof Error ? error.message : "Registration failed. Please try again.";
      setErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPhoneCountry =
    getSignupPhoneCountry(form.phoneCountryId) ?? getDefaultSignupPhoneCountry();

  return (
    <div className="auth-page min-h-[100dvh] lg:min-h-screen flex flex-col max-lg:bg-transparent bg-white px-0 py-0 lg:px-6 lg:py-4 overflow-y-auto">
      <div className="w-full max-lg:max-w-none max-w-6xl mx-auto flex flex-1 flex-col lg:flex-none lg:flex-row gap-0 lg:gap-8 auth-layout">
        {/* Card first on mobile (top), right on desktop */}
        <div className="flex w-full flex-1 flex-col items-stretch justify-center order-1 lg:order-2 lg:w-1/2 lg:flex-none">
          <div
            className="relative flex w-full max-w-[520px] flex-1 flex-col overflow-x-hidden overflow-y-visible self-center bg-gradient-to-b from-[#5f82e8] via-[#3f66c9] to-[#021a46] px-6 sm:px-10 max-lg:max-w-none max-lg:min-h-[100dvh] max-lg:min-h-[100svh] lg:flex-none lg:rounded-[10px] signup-card auth-form-card"
          >
            <div className="auth-inner-panel pointer-events-none absolute inset-y-0 left-1/2 w-[78%] -translate-x-1/2 bg-gradient-to-b from-white/10 via-black/10 to-black/35" />
            <div className="pointer-events-none absolute inset-0 rounded-none lg:rounded-[10px] shadow-[inset_20px_0_45px_rgba(0,0,0,0.55),inset_-20px_0_45px_rgba(0,0,0,0.55)]" />
            <div className="pointer-events-none absolute inset-0 rounded-none lg:rounded-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />

            <div className="relative z-10 flex flex-col flex-1 min-h-0 min-w-0 px-4 sm:px-6 pt-2.5 sm:pt-4 pb-2 sm:pb-3 lg:pt-7 lg:pb-4 text-white signup-card-content text-left justify-start lg:justify-between">
              {/* Single column: centers WELCOME and logo on the same axis (mobile + desktop) */}
              <div className="signup-brand-stack flex w-full min-w-0 flex-col items-center flex-shrink-0 mb-3 sm:mb-2.5 lg:mb-4">
                <h1 className="signup-welcome-title font-welcome-heading text-xl sm:text-2xl font-semibold text-center mb-3 sm:mb-2.5 lg:mb-4 w-[120px] sm:w-[140px] lg:w-[180px]">
                  WELCOME
                </h1>
                <div className="bg-white w-[120px] sm:w-[140px] lg:w-[180px] h-[44px] sm:h-[52px] lg:h-[64px] rounded-[50%] flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                  <img src={assetPath("/stackly-logo.webp")} alt="Stackly Logo" className="h-3.5 sm:h-4 lg:h-7 object-contain" />
                </div>
              </div>

              <form onSubmit={handleSignup} noValidate>
                <div className="space-y-3 sm:space-y-2.5 lg:space-y-2.5 flex-shrink-0">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b border-white/80 pb-2">
                      <FaUser className="mr-3 text-sm text-white/90" />
                      <input
                        type="text"
                        placeholder="Name"
                        value={form.name}
                        onChange={handleChange("name")}
                        className="bg-transparent outline-none w-full placeholder-white/90 text-sm text-white"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                    </div>
                    {errors.name && (
                      <p id="name-error" className="auth-error-text mt-0.5 text-[11px] sm:text-xs lg:text-[11px]">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center border-b border-white/80 pb-2">
                      <FaEnvelope className="mr-3 text-sm text-white/90" />
                      <input
                        type="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange("email")}
                        className="bg-transparent outline-none w-full placeholder-white/90 text-sm text-white"
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? "email-error" : undefined}
                      />
                    </div>
                    {errors.email && (
                      <p id="email-error" className="auth-error-text mt-0.5 text-[11px] sm:text-xs lg:text-[11px]">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center border-b border-white/80 pb-2 min-w-0">
                      <FaPhone className="mr-3 shrink-0 text-sm text-white/90" />
                      <div className="relative z-20 mr-2 min-h-5 shrink-0 max-w-[46%] sm:max-w-[200px] min-w-0 self-center" ref={countryDropdownRef}>
                        <button
                          type="button"
                          id="country-select-trigger"
                          aria-label="Country calling code"
                          aria-haspopup="listbox"
                          aria-expanded={countryDropdownOpen}
                          onClick={() => setCountryDropdownOpen((o) => !o)}
                          className="flex w-full min-w-0 items-center justify-between gap-1 rounded-md border border-white/80 bg-transparent px-2 py-0 text-left text-sm leading-5 text-white outline-none hover:border-white"
                        >
                          <span className="min-w-0 truncate">
                            {selectedPhoneCountry.name} (+{selectedPhoneCountry.dialCode})
                          </span>
                          <span
                            className={`shrink-0 text-white/90 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`}
                            aria-hidden
                          >
                            <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path
                                fillRule="evenodd"
                                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </span>
                        </button>
                        {countryDropdownOpen && (
                          <ul
                            role="listbox"
                            aria-labelledby="country-select-trigger"
                            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg [scrollbar-color:#94a3b8_#f1f5f9]"
                          >
                            {SIGNUP_PHONE_COUNTRIES.map((c) => {
                              const selected = form.phoneCountryId === c.id;
                              return (
                                <li key={c.id} className="px-0 py-0">
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={selected}
                                    className={`w-full cursor-pointer px-3 py-2 text-left text-gray-900 hover:bg-[#1A73E8] hover:text-white ${
                                      selected ? "bg-[#1A73E8] text-white" : "bg-white"
                                    }`}
                                    onClick={() => selectPhoneCountry(c.id)}
                                  >
                                    {c.name} (+{c.dialCode})
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={
                          (getSignupPhoneCountry(form.phoneCountryId) ?? getDefaultSignupPhoneCountry())
                            .maxDigits
                        }
                        placeholder="Phone number"
                        value={form.mobileNumber}
                        onChange={handleChange("mobileNumber")}
                        className="min-h-5 flex-1 min-w-0 self-center border-0 bg-transparent py-0 text-sm leading-5 text-white outline-none placeholder-white/90"
                        aria-invalid={!!errors.mobileNumber}
                        aria-describedby={errors.mobileNumber ? "mobile-error" : undefined}
                      />
                    </div>
                    {errors.mobileNumber && (
                      <p id="mobile-error" className="auth-error-text mt-0.5 text-[11px] sm:text-xs lg:text-[11px]">
                        {errors.mobileNumber}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center border-b border-white/80 pb-2 relative">
                      <FaLock className="mr-3 text-sm text-white/90 flex-shrink-0" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange("password")}
                        className="bg-transparent outline-none w-full placeholder-white/90 text-sm text-white pr-9"
                        aria-invalid={!!errors.password}
                        aria-describedby={errors.password ? "password-error" : undefined}
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-1 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                        onClick={() => setShowPassword((p) => !p)}
                      >
                        {showPassword ? (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p id="password-error" className="auth-error-text mt-0.5 text-[11px] sm:text-xs lg:text-[11px]">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center border-b border-white/80 pb-2 relative">
                      <FaLock className="signup-confirm-icon mr-3 text-sm text-white/90 flex-shrink-0" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm Password"
                        value={form.confirmPassword}
                        onChange={handleChange("confirmPassword")}
                        className="bg-transparent outline-none w-full placeholder-white/90 text-sm text-white pr-9 signup-confirm-input"
                        aria-invalid={!!errors.confirmPassword}
                        aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                      />
                      <button
                        type="button"
                        aria-label="Toggle confirm password visibility"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-1 flex-shrink-0 w-5 h-5 flex items-center justify-center"
                        onClick={() => setShowConfirmPassword((p) => !p)}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                        ) : (
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p id="confirmPassword-error" className="auth-error-text mt-0.5 text-[11px] sm:text-xs lg:text-[11px]">
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {errors.form && (
                  <p
                    className={`mt-1.5 text-[11px] sm:text-xs font-medium ${errors.form === "Signup successful!" ? "text-green-300" : "auth-error-text"}`}
                  >
                    {errors.form}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2.5 mb-2.5 lg:mt-2.5 lg:mb-2.5 w-full h-[42px] flex-shrink-0 bg-gradient-to-r from-[#2d8cf0] to-[#5a78c7] rounded-md text-sm font-medium text-white shadow-md hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Checking..." : "Sign Up"}
                </button>
              </form>

              <div className="flex-shrink-0 mt-1 lg:mt-0.5">
                <p className="text-center text-xs mt-1 lg:mt-0.5 mb-1.5 lg:mb-2 text-white/80">
                  Already have an account?{" "}
                  <Link href="/login" className="text-amber-300 hover:text-amber-200 font-medium">
                    Login
                  </Link>
                </p>

                <div className="mt-1.5 mb-1 lg:mt-1 lg:mb-0.5 border-t border-white/50" />

                <div className="pt-0.5 pb-1 sm:pt-1 sm:pb-3 lg:pb-2">
                  <a
                    href={
                      "https://accounts.google.com/o/oauth2/v2/auth" +
                      "?client_id=703831654489-m34p97it8cppn924006cgt8u6jgk9tsa.apps.googleusercontent.com" +
                      "&redirect_uri=http://localhost:5000/api/auth/google" +
                      "&response_type=code" +
                      "&scope=openid%20email%20profile" +
                      "&access_type=online" +
                      "&prompt=select_account"
                    }
                    className="w-full h-[42px] border border-white/80 rounded-md flex items-center justify-center text-sm font-medium bg-transparent text-white hover:bg-white hover:text-[#0c2b5a] transition"
                  >
                    <FcGoogle className="mr-3 text-lg" />
                    Sign up with Google
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Illustration below on mobile, left on desktop */}
        <div className="auth-image-col w-full lg:w-1/2 flex justify-center order-2 lg:order-1 mt-6 sm:mt-8 lg:mt-0">
          <img
            src={assetPath("/illustration.webp")}
            alt="Illustration"
            className="auth-image w-[80%] sm:w-[80%] lg:w-[88%] max-w-[520px] object-contain"
          />
        </div>
      </div>
    </div>
  );
}