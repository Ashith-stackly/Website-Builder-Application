"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, ExternalLink } from "lucide-react";

type BillingEntry = { planTier?: string; planName?: string; status?: string; amount?: string };

export default function SubscriptionPanel() {
  const [plan, setPlan] = useState<BillingEntry>({ planTier: "Free", status: "Free", amount: "$0.00" });

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const rows = JSON.parse(window.localStorage.getItem("stacklyPlanningBillingHistory") || "[]") as BillingEntry[];
        if (Array.isArray(rows) && rows[0]) setPlan(rows[0]);
      } catch { /* retain the free-plan fallback */ }
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section id="subscription-settings" className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700"><CreditCard className="h-5 w-5" /></span>
          <div><p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">Billing</p><h2 className="text-xl font-black text-[#06224C]">Subscription</h2></div>
        </div>
        <Link href="/planning" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#06224C] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-blue-800">Manage plan <ExternalLink className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current plan</p><p className="mt-1 font-black text-[#06224C]">{plan.planTier || plan.planName || "Free"}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</p><p className="mt-1 font-black text-emerald-600">{plan.status || "Free"}</p></div>
        <div className="rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last charge</p><p className="mt-1 font-black text-[#06224C]">{plan.amount || "$0.00"}</p></div>
      </div>
    </section>
  );
}
