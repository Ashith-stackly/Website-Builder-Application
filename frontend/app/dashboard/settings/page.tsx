"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  User as UserIcon,
  Palette,
  Bell,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  Check,
  Sun,
  Moon,
  Monitor,
  Mail,
  Phone,
  KeyRound,
  Globe,
  Smartphone,
  LogOut,
  Trash2,
  Camera,
  Sparkles,
  FolderCog,
  Loader2,
} from "lucide-react";
import { staggerContainer, staggerChild, revealSection, spring } from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { useThemeStore, type ThemeMode } from "@/lib/theme";
import { usePersistentState } from "@/lib/hooks";
import { fetchProfile, updateProfile, PROFILE_UPDATED_EVENT, type UserProfile } from "@/lib/profileApi";
import ProjectSettingsForm from "@/components/dashboard/ProjectSettingsForm";

type TabKey = "profile" | "appearance" | "notifications" | "security" | "billing" | "danger";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "profile", label: "Profile", icon: UserIcon },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: ShieldCheck },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "danger", label: "Danger zone", icon: AlertTriangle },
];

function SettingsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = searchParams?.get("id") ?? "";
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const [tab, setTab] = useState<TabKey>("profile");

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
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="relative flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] font-semibold transition-colors"
                  style={{ color: active ? (t.key === "danger" ? "#f43f5e" : "var(--accent-strong)") : "var(--text-muted)" }}
                >
                  {active && (
                    <motion.span layoutId="settings-active" transition={spring.soft} className="absolute inset-0 rounded-xl"
                      style={{ background: t.key === "danger" ? "rgba(244,63,94,0.1)" : "var(--accent-soft)" }} />
                  )}
                  <t.icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10 whitespace-nowrap">{t.label}</span>
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
              {tab === "notifications" && <NotificationsPanel />}
              {tab === "security" && <SecurityPanel />}
              {tab === "billing" && <BillingPanel onUpgrade={() => router.push("/planning")} />}
              {tab === "danger" && <DangerPanel onSignOut={() => { try { window.localStorage.removeItem("stackly-auth-token"); } catch {} router.push("/login"); }} />}

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProfile(controller.signal)
      .then((data) => setUser(data))
      .catch(() => {})
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

  const name = user?.name || (loading ? "Loading profile..." : "Stackly User");
  const email = user?.email || (loading ? "..." : "user@stackly.com");
  const planLabel = user?.plan ? `${user.plan.charAt(0).toUpperCase()}${user.plan.slice(1)} plan` : "Free plan";
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "SU";

  return (
    <motion.section
      variants={revealSection}
      initial="hidden"
      animate="visible"
      className="relative overflow-hidden rounded-3xl border p-6 sm:p-7"
      style={{ borderColor: "var(--border)", background: "var(--surface)", boxShadow: "var(--shadow-sm)" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-[#4f6bed] via-[#6d5ef0] to-[#8b5cf6] opacity-90" />
      <div className="relative flex flex-col items-start gap-4 pt-8 sm:flex-row sm:items-center">
        <div className="relative">
          <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 bg-gradient-to-br from-[#4f6bed] to-[#8b5cf6] text-2xl font-black text-white shadow-xl" style={{ borderColor: "var(--surface)" }}>
            {loading ? <Loader2 className="h-6 w-6 animate-spin text-white" /> : initials}
          </span>
          <button className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-lg border text-white shadow-md" style={{ background: "var(--accent)", borderColor: "var(--surface)" }} aria-label="Change avatar">
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-black sm:text-2xl" style={{ color: "var(--text)" }}>{name}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{email}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: "var(--border)", background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
          <Sparkles className="h-3.5 w-3.5" /> {planLabel}
        </span>
      </div>
    </motion.section>
  );
}

/* ─── Panels ───────────────────────────────────────────────────────────── */

function ProfilePanel() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialProfile, setInitialProfile] = useState<{ name: string; email: string } | null>(null);
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
        setInitialProfile({ name: data.name, email: data.email });
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

    if (!trimmedName) return setError("Name can't be empty.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) return setError("Enter a valid email address.");

    // Prevent duplicate submission if values are unchanged
    if (initialProfile && initialProfile.name === trimmedName && initialProfile.email === trimmedEmail) {
      setError(null);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const updated = await updateProfile({ name: trimmedName, email: trimmedEmail });
      setName(updated.name);
      setEmail(updated.email);
      setInitialProfile({ name: updated.name, email: updated.email });
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
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
  const [lang, setLang] = usePersistentState("stackly-lang", "en");
  const options: { key: ThemeMode; icon: React.ElementType; label: string; hint: string }[] = [
    { key: "light", icon: Sun, label: "Light", hint: "Clean & bright" },
    { key: "dark", icon: Moon, label: "Dark", hint: "Easy on the eyes" },
    { key: "system", icon: Monitor, label: "System", hint: "Match device" },
  ];
  return (
    <>
      <Card icon={Palette} title="Theme" desc="Choose how Stackly looks. Applies instantly across the app.">
        <div className="grid gap-3 sm:grid-cols-3">
          {options.map((o) => {
            const active = mode === o.key;
            return (
              <motion.button key={o.key} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} transition={spring.snappy}
                onClick={() => setMode(o.key)}
                className="relative flex flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left"
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
      <Card icon={Monitor} title="Language & region" desc="Localize dates, numbers and interface text.">
        <Field label="Language">
          <select value={lang} onChange={(e) => setLang(e.target.value)}
            className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
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

function NotificationsPanel() {
  const [prefs, setPrefs] = usePersistentState("stackly-notif", {
    deploys: true, comments: true, product: false, security: true, weekly: false,
  });
  const rows: { key: keyof typeof prefs; label: string; desc: string }[] = [
    { key: "deploys", label: "Deployment updates", desc: "When a site publishes or fails." },
    { key: "comments", label: "Collaborator activity", desc: "Comments and shared edits." },
    { key: "product", label: "Product news", desc: "New features and templates." },
    { key: "security", label: "Security alerts", desc: "Sign-ins and account changes." },
    { key: "weekly", label: "Weekly digest", desc: "Traffic summary every Monday." },
  ];
  return (
    <Card icon={Bell} title="Notifications" desc="Decide what Stackly emails you about.">
      <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
        {rows.map((r) => (
          <li key={r.key} className="flex items-center justify-between gap-4 py-3.5" style={{ borderColor: "var(--border)" }}>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold" style={{ color: "var(--text)" }}>{r.label}</p>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{r.desc}</p>
            </div>
            <Switch on={prefs[r.key]} onToggle={() => setPrefs({ ...prefs, [r.key]: !prefs[r.key] })} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SecurityPanel() {
  const rows = [
    { icon: KeyRound, label: "Password", value: "Last changed 3 months ago", action: "Change" },
    { icon: Mail, label: "Email", value: "Verified", action: "Update" },
    { icon: Phone, label: "Phone", value: "Not added", action: "Add" },
    { icon: Globe, label: "Google account", value: "Connected", action: "Manage" },
    { icon: ShieldCheck, label: "Two-factor auth", value: "Recommended", action: "Enable" },
  ];
  return (
    <>
      <Card icon={ShieldCheck} title="Security" desc="Keep your account protected.">
        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.map((r) => (
            <li key={r.label} className="flex items-center gap-3 py-3.5" style={{ borderColor: "var(--border)" }}>
              <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}>
                <r.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-semibold" style={{ color: "var(--text)" }}>{r.label}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{r.value}</p>
              </div>
              <button className="rounded-lg border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}>
                {r.action}
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card icon={Smartphone} title="Active sessions" desc="Devices currently signed in to your account.">
        <ul className="space-y-3">
          {[{ d: "Chrome · Windows", loc: "This device", now: true }, { d: "Safari · iPhone", loc: "Mumbai, IN", now: false }].map((s) => (
            <li key={s.d} className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
              <span className="grid h-9 w-9 place-items-center rounded-lg" style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}><Monitor className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>{s.d}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>{s.loc}</p>
              </div>
              {s.now ? (
                <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-emerald-600" style={{ background: "rgba(16,185,129,0.12)" }}>Active now</span>
              ) : (
                <button className="text-xs font-bold text-rose-500">Revoke</button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function BillingPanel({ onUpgrade }: { onUpgrade: () => void }) {
  const usage = [
    { label: "Projects", used: 3, total: 5 },
    { label: "Published sites", used: 1, total: 1 },
    { label: "Storage", used: 42, total: 100, unit: " MB" },
  ];
  return (
    <>
      <Card icon={CreditCard} title="Current plan" desc="You're on the Free plan.">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center" style={{ borderColor: "var(--border)", background: "linear-gradient(135deg, var(--accent-soft), var(--surface))" }}>
          <div>
            <p className="text-lg font-black" style={{ color: "var(--text)" }}>Free</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Upgrade for custom domains, more storage and analytics.</p>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onUpgrade}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4f6bed] to-[#7c3aed] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="h-4 w-4" /> Upgrade
          </motion.button>
        </div>
      </Card>
      <Card icon={Monitor} title="Usage" desc="Resource usage this billing period.">
        <ul className="space-y-4">
          {usage.map((u) => {
            const pct = Math.min(100, Math.round((u.used / u.total) * 100));
            return (
              <li key={u.label}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="font-semibold" style={{ color: "var(--text)" }}>{u.label}</span>
                  <span className="tabular-nums" style={{ color: "var(--text-faint)" }}>{u.used}{u.unit || ""} / {u.total}{u.unit || ""}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full" style={{ background: "var(--surface-3)" }}>
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-[#4f6bed] to-[#8b5cf6]" />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}

function DangerPanel({ onSignOut }: { onSignOut: () => void }) {
  return (
    <>
      <Card icon={LogOut} title="Sign out" desc="Sign out of Stackly on this device.">
        <button onClick={onSignOut} className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text)" }}>
          <LogOut className="h-4 w-4" /> Sign out
        </button>
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
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25">
          <Trash2 className="h-4 w-4" /> Delete account
        </button>
      </div>
    </>
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

function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={on}
      className="relative h-6 w-11 shrink-0 rounded-full transition-colors"
      style={{ background: on ? "var(--accent)" : "var(--surface-3)" }}
    >
      <motion.span layout transition={spring.snappy}
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: on ? "calc(100% - 22px)" : "2px" }} />
    </button>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8" />}>
      <SettingsInner />
    </Suspense>
  );
}
