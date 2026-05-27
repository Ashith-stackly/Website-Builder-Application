"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FaAddressBook, FaLock } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  getAuthPullScrollRoot,
  isAuthPageZoomed,
  mountAuthAndroidClass,
} from "@/lib/authMobileTouch";
import {
  fitInputPlaceholderToWidth,
  observeAuthPlaceholderFit,
} from "@/lib/authPlaceholderFit";
import { isApiConnectionError, login as loginApi } from "@/lib/api";
import { assetPath } from "@/lib/paths";
import {
  capSimpleMobileContactInput,
  countMobileDigits,
  looksLikeMobileContactInput,
  isValidSimpleMobileContact,
  simpleMobileMaxLengthMessage,
  SIMPLE_MOBILE_MAX_DIGITS,
  validateSimpleMobileContact,
} from "@/lib/simpleMobileContact";
import AuthGoogleButton from "@/components/AuthGoogleButton";

type LoginFormState = {
  email: string;
  password: string;
  rememberMe: boolean;
};

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

const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MAX_LENGTH = 60;
const EMAIL_MAX_ERROR = `Email or mobile number cannot exceed ${EMAIL_MAX_LENGTH} characters.`;
const PASSWORD_MAX_ERROR = `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters.`;

const loginContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

const loginFadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

const loginCardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const loginErrorVariants: Variants = {
  hidden: { opacity: 0, y: -5 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, y: -5, transition: { duration: 0.16, ease: "easeIn" } },
};

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormState>(initialLoginState);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); // New state for popup
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)");
    const setup = () => observeAuthPlaceholderFit(emailInputRef.current, mql.matches);
    let cleanup = setup();
    const onChange = () => {
      cleanup();
      cleanup = setup();
    };
    mql.addEventListener("change", onChange);
    return () => {
      mql.removeEventListener("change", onChange);
      cleanup();
    };
  }, []);

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
    return () => {
      document.documentElement.classList.remove("auth-visible");
      document.body.classList.remove("auth-visible");
      unmountAndroid();
    };
  }, []);

  useEffect(() => {
    const scrollEl = getAuthPullScrollRoot(true);
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

  const validate = (values: LoginFormState): LoginFormErrors => {
    const newErrors: LoginFormErrors = {};

    const trimmedContact = values.email.trim();
    if (!trimmedContact) {
      newErrors.email = "Email or mobile number is required.";
    } else if (looksLikeMobileContactInput(trimmedContact)) {
      const mobileError = validateSimpleMobileContact(trimmedContact);
      if (mobileError) {
        newErrors.email = mobileError;
      }
    } else if (trimmedContact.length > EMAIL_MAX_LENGTH) {
      newErrors.email = EMAIL_MAX_ERROR;
    } else {
      const isEmail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|in|org|net|edu)$/i.test(
        trimmedContact.toLowerCase(),
      );
      if (!isEmail) {
        newErrors.email = "Enter valid email or mobile number.";
      }
    }

    if (!values.password) {
      newErrors.password = "Enter valid password";
    } else if (values.password.length > PASSWORD_MAX_LENGTH) {
      newErrors.password = PASSWORD_MAX_ERROR;
    } else if (values.password.length < 8) {
      newErrors.password = "Enter valid password";
    }

    return newErrors;
  };

  const handleChange =
    (field: keyof LoginFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (field === "rememberMe") {
        setForm((prev) => ({ ...prev, rememberMe: event.target.checked }));
        setErrors((prev) => ({ ...prev, form: undefined }));
        return;
      }

      const rawValue = event.target.value;
      const contactValue =
        field === "email" ? rawValue.replace(/\s+/g, "") : rawValue;

      if (field === "email") {
        const treatAsMobile = looksLikeMobileContactInput(contactValue);
        if (treatAsMobile) {
          const capped = capSimpleMobileContactInput(contactValue);
          if (capped !== contactValue) {
            setForm((prev) => ({ ...prev, email: capped }));
            if (countMobileDigits(capped) >= SIMPLE_MOBILE_MAX_DIGITS) {
              setErrors((prev) => ({
                ...prev,
                email: simpleMobileMaxLengthMessage(),
                form: undefined,
              }));
            }
            return;
          }
        } else if (contactValue.length > EMAIL_MAX_LENGTH) {
          setForm((prev) => ({
            ...prev,
            email: contactValue.slice(0, EMAIL_MAX_LENGTH),
          }));
          setErrors((prev) => ({
            ...prev,
            email: EMAIL_MAX_ERROR,
            form: undefined,
          }));
          return;
        }
      }

      if (field === "password" && rawValue.length > PASSWORD_MAX_LENGTH) {
        setForm((prev) => ({
          ...prev,
          password: rawValue.slice(0, PASSWORD_MAX_LENGTH),
        }));
        setErrors((prev) => ({
          ...prev,
          password: PASSWORD_MAX_ERROR,
          form: undefined,
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        [field]: field === "email" ? contactValue : rawValue,
      }));
      setErrors((prev) => ({ ...prev, [field]: undefined, form: undefined }));
    };

  const handleContactBlur = () => {
    const trimmed = form.email.trim();
    setForm((prev) => ({ ...prev, email: trimmed }));
    if (trimmed && looksLikeMobileContactInput(trimmed)) {
      const mobileError = validateSimpleMobileContact(trimmed);
      setErrors((errs) => ({
        ...errs,
        email: mobileError ?? undefined,
        form: undefined,
      }));
    }
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

      const isMobileContact = isValidSimpleMobileContact(contact);
      const result = await loginApi({
        ...(isMobileContact ? { mobile: contact } : { email: contact.toLowerCase() }),
        password: form.password,
      });

      if (result.token) {
        window.localStorage.setItem("stackly-auth-token", result.token);
      }

      setForm(initialLoginState);
      setErrors((prev) => ({ ...prev, form: "Login successful!" }));
      // Trigger success popup and delay redirect
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push("/landing");
      }, 2000);
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
    <>
      <motion.div className="login-page auth-page min-h-[100dvh] lg:min-h-screen flex flex-col max-lg:overflow-auto bg-white px-0 py-0 lg:px-6 lg:py-4 lg:overflow-y-auto" initial="hidden" animate="visible" variants={loginContainerVariants}>
        <motion.div className="w-full max-lg:max-w-none max-w-6xl mx-auto flex flex-1 flex-col max-lg:h-full lg:flex-none lg:flex-row gap-0 lg:gap-8 auth-layout" variants={loginContainerVariants}>
          {/* Card first on mobile (top), right on desktop */}
          <motion.div className="flex w-full flex-1 flex-col items-stretch max-lg:justify-stretch justify-center max-lg:h-full order-1 lg:order-2 lg:w-1/2 lg:flex-none" variants={loginCardVariants}>
            <motion.div className="relative flex w-full max-w-[520px] flex-1 flex-col overflow-hidden max-lg:overflow-auto lg:overflow-visible self-center max-lg:self-stretch bg-gradient-to-b from-[#5f82e8] via-[#3f66c9] to-[#021a46] px-6 sm:px-10 max-lg:max-w-none max-lg:w-full max-lg:h-full max-lg:flex-1 lg:flex-none lg:rounded-[10px] login-card auth-form-card" whileHover={{ y: -3, boxShadow: "0 28px 70px rgba(2,15,38,0.22)", transition: { duration: 0.24 } }}>
              <div className="auth-inner-panel pointer-events-none absolute inset-y-0 left-1/2 w-[78%] -translate-x-1/2 bg-gradient-to-b from-white/10 via-black/10 to-black/35" />
              <div className="pointer-events-none absolute inset-0 rounded-none lg:rounded-[10px] shadow-[inset_20px_0_45px_rgba(0,0,0,0.55),inset_-20px_0_45px_rgba(0,0,0,0.55)]" />
              <div className="pointer-events-none absolute inset-0 rounded-none lg:rounded-[10px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" />

              <motion.div className="relative z-10 flex flex-col flex-1 min-h-0 min-w-0 auth-card-content login-card-inner px-4 sm:px-6 pt-4 sm:pt-8 pb-4 sm:pb-8 lg:pt-14 lg:pb-10 text-white text-left justify-start lg:justify-center lg:min-h-0 max-lg:overflow-auto" variants={loginContainerVariants}>
                <motion.div variants={loginContainerVariants}>
                  <motion.div className="w-full flex justify-center flex-shrink-0 min-w-0" variants={loginFadeUp}>
                    <h1 className="font-welcome-heading text-lg sm:text-xl md:text-2xl lg:text-3xl text-center font-semibold mb-1 sm:mb-4 lg:mb-7 break-words tracking-widest">
                      WELCOME
                    </h1>
                  </motion.div>

                  <motion.div className="flex justify-center mb-8 sm:mb-4 lg:mb-8 flex-shrink-0" variants={loginFadeUp}>
                    <motion.div className="bg-white w-[120px] h-[44px] sm:w-[160px] sm:h-[60px] lg:w-[200px] lg:h-[80px] rounded-[50%] flex items-center justify-center shadow-lg overflow-hidden" whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}>
                      <img
                        src={assetPath("/stackly-logo.webp")}
                        alt="Stackly Logo"
                        className="h-4 sm:h-5 lg:h-8 object-contain"
                      />
                    </motion.div>
                  </motion.div>

                  <motion.form onSubmit={handleLogin} noValidate variants={loginContainerVariants}>
                    <motion.div className="space-y-6 sm:space-y-4 lg:space-y-6 flex-shrink-0" variants={loginContainerVariants}>
                    <motion.div className="flex flex-col" variants={loginFadeUp}>
                      <motion.div className="login-contact-row flex items-center border-b border-white/60 pb-2 min-w-0" whileFocus={{ scale: 1.01 }} whileHover={{ borderColor: "rgba(255,255,255,0.95)", transition: { duration: 0.2 } }}>
                        <FaAddressBook className="login-email-icon mr-2 sm:mr-4 text-sm opacity-80 flex-shrink-0" />
                        <input
                          ref={emailInputRef}
                          type="text"
                          placeholder="Email or Mobile number"
                          value={form.email}
                          onChange={handleChange("email")}
                          onBlur={() => {
                            handleContactBlur();
                            requestAnimationFrame(() =>
                              fitInputPlaceholderToWidth(emailInputRef.current)
                            );
                          }}
                          maxLength={EMAIL_MAX_LENGTH}
                          className="bg-transparent outline-none w-full min-w-0 placeholder-white text-sm login-email-input"
                          aria-invalid={!!errors.email}
                          aria-describedby={
                            errors.email ? "login-email-error" : undefined
                          }
                        />
                      </motion.div>
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p
                            id="login-email-error"
                            className="auth-error-text mt-0.5 text-[11px] sm:text-xs"
                            variants={loginErrorVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            {errors.email}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <motion.div className="flex flex-col" variants={loginFadeUp}>
                      <motion.div className="flex items-center border-b border-white/60 pb-2 relative min-w-0" whileHover={{ borderColor: "rgba(255,255,255,0.95)", transition: { duration: 0.2 } }}>
                        <FaLock className="mr-2 sm:mr-4 text-sm opacity-80 flex-shrink-0" />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={form.password}
                          onChange={handleChange("password")}
                          maxLength={PASSWORD_MAX_LENGTH}
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
                      </motion.div>
                      <AnimatePresence>
                        {errors.password && (
                          <motion.p
                            id="login-password-error"
                            className="auth-error-text mt-0.5 text-[11px] sm:text-xs"
                            variants={loginErrorVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            {errors.password}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </motion.div>

                  <motion.div className="login-remember-forgot mt-5 sm:mt-4 text-xs opacity-90 w-full min-w-0" variants={loginFadeUp}>
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
                  </motion.div>

                  <AnimatePresence>
                    {errors.form && (
                      <motion.p
                        className={`mt-1.5 sm:mt-2 text-[11px] sm:text-xs font-medium ${errors.form === "Login successful!" ? "text-green-300" : "auth-error-text"}`}
                        variants={loginErrorVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                      >
                        {errors.form}
                      </motion.p>
                    )}
                  </AnimatePresence>

                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="mt-6 sm:mt-6 lg:mt-8 w-full h-[42px] sm:h-[45px] bg-gradient-to-r from-[#2d8cf0] to-[#5a78c7] rounded-md text-sm font-medium shadow-md hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
                      variants={loginFadeUp}
                      whileHover={!isSubmitting ? { scale: 1.025, filter: "brightness(1.08)" } : undefined}
                      whileTap={!isSubmitting ? { scale: 0.98 } : undefined}
                    >
                      {isSubmitting ? "Checking..." : "Login"}
                    </motion.button>
                  </motion.form>
                </motion.div>

                <motion.div className="flex-shrink-0 mt-2 max-lg:mt-2 lg:mt-4" variants={loginFadeUp}>
                  <p className="text-center text-xs mb-2 sm:mb-2.5 lg:mb-3 text-white/80">
                    Don&apos;t have an account?{" "}
                    <Link
                      href="/signup"
                      className="text-yellow-400 hover:text-yellow-300 font-medium"
                    >
                      Sign Up
                    </Link>
                  </p>

                  <div className="mt-1.5 mb-1 lg:mt-1 lg:mb-0.5 border-t border-white/50" />

                  <div className="pt-0.5 pb-1 sm:pt-1 sm:pb-3 lg:pb-2">
                    <AuthGoogleButton intent="login" label="Login with Google" />
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Illustration below on mobile, left on desktop */}
          <motion.div
            className="auth-image-col w-full lg:w-1/2 flex justify-center order-2 lg:order-1 mt-6 sm:mt-8 lg:mt-0"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.45, ease: "easeOut" },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <motion.img
              src={assetPath("/login-animation.gif")}
              alt="Secure login animation"
              className="auth-image w-[80%] sm:w-[70%] lg:w-[90%] max-w-[550px] object-contain"
              whileHover={{ scale: 1.02, transition: { duration: 0.24 } }}
            />
          </motion.div>
        </motion.div>
      </motion.div>

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
              <p className="text-gray-600 font-medium">Successfully completed signin.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
