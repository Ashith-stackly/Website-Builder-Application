"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/motion";
import { useProjectStore } from "@/store/projectStore";
import { trackPageView } from "@/lib/analytics";
import ProjectSettingsForm from "@/components/dashboard/ProjectSettingsForm";
import ProfileSettingsPanel from "@/components/dashboard/ProfileSettingsPanel";
import SettingsQuickLinks from "@/components/dashboard/SettingsQuickLinks";
import SubscriptionPanel from "@/components/dashboard/SubscriptionPanel";
import Link from "next/link";
import { assetPath } from "@/lib/paths";
import { ArrowLeft, FolderOpen, Settings2 } from "lucide-react";

function SettingsContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("id") ?? "";
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const mountedId = window.setTimeout(() => setMounted(true), 0);
    void loadProjects(controller.signal);
    if (projectId) trackPageView(`/project/${projectId}/settings`);
    return () => {
      controller.abort();
      window.clearTimeout(mountedId);
    };
  }, [loadProjects, projectId]);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
    );
  }

  if (!projectId) {
    return (
      <main className="dashboard-page min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_32%),linear-gradient(135deg,#f8fbff,#eef6ff_50%,#fff7ed)]">
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
          <SettingsHero title="Tune your account" description="Update your profile and manage the subscription details reflected across Stackly." />
          <SettingsQuickLinks />
          <ProfileSettingsPanel />
          <SubscriptionPanel />
          <div className="flex flex-col items-center justify-center rounded-3xl border border-white/70 bg-white/80 px-5 py-10 text-center shadow-sm">
          <FolderOpen className="h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-xl font-bold text-[#06224C]">No Project Selected</h2>
          <p className="mt-2 text-sm text-slate-400">Select a project to edit its project-specific settings.</p>
          <Link href="/dashboard" className="mt-6 rounded-xl bg-[#06224C] px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-blue-900">
            Back to Dashboard
          </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      {/* Header */}
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/80 px-4 py-3 backdrop-blur-xl md:px-8"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img src={assetPath("/stackly-logo.webp")} alt="Stackly" className="h-7 w-auto" />
            </Link>
            <span className="hidden text-sm font-extrabold uppercase tracking-[0.12em] text-[#06224C] sm:block">
              Project Settings
            </span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#06224C]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
        </div>
      </motion.header>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <SettingsHero title="Shape this workspace" description="Keep account, subscription, and project preferences aligned in one place." />
        <SettingsQuickLinks />
        <ProfileSettingsPanel />
        <SubscriptionPanel />
        <ProjectSettingsForm projectId={projectId} />
      </div>
    </main>
  );
}

function SettingsHero({ title, description }: { title: string; description: string }) {
  return (
    <motion.section variants={fadeUp} initial="hidden" animate="visible" className="flex items-center justify-between gap-5 overflow-hidden rounded-3xl bg-gradient-to-r from-[#06224C] via-blue-700 to-cyan-500 p-6 text-white shadow-[0_28px_80px_rgba(6,34,76,0.22)] sm:p-8">
      <div><p className="text-[10px] font-black uppercase tracking-[0.32em] text-cyan-100">Dashboard settings</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">{title}</h1><p className="mt-3 max-w-2xl text-sm font-medium text-white/80">{description}</p></div>
      <Settings2 className="hidden h-10 w-10 shrink-0 text-cyan-100 sm:block" />
    </motion.section>
  );
}

/**
 * Project Settings page — uses query param ?id=xxx.
 * Wrapped in Suspense because useSearchParams requires it during static export.
 */
export default function ProjectSettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="dashboard-page min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
          </div>
        </main>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
