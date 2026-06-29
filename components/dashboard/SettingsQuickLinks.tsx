"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BarChart3, CreditCard, LayoutDashboard, LifeBuoy, PlusCircle, Sparkles } from "lucide-react";
import { fadeUp } from "@/lib/motion";

const links = [
  { href: "/dashboard", title: "Dashboard", description: "Back to projects", icon: LayoutDashboard, color: "from-blue-600 to-cyan-500" },
  { href: "/dashboard/analytics", title: "Analytics", description: "View traffic insights", icon: BarChart3, color: "from-violet-600 to-fuchsia-500" },
  { href: "/landing#templates", title: "Templates", description: "Browse starters", icon: Sparkles, color: "from-amber-500 to-orange-500" },
  { href: "/planning", title: "Plans", description: "Manage upgrades", icon: CreditCard, color: "from-emerald-600 to-teal-500" },
  { href: "/builder", title: "Builder", description: "Open editor", icon: PlusCircle, color: "from-slate-900 to-blue-700" },
  { href: "/landing#contact", title: "Support", description: "Contact Stackly", icon: LifeBuoy, color: "from-rose-500 to-pink-500" },
];

export default function SettingsQuickLinks() {
  return (
    <motion.section variants={fadeUp} initial="hidden" animate="visible" className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
      <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[0.26em] text-blue-700">Quick navigation</p><h2 className="mt-1 text-xl font-black text-[#06224C]">Jump to another workspace area</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ icon: Icon, ...item }) => (
          <motion.div key={item.href} whileHover={{ y: -4, scale: 1.01 }}>
            <Link href={item.href} className="group flex min-h-[92px] items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-blue-100 hover:shadow-xl">
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}><Icon className="h-5 w-5" /></span>
              <span><span className="block text-sm font-black text-[#06224C] group-hover:text-blue-700">{item.title}</span><span className="mt-0.5 block text-xs font-semibold text-slate-400">{item.description}</span></span>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
