"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CalendarDays,
  Clock,
  RefreshCw,
} from "lucide-react";
import { fadeUp, staggerContainer, staggerChild } from "@/lib/motion";
import { getAnalyticsData, seedDemoAnalytics, trackPageView, trackVisitor } from "@/lib/analytics";
import { assetPath } from "@/lib/paths";
import AnalyticsCards from "@/components/analytics/AnalyticsCards";
import ViewsChart from "@/components/analytics/ViewsChart";
import VisitorsChart from "@/components/analytics/VisitorsChart";
import TopPages from "@/components/analytics/TopPages";
import ActivityTable from "@/components/analytics/ActivityTable";
import type { AnalyticsData, AnalyticsDateFilter } from "@/types/analytics";

const filterOptions: { value: AnalyticsDateFilter; label: string; icon: React.ElementType }[] = [
  { value: "today", label: "Today", icon: Clock },
  { value: "7days", label: "7 Days", icon: Calendar },
  { value: "30days", label: "30 Days", icon: CalendarDays },
];

function AnalyticsContent() {
  const [filter, setFilter] = useState<AnalyticsDateFilter>("7days");
  const [data, setData] = useState<AnalyticsData | null>(null);

  const loadData = (f: AnalyticsDateFilter) => {
    const analytics = getAnalyticsData(f);
    setData(analytics);
  };

  useEffect(() => {
    trackVisitor();
    trackPageView("/analytics");

    // Check if we have data; seed demo data if empty
    const initial = getAnalyticsData("30days");
    if (initial.totalViews === 0) {
      seedDemoAnalytics();
    }

    loadData(filter);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData(filter);
  }, [filter]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
      </div>
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
              Analytics
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

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 sm:space-y-8">
          {/* Title + Filters */}
          <motion.div variants={staggerChild} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#06224C] sm:text-3xl">Analytics</h1>
              <p className="mt-1 text-sm text-slate-500">Track your website performance and visitor engagement.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Date Filters */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {filterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilter(opt.value)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      filter === opt.value
                        ? "bg-white text-[#06224C] shadow-sm"
                        : "text-slate-500 hover:text-[#06224C]"
                    }`}
                  >
                    <opt.icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => loadData(filter)}
                className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-[#06224C]"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div variants={staggerChild}>
            <AnalyticsCards data={data} />
          </motion.div>

          {/* Charts Row */}
          <motion.div variants={staggerChild} className="grid gap-4 lg:grid-cols-2 sm:gap-6">
            <ViewsChart data={data.dailyTraffic} title="Daily Traffic" />
            <VisitorsChart data={data.weeklyTraffic} />
          </motion.div>

          {/* Bottom Row */}
          <motion.div variants={staggerChild} className="grid gap-4 lg:grid-cols-2 sm:gap-6">
            <TopPages pages={data.topPages} />
            <ActivityTable events={data.recentActivity} />
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

/**
 * Analytics page — rendered client-side only since it depends on
 * localStorage for analytics data and sessionStorage for session tracking.
 */
export default function AnalyticsPage() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <main className="dashboard-page min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      </main>
    );
  }

  return <AnalyticsContent />;
}
