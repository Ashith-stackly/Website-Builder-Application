/** True when the page is pinch-zoomed (visual viewport scale > 1). */
export function isAuthPageZoomed(): boolean {
  if (typeof window === "undefined") return false;
  return (window.visualViewport?.scale ?? 1) > 1.01;
}

/** Android WebView / Chrome — needs document scroll for post-zoom pan. */
export function isAndroidMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

/** Apply `auth-android` on <html> for Android-specific auth CSS. */
export function mountAuthAndroidClass(): () => void {
  if (typeof document === "undefined") return () => undefined;
  if (!isAndroidMobile()) return () => undefined;
  document.documentElement.classList.add("auth-android");
  return () => document.documentElement.classList.remove("auth-android");
}

/** Scroll root for pull-to-refresh: document on Android, inner panel on iOS. */
export function getAuthPullScrollRoot(loginPage: boolean): HTMLElement | null {
  if (typeof window === "undefined" || window.innerWidth >= 1024) return null;
  if (isAndroidMobile()) {
    return document.scrollingElement as HTMLElement | null;
  }
  if (loginPage) {
    return document.querySelector(".login-page .login-card-inner") as HTMLElement | null;
  }
  return document.querySelector(".auth-page") as HTMLElement | null;
}

/** 150%–200%+ pinch-zoom on mobile signup: stack mobile number under country selector. */
const SIGNUP_PHONE_STACK_ZOOM = 1.5;
const SIGNUP_PHONE_UNZOOM_MAX = 1.06;

/** Pinch / page zoom factor (iOS reports scale; Android often only shrinks layout / visual viewport). */
function getAuthVisualZoomScale(): number {
  const vv = window.visualViewport;
  if (!vv) return 1;

  const reported = vv.scale > 0 ? vv.scale : 1;
  const layoutWidth = Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  );
  const widthRatio =
    vv.width > 0 && layoutWidth > 0 ? layoutWidth / vv.width : 1;

  return Math.max(reported, widthRatio);
}

/** Android: layout viewport shrinks on pinch-zoom while screen.width stays constant. */
function getAndroidScreenZoomScale(): number {
  if (!isAndroidMobile()) return 1;
  const screenW = window.screen?.width ?? 0;
  const innerW = window.innerWidth || 0;
  if (screenW < 280 || innerW < 200) return 1;
  const ratio = screenW / innerW;
  return ratio >= 1.12 ? ratio : 1;
}

let signupPhoneBaselineInner = 0;
let signupPhoneBaselineVisual = 0;

function captureSignupPhoneZoomBaseline(): void {
  const vv = window.visualViewport;
  if (window.innerWidth > 0) signupPhoneBaselineInner = window.innerWidth;
  if (vv && vv.width > 0) signupPhoneBaselineVisual = vv.width;
}

function getSignupPhoneZoomScale(): number {
  const vv = window.visualViewport;
  const fromViewport = getAuthVisualZoomScale();
  const fromScreen = getAndroidScreenZoomScale();

  const layoutShrink =
    signupPhoneBaselineInner > 0 && window.innerWidth > 0
      ? signupPhoneBaselineInner / window.innerWidth
      : 1;
  const visualShrink =
    signupPhoneBaselineVisual > 0 && vv && vv.width > 0
      ? signupPhoneBaselineVisual / vv.width
      : 1;

  return Math.max(fromViewport, fromScreen, layoutShrink, visualShrink);
}

function isSignupPhoneUnzoomed(): boolean {
  return getSignupPhoneZoomScale() < SIGNUP_PHONE_UNZOOM_MAX;
}

function measureInputPlaceholderWidthPx(
  input: HTMLInputElement,
  text: string
): number {
  const style = getComputedStyle(input);
  const span = document.createElement("span");
  span.setAttribute("aria-hidden", "true");
  span.style.cssText =
    "position:absolute;left:-9999px;visibility:hidden;white-space:nowrap;";
  span.style.fontFamily = style.fontFamily;
  span.style.fontWeight = style.fontWeight;
  span.style.fontSize = style.fontSize;
  span.style.letterSpacing = style.letterSpacing;
  span.textContent = text;
  document.body.appendChild(span);
  const width = span.getBoundingClientRect().width;
  document.body.removeChild(span);
  return width;
}

/** True when single-row mobile field is too narrow for the placeholder (common at 150%+ zoom). */
function signupPhonePlaceholderClips(): boolean {
  const input = document.querySelector(
    ".signup-card-content .signup-mobile-input"
  ) as HTMLInputElement | null;
  if (!input) return false;
  const available = input.clientWidth - 6;
  if (available < 48) return true;
  const text = input.getAttribute("placeholder") ?? "Mobile number";
  return measureInputPlaceholderWidthPx(input, text) > available;
}

function signupPhoneRowOverflows(): boolean {
  const fields = document.querySelector(
    ".signup-card-content .signup-phone-fields"
  );
  if (!fields) return false;
  const country = fields.querySelector(".signup-country-select");
  const mobile = fields.querySelector(".signup-mobile-input");
  if (!country || !mobile) return false;
  const gap = 8;
  const needed =
    country.getBoundingClientRect().width +
    gap +
    mobile.getBoundingClientRect().width;
  return needed > fields.getBoundingClientRect().width + 2;
}

function shouldStackSignupPhone(mobile: boolean): boolean {
  if (!mobile) return false;
  if (getSignupPhoneZoomScale() >= SIGNUP_PHONE_STACK_ZOOM) return true;
  if (isAndroidMobile() && signupPhonePlaceholderClips()) return true;
  if (isAndroidMobile() && signupPhoneRowOverflows()) return true;
  return false;
}

function applySignupPhoneStackedClass(stacked: boolean): void {
  document.documentElement.classList.toggle("signup-phone-zoom-stacked", stacked);
  document
    .querySelectorAll(".signup-card-content .signup-phone-fields")
    .forEach((el) => {
      el.classList.toggle("signup-phone-fields--stacked", stacked);
    });
}

export function mountSignupPhoneStackedClass(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const mql = window.matchMedia("(max-width: 1023px)");
  let rowObserver: ResizeObserver | null = null;
  let rafId = 0;

  const update = () => {
    if (mql.matches && isSignupPhoneUnzoomed()) {
      captureSignupPhoneZoomBaseline();
    }
    applySignupPhoneStackedClass(shouldStackSignupPhone(mql.matches));

    const fields = document.querySelector(
      ".signup-card-content .signup-phone-fields"
    );
    if (fields && !rowObserver) {
      rowObserver = new ResizeObserver(() => scheduleUpdate());
      rowObserver.observe(fields);
      const row = fields.closest(".signup-phone-row");
      if (row) rowObserver.observe(row);
      const mobile = fields.querySelector(".signup-mobile-input");
      if (mobile) rowObserver.observe(mobile);
    }
  };

  const scheduleUpdate = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  };

  captureSignupPhoneZoomBaseline();
  update();
  requestAnimationFrame(captureSignupPhoneZoomBaseline);
  const t0 = window.setTimeout(captureSignupPhoneZoomBaseline, 0);
  const t1 = window.setTimeout(update, 120);
  const t2 = window.setTimeout(update, 400);

  const onOrientationChange = () => {
    captureSignupPhoneZoomBaseline();
    scheduleUpdate();
  };

  mql.addEventListener("change", scheduleUpdate);
  window.visualViewport?.addEventListener("resize", scheduleUpdate);
  window.visualViewport?.addEventListener("scroll", scheduleUpdate);
  window.addEventListener("resize", scheduleUpdate);
  window.addEventListener("orientationchange", onOrientationChange);
  document.addEventListener("touchend", scheduleUpdate, { passive: true });
  document.addEventListener("touchcancel", scheduleUpdate, { passive: true });
  document.addEventListener("touchmove", scheduleUpdate, { passive: true });

  return () => {
    window.clearTimeout(t0);
    window.clearTimeout(t1);
    window.clearTimeout(t2);
    cancelAnimationFrame(rafId);
    mql.removeEventListener("change", scheduleUpdate);
    window.visualViewport?.removeEventListener("resize", scheduleUpdate);
    window.visualViewport?.removeEventListener("scroll", scheduleUpdate);
    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("orientationchange", onOrientationChange);
    document.removeEventListener("touchend", scheduleUpdate);
    document.removeEventListener("touchcancel", scheduleUpdate);
    document.removeEventListener("touchmove", scheduleUpdate);
    rowObserver?.disconnect();
    rowObserver = null;
    signupPhoneBaselineInner = 0;
    signupPhoneBaselineVisual = 0;
    applySignupPhoneStackedClass(false);
  };
}
