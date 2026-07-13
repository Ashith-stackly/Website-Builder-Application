"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaUser, FaEnvelope, FaPhone, FaLock } from "react-icons/fa";
import AuthGoogleButton from "@/components/AuthGoogleButton";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { isApiConnectionError, register as registerApi } from "@/lib/api";
import { assetPath } from "@/lib/paths";
import {
  PASSWORD_WHITESPACE_ERROR,
  passwordContainsWhitespace,
} from "@/lib/resetFlowValidation";
import {
  getAuthPullScrollRoot,
  isAuthPageZoomed,
  mountAuthAndroidClass,
  mountSignupPhoneStackedClass,
} from "@/lib/authMobileTouch";
import {
  EMAIL_MAX_ERROR,
  getSignupEmailValidationError,
  shouldValidateSignupEmailLive,
  SIGNUP_EMAIL_DOMAIN_ERROR,
} from "@/lib/emailValidation";
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

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;
const EMAIL_MAX_LENGTH = 254; /* keep in sync with lib/emailValidation */
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 60;

const NAME_MAX_ERROR = `Name cannot exceed ${NAME_MAX_LENGTH} characters`;
const PASSWORD_MAX_ERROR = `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters`;
const CONFIRM_PASSWORD_MAX_ERROR = `Confirm password cannot exceed ${PASSWORD_MAX_LENGTH} characters`;

const FIELD_MAX_LENGTHS: Partial<Record<keyof SignupFormState, number>> = {
  name: NAME_MAX_LENGTH,
  email: EMAIL_MAX_LENGTH,
  password: PASSWORD_MAX_LENGTH,
  confirmPassword: PASSWORD_MAX_LENGTH,
};

const FIELD_MAX_ERRORS: Partial<Record<keyof SignupFormState, string>> = {
  name: NAME_MAX_ERROR,
  email: EMAIL_MAX_ERROR,
  password: PASSWORD_MAX_ERROR,
  confirmPassword: CONFIRM_PASSWORD_MAX_ERROR,
};

/** Strip all whitespace (space, tab, NBSP, ZWSP, etc.) — valid emails never contain these. */
function stripEmailWhitespace(value: string): string {
  return value.replace(/[\s\u00A0\uFEFF\u2000-\u200B\u202F\u205F\u3000]+/g, "");
}

function normalizeSignupEmail(raw: string | undefined | null): string {
  return stripEmailWhitespace(String(raw ?? "")).trim().toLowerCase();
}

/** Trim edges and collapse internal whitespace runs to a single space. */
function normalizeSignupName(raw: string | undefined | null): string {
  return String(raw ?? "")
    .trim()
    .replace(/[\s\u00A0\uFEFF\u2000-\u200B\u202F\u205F\u3000]+/g, " ");
}

function hasExtraSignupNameSpacing(raw: string): boolean {
  return /^\s|\s$|[\s\u00A0\uFEFF\u2000-\u200B\u202F\u205F\u3000]{2,}/.test(raw);
}

const SIGNUP_NAME_PATTERN = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;

function getCountryListIndex(countryId: string): number {
  const idx = SIGNUP_PHONE_COUNTRIES.findIndex((c) => c.id === countryId);
  return idx >= 0 ? idx : 0;
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState<SignupFormState>(initialSignupState);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [countryHighlightIndex, setCountryHighlightIndex] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New state for popup
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const countryTriggerRef = useRef<HTMLButtonElement>(null);
  const countryListRef = useRef<HTMLUListElement>(null);
  const countryPointerOnTriggerRef = useRef(false);

  useEffect(() => {
    if (!countryDropdownOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = countryDropdownRef.current;
      if (el && !el.contains(e.target as Node)) {
        setCountryDropdownOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCountryDropdownOpen(false);
        countryTriggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [countryDropdownOpen]);

  useEffect(() => {
    if (!countryDropdownOpen || !countryListRef.current) return;
    const country = SIGNUP_PHONE_COUNTRIES[countryHighlightIndex];
    if (!country) return;
    const option = countryListRef.current.querySelector(`#country-option-${country.id}`);
    option?.scrollIntoView({ block: "nearest" });
  }, [countryDropdownOpen, countryHighlightIndex]);

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
    const unmountAndroid = mountAuthAndroidClass();
    const unmountPhoneStack = mountSignupPhoneStackedClass();
    return () => {
      document.documentElement.classList.remove("auth-visible");
      document.body.classList.remove("auth-visible");
      unmountAndroid();
      unmountPhoneStack();
    };
  }, []);

  useEffect(() => {
    const scrollEl = getAuthPullScrollRoot(false);
    if (!scrollEl) return;

    let startY = 0;
    let canPull = false;
    let triggered = false;
    const threshold = 88;

    const onTouchStart = (event: TouchEvent) => {
      if (window.innerWidth >= 1024 || event.touches.length !== 1 || isAuthPageZoomed()) return;
      startY = event.touches[0].clientY;
      canPull = scrollEl.scrollTop <= 0;
      triggered = false;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (
        !canPull ||
        triggered ||
        window.innerWidth >= 1024 ||
        isAuthPageZoomed() ||
        event.touches.length !== 1
      ) {
        return;
      }
      const deltaY = event.touches[0].clientY - startY;
      if (deltaY > threshold && scrollEl.scrollTop <= 0) {
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

    scrollEl.addEventListener("touchstart", onTouchStart, { passive: true });
    scrollEl.addEventListener("touchmove", onTouchMove, { passive: true });
    scrollEl.addEventListener("touchend", onTouchEnd);
    scrollEl.addEventListener("touchcancel", onTouchEnd);

    return () => {
      scrollEl.removeEventListener("touchstart", onTouchStart);
      scrollEl.removeEventListener("touchmove", onTouchMove);
      scrollEl.removeEventListener("touchend", onTouchEnd);
      scrollEl.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const validate = (values: SignupFormState): SignupFormErrors => {
    const newErrors: SignupFormErrors = {};

    const normalizedName = normalizeSignupName(values.name);
    if (!normalizedName) {
      newErrors.name = "Name is required";
    } else if (hasExtraSignupNameSpacing(values.name)) {
      newErrors.name = "Name cannot contain extra spaces";
    } else if (normalizedName.length < NAME_MIN_LENGTH) {
      newErrors.name = `Name must be at least ${NAME_MIN_LENGTH} characters`;
    } else if (normalizedName.length > NAME_MAX_LENGTH) {
      newErrors.name = NAME_MAX_ERROR;
    } else if (!SIGNUP_NAME_PATTERN.test(normalizedName)) {
      newErrors.name = "Name must contain only letters";
    }

    const emailNormalized = normalizeSignupEmail(values.email);
    const emailError = getSignupEmailValidationError(emailNormalized);
    if (emailError) {
      newErrors.email = emailError;
    }

    const phoneCountry =
      getSignupPhoneCountry(values.phoneCountryId) ?? getDefaultSignupPhoneCountry();
    if (!values.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else {
      const mobileErr = validateSignupNationalDigits(values.mobileNumber.trim(), phoneCountry);
      if (mobileErr) {
        newErrors.mobileNumber = mobileErr;
      }
    }

    const passwordRaw = values.password ?? "";
    // Empty or whitespace-only must show required first (not min-length).
    if (passwordRaw.length === 0 || /^\s+$/.test(passwordRaw)) {
      newErrors.password = "Password is required";
    } else if (passwordContainsWhitespace(passwordRaw)) {
      newErrors.password = PASSWORD_WHITESPACE_ERROR;
    } else if (passwordRaw.length < PASSWORD_MIN_LENGTH) {
      newErrors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    } else if (passwordRaw.length > PASSWORD_MAX_LENGTH) {
      newErrors.password = PASSWORD_MAX_ERROR;
    } else {
      const hasLower = /[a-z]/.test(passwordRaw);
      const hasUpper = /[A-Z]/.test(passwordRaw);
      const hasNumber = /[0-9]/.test(passwordRaw);
      const hasSpecial = /[!@#$%^&*(),.?\x3a{}|<>]/.test(passwordRaw);
      if (!hasLower) {
        newErrors.password = "Password must include a lowercase letter";
      } else if (!hasUpper) {
        newErrors.password = "Password must include an uppercase letter";
      } else if (!hasNumber) {
        newErrors.password = "Password must include a number";
      } else if (!hasSpecial) {
        newErrors.password = "Password must include a special character (!@#$%^&* etc)";
      }
    }

    const confirmRaw = values.confirmPassword ?? "";
    if (confirmRaw.length === 0 || /^\s+$/.test(confirmRaw)) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (passwordContainsWhitespace(confirmRaw)) {
      newErrors.confirmPassword = PASSWORD_WHITESPACE_ERROR;
    } else if (confirmRaw.length > PASSWORD_MAX_LENGTH) {
      newErrors.confirmPassword = CONFIRM_PASSWORD_MAX_ERROR;
    } else if (passwordRaw !== confirmRaw) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    return newErrors;
  };

  const handleChange =
    (field: keyof SignupFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let raw = event.target.value;

      if (field === "mobileNumber") {
        setForm((prev) => {
          const country = getSignupPhoneCountry(prev.phoneCountryId) ?? getDefaultSignupPhoneCountry();
          const digits = raw.replace(/\D/g, "").slice(0, country.maxDigits);
          return { ...prev, mobileNumber: digits };
        });
        setErrors((prev) => ({ ...prev, mobileNumber: undefined, form: undefined }));
        return;
      }

      if (field === "name") {
        // Strip leading whitespace and collapse multiple internal spaces while typing.
        raw = raw.replace(/^[\s\u00A0\uFEFF\u2000-\u200B\u202F\u205F\u3000]+/, "");
        raw = raw.replace(/[\s\u00A0\uFEFF\u2000-\u200B\u202F\u205F\u3000]{2,}/g, " ");
      }

      if (field === "email") {
        raw = stripEmailWhitespace(raw);
      }

      let passwordWhitespaceRemoved = false;
      if (field === "password" || field === "confirmPassword") {
        if (passwordContainsWhitespace(raw)) {
          raw = raw.replace(/\s/g, "");
          passwordWhitespaceRemoved = true;
        }
      }

      const maxLength = FIELD_MAX_LENGTHS[field];
      if (typeof maxLength === "number" && raw.length > maxLength) {
        const overflowError = FIELD_MAX_ERRORS[field];
        setForm((prev) => ({ ...prev, [field]: raw.slice(0, maxLength) }));
        setErrors((prev) => ({
          ...prev,
          [field]: overflowError,
          form: undefined,
        }));
        return;
      }

      setForm((prev) => ({ ...prev, [field]: raw }));
      if (field === "password" || field === "confirmPassword") {
        setErrors((prev) => ({
          ...prev,
          [field]: passwordWhitespaceRemoved ? PASSWORD_WHITESPACE_ERROR : undefined,
          form: undefined,
        }));
      } else if (field === "email") {
        const normalized = normalizeSignupEmail(raw);
        const emailError = shouldValidateSignupEmailLive(normalized)
          ? getSignupEmailValidationError(normalized)
          : undefined;
        setErrors((prev) => ({
          ...prev,
          email: emailError,
          form: undefined,
        }));
      } else {
      setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
      }
    };

  const handleNameBlur = () => {
    const normalizedName = normalizeSignupName(form.name);
    setForm((prev) => ({ ...prev, name: normalizedName }));
    const fieldErrors = validate({ ...form, name: normalizedName });
    setErrors((prev) => ({
      ...prev,
      name: fieldErrors.name,
      form: fieldErrors.name ? undefined : prev.form,
    }));
  };

  const handleEmailBlur = () => {
    const trimmedEmail = stripEmailWhitespace(form.email).trim();
    setForm((prev) => ({
      ...prev,
      email: trimmedEmail,
    }));
    const fieldErrors = validate({
      ...form,
      email: trimmedEmail,
    });
    setErrors((prev) => ({
      ...prev,
      email: fieldErrors.email,
      form: fieldErrors.email ? undefined : prev.form,
    }));
  };

  const handleMobileBlur = () => {
    const fieldErrors = validate(form);
    setErrors((prev) => ({
      ...prev,
      mobileNumber: fieldErrors.mobileNumber,
      form: fieldErrors.mobileNumber ? undefined : prev.form,
    }));
  };

  const handlePasswordBlur = () => {
    const fieldErrors = validate(form);
    setErrors((prev) => ({
      ...prev,
      password: fieldErrors.password,
      form: fieldErrors.password ? undefined : prev.form,
    }));
  };

  const handleConfirmPasswordBlur = () => {
    const fieldErrors = validate(form);
    setErrors((prev) => ({
      ...prev,
      confirmPassword: fieldErrors.confirmPassword,
      form: fieldErrors.confirmPassword ? undefined : prev.form,
    }));
  };

  const handleEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      e.preventDefault();
    }
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      e.preventDefault();
    }
  };

  const openCountryDropdown = () => {
    setCountryHighlightIndex(getCountryListIndex(form.phoneCountryId));
    setCountryDropdownOpen(true);
  };

  const closeCountryDropdown = (returnFocus = false) => {
    setCountryDropdownOpen(false);
    if (returnFocus) {
      countryTriggerRef.current?.focus();
    }
  };

  const selectPhoneCountry = (id: string) => {
    const country = getSignupPhoneCountry(id) ?? getDefaultSignupPhoneCountry();
    setForm((prev) => ({
      ...prev,
      phoneCountryId: id,
      mobileNumber: prev.mobileNumber.replace(/\D/g, "").slice(0, country.maxDigits),
    }));
    setErrors((prev) => ({ ...prev, mobileNumber: undefined, form: undefined }));
    setCountryHighlightIndex(getCountryListIndex(id));
    setCountryDropdownOpen(false);
    countryTriggerRef.current?.focus();
  };

  const focusCountryOption = (index: number) => {
    const country = SIGNUP_PHONE_COUNTRIES[index];
    if (!country) return;
    setCountryHighlightIndex(index);
    document.getElementById(`country-option-${country.id}`)?.focus();
  };

  const handleCountryOptionKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    countryId: string,
    index: number
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectPhoneCountry(countryId);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      closeCountryDropdown(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      focusCountryOption(Math.min(index + 1, SIGNUP_PHONE_COUNTRIES.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (index === 0) {
        closeCountryDropdown(true);
        return;
      }
      focusCountryOption(Math.max(index - 1, 0));
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      focusCountryOption(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      focusCountryOption(SIGNUP_PHONE_COUNTRIES.length - 1);
    }
  };

  const handleCountryTriggerKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Escape") {
      if (countryDropdownOpen) {
        e.preventDefault();
        closeCountryDropdown(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!countryDropdownOpen) {
        openCountryDropdown();
        return;
      }
      setCountryHighlightIndex((i) => Math.min(i + 1, SIGNUP_PHONE_COUNTRIES.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!countryDropdownOpen) {
        setCountryHighlightIndex(SIGNUP_PHONE_COUNTRIES.length - 1);
        setCountryDropdownOpen(true);
        return;
      }
      setCountryHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!countryDropdownOpen) {
        openCountryDropdown();
        return;
      }
      const country = SIGNUP_PHONE_COUNTRIES[countryHighlightIndex];
      if (country) selectPhoneCountry(country.id);
      return;
    }
    if (e.key === "Home" && countryDropdownOpen) {
      e.preventDefault();
      setCountryHighlightIndex(0);
      return;
    }
    if (e.key === "End" && countryDropdownOpen) {
      e.preventDefault();
      setCountryHighlightIndex(SIGNUP_PHONE_COUNTRIES.length - 1);
    }
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
        name: normalizeSignupName(form.name),
        email: normalizeSignupEmail(form.email),
        mobile: toE164Mobile(phoneCountry, form.mobileNumber.trim()),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      setForm(initialSignupState);
      setErrors((prev) => ({ ...prev, form: "Signup successful!" }));
      // Trigger success popup and delay redirect
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      router.push("/login");
      }, 2000);

    } catch (error) {
      if (isApiConnectionError(error)) {
        router.push("/backend-error");
        return;
      }
      const message =
        error instanceof Error ? error.message : "Registration failed, please try again";
      const normalizedEmail = normalizeSignupEmail(form.email);
      const apiMessageLooksLikeMissingEmail =
        !normalizedEmail &&
        (message === "Enter valid email" ||
          message === "All fields are required" ||
          message === "Email is required");
      if (apiMessageLooksLikeMissingEmail) {
        setErrors((prev) => ({
          ...prev,
          email: "Email is required",
          form: undefined,
        }));
        return;
      }
      const lowerMessage = message.toLowerCase();
      if (
        lowerMessage.includes("valid email") ||
        lowerMessage.includes("gmail") ||
        lowerMessage.includes("outlook") ||
        lowerMessage.includes("yahoo") ||
        lowerMessage.includes("stackly")
      ) {
        setErrors((prev) => ({
          ...prev,
          email:
            message === "Enter valid email"
              ? "Please enter a valid email address"
              : message.includes("Only Gmail")
                ? SIGNUP_EMAIL_DOMAIN_ERROR
                : message,
          form: undefined,
        }));
        return;
      }
      setErrors((prev) => ({ ...prev, form: message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPhoneCountry =
    getSignupPhoneCountry(form.phoneCountryId) ?? getDefaultSignupPhoneCountry();

  return (
    <>
      <div className="auth-page min-h-[100dvh] lg:min-h-screen flex flex-col max-lg:overflow-auto bg-white px-0 py-0 lg:px-6 lg:py-4 lg:overflow-y-auto">
        <div className="w-full max-lg:max-w-none max-w-6xl mx-auto flex flex-1 flex-col max-lg:h-full lg:flex-none lg:flex-row gap-0 lg:gap-8 auth-layout">
        {/* Card first on mobile (top), right on desktop */}
          <div className="flex w-full flex-1 flex-col items-stretch max-lg:justify-stretch justify-center max-lg:h-full order-1 lg:order-2 lg:w-1/2 lg:flex-none">
          <div
              className="relative flex w-full max-w-[520px] flex-1 flex-col overflow-hidden max-lg:overflow-auto lg:overflow-visible self-center max-lg:self-stretch bg-gradient-to-b from-[#5f82e8] via-[#3f66c9] to-[#021a46] px-6 sm:px-10 max-lg:max-w-none max-lg:w-full max-lg:h-full max-lg:flex-1 lg:flex-none lg:rounded-[10px] signup-card auth-form-card"
          >
            <div className="auth-inner-panel pointer-events-none absolute inset-y-0 left-1/2 w-[78%] -translate-x-1/2 bg-gradient-to-b from-white/10 via-black/10 to-black/35" />
            <div className="pointer-events-none absolute inset-0 rounded-none lg:rounded-[10px] shadow-[inset_20px_0_45px_rgba(0,0,0,0.55),inset_-20px_0_45px_rgba(0,0,0,0.55)]" />
            <div className="pointer-events-none absolute inset-0 rounded-none lg:rounded-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />

              <div className="relative z-10 flex flex-col flex-1 min-h-0 min-w-0 px-4 sm:px-6 pt-2.5 sm:pt-4 pb-2 sm:pb-3 lg:pt-7 lg:pb-4 text-white signup-card-content text-left justify-start lg:justify-between max-lg:overflow-auto">
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
                          onBlur={handleNameBlur}
                          minLength={NAME_MIN_LENGTH}
                          maxLength={NAME_MAX_LENGTH}
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
                          type="text"
                          inputMode="email"
                          autoComplete="email"
                          spellCheck={false}
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange("email")}
                          onBlur={handleEmailBlur}
                          onKeyDown={handleEmailKeyDown}
                          maxLength={EMAIL_MAX_LENGTH}
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
                      <div className="signup-phone-row flex items-center border-b border-white/80 pb-2 min-w-0">
                        <FaPhone className="signup-phone-icon mr-3 shrink-0 text-sm text-white/90" />
                        <div className="signup-phone-fields flex min-w-0 flex-1 items-center gap-2">
                        <div
                          className="signup-country-select relative z-20 w-fit max-lg:max-w-[7.25rem] max-w-[200px] shrink-0 min-w-0"
                          ref={countryDropdownRef}
                          onBlur={(e) => {
                            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                              setCountryDropdownOpen(false);
                            }
                          }}
                        >
                          <button
                            ref={countryTriggerRef}
                            type="button"
                            id="country-select-trigger"
                            role="combobox"
                            tabIndex={0}
                            aria-label={`Country calling code: ${selectedPhoneCountry.name} (+${selectedPhoneCountry.dialCode})`}
                            aria-haspopup="listbox"
                            aria-controls="country-select-listbox"
                            aria-autocomplete="none"
                            aria-expanded={countryDropdownOpen}
                            aria-activedescendant={
                              countryDropdownOpen
                                ? `country-option-${SIGNUP_PHONE_COUNTRIES[countryHighlightIndex]?.id}`
                                : undefined
                            }
                            onPointerDown={() => {
                              countryPointerOnTriggerRef.current = true;
                            }}
                            onFocus={() => {
                              if (!countryPointerOnTriggerRef.current) {
                                openCountryDropdown();
                              }
                              countryPointerOnTriggerRef.current = false;
                            }}
                            onClick={() => {
                              if (countryDropdownOpen) {
                                setCountryDropdownOpen(false);
                              } else {
                                openCountryDropdown();
                              }
                            }}
                            onKeyDown={handleCountryTriggerKeyDown}
                            className="signup-country-trigger flex w-auto max-w-full min-w-0 items-center justify-between gap-1 rounded border border-white/80 bg-transparent px-2 py-0 text-left text-sm leading-5 text-white outline-none hover:border-white focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent max-lg:gap-0.5 max-lg:rounded-sm max-lg:px-1"
                          >
                            <span className="min-w-0 truncate">
                              <span className="sm:hidden">
                                {selectedPhoneCountry.id} (+{selectedPhoneCountry.dialCode})
                              </span>
                              <span className="hidden sm:inline">
                                {selectedPhoneCountry.name} (+{selectedPhoneCountry.dialCode})
                              </span>
                            </span>
                            <span
                              className={`shrink-0 text-white/90 transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`}
                              aria-hidden
                            >
                              <svg
                                className="h-3 w-3 max-lg:h-2.5 max-lg:w-2.5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
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
                              ref={countryListRef}
                              id="country-select-listbox"
                              role="listbox"
                              aria-labelledby="country-select-trigger"
                              className="signup-country-list absolute left-0 top-full z-50 mt-1 max-h-60 w-max min-w-full max-w-[80vw] overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg [scrollbar-color:#94a3b8_#f1f5f9]"
                            >
                              {SIGNUP_PHONE_COUNTRIES.map((c, idx) => {
                                const selected = form.phoneCountryId === c.id;
                                const highlighted = countryHighlightIndex === idx;
                                return (
                                  <li key={c.id} role="presentation" className="px-0 py-0">
                                    <button
                                      type="button"
                                      id={`country-option-${c.id}`}
                                      role="option"
                                      tabIndex={countryDropdownOpen ? 0 : -1}
                                      aria-selected={selected}
                                      className={`flex w-full cursor-pointer items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm outline-none hover:bg-[#1A73E8] hover:text-white focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1A73E8] ${
                                        selected || highlighted
                                          ? "bg-[#1A73E8] text-white"
                                          : "bg-white text-gray-900"
                                      }`}
                                      onFocus={() => setCountryHighlightIndex(idx)}
                                      onMouseEnter={() => setCountryHighlightIndex(idx)}
                                      onKeyDown={(e) => handleCountryOptionKeyDown(e, c.id, idx)}
                                      onClick={() => selectPhoneCountry(c.id)}
                                    >
                                      <span className="inline-block w-6 shrink-0 font-medium">{c.id}</span>
                                      <span className="truncate">{c.name} (+{c.dialCode})</span>
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
                        placeholder="Mobile number"
                        value={form.mobileNumber}
                        onChange={handleChange("mobileNumber")}
                          onBlur={handleMobileBlur}
                          className="signup-mobile-input min-h-5 min-w-0 flex-1 border-0 bg-transparent py-0 text-sm leading-5 text-white outline-none placeholder-white/90"
                        aria-invalid={!!errors.mobileNumber}
                        aria-describedby={errors.mobileNumber ? "mobile-error" : undefined}
                      />
                        </div>
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
                          onBlur={handlePasswordBlur}
                          onKeyDown={handlePasswordKeyDown}
                          maxLength={PASSWORD_MAX_LENGTH}
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
                          onBlur={handleConfirmPasswordBlur}
                          onKeyDown={handlePasswordKeyDown}
                          maxLength={PASSWORD_MAX_LENGTH}
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

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2.5 mb-2.5 lg:mt-2.5 lg:mb-2.5 w-full h-[42px] flex-shrink-0 cursor-pointer bg-gradient-to-r from-[#2d8cf0] to-[#5a78c7] rounded-md text-sm font-medium text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  whileHover={!isSubmitting ? { scale: 1.025, filter: "brightness(1.08)" } : undefined}
                  whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                >
                  {isSubmitting ? "Checking..." : "Sign Up"}
                </motion.button>
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
                    <AuthGoogleButton intent="signup" label="Sign up with Google" />
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

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center flex flex-col items-center"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", bounce: 0.4 }}
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-5 shadow-sm">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 font-medium">Successfully completed signup.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
