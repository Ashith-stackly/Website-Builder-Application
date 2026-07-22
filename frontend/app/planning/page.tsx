"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaCheckCircle } from "react-icons/fa";
import Footer from "@/components/Footer";
import { activateFrontendSubscription } from "@/lib/demoAuth";
import { downloadPlanningInvoiceForEntry } from "@/lib/planningInvoiceHtml";
import type { PlanningInvoiceContactDefaults } from "@/lib/planningInvoiceHtml";
import {
  buildPlanningQuery,
  clearPlanningInvoiceData,
  planningPathFromQuery,
  readPlanningLocationSearch,
  resolvePlanningStateFromSearch,
  savePlanningInvoiceData,
  type PlanningView,
} from "@/lib/planningNavigation";
import {
  createRazorpayOrder,
  formatInrFromDisplayPrice,
  getRazorpaySetupHint,
  isRazorpayDemoMode,
  loadRazorpayCheckoutScript,
  openRazorpayCheckout,
  parseDisplayPriceToPaise,
  verifyRazorpayPayment,
  type RazorpayVerifyResponse,
} from "@/lib/razorpayClient";

type UserProfile = {
  _id?: string;
  name: string;
  email: string;
  mobile: string;
};

const BACKEND_BASE =
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:3001"
    : "";

async function fetchUserProfile(): Promise<UserProfile | null> {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem("stackly-auth-token");
  if (!token) return null;
  try {
    const res = await fetch(`${BACKEND_BASE}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: UserProfile };
    return data.user ?? null;
  } catch {
    return null;
  }
}

function getUserInvoiceContact(profile: UserProfile | null): PlanningInvoiceContactDefaults {
  return {
    displayName: profile?.name || "User",
    email: profile?.email || "",
    phone: profile?.mobile || "",
    address: "",
  };
}

const plans = [
  {
    name: "Basic",
    oldPrice: "₹80",
    newPrice: "₹40",
    saveText: "Save 50%",
    yearlyOldPrice: "₹960",
    yearlyNewPrice: "₹403",
    yearlySaveText: "Save 58%",
    features: [
      "Free domain for 1 year",
      "20 GB storage space",
      "Multi-cloud hosting",
      "Light marketing suite",
      "2 site collaborators",
    ],
  },
  {
    name: "Business Plan",
    oldPrice: "₹300",
    newPrice: "₹150",
    saveText: "Save 50%",
    yearlyOldPrice: "₹3,600",
    yearlyNewPrice: "₹1,512",
    yearlySaveText: "Save 58%",
    isRecommended: true,
    features: [
      "Free domain for 1 year",
      "100 GB storage space",
      "Multi-cloud hosting",
      "Standard marketing suite",
      "Accept payments",
      "Basic eCommerce",
      "Scheduling and services",
      "5 site collaborators",
    ],
  },
  {
    name: "Advanced",
    oldPrice: "₹400",
    newPrice: "₹280",
    saveText: "Save 30%",
    yearlyOldPrice: "₹4,800",
    yearlyNewPrice: "₹3,360",
    yearlySaveText: "Save 30%",
    features: [
      "Free domain for 1 year",
      "300 GB storage space",
      "Multi-cloud hosting",
      "Legacy marketing suite",
      "Accept payments",
      "Basic eCommerce",
      "Scheduling and services",
      "10 site collaborators",
    ],
  },
];

const PLAN_NAMES = plans.map((plan) => plan.name);

type Plan = (typeof plans)[number];

type BillingHistoryEntry = {
  date: string;
  invoiceId: string;
  amount: string;
  status: "Paid" | "Free";
  planName?: string;
  planTier?: string;
  websiteLabel?: string;
  paymentMethodLabel?: string;
  paymentDetail?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  buyerAddress?: string;
  generatedAt?: string;
};

type InvoiceData = {
  invoiceId: string;
  date: string;
  planName: string;
  amount: string;
  name: string;
  email: string;
  contactNo: string;
  address: string;
};

function historyYearFromDate(date: string) {
  const m = date.match(/(\d{4})$/);
  return m ? Number(m[1]) : NaN;
}

function historyMonthIndexFromDate(date: string) {
  const parsed = new Date(`${date} 00:00:00`);
  return Number.isNaN(parsed.getTime()) ? -1 : parsed.getMonth();
}

const INITIAL_BILLING_HISTORY: BillingHistoryEntry[] = [];

const PLANNING_BILLING_HISTORY_KEY = "stacklyPlanningBillingHistory";

function isBillingHistoryEntry(x: unknown): x is BillingHistoryEntry {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.date === "string" &&
    typeof o.invoiceId === "string" &&
    typeof o.amount === "string" &&
    (o.status === "Paid" || o.status === "Free")
  );
}

function loadBillingHistoryFromStorage(): BillingHistoryEntry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLANNING_BILLING_HISTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const rows = parsed.filter(isBillingHistoryEntry);
    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}

function saveBillingHistoryToStorage(entries: BillingHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PLANNING_BILLING_HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota / private mode */
  }
}

export default function PlanningPage() {
  return (
    <Suspense fallback={null}>
      <PlanningPageContent />
    </Suspense>
  );
}

function PlanningPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [viewResolved, setViewResolved] = useState(false);
  const [billingYearly, setBillingYearly] = useState(false);
  const [planningView, setPlanningView] = useState<PlanningView>("plans");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [isFreeCheckout, setIsFreeCheckout] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryEntry[]>(INITIAL_BILLING_HISTORY);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const invoiceContact = getUserInvoiceContact(userProfile);

  /** Stackly-branded HTML invoice using ₹ (INR) currency symbol. */
  const downloadBillingInvoiceSummary = useCallback(async (entry: BillingHistoryEntry) => {
    if (typeof window === "undefined") return;
    await downloadPlanningInvoiceForEntry(entry, invoiceContact, entry.invoiceId);
  }, [invoiceContact]);
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>("all");
  const currentYear = new Date().getFullYear();
  const historyMonths = [
    { value: "0", label: "January" },
    { value: "1", label: "February" },
    { value: "2", label: "March" },
    { value: "3", label: "April" },
    { value: "4", label: "May" },
    { value: "5", label: "June" },
    { value: "6", label: "July" },
    { value: "7", label: "August" },
    { value: "8", label: "September" },
    { value: "9", label: "October" },
    { value: "10", label: "November" },
    { value: "11", label: "December" },
  ] as const;
  const filteredBillingHistory =
    historyMonthFilter === "all"
      ? billingHistory
      : billingHistory.filter((entry) => {
        if (historyYearFromDate(entry.date) !== currentYear) return false;
        return historyMonthIndexFromDate(entry.date) === Number(historyMonthFilter);
      });

  const syncPlanningUrl = useCallback(
    (params: {
      view: PlanningView;
      plan?: Plan | null;
      billingYearly?: boolean;
      isFreeCheckout?: boolean;
    }) => {
      const query = buildPlanningQuery({
        view: params.view,
        planName: params.plan?.name,
        billingYearly: params.billingYearly,
        isFreeCheckout: params.isFreeCheckout,
      });
      router.replace(planningPathFromQuery(query), { scroll: false });
    },
    [router],
  );

  const applyResolvedPlanningState = useCallback((resolved: ReturnType<typeof resolvePlanningStateFromSearch>) => {
    setBillingYearly(resolved.billingYearly);
    setIsFreeCheckout(resolved.isFreeCheckout);
    setPaymentLoading(false);
    setPaymentError(null);
    setPlanningView(resolved.view);

    if (resolved.view === "payment" && resolved.planName) {
      const plan = plans.find((entry) => entry.name === resolved.planName) ?? null;
      setSelectedPlan(plan);
      setInvoiceData(null);
      return;
    }

    if (resolved.view === "invoice") {
      setInvoiceData(resolved.invoiceData);
      setSelectedPlan(null);
      return;
    }

    setSelectedPlan(null);
    setInvoiceData(null);
  }, []);

  useLayoutEffect(() => {
    const search =
      searchParams.toString() || readPlanningLocationSearch();
    const resolved = resolvePlanningStateFromSearch(search, PLAN_NAMES);
    applyResolvedPlanningState(resolved);
    setViewResolved(true);
  }, [applyResolvedPlanningState, searchParams]);

  useEffect(() => {
    const stored = loadBillingHistoryFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setBillingHistory(stored);
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("stackly-auth-token") : null;
    if (!token) {
      router.push(`/login?redirect=${encodeURIComponent("/planning")}`);
      return;
    }
    void fetchUserProfile().then((profile) => {
      if (profile) setUserProfile(profile);
    });
  }, [router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollToTop();
    const frame = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(frame);
  }, [planningView]);

  function getActivePrice(plan: Plan) {
    return {
      oldPrice: billingYearly ? plan.yearlyOldPrice : plan.oldPrice,
      newPrice: billingYearly ? plan.yearlyNewPrice : plan.newPrice,
      saveText: billingYearly ? plan.yearlySaveText : plan.saveText,
      period: billingYearly ? "Per year" : "Per month",
    };
  }

  function handlePurchasePlan(plan: Plan, freeCheckout = false) {
    setViewResolved(true);
    setSelectedPlan(plan);
    setPlanningView("payment");
    setPaymentLoading(false);
    setIsFreeCheckout(freeCheckout);
    setPaymentError(null);
    syncPlanningUrl({
      view: "payment",
      plan,
      billingYearly,
      isFreeCheckout: freeCheckout,
    });
  }

  function handleBackToPlans() {
    setPlanningView("plans");
    setSelectedPlan(null);
    setPaymentLoading(false);
    setPaymentError(null);
    setIsFreeCheckout(false);
    setInvoiceData(null);
    clearPlanningInvoiceData();
    syncPlanningUrl({ view: "plans" });
  }

  function finalizeCheckout(opts: {
    isFree: boolean;
    paymentMethodLabel: string;
    paymentDetail: string;
    verifyResponse?: RazorpayVerifyResponse;
    paymentId?: string;
  }) {
    if (!selectedPlan) return;
    const now = new Date();
    const invoiceId = opts.paymentId
      ? `INV-${opts.paymentId.replace(/^pay_/, "").substring(0, 10).toUpperCase()}`
      : `INV-${Math.floor(100000 + Math.random() * 899999)}`;
    const active = getActivePrice(selectedPlan);
    const finalAmount = opts.isFree ? "₹0" : active.newPrice;

    // Use backend-returned user data if available, otherwise fall back to fetched profile
    const verifiedUser = opts.verifyResponse?.user;
    const userName = verifiedUser?.name || userProfile?.name || "User";
    const userEmail = verifiedUser?.email || userProfile?.email || "";
    const userPhone = verifiedUser?.mobile || userProfile?.mobile || "";

    const createdInvoice: InvoiceData = {
      invoiceId,
      date: now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      planName: `${selectedPlan.name} ${opts.isFree ? "(Free)" : billingYearly ? "(Yearly)" : "(Monthly)"}`,
      amount: finalAmount,
      name: userName,
      email: userEmail,
      contactNo: userPhone,
      address: "",
    };
    setInvoiceData(createdInvoice);
    savePlanningInvoiceData(createdInvoice);
    setBillingHistory((prev) => {
      const row: BillingHistoryEntry = {
        date: createdInvoice.date,
        invoiceId: createdInvoice.invoiceId,
        amount: createdInvoice.amount,
        status: opts.isFree ? "Free" : "Paid",
        planName: createdInvoice.planName,
        planTier: selectedPlan.name,
        websiteLabel: "Stackly workspace subscription",
        paymentMethodLabel: opts.paymentMethodLabel,
        paymentDetail: opts.paymentDetail,
        buyerName: createdInvoice.name,
        buyerEmail: createdInvoice.email,
        buyerPhone: createdInvoice.contactNo,
        buyerAddress: createdInvoice.address,
        generatedAt: now.toISOString(),
      };
      const next = [row, ...prev.filter((e) => e.invoiceId !== row.invoiceId)];
      saveBillingHistoryToStorage(next);
      return next;
    });
    setPaymentLoading(false);
    setIsFreeCheckout(false);
    activateFrontendSubscription();
    setPlanningView("invoice");
    syncPlanningUrl({ view: "invoice" });
  }

  async function handlePayWithRazorpay() {
    if (!selectedPlan) return;

    const customerName = userProfile?.name || "User";
    const customerEmail = userProfile?.email || "";
    const customerPhone = userProfile?.mobile || "";

    if (isFreeCheckout) {
      setPaymentError(null);
      setPaymentLoading(true);
      finalizeCheckout({
        isFree: true,
        paymentMethodLabel: "Complimentary",
        paymentDetail: "No charge — complimentary activation.",
      });
      return;
    }

    if (isRazorpayDemoMode()) {
      setPaymentError(null);
      setPaymentLoading(true);
      await new Promise((r) => window.setTimeout(r, 900));
      finalizeCheckout({
        isFree: false,
        paymentMethodLabel: "Razorpay (demo)",
        paymentDetail: "Demo payment — add real Razorpay Test keys in .env.local for live checkout.",
      });
      return;
    }

    setPaymentError(null);
    setPaymentLoading(true);

    try {
      await loadRazorpayCheckoutScript();
      const active = getActivePrice(selectedPlan);
      const amountPaise = parseDisplayPriceToPaise(active.newPrice);
      if (amountPaise < 100) {
        setPaymentError("Invalid plan amount for payment.");
        setPaymentLoading(false);
        return;
      }

      const billingPeriod = billingYearly ? "Yearly" : "Monthly";

      const order = await createRazorpayOrder({
        amountPaise,
        planName: selectedPlan.name,
        billingPeriod,
      });

      setPaymentLoading(false);

      openRazorpayCheckout({
        order,
        planLabel: `${selectedPlan.name} (${billingPeriod})`,
        customerName,
        customerEmail,
        customerPhone,
        onDismiss: () => setPaymentLoading(false),
        onSuccess: async (response) => {
          setPaymentLoading(true);
          try {
            const verifyResult = await verifyRazorpayPayment({
              ...response,
              amount: amountPaise,
              planName: selectedPlan.name,
              billingPeriod,
            });
            if (!verifyResult.verified) throw new Error("Payment verification failed");

            // Update user profile from verify response if backend returned it
            if (verifyResult.user) {
              setUserProfile({
                _id: verifyResult.user._id,
                name: verifyResult.user.name || customerName,
                email: verifyResult.user.email || customerEmail,
                mobile: verifyResult.user.mobile || customerPhone,
              });
            }

            finalizeCheckout({
              isFree: false,
              paymentMethodLabel: "Razorpay",
              paymentDetail: `Payment ${response.razorpay_payment_id} · Order ${response.razorpay_order_id}`,
              verifyResponse: verifyResult,
              paymentId: response.razorpay_payment_id,
            });
          } catch (e) {
            setPaymentError(e instanceof Error ? e.message : "Payment failed");
            setPaymentLoading(false);
          }
        },
      });
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "Could not start payment");
      setPaymentLoading(false);
    }
  }

  return (
    <main className="planning-page flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-slate-100">
      {!viewResolved ? (
        <div className="w-full flex-1">
          <div className="w-full border border-slate-200 bg-white shadow-sm">
            <section className="px-3 py-5 sm:px-8 sm:py-8">
              <div className="planning-sale-strip mb-4 w-full rounded-md bg-gradient-to-r from-slate-950 via-blue-900 to-blue-600 px-4 py-2 text-center text-[11px] font-semibold text-white shadow-lg shadow-blue-950/10 sm:text-xs">
                Upgrade Now: Get - 50% Off on Selected Plans
              </div>
              <div
                className="mx-auto w-full rounded-xl bg-gradient-to-b from-[#2b66be] to-[#0a2a5f] shadow-2xl shadow-blue-950/25"
                style={{ maxWidth: 780, minHeight: 420 }}
                aria-hidden
              />
            </section>
          </div>
        </div>
      ) : (
      <div className="w-full flex-1">
        <div className="w-full border border-slate-200 bg-white shadow-sm">
          <section
            id="planning-billing-content"
            className="scroll-mt-4 px-3 py-5 sm:px-8 sm:py-8"
          >
            <div className="planning-sale-strip mb-4 w-full rounded-md bg-gradient-to-r from-slate-950 via-blue-900 to-blue-600 px-4 py-2 text-center text-[11px] font-semibold text-white shadow-lg shadow-blue-950/10 sm:text-xs">
              Upgrade Now: Get - 50% Off on Selected Plans
            </div>

            {planningView === "plans" && (
              <div className="planning-hero-panel rounded-lg bg-gradient-to-br from-slate-50 via-blue-50 to-white px-5 py-8 shadow-sm ring-1 ring-slate-200/80 sm:px-8 sm:py-10 md:px-10">
                <div className="mx-auto w-full max-w-5xl">
                  <h1 className="planning-fade-up text-center text-3xl font-bold text-slate-950 sm:text-[44px] sm:leading-tight">
                    Choose the Best Plan for You
                  </h1>
                  <p className="planning-fade-up mx-auto mt-4 max-w-2xl text-center text-[13px] font-medium leading-relaxed text-slate-700 sm:text-sm md:text-base">
                    Create your website for free and upgrade when you’re ready
                  </p>

                  <div className="planning-fade-up mt-5 flex justify-center sm:mt-6">
                    <button
                      type="button"
                      onClick={() => handlePurchasePlan(plans[0], true)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-gradient-to-r from-slate-950 to-blue-700 px-5 py-2.5 text-[11px] font-semibold text-white no-underline shadow-lg shadow-blue-950/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/30 hover:ring-2 hover:ring-white/70 active:translate-y-0 active:scale-100 sm:text-xs"
                    >
                      <span>Start Your Free Plan</span>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <circle
                            cx="10"
                            cy="10"
                            r="8.25"
                            stroke="white"
                            strokeWidth="1.2"
                            fill="none"
                          />
                          <path
                            d="M8 10h4M11.5 7l3 3-3 3"
                            stroke="white"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                      </span>
                    </button>
                  </div>

                  <div className="planning-fade-up mt-8 w-full pl-0 sm:pl-5 md:pl-8 lg:pl-10">
                    <div className="grid w-full min-w-0 grid-cols-1 gap-y-3 md:grid-cols-4 md:items-center md:gap-x-4 lg:gap-x-6">
                      <p className="min-w-0 text-center text-sm font-bold leading-snug text-slate-950 md:text-left">
                        What you get with every plan:
                      </p>
                      <span className="min-w-0 rounded-full bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-300 sm:text-center">
                        Custom Domain
                      </span>
                      <span className="min-w-0 rounded-full bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-300 sm:text-center">
                        Reliable web hosting
                      </span>
                      <span className="min-w-0 rounded-full bg-white px-3 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-300 sm:text-center">
                        24/7 customer care
                      </span>
                    </div>
                  </div>

                  <div className="planning-fade-up mt-8 flex w-full justify-center px-3 sm:px-4">
                    <div className="planning-billing-toggle-wrap flex w-full max-w-xl items-center gap-3 sm:gap-5">
                      <span
                        className={`planning-billing-label inline-flex min-h-9 min-w-0 flex-1 select-none items-center justify-end gap-1 py-1.5 pl-2 pr-1 text-right text-sm leading-tight sm:pr-2 ${!billingYearly ? "font-bold text-slate-950" : "font-medium text-slate-500"
                          }`}
                      >
                        <span className="planning-billing-label-line">Bill</span>
                        <span className="planning-billing-label-line">Monthly</span>
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={billingYearly}
                        aria-label="Toggle monthly or yearly billing"
                        onClick={() => setBillingYearly((v) => !v)}
                        className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center self-center rounded-full border border-slate-300 bg-white px-0.5 align-middle shadow-inner transition-colors duration-300 hover:border-blue-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700/40 focus-visible:ring-offset-2"
                      >
                        <span
                          className={`pointer-events-none absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-blue-700 shadow-sm transition-transform duration-300 ${billingYearly ? "translate-x-6" : "translate-x-0"
                            }`}
                        />
                      </button>
                      <span
                        className={`planning-billing-label inline-flex min-h-9 min-w-0 flex-1 select-none items-center justify-start gap-1 py-1.5 pl-1 pr-2 text-left text-sm leading-tight sm:pl-2 ${billingYearly ? "font-bold text-slate-950" : "font-medium text-slate-500"
                          }`}
                      >
                        <span className="planning-billing-label-line">Bill</span>
                        <span className="planning-billing-label-line">Yearly</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="planning-plans-grid mx-auto mt-8 grid w-full max-w-5xl grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch md:gap-6">
                  {plans.map((plan) => (
                    <article
                      key={plan.name}
                      className={`planning-plan-card group relative flex h-full min-h-0 flex-col rounded-lg border border-slate-200 bg-white p-4 text-slate-900 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/20 hover:bg-gradient-to-b hover:from-slate-950 hover:to-blue-700 hover:text-white hover:shadow-xl hover:shadow-blue-950/20 sm:p-4 ${plan.isRecommended ? "planning-recommended-card" : ""
                        }`}
                    >
                      {plan.isRecommended && (
                        <div className="planning-recommended-badge absolute right-0 top-0 z-10 rounded-bl-md rounded-tr-lg border border-white/10 bg-blue-600 px-3 py-1.5 text-[9px] font-extrabold leading-none tracking-wide text-white shadow-sm transition-colors group-hover:border-slate-900/40 group-hover:bg-white group-hover:text-slate-950 hover:border-slate-900/40 hover:bg-white hover:text-slate-950">
                          RECOMMENDED
                        </div>
                      )}
                      <div className={`mb-1.5 flex items-center justify-between gap-2 ${plan.isRecommended ? "planning-recommended-content-offset" : ""}`}>
                        <div>
                          <h2 className="text-base font-bold leading-tight transition-colors group-hover:text-white">{plan.name}</h2>
                          <p className="mt-0.5 text-xs leading-tight text-blue-900 transition-colors group-hover:text-white/85">
                            {billingYearly ? "Per year" : "Per month"}
                          </p>
                        </div>
                      </div>

                      <div className="planning-price-row mb-1.5 flex items-start justify-between gap-2 lg:items-end">
                        <div className="planning-price-oldsave flex min-w-0 flex-wrap items-end gap-x-1.5 gap-y-0.5 pr-1">
                          <div className="text-sm font-bold text-slate-900 line-through transition-colors group-hover:text-white">
                            {billingYearly ? plan.yearlyOldPrice : plan.oldPrice}
                          </div>
                          <div className="text-[10px] font-semibold leading-tight text-slate-500 transition-colors group-hover:text-white/85">
                            {billingYearly ? plan.yearlySaveText : plan.saveText}
                          </div>
                        </div>
                        <div className="planning-price-chip relative top-0 mr-1 shrink-0 rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-base font-bold leading-none text-blue-950 transition-colors lg:-top-2 lg:mr-3 lg:px-3.5 lg:py-1.5 lg:text-xl group-hover:border-white/30 group-hover:bg-white group-hover:text-blue-700">
                          {billingYearly ? plan.yearlyNewPrice : plan.newPrice}
                        </div>
                      </div>
                      <div className="mb-2 h-px w-full bg-slate-200 transition-colors group-hover:bg-white/30" />

                      <ul className="space-y-1 text-xs leading-snug text-slate-700 transition-colors group-hover:text-white sm:text-sm sm:leading-snug">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-1.5">
                            <FaCheckCircle className="mt-px shrink-0 text-[10px] text-blue-700 transition-colors group-hover:text-white" aria-hidden={true} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-2 min-h-0 w-full flex-1 shrink-0" aria-hidden />

                      <button
                        type="button"
                        onClick={() => handlePurchasePlan(plan)}
                        className="block w-full shrink-0 cursor-pointer rounded-full bg-gradient-to-r from-slate-950 to-blue-700 py-2 text-center text-sm font-semibold text-white shadow-sm transition-all duration-300 group-hover:bg-none group-hover:bg-white group-hover:text-blue-700 group-hover:opacity-100 hover:bg-none hover:bg-white hover:text-blue-700 hover:shadow-md active:scale-[0.98]"
                      >
                        Purchase Plan
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {planningView === "payment" && selectedPlan && (
              <div
                className="planning-payment-view planning-view-panel mx-auto w-full overflow-hidden rounded-xl border border-white/20 text-white shadow-2xl shadow-blue-950/25"
                style={{
                  maxWidth: 780,
                  background: "linear-gradient(180deg, #2b66be 0%, #0a2a5f 100%)",
                }}
              >
                <div className="border-b border-white/20 bg-white/5 px-4 pb-6 pt-4 backdrop-blur sm:px-6 sm:pb-8 sm:pt-6">
                  <div className="mb-4 text-left">
                    <button
                      type="button"
                      onClick={handleBackToPlans}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-sm"
                      aria-label="Back to plans"
                    >
                      ← Back to plans
                    </button>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold sm:text-3xl">
                      {isFreeCheckout ? "Activate free plan" : "Pay with Razorpay"}
                    </h2>
                    <p className="mt-2 text-xs text-white/85 sm:text-sm">
                      {isFreeCheckout
                        ? "No payment required — your free plan will be activated immediately."
                        : "Card, UPI, netbanking, and wallets are supported via Razorpay Checkout."}
                    </p>
                  </div>
                </div>
                <div className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8" style={{ maxWidth: 500 }}>

                  <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-xs shadow-lg shadow-blue-950/10 backdrop-blur sm:p-5 sm:text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Order summary</p>
                    <p className="mt-2 text-lg font-bold text-white">{selectedPlan.name}</p>
                    <p className="text-white/85">
                      {billingYearly ? "Yearly billing" : "Monthly billing"}
                    </p>
                    {isFreeCheckout ? (
                      <p className="mt-3 text-2xl font-bold text-white">Free</p>
                    ) : (
                      <>
                        <p className="mt-3 text-2xl font-bold text-white">
                          {formatInrFromDisplayPrice(getActivePrice(selectedPlan).newPrice)}
                        </p>
                        <p className="mt-1 text-[11px] text-white/65">
                          Plan price {getActivePrice(selectedPlan).newPrice} · paid in INR via Razorpay
                        </p>
                      </>
                    )}
                    {!isFreeCheckout ? (
                      <p className="mt-2 text-[11px] leading-snug text-white/75">
                        Secure Razorpay popup — UPI, cards, netbanking, and wallets.
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="border-t border-white/20 bg-white/5 px-4 py-5 text-center sm:px-6 sm:py-6">
                  {paymentError ? (
                    <p className="mb-3 text-center text-xs font-medium text-red-200 sm:text-sm" role="alert">
                      {paymentError}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handlePayWithRazorpay()}
                    disabled={paymentLoading}
                    className="inline-flex min-h-10 w-full max-w-full cursor-pointer items-center justify-center rounded-lg bg-white px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg shadow-blue-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[180px] sm:px-6 sm:text-sm"
                  >
                    {paymentLoading
                      ? "Processing..."
                      : isFreeCheckout
                        ? "Activate free plan"
                        : isRazorpayDemoMode()
                          ? "Complete demo payment"
                          : "Pay with Razorpay"}
                  </button>
                </div>
              </div>
            )}

            {planningView === "invoice" && invoiceData && (
              <div
                className="planning-invoice-view planning-view-panel mx-auto w-full min-w-0 overflow-hidden rounded-xl border border-white/20 text-white shadow-2xl shadow-blue-950/25"
                style={{
                  maxWidth: 900,
                  background: "linear-gradient(180deg, #2a66be 0%, #0b2a5c 100%)",
                }}
              >
                <div className="border-b border-white/15 bg-white/5 px-4 py-5 backdrop-blur sm:px-8 sm:py-6">
                  <div className="mb-4 text-left">
                    <button
                      type="button"
                      onClick={handleBackToPlans}
                      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-sm"
                      aria-label="Back to plans"
                    >
                      ← Back to plans
                    </button>
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold leading-tight sm:text-[36px]">Invoice Details</h2>
                  </div>
                </div>
                <div className="min-w-0 space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-7">
                  <div className="mx-auto w-full min-w-0 max-w-2xl space-y-3 text-xs sm:space-y-4 sm:text-[15px]">
                    <div className="planning-invoice-row rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm" style={{ display: "grid", gridTemplateColumns: "96px 14px minmax(0,1fr)", alignItems: "center" }}><span>Invoice ID</span><span>:</span><span className="planning-invoice-value break-words">{invoiceData.invoiceId}</span></div>
                    <div className="planning-invoice-row rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm" style={{ display: "grid", gridTemplateColumns: "96px 14px minmax(0,1fr)", alignItems: "center" }}><span>Date</span><span>:</span><span className="planning-invoice-value break-words">{invoiceData.date}</span></div>
                    <div className="planning-invoice-row rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm" style={{ display: "grid", gridTemplateColumns: "96px 14px minmax(0,1fr)", alignItems: "center" }}><span>Plan</span><span>:</span><span className="planning-invoice-value break-words">{invoiceData.planName}</span></div>
                    <div className="planning-invoice-row rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm" style={{ display: "grid", gridTemplateColumns: "96px 14px minmax(0,1fr)", alignItems: "center" }}><span>Amount</span><span>:</span><span className="planning-invoice-value break-words">{invoiceData.amount}</span></div>
                  </div>
                  <div className="min-w-0 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                    <h3 className="mx-auto mb-4 w-full min-w-0 max-w-2xl text-xl font-semibold sm:mb-5 sm:text-[30px]">Billing Information</h3>
                    <div className="mx-auto w-full min-w-0 max-w-2xl space-y-3 text-xs sm:space-y-4 sm:text-[15px]">
                      <div className="planning-invoice-row rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm" style={{ display: "grid", gridTemplateColumns: "96px 14px minmax(0,1fr)", alignItems: "center" }}><span>Name</span><span>:</span><span className="planning-invoice-value break-words">{invoiceData.name}</span></div>
                      <div className="planning-invoice-row rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm" style={{ display: "grid", gridTemplateColumns: "96px 14px minmax(0,1fr)", alignItems: "center" }}><span>Email</span><span>:</span><span className="planning-invoice-value break-words">{invoiceData.email}</span></div>
                      <div className="planning-invoice-row rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm" style={{ display: "grid", gridTemplateColumns: "96px 14px minmax(0,1fr)", alignItems: "center" }}><span>Contact No</span><span>:</span><span className="planning-invoice-value break-words">{invoiceData.contactNo}</span></div>
                      <div className="planning-invoice-row rounded-lg border border-white/10 bg-white/10 px-3 py-2.5 shadow-sm" style={{ display: "grid", gridTemplateColumns: "96px 14px minmax(0,1fr)", alignItems: "center" }}><span>Address</span><span>:</span><span className="planning-invoice-value break-words">{invoiceData.address}</span></div>
                    </div>
                  </div>
                </div>
                <div
                  className="planning-invoice-download min-w-0 px-4 py-5 text-center sm:px-8 sm:py-6"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.15)" }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPlanningView("history");
                      syncPlanningUrl({ view: "history" });
                    }}
                    className="inline-flex w-full max-w-full min-w-0 flex-wrap items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold leading-snug text-slate-900 shadow-lg shadow-blue-950/15 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:inline-flex sm:w-auto sm:max-w-none sm:px-6 sm:text-[15px]"
                  >
                    <span aria-hidden>↓</span>
                    Download Invoice
                  </button>
                </div>
              </div>
            )}

            {planningView === "history" && (
              <div
                className="planning-history-view planning-view-panel mx-auto my-4 w-full rounded-xl border border-white/25 p-3 text-white shadow-2xl shadow-blue-950/25 sm:my-6 sm:p-4"
                style={{
                  maxWidth: 640,
                  background: "linear-gradient(180deg, #2f6dca 0%, #0a2a5f 100%)",
                }}
              >
                <div className="mx-auto mb-3 w-full max-w-[560px] text-left">
                  <button
                    type="button"
                    onClick={handleBackToPlans}
                    className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-sm"
                    aria-label="Back to plans"
                  >
                    ← Back to plans
                  </button>
                </div>
                <div className="planning-history-track mx-auto mb-3 flex w-full max-w-[560px] flex-col gap-3 pb-3 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.17)" }}>
                  <h2 className="shrink-0 text-xl font-bold leading-tight tracking-[0.2px] sm:text-[34px]">Billing History</h2>
                  <div
                    className="planning-history-filter flex min-h-0 w-full min-w-0 flex-col items-stretch overflow-visible rounded-md bg-white sm:w-auto sm:max-w-none sm:flex-row sm:flex-nowrap sm:shrink-0"
                    style={{ color: "#1f2937", fontSize: 10, lineHeight: 1.2, boxShadow: "0 0 0 1px rgba(15,23,42,0.08)" }}
                  >
                    <button
                      type="button"
                      onClick={() => setHistoryMonthFilter("all")}
                      className="min-w-0 w-full whitespace-nowrap border-b border-[#e2e8f0] sm:w-auto sm:flex-none sm:border-b-0 sm:border-r sm:border-[#e2e8f0]"
                      style={{
                        padding: "7px 10px",
                        color: "#1f2937",
                        background: historyMonthFilter === "all" ? "#eef2ff" : "transparent",
                        fontWeight: historyMonthFilter === "all" ? 700 : 500,
                      }}
                    >
                      All Invoices
                    </button>
                    <select
                      id="historyYearSelect"
                      value={historyMonthFilter}
                      onChange={(e) => setHistoryMonthFilter(e.target.value)}
                      className="planning-history-year-select box-border w-full min-w-0 max-w-none shrink-0 bg-transparent py-[7px] pl-[10px] pr-9 text-[12px] leading-snug text-[#1f2937] sm:min-w-[10rem] sm:max-w-[12rem] sm:flex-1 sm:pr-9 sm:text-[10px]"
                      style={{ border: 0, outline: "none", fontWeight: historyMonthFilter === "all" ? 500 : 700 }}
                    >
                      <option value="all">This Year (All Months)</option>
                      {historyMonths.map((month) => (
                        <option key={month.value} value={month.value}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="planning-history-table-wrap mx-auto w-full max-w-[560px] overflow-x-auto rounded-xl bg-white shadow-xl shadow-blue-950/15" style={{ WebkitOverflowScrolling: "touch" as const }}>
                  <table className="planning-history-table w-full min-w-[470px] text-left" style={{ fontSize: 10.5, color: "#0f172a" }}>
                    <thead className="bg-[#f3f4f6] text-[11px] font-semibold text-[#1f2937]" style={{ borderBottom: "2px solid #d1d5db" }}>
                      <tr>
                        <th className="px-3 py-3.5">Date</th>
                        <th className="px-3 py-3.5">Invoice ID</th>
                        <th className="px-3 py-3.5">Amount</th>
                        <th className="px-3 py-3.5">Status</th>
                        <th className="px-3 py-3.5">Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBillingHistory.map((entry, index) => (
                        <tr key={`${entry.invoiceId}-${entry.date}-${index}`} className="transition-colors hover:bg-blue-50" style={{ borderTop: "1px solid #e2e8f0" }}>
                          <td className="px-3 py-3.5">{entry.date}</td>
                          <td className="px-3 py-3.5">{entry.invoiceId}</td>
                          <td className="px-3 py-3.5">{entry.amount}</td>
                          <td className="px-3 py-3.5">
                            <span
                              className="inline-flex min-w-[56px] justify-center rounded-md px-2 py-1 text-[10px] font-bold text-white"
                              style={{ backgroundColor: entry.status === "Paid" ? "#4f8f43" : "#667085" }}
                            >
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-3 py-3.5">
                            <button
                              type="button"
                              className="inline-flex h-6 w-7 cursor-pointer items-center justify-center rounded-md border-0 text-xs font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e7fd8] focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                              style={{ backgroundColor: "#1e7fd8" }}
                              aria-label={`Download invoice summary ${entry.invoiceId}`}
                              onClick={() => void downloadBillingInvoiceSummary(entry)}
                            >
                              <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M10 4v8m0 0l-3-3m3 3l3-3M5 14h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      )}
      <Footer />
    </main>
  );
}



