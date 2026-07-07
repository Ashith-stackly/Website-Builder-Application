"use client";

import React from "react";
import { motion } from "framer-motion";
import { Eye, Users, TrendingUp, BarChart3 } from "lucide-react";
import { staggerContainer, staggerChild } from "@/lib/motion";
import type { AnalyticsData } from "@/types/analytics";

interface AnalyticsCardsProps {
  data: AnalyticsData;
}

interface CardItem {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  change?: string;
}

export default function AnalyticsCards({ data }: AnalyticsCardsProps) {
  const cards: CardItem[] = [
    {
      label: "Total Views",
      value: data.totalViews,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
    },
    {
      label: "Unique Visitors",
      value: data.uniqueVisitors,
      icon: Users,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
    },
    {
      label: "Today's Views",
      value: data.todayViews,
      icon: TrendingUp,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-100",
    },
    {
      label: "Weekly Views",
      value: data.weeklyViews,
      icon: BarChart3,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
    >
      {cards.map((card) => (
        <motion.div
          key={card.label}
          variants={staggerChild}
          className={`group relative overflow-hidden rounded-2xl border ${card.borderColor} bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-5`}
        >
          <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full ${card.bgColor} opacity-50 transition-transform duration-500 group-hover:scale-150`} />
          <div className="relative">
            <div className={`mb-3 inline-flex rounded-xl ${card.bgColor} p-2.5`}>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="text-2xl font-black text-[#06224C] sm:text-3xl">
              <AnimatedNumber value={card.value} />
            </div>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:text-xs">
              {card.label}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const steps = 30;
    const inc = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += inc;
      if (current >= value) { setDisplay(value); clearInterval(interval); }
      else setDisplay(Math.floor(current));
    }, 20);
    return () => clearInterval(interval);
  }, [value]);

  return <span>{display.toLocaleString()}</span>;
}
