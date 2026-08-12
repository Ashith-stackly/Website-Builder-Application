"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  User as UserIcon,
  Palette,
  CreditCard,
  AlertTriangle,
  Check,
  Sun,
  Moon,
  Monitor,
  Globe,
  LogOut,
  Trash2,
  Camera,
  Sparkles,
  FolderCog,
  Loader2,
  Download,
  FileText,
} from "lucide-react";
import { downloadPlanningInvoiceForEntry, type BillingHistoryEntryLike } from "@/lib/planningInvoiceHtml";
import { revealSection, spring } from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { useThemeStore, type ThemeMode } from "@/lib/theme";
import { fetchProfile, formatPlanLabel, resolveActivePlan, updateProfile, PROFILE_UPDATED_EVENT, type UserProfile } from "@/lib/profileApi";
import { useLanguageStore, type LanguageCode } from "@/lib/i18n"
import ProjectSettingsForm from "@/components/dashboard/ProjectSettingsForm";
import { clearAuthToken } from "@/lib/authToken";
import { clearDemoSession } from "@/lib/demoAuth";
import { getSignupEmailValidationError } from "@/lib/emailValidation";

type TabKey = "profile" | "appearance" | "billing" | "danger";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "danger", label: "Danger zone", icon: AlertTriangle },
];

function SettingsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams?.get("id") ?? "";
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const [tab, setTab] = useState<TabKey>("profile");
  const i18n = useLanguageStore((s) => s.t);

  useEffect(() => {
    const controller = new AbortController();
    void loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Profile hero */}
      <ProfileHero />

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Tab rail */}
        <LayoutGroup id="settings-tabs">
          <nav className="flex gap-2 overflow-x-auto lg:sticky lg:top-20 lg:h-max lg:flex-col lg:overflow-visible">
            {TABS.map((tabInfo) => {
              const active = tab === tabInfo.key;
              const translatedLabel = i18n.settings?.tabs?.[tabInfo.key] || tabInfo.label;
              return (
                <button
                  key={tabInfo.key}
                  onClick={() => setTab(tabInfo.key)}
                  className="relative flex cursor-pointer shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition-colors"
                  style={{ color: active ? (tabInfo.key === "danger" ? "#f43f5e" : "var(--accent-strong)") : "var(--text-muted)" }}
                >
                  {active && (
                    <motion.span layoutId="settings-active" transition={spring.soft} className="absolute inset-0 rounded-xl"
                      style={{ background: tabInfo.key === "danger" ? "rgba(244,63,94,0.1)" : "var(--accent-soft)" }} />
                  )}
                  <tabInfo.icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10 whitespace-nowrap">{translatedLabel}</span>
                </button>
              );
            })}
          </nav>
        </LayoutGroup>

        {/* Panels */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {tab === "profile" && <ProfilePanel />}
              {tab === "appearance" && <AppearancePanel />}
              {tab === "billing" && <BillingPanel onUpgrade={() => router.push("/planning")} />}
              {tab === "danger" && <DangerPanel onSignOut={() => { try { clearAuthToken(); clearDemoSession(); } catch { } router.push("/login"); }} />}

              {projectId && (
                <Card icon={FolderCog} title="Project settings" desc="Settings for the currently selected project.">
                  <ProjectSettingsForm projectId={projectId} />
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile hero ─────────────────────────────────────────────────────── */

function ProfileHero() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recentPurchasePlan, setRecentPurchasePlan] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stacklyPlanningBillingHistory");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0]) {
          const latest = parsed[0] as BillingHistoryEntryLike;
          setRecentPurchasePlan(latest.planTier || latest.planName);
        }
      }
    } catch { /* ignore */ }

    const controller = new AbortController();
    void fetchProfile(controller.signal)
      .then((data) => setUser(data))
      .catch(() => { })
      .finally(() => setLoading(false));

    const onUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      if (customEvent.detail) setUser(customEvent.detail);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onUpdated);
    return () => {
      controller.abort();
      window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdated);
    };
  }, []);

  const name = user?.name || (loading ? "Loading profile..." : "Balaji B");
  const email = user?.email || (loading ? "..." : "balajib@gmail.com");
  const planLabel = formatPlanLabel(resolveActivePlan(user?.plan, recentPurchasePlan)).toUpperCase();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (user) {
        setUser({ ...user, avatar: base64 });
        try {
          await updateProfile({ avatar: base64 });
        } catch (err) {
          console.error("Failed to update avatar:", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const currentAvatarSrc = user?.avatar && user.avatar !== "/profile.webp"
    ? user.avatar
    : "/profile_avatar_balaji.png";

  return (
    <motion.section
      variants={revealSection}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-[28px] border shadow-sm flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 min-h-[190px]"
      style={{
        borderColor: "rgba(147, 197, 253, 0.4)",
        background: "linear-gradient(90deg, #ffffff 0%, #e0f2fe 25%, #7dd3fc 60%, #60a5fa 100%)",
      }}
    >
      {/* Left section: Avatar & user info */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left w-full md:w-auto">
        {/* Avatar with purple container frame */}
        <div className="relative shrink-0">
          <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-[24px] bg-[#818cf8] p-1 shadow-md">
            <div className="h-full w-full overflow-hidden rounded-[20px] bg-slate-900 flex items-center justify-center font-bold text-2xl text-white">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              ) : (
                <img
                  src={currentAvatarSrc}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            {/* Camera badge icon */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 grid h-8 w-8 cursor-pointer place-items-center rounded-full border-2 border-white text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
              style={{ background: "#818cf8" }}
              aria-label="Change avatar"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* User Details */}
        <div className="flex flex-col items-center sm:items-start gap-1">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0f2744]">
            {name}
          </h1>
          <p className="text-sm sm:text-base font-semibold text-[#2563eb]">
            {email}
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#818cf8]/25 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-[#4338ca]">
            <Sparkles className="h-3.5 w-3.5 text-[#6366f1]" />
            <span>{planLabel}</span>
          </div>
        </div>
      </div>

      {/* Right section: Top-down Laptop Graphic (Full Uncropped Laptop) */}
      <div className="hidden md:flex relative h-[210px] sm:h-[220px] shrink-0 items-center justify-end overflow-hidden -my-8 -mr-6 sm:-mr-8 pointer-events-none">
        <img
          src="/settings_profile_laptop.webp"
          alt="Laptop overhead view"
          className="h-full w-auto object-contain object-right"
          style={{ WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 15%, black 100%)", maskImage: "linear-gradient(to right, transparent 0%, black 15%, black 100%)" }}
        />
      </div>
    </motion.section>
  );
}

/* ─── Panels ───────────────────────────────────────────────────────────── */

function ProfilePanel() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [initialProfile, setInitialProfile] = useState<{ name: string; email: string; address: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProfile(controller.signal)
      .then((data) => {
        setName(data.name);
        setEmail(data.email);
        setAddress(data.address || "");
        setInitialProfile({ name: data.name, email: data.email, address: data.address || "" });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to load profile from server.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedAddress = address.trim();

    if (!trimmedName) return setError("Name can't be empty.");

    const emailError = getSignupEmailValidationError(trimmedEmail.toLowerCase());
    if (emailError) return setError(emailError);

    // Prevent duplicate submission if values are unchanged
    if (initialProfile && initialProfile.name === trimmedName && initialProfile.email === trimmedEmail && initialProfile.address === trimmedAddress) {
      setError(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const updated = await updateProfile({ name: trimmedName, email: trimmedEmail, address: trimmedAddress });
      setName(updated.name);
      setEmail(updated.email);
      setAddress(updated.address || "");
      setInitialProfile({ name: updated.name, email: updated.email, address: updated.address || "" });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile changes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card icon={UserIcon} title="Personal information" desc="Update how your name and email appear across Stackly.">
      {loading ? (
        <div className="flex items-center gap-3 py-6 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent-strong)" }} />
          Loading profile settings...
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name">
            <Input value={name} onChange={setName} placeholder="Jane Doe" />
          </Field>
          <Field label="Email address">
            <Input value={email} onChange={setEmail} placeholder="jane@example.com" type="email" />
          </Field>
          <Field label="Billing address">
            <textarea
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, State, ZIP, Country"
              className="w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-shadow focus:shadow-[0_0_0_4px_var(--ring)]"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
            />
          </Field>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[13px] font-semibold text-rose-500">
                {error}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-3 pt-1">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={submitting}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </motion.button>
            <AnimatePresence>
              {saved && (
                <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-600">
                  <Check className="h-4 w-4" /> Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </form>
      )}
    </Card>
  );
}

function AppearancePanel() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const lang = useLanguageStore((s) => s.lang);
  const setLang = useLanguageStore((s) => s.setLang);
  const t = useLanguageStore((s) => s.t).settings.appearance;
  const tSidebar = useLanguageStore((s) => s.t).sidebar;

  const options: { key: ThemeMode; icon: React.ElementType; label: string; hint: string }[] = [
    { key: "light", icon: Sun, label: tSidebar.light, hint: t.lightHint },
    { key: "dark", icon: Moon, label: tSidebar.dark, hint: t.darkHint },
    { key: "system", icon: Monitor, label: tSidebar.system, hint: t.systemHint },
  ];
  return (
    <>
      <Card icon={Palette} title={t.theme} desc={t.themeDesc}>
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((o) => {
            const active = mode === o.key;
            return (
              <motion.button key={o.key} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={spring.snappy}
                onClick={() => setMode(o.key)}
                className="relative flex cursor-pointer flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left"
                style={{ borderColor: active ? "var(--accent)" : "var(--border)", background: active ? "var(--accent-soft)" : "var(--surface-2)" }}>
                {active && <span className="absolute right-3 top-3 grid h-5 w-5 place-items-center rounded-full text-white" style={{ background: "var(--accent)" }}><Check className="h-3 w-3" /></span>}
                <o.icon className="h-5 w-5" style={{ color: active ? "var(--accent-strong)" : "var(--text-muted)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{o.label}</span>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>{o.hint}</span>
              </motion.button>
            );
          })}
        </div>
      </Card>
      <Card icon={Monitor} title={t.langRegion} desc={t.langDesc}>
        <Field label={t.language}>
          <select value={lang} onChange={(e) => setLang(e.target.value as LanguageCode)}
            className="w-full cursor-pointer rounded-xl border px-3.5 py-2.5 text-sm outline-none"
            style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}>
            <option value="en">English (US)</option>
            <option value="en-gb">English (UK)</option>
            <option value="hi">हिन्दी</option>
            <option value="es">Español</option>
          </select>
        </Field>
      </Card>
    </>
  );
}

const PLAN_DESCRIPTIONS: Record<string, string> = {
  free: "Upgrade for custom domains, more storage and analytics.",
  basic: "20 GB storage, multi-cloud hosting, and light marketing suite.",
  business: "100 GB storage, payments, eCommerce, and standard marketing suite.",
  advanced: "300 GB storage, legacy marketing suite, and 10 site collaborators.",
  premium: "Unlimited projects and pages with full platform access.",
};

function BillingPanel({ onUpgrade }: { onUpgrade: () => void }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [recentPurchasePlan, setRecentPurchasePlan] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stacklyPlanningBillingHistory");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed[0]) {
          const latest = parsed[0] as BillingHistoryEntryLike;
          setRecentPurchasePlan(latest.planTier || latest.planName);
        }
      }
    } catch { /* ignore */ }

    const controller = new AbortController();
    void fetchProfile(controller.signal)
      .then((data) => setUser(data))
      .catch(() => { })
      .finally(() => setLoading(false));

    const onUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      if (customEvent.detail) setUser(customEvent.detail);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onUpdated);
    return () => {
      controller.abort();
      window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdated);
    };
  }, []);

  const planKey = resolveActivePlan(user?.plan, recentPurchasePlan);
  const planLabel = formatPlanLabel(planKey);
  const planDesc = PLAN_DESCRIPTIONS[planKey] || PLAN_DESCRIPTIONS.free;
  const isFreePlan = planKey === "free";

  return (
    <>
      <Card icon={CreditCard} title="Current plan" desc={`You're on the ${planLabel} plan.`}>
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center" style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, var(--accent-soft), var(--surface))" }}>
          <div>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
            ) : (
              <p className="text-lg font-black" style={{ color: "var(--text)" }}>{planLabel}</p>
            )}
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{planDesc}</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onUpgrade}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-4 w-4" /> {isFreePlan ? "Upgrade" : "Change plan"}
          </motion.button>
        </div>
      </Card>

      <DashboardBillingHistory />
    </>
  );
}

function DashboardBillingHistory() {
  const [history, setHistory] = useState<BillingHistoryEntryLike[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("stacklyPlanningBillingHistory");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setHistory(parsed);
      }
    } catch { }

    const controller = new AbortController();
    void fetchProfile(controller.signal).then(setUser).catch(() => { });
    return () => controller.abort();
  }, []);

  const downloadInvoice = async (entry: BillingHistoryEntryLike) => {
    const contactDefaults = {
      displayName: user?.name || "User",
      email: user?.email || "",
      phone: user?.mobile || "",
      address: user?.address || "",
    };
    await downloadPlanningInvoiceForEntry(entry, contactDefaults, entry.invoiceId);
  };

  return (
    <Card icon={FileText} title="Invoice & Billing History" desc="Past payment invoices and downloadable billing records.">
      {history.length === 0 ? (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
          <FileText className="mx-auto h-8 w-8 text-slate-400 mb-2" />
          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>No past invoices found</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Subscribe to a plan or complete checkout to view and download past invoices.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-left text-xs" style={{ color: "var(--text)" }}>
            <thead className="border-b uppercase tracking-wider text-[11px] font-bold" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}>
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Invoice ID</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Invoice PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
              {history.map((entry, index) => (
                <tr key={`${entry.invoiceId}-${index}`} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3.5 font-medium">{entry.date}</td>
                  <td className="px-4 py-3.5 font-mono font-bold">{entry.invoiceId}</td>
                  <td className="px-4 py-3.5 font-bold">{entry.amount}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black ${entry.status === "Paid" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => void downloadInvoice(entry)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                      style={{ borderColor: "var(--border)", background: "var(--accent-soft)", color: "var(--accent-strong)" }}
                      title="Download PDF Invoice"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function DangerPanel({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="space-y-6">
      <Card icon={LogOut} title="Sign Out" desc="Sign out of Stackly on this device.">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSignOut}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </motion.button>
      </Card>
      <Card icon={Globe} title="Sign Out from All Accounts" desc="Sign out from all devices and all active account sessions.">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { if (window.confirm("Are you sure you want to sign out from all devices?")) onSignOut(); }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25"
        >
          <Globe className="h-4 w-4" /> Sign Out All
        </motion.button>
      </Card>
      <div className="rounded-2xl border-2 border-rose-500/30 p-5" style={{ background: "rgba(244,63,94,0.04)" }}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-500"><AlertTriangle className="h-4 w-4" /></span>
          <div>
            <h3 className="text-sm font-black text-rose-500">Delete account</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Permanently remove your account and all projects. This cannot be undone.</p>
          </div>
        </div>
        <button
          onClick={() => window.confirm("This will permanently delete your account. Continue?")}
          className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25">
          <Trash2 className="h-4 w-4" /> Delete account
        </button>
      </div>
    </div>
  );
}

/* ─── primitives ───────────────────────────────────────────────────────── */

function Card({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <motion.section variants={revealSection} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
      className="rounded-2xl border p-5 sm:p-6" style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-black" style={{ color: "var(--text)" }}>{title}</h3>
          {desc && <p className="mt-0.5 text-xs" style={{ color: "var(--text-faint)" }}>{desc}</p>}
        </div>
      </div>
      {children}
    </motion.section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>{label}</span>
      {children}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-shadow focus:shadow-[0_0_0_4px_var(--ring)]"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8" />}>
      <SettingsInner />
    </Suspense>
  );
}

