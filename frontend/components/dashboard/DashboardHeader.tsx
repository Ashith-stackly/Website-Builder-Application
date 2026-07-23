"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FaBell, FaChartColumn, FaGear } from "react-icons/fa6";
import { BarChart3, LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { assetPath } from "@/lib/paths";
import { fetchProfile, PROFILE_UPDATED_EVENT, type UserProfile } from "@/lib/profileApi";
import { defaultUserSettings } from "@/lib/userSettings";

const NAV_ITEMS = [
  { id: "workspace" as const, label: "WORKSPACE" },
  { id: "myWebsites" as const, label: "MY WEBSITES" },
  { id: "templates" as const, label: "TEMPLATES" },
  { id: "domains" as const, label: "DOMAINS" },
  { id: "billing" as const, label: "BILLING" },
];
type NavId = (typeof NAV_ITEMS)[number]["id"];

const stacklyIconButtonClass =
  "stackly-icon-button relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm text-[#06224C] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C]";

const dashboardNavLinkClass =
  "stackly-nav-link whitespace-nowrap text-[13px] font-bold uppercase tracking-wide text-white transition hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:rounded-sm";

function MotionNavItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span initial="rest" whileHover="hover" animate="rest" className={`relative inline-flex ${className}`}>
      <motion.span
        variants={{ rest: { y: 0 }, hover: { y: -1 } }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="inline-flex"
      >
        {children}
      </motion.span>
      <motion.span
        variants={{ rest: { scaleX: 0, opacity: 0 }, hover: { scaleX: 1, opacity: 1 } }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="pointer-events-none absolute -bottom-1.5 left-0 right-0 h-[2px] origin-left rounded-full bg-blue-300"
      />
    </motion.span>
  );
}

export default function DashboardHeader() {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<NavId>("workspace");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const [displayUser, setDisplayUser] = useState(defaultUserSettings);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!profileWrapRef.current?.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchProfile(controller.signal).then((data) => {
      setDisplayUser({
        name: data.name || defaultUserSettings.name,
        email: data.email || defaultUserSettings.email,
        avatar: data.avatar || defaultUserSettings.avatar,
      });
    }).catch(() => {});

    const onUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      if (customEvent.detail) {
        setDisplayUser({
          name: customEvent.detail.name || defaultUserSettings.name,
          email: customEvent.detail.email || defaultUserSettings.email,
          avatar: customEvent.detail.avatar || defaultUserSettings.avatar,
        });
      }
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, onUpdated);
    return () => {
      controller.abort();
      window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdated);
    };
  }, []);

  function handleNavClick(id: NavId) {
    setActiveNav(id);
    setMobileMenuOpen(false);
    if (id === "workspace" || id === "myWebsites") {
      router.push("/dashboard");
      return;
    }
    if (id === "templates") {
      router.push("/landing#templates");
      return;
    }
    window.setTimeout(() => {
      router.push("/page-not-found");
    }, 120);
  }

  return (
    <header className="stackly-navbar sticky top-0 z-40 w-full border-b border-white/10 bg-[#06224C] px-2 py-3 shadow-sm md:px-12">
      <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 md:gap-4" aria-label="Main">
        <div className="flex min-w-0 items-center gap-1 md:gap-8">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md p-1 text-white transition hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] lg:hidden"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M3 5.5H17M3 10H17M3 14.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex aspect-[2/1] min-w-[75px] items-center justify-center rounded-[60%] bg-white px-2 py-2 shadow-md transition hover:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] md:min-w-[90px] md:px-4 md:py-3"
            aria-label="Stackly dashboard home"
          >
            <img src={assetPath("/stackly-logo.webp")} alt="Stackly logo" className="h-3 w-auto object-contain md:h-5" />
          </Link>

          <div className="hidden items-center justify-center gap-12 text-[13px] font-bold uppercase tracking-wide text-white lg:flex">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`${dashboardNavLinkClass} m-0 cursor-pointer border-0 bg-transparent p-0 ${
                  activeNav === item.id ? "text-blue-300" : ""
                }`}
                aria-current={activeNav === item.id ? "page" : undefined}
              >
                <MotionNavItem>{item.label}</MotionNavItem>
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2 md:gap-3">
          <button type="button" className={stacklyIconButtonClass} aria-label="Analytics" onClick={() => router.push("/dashboard/analytics")}>
            <FaChartColumn className="text-sm" aria-hidden />
          </button>
          <button type="button" className={stacklyIconButtonClass} aria-label="Settings" onClick={() => router.push("/dashboard/settings")}>
            <FaGear className="text-sm" aria-hidden />
          </button>
          <button type="button" className={stacklyIconButtonClass} aria-label="Notifications">
            <FaBell className="text-sm" aria-hidden />
          </button>

          <div className="relative flex shrink-0 items-center" ref={profileWrapRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileOpen((o) => !o);
              }}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(255,255,255,0.18)] focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 md:h-9 md:w-9"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              aria-label={`Profile menu, ${displayUser.name}`}
            >
              <img src={displayUser.avatar.startsWith("data:") ? displayUser.avatar : assetPath(displayUser.avatar)} alt="User Profile Picture" className="h-full w-full object-cover" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-[222px] overflow-hidden rounded-2xl border border-[#d5dbe3] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.18)]" role="menu">
                <div className="border-b border-[#e6ebf2] px-4 py-3">
                  <p className="text-sm font-bold leading-tight text-[#243b5f]">{displayUser.name}</p>
                  <p className="mt-0.5 text-xs font-semibold text-[#9aa9bc]">{displayUser.email}</p>
                </div>

                <div className="py-1.5">
                  <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#3e5373] transition-colors hover:bg-[#f8fafc]" role="menuitem" onClick={() => setProfileOpen(false)}>
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link href="/dashboard/analytics" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#3e5373] transition-colors hover:bg-[#f8fafc]" role="menuitem" onClick={() => setProfileOpen(false)}>
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                  <Link href="/dashboard/settings#profile-settings" onClick={() => setProfileOpen(false)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-[#3e5373] transition-colors hover:bg-[#f8fafc]" role="menuitem">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link href="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-[#3e5373] transition-colors hover:bg-[#f8fafc]" role="menuitem">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-[#e6ebf2] py-1.5">
                  <Link href="/login" className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-[#ef4444] transition-colors hover:bg-[#fff5f5]" role="menuitem">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="stackly-mobile-menu mt-3 border-t border-white/20 pb-5 pt-3 text-[11px] font-bold uppercase tracking-widest text-white shadow-[inset_0_10px_24px_-12px_rgba(0,0,0,0.55)] lg:hidden">
          <div className="flex flex-col">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`block border-b border-white/5 px-6 py-4 text-left transition focus-visible:outline-none focus-visible:bg-white/10 ${
                  activeNav === item.id ? "bg-white/10 text-blue-300" : ""
                }`}
              >
                {item.label}
              </button>
            ))}
        </div>
      </div>
      )}
    </header>
  );
}
