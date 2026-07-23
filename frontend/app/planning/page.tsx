"use client";

import { Suspense, useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Check,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Download,
  CreditCard,
  Zap,
  ArrowRight,
  Lock,
  Star,
  FileText,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  RefreshCcw,
} from "lucide-react";
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
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

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
  paymentMethodLabel?: string;
  paymentId?: string;
  orderId?: string;
  paymentDate?: string;
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

// Framer Motion Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const viewTransitionVariants: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -15, scale: 0.98, transition: { duration: 0.25 } },
};

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
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    };
    scrollToTop();
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
    const details = opts.verifyResponse?.paymentDetails;
    const verifiedUser = opts.verifyResponse?.user;

    const invoiceId = details?.invoiceId || (opts.paymentId
      ? `INV-${opts.paymentId.replace(/^pay_/, "").substring(0, 10).toUpperCase()}`
      : `INV-${Math.floor(100000 + Math.random() * 899999)}`);

    const active = getActivePrice(selectedPlan);
    const finalAmount = opts.isFree ? "₹0" : active.newPrice;

    const userName = details?.customerName || verifiedUser?.name || userProfile?.name || "User";
    const userEmail = details?.customerEmail || verifiedUser?.email || userProfile?.email || "";
    const userPhone = details?.customerPhone || verifiedUser?.mobile || userProfile?.mobile || "";
    const userAddress = details?.customerAddress || verifiedUser?.address || "";

    const methodLabel = details?.paymentMethodLabel || opts.paymentMethodLabel || "Card – Visa / MasterCard";
    const paymentIdStr = details?.paymentId || opts.paymentId || "";
    const orderIdStr = details?.orderId || "";
    const paymentDateStr = details?.paymentDate
      ? new Date(details.paymentDate).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : now.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

    const createdInvoice: InvoiceData = {
      invoiceId,
      date: now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      planName: `${selectedPlan.name} ${opts.isFree ? "(Free)" : billingYearly ? "(Yearly)" : "(Monthly)"}`,
      amount: finalAmount,
      name: userName,
      email: userEmail,
      contactNo: userPhone,
      address: userAddress,
      paymentMethodLabel: methodLabel,
      paymentId: paymentIdStr,
      orderId: orderIdStr,
      paymentDate: paymentDateStr,
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
        paymentMethodLabel: methodLabel,
        paymentDetail: paymentIdStr ? `Payment ${paymentIdStr}${orderIdStr ? ` · Order ${orderIdStr}` : ""}` : opts.paymentDetail,
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
    <main className="relative min-h-screen w-full bg-[#080d1a] text-slate-100 overflow-x-hidden font-sans selection:bg-blue-500 selection:text-white">
      {/* Background Decorative Glow Effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[130px]" />
        <div className="absolute -right-40 top-1/3 h-[600px] w-[600px] rounded-full bg-indigo-600/15 blur-[150px]" />
        <div className="absolute left-1/3 bottom-10 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* SALE PROMO STRIP */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-900/40 via-indigo-900/50 to-purple-900/40 p-0.5 shadow-xl shadow-blue-950/40 backdrop-blur-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#0b1329]/80 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30">
                <Sparkles className="h-4 w-4" />
              </span>
              <p className="text-xs font-semibold text-slate-200 sm:text-sm">
                <span className="font-extrabold text-white">Special Launch Offer:</span> Save up to <span className="text-blue-400 font-extrabold">58% OFF</span> on Annual Subscriptions!
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>30-Day Money-Back Guarantee</span>
            </div>
          </div>
        </motion.div>

        {/* DYNAMIC VIEW ROUTER WITH ANIMATE PRESENCE */}
        <AnimatePresence mode="wait">
          {!viewResolved ? (
            <motion.div
              key="loading-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[450px] w-full items-center justify-center rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-3 border-blue-500 border-t-transparent" />
                <p className="text-sm font-semibold text-slate-400">Loading plan choices...</p>
              </div>
            </motion.div>
          ) : planningView === "plans" ? (
            /* ================= PLANS SELECTION VIEW ================= */
            <motion.div
              key="plans-view"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-10"
            >
              {/* HERO HEADER */}
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-bold text-blue-300 backdrop-blur-md">
                  <Zap className="h-3.5 w-3.5 text-blue-400" />
                  <span>Flexible Pricing for Everyone</span>
                </motion.div>
                <motion.h1 variants={fadeUpVariants} className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Choose the Perfect Plan for Your <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">Growth</span>
                </motion.h1>
                <motion.p variants={fadeUpVariants} className="text-base text-slate-300 sm:text-lg">
                  Start free and upgrade as your website expands. Cancel or switch plans anytime.
                </motion.p>
              </div>

              {/* BILLING TOGGLE */}
              <motion.div variants={fadeUpVariants} className="flex flex-col items-center gap-4 pt-2">
                <div className="relative flex items-center gap-3 rounded-full border border-white/15 bg-slate-900/90 p-1.5 shadow-2xl backdrop-blur-xl">
                  <button
                    type="button"
                    onClick={() => setBillingYearly(false)}
                    className={`relative z-10 rounded-full px-5 py-2 text-xs font-bold transition-colors cursor-pointer sm:text-sm ${!billingYearly ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    {!billingYearly && (
                      <motion.div
                        layoutId="billingToggleHighlight"
                        className="absolute inset-0 z-[-1] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/40"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    Monthly Billing
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingYearly(true)}
                    className={`relative z-10 flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-colors cursor-pointer sm:text-sm ${billingYearly ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
                  >
                    {billingYearly && (
                      <motion.div
                        layoutId="billingToggleHighlight"
                        className="absolute inset-0 z-[-1] rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/40"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span>Annual Billing</span>
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold text-amber-300 border border-amber-400/30">
                      Save 58%
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handlePurchasePlan(plans[0], true)}
                  className="group inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <span>Looking to test first? Activate Free Plan</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>

              {/* FEATURES INCLUDED BAR */}
              <motion.div variants={fadeUpVariants} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <div className="flex flex-wrap items-center justify-around gap-4 text-xs font-semibold text-slate-300 sm:text-sm">
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-400" /> Free Domain Included</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-400" /> Reliable Cloud Hosting</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-400" /> 24/7 Priority Support</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-400" /> SSL Security Certificate</span>
                </div>
              </motion.div>

              {/* CARDS GRID */}
              <motion.div variants={fadeUpVariants} className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-8 items-stretch">
                {plans.map((plan) => {
                  const priceInfo = getActivePrice(plan);
                  return (
                    <motion.div
                      key={plan.name}
                      whileHover={{ y: -8, transition: { duration: 0.25 } }}
                      className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 sm:p-8 ${
                        plan.isRecommended
                          ? "border-2 border-blue-500/80 bg-gradient-to-b from-[#111e3b] via-[#0d162d] to-[#080d1a] shadow-2xl shadow-blue-600/30 ring-1 ring-blue-400/50"
                          : "border border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl hover:border-white/20 hover:shadow-xl"
                      }`}
                    >
                      {plan.isRecommended && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-1 text-xs font-extrabold tracking-wider text-white shadow-lg shadow-blue-500/40 uppercase border border-white/20">
                          ★ Most Popular Choice
                        </div>
                      )}

                      <div className="space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-white sm:text-2xl">{plan.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">{priceInfo.period}</p>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-extrabold text-white sm:text-5xl">{priceInfo.newPrice}</span>
                          <span className="text-sm font-semibold text-slate-400 line-through">{priceInfo.oldPrice}</span>
                          <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                            {priceInfo.saveText}
                          </span>
                        </div>

                        <div className="h-px w-full bg-white/10" />

                        <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-3">
                              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${plan.isRecommended ? "bg-blue-500 text-white" : "bg-white/10 text-blue-400"}`}>
                                <Check className="h-3.5 w-3.5" />
                              </span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-8">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handlePurchasePlan(plan)}
                          className={`w-full rounded-2xl py-3.5 text-sm font-bold shadow-lg transition-all cursor-pointer ${
                            plan.isRecommended
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-600/40 hover:from-blue-600 hover:to-indigo-700"
                              : "bg-white text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          Select {plan.name}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          ) : planningView === "payment" && selectedPlan ? (
            /* ================= PAYMENT CHECKOUT VIEW ================= */
            <motion.div
              key="payment-view"
              variants={viewTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-2xl"
            >
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#101b36] to-[#0a1224] p-6 shadow-2xl backdrop-blur-2xl sm:p-10">
                <button
                  type="button"
                  onClick={handleBackToPlans}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer mb-6"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to plan options</span>
                </button>

                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <CreditCard className="h-6 w-6" />
                    </span>
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                      {isFreeCheckout ? "Activate Free Subscription" : "Complete Payment"}
                    </h2>
                    <p className="text-xs text-slate-300 sm:text-sm">
                      {isFreeCheckout
                        ? "Instant free access — no credit card needed."
                        : "Encrypted payment powered by Razorpay Checkout."}
                    </p>
                  </div>

                  {/* SUMMARY BOX */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <span>Order Summary</span>
                      <span className="text-blue-400">{billingYearly ? "Annual" : "Monthly"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-white">{selectedPlan.name}</p>
                        <p className="text-xs text-slate-400">Stackly Workspace Access</p>
                      </div>
                      <div className="text-right">
                        {isFreeCheckout ? (
                          <p className="text-xl font-extrabold text-emerald-400">₹0</p>
                        ) : (
                          <p className="text-xl font-extrabold text-white">
                            {formatInrFromDisplayPrice(getActivePrice(selectedPlan).newPrice)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300 font-semibold text-center">
                      {paymentError}
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      disabled={paymentLoading}
                      onClick={() => void handlePayWithRazorpay()}
                      className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {paymentLoading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Processing Payment...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>{isFreeCheckout ? "Activate Free Plan" : "Pay with Razorpay"}</span>
                        </>
                      )}
                    </motion.button>

                    <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                      <Lock className="h-3 w-3 text-emerald-400" />
                      <span>256-Bit SSL Encrypted & Secure Checkout</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : planningView === "invoice" && invoiceData ? (
            /* ================= INVOICE DISPLAY VIEW ================= */
            <motion.div
              key="invoice-view"
              variants={viewTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-3xl"
            >
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#101b36] to-[#0a1224] p-6 shadow-2xl backdrop-blur-2xl sm:p-10 space-y-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-6">
                  <button
                    type="button"
                    onClick={handleBackToPlans}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to plans</span>
                  </button>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Payment Successful
                  </span>
                </div>

                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-extrabold text-white">Invoice Details</h2>
                  <p className="text-xs text-slate-400">Thank you for subscribing to Stackly!</p>
                </div>

                {/* INVOICE DETAILS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Plan Overview */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 text-xs">
                    <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4" /> Order Overview
                    </h3>
                    <div className="space-y-2 text-slate-300">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Invoice ID</span>
                        <span className="font-mono font-bold text-white">{invoiceData.invoiceId}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Date</span>
                        <span className="font-semibold text-white">{invoiceData.date}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Plan Name</span>
                        <span className="font-semibold text-white">{invoiceData.planName}</span>
                      </div>
                      <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                        <span className="text-slate-300">Amount Paid</span>
                        <span className="text-emerald-400">{invoiceData.amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Customer Info */}
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 text-xs">
                    <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                      <User className="h-4 w-4" /> Customer Details
                    </h3>
                    <div className="space-y-2 text-slate-300">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Name</span>
                        <span className="font-semibold text-white">{invoiceData.name || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Email</span>
                        <span className="font-semibold text-white truncate max-w-[180px]">{invoiceData.email || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-slate-400">Contact</span>
                        <span className="font-semibold text-white">{invoiceData.contactNo || "—"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-400">Address</span>
                        <span className="font-semibold text-white truncate max-w-[180px]">{invoiceData.address || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PAYMENT INSTRUMENT INFO */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3 text-xs">
                  <h3 className="text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4 w-4" /> Payment Instrument
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-300">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Payment Instrument</span>
                      <span className="font-semibold text-white text-sm">{invoiceData.paymentMethodLabel || "Card – Visa / MasterCard"}</span>
                    </div>
                    {invoiceData.paymentId && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Transaction ID</span>
                        <span className="font-mono text-white text-xs">{invoiceData.paymentId}</span>
                      </div>
                    )}
                    {invoiceData.orderId && (
                      <div>
                        <span className="text-slate-400 block text-[11px]">Order ID</span>
                        <span className="font-mono text-white text-xs">{invoiceData.orderId}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="flex justify-center pt-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      const entry: BillingHistoryEntry = {
                        date: invoiceData.date,
                        invoiceId: invoiceData.invoiceId,
                        amount: invoiceData.amount,
                        status: "Paid",
                        planName: invoiceData.planName,
                        planTier: selectedPlan?.name || "Advanced",
                        websiteLabel: "Stackly workspace subscription",
                        paymentMethodLabel: invoiceData.paymentMethodLabel || "Card – Visa / MasterCard",
                        paymentDetail: invoiceData.paymentId ? `Payment ${invoiceData.paymentId}${invoiceData.orderId ? ` · Order ${invoiceData.orderId}` : ""}` : "",
                        buyerName: invoiceData.name,
                        buyerEmail: invoiceData.email,
                        buyerPhone: invoiceData.contactNo,
                        buyerAddress: invoiceData.address,
                        generatedAt: invoiceData.paymentDate || new Date().toISOString(),
                      };
                      void downloadBillingInvoiceSummary(entry);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-bold text-slate-900 shadow-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-blue-600" />
                    <span>Download PDF Invoice</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : planningView === "history" ? (
            /* ================= BILLING HISTORY VIEW ================= */
            <motion.div
              key="history-view"
              variants={viewTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mx-auto max-w-4xl"
            >
              <div className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-[#101b36] to-[#0a1224] p-6 shadow-2xl backdrop-blur-2xl sm:p-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <button
                    type="button"
                    onClick={handleBackToPlans}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to plans</span>
                  </button>

                  <h2 className="text-xl font-bold text-white sm:text-2xl">Billing History</h2>

                  <select
                    value={historyMonthFilter}
                    onChange={(e) => setHistoryMonthFilter(e.target.value)}
                    className="rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900 text-white">All Months</option>
                    {historyMonths.map((m) => (
                      <option key={m.value} value={m.value} className="bg-slate-900 text-white">{m.label}</option>
                    ))}
                  </select>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
                  <table className="w-full min-w-[550px] text-left text-xs text-slate-300">
                    <thead className="bg-white/5 text-slate-400 font-bold uppercase tracking-wider border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3.5">Date</th>
                        <th className="px-4 py-3.5">Invoice ID</th>
                        <th className="px-4 py-3.5">Amount</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Download</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredBillingHistory.map((entry, index) => (
                        <tr key={`${entry.invoiceId}-${index}`} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3.5">{entry.date}</td>
                          <td className="px-4 py-3.5 font-mono font-semibold text-white">{entry.invoiceId}</td>
                          <td className="px-4 py-3.5 font-bold text-white">{entry.amount}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${entry.status === "Paid" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-500/20 text-slate-400"}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => void downloadBillingInvoiceSummary(entry)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer border border-blue-500/30"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Footer />
    </main>
  );
}
