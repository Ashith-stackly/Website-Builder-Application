"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  LogOut,
  Settings,
  User as UserIcon,
  Rocket,
  Sparkles,
  Check,
} from "lucide-react";
import { scaleIn, spring, staggerChild, staggerContainer } from "@/lib/motion";
import { useThemeStore, type ThemeMode } from "@/lib/theme";
import { useClickOutside } from "@/lib/hooks";
import { fetchProfile, PROFILE_UPDATED_EVENT, type UserProfile } from "@/lib/profileApi";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  settings: "Settings",
  builder: "Builder",
  templates: "Templates",
};

const SAMPLE_NOTIFICATIONS = [
  { id: 1, icon: Rocket, title: "Deployment succeeded", body: "Your site is live.", time: "2m", tone: "#10b981" },
  { id: 2, icon: Sparkles, title: "New templates added", body: "5 fresh layouts in the studio.", time: "1h", tone: "#8b5cf6" },
  { id: 3, icon: Bell, title: "Autosave restored", body: "We recovered a draft from earlier.", time: "3h", tone: "#4f6bed" },
];

export default function Topbar({
  onOpenMobileNav,
  onOpenCommand,
}: {
  onOpenMobileNav: () => void;
  onOpenCommand: () => void;
}) {
  const pathname = usePathname() || "/dashboard";
  const crumbs = pathname.split("/").filter(Boolean);

  return (
    <header
      className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl md:px-6"
      style={{ background: "var(--glass)", borderColor: "var(--border)" }}
    >
      <button
        onClick={onOpenMobileNav}
        className="grid h-9 w-9 place-items-center rounded-lg lg:hidden"
        style={{ color: "var(--text-muted)" }}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 sm:flex">
        {crumbs.map((seg, i) => {
          const href = "/" + crumbs.slice(0, i + 1).join("/");
          const label = SEGMENT_LABELS[seg] || seg;
          const last = i === crumbs.length - 1;
          return (
            <span key={href} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--text-faint)" }} />}
              {last ? (
                <span className="truncate text-sm font-semibold" style={{ color: "var(--text)" }}>{label}</span>
              ) : (
                <Link href={href} className="truncate text-sm transition-colors hover:underline" style={{ color: "var(--text-muted)" }}>
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      {/* Search (command) trigger */}
      <button
        onClick={onOpenCommand}
        className="ml-auto flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors md:min-w-[240px]"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-faint)" }}
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Search everything…</span>
        <kbd className="ml-auto hidden rounded-md border px-1.5 py-0.5 text-[10px] font-semibold md:block" style={{ borderColor: "var(--border)" }}>
          ⌘K
        </kbd>
      </button>

      <ThemeSwitch />
      <Notifications />
      <ProfileMenu />
    </header>
  );
}

/* ─── Theme switch (segmented light / system / dark) ───────────────────── */

function ThemeSwitch() {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const options: { key: ThemeMode; icon: typeof Sun; label: string }[] = [
    { key: "light", icon: Sun, label: "Light" },
    { key: "system", icon: Monitor, label: "System" },
    { key: "dark", icon: Moon, label: "Dark" },
  ];

  return (
    <div
      className="hidden items-center gap-0.5 rounded-xl border p-0.5 sm:flex"
      style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
      role="radiogroup"
      aria-label="Theme"
    >
      {options.map((o) => {
        const active = mode === o.key;
        return (
          <button
            key={o.key}
            onClick={() => setMode(o.key)}
            className="relative grid h-7 w-7 place-items-center rounded-lg"
            aria-label={o.label}
            aria-checked={active}
            role="radio"
            style={{ color: active ? "#fff" : "var(--text-faint)" }}
          >
            {active && (
              <motion.span
                layoutId="theme-active"
                transition={spring.snappy}
                className="absolute inset-0 rounded-lg"
                style={{ background: "var(--accent)" }}
              />
            )}
            <o.icon className="relative z-10 h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
}

/* ─── Notifications dropdown ───────────────────────────────────────────── */

function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((v) => !v)}
        className="relative grid h-9 w-9 place-items-center rounded-xl border"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2" style={{ ["--tw-ring-color" as string]: "var(--surface-2)" }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-80 origin-top-right overflow-hidden rounded-2xl border shadow-2xl"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--text)" }}>Notifications</span>
              <button className="text-xs font-semibold" style={{ color: "var(--accent)" }}>Mark all read</button>
            </div>
            <motion.ul variants={staggerContainer} initial="hidden" animate="visible" className="max-h-80 overflow-y-auto p-1.5">
              {SAMPLE_NOTIFICATIONS.map((n) => (
                <motion.li key={n.id} variants={staggerChild}>
                  <button className="flex w-full items-start gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-[color:var(--surface-2)]">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${n.tone}1a`, color: n.tone }}>
                      <n.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold" style={{ color: "var(--text)" }}>{n.title}</span>
                      <span className="block truncate text-xs" style={{ color: "var(--text-faint)" }}>{n.body}</span>
                    </span>
                    <span className="shrink-0 text-[11px]" style={{ color: "var(--text-faint)" }}>{n.time}</span>
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Profile menu ─────────────────────────────────────────────────────── */

function ProfileMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProfile(controller.signal)
      .then((data) => setUser(data))
      .catch(() => {});

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

  const initials = (user?.name || "Stackly User")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const signOut = () => {
    try {
      window.localStorage.removeItem("stackly-auth-token");
    } catch {
      /* ignore */
    }
    router.push("/login");
  };

  return (
    <div ref={ref} className="relative">
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border p-0.5 pr-1.5"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        aria-label="Account menu"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#4f6bed] to-[#8b5cf6] text-xs font-bold text-white">
          {initials}
        </span>
        <ChevronRight className="h-3.5 w-3.5 rotate-90" style={{ color: "var(--text-faint)" }} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute right-0 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border shadow-2xl"
            style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}
          >
            <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--border)" }}>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#4f6bed] to-[#8b5cf6] text-sm font-bold text-white">
                {initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold" style={{ color: "var(--text)" }}>{user?.name || "Stackly User"}</span>
                <span className="block truncate text-xs" style={{ color: "var(--text-faint)" }}>{user?.email || "user@stackly.com"}</span>
              </span>
            </div>
            <div className="p-1.5">
              <MenuLink icon={UserIcon} label="Profile" onClick={() => { setOpen(false); router.push("/dashboard/settings"); }} />
              <MenuLink icon={Settings} label="Settings" onClick={() => { setOpen(false); router.push("/dashboard/settings"); }} />
              <MenuLink icon={Check} label="Plan: Free" muted onClick={() => { setOpen(false); router.push("/planning"); }} />
            </div>
            <div className="border-t p-1.5" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-rose-500 transition-colors hover:bg-rose-500/10"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({
  icon: Icon,
  label,
  onClick,
  muted,
}: {
  icon: typeof UserIcon;
  label: string;
  onClick: () => void;
  muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-[color:var(--surface-2)]"
      style={{ color: muted ? "var(--text-faint)" : "var(--text)" }}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
