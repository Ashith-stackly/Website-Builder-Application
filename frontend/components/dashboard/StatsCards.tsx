"use client";

import React from "react";
import { motion } from "framer-motion";
import { Activity, Blocks, FolderKanban, Gauge } from "lucide-react";
import { staggerContainer, staggerChild } from "@/lib/motion";
import type { Project } from "@/types/project";

interface StatsCardsProps {
  projects: Project[];
}

interface StatItem {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  accent: string;
}

export default function StatsCards({ projects }: StatsCardsProps) {
  const now = new Date();
  const thisWeek = projects.filter((p) => {
    const updated = new Date(p.updatedAt);
    return now.getTime() - updated.getTime() < 7 * 24 * 60 * 60 * 1000;
  });

  const categories = new Set(projects.map((p) => p.category));

  const stats: StatItem[] = [
    {
      label: "Total Projects",
      value: projects.length,
      icon: FolderKanban,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      accent: "from-blue-500 to-cyan-500",
    },
    {
      label: "Active This Week",
      value: thisWeek.length,
      icon: Activity,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-100",
      accent: "from-emerald-500 to-teal-500",
    },
    {
      label: "Categories Used",
      value: categories.size,
      icon: Gauge,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      borderColor: "border-violet-100",
      accent: "from-violet-500 to-fuchsia-500",
    },
    {
      label: "Total Components",
      value: projects.reduce((acc, p) => acc + (p.components?.length ?? 0), 0),
      icon: Blocks,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-100",
      accent: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
    >
      {stats.map((stat) => (
        <motion.div
          key={stat.label}
          variants={staggerChild}
          whileHover={{ y: -5, scale: 1.015 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className={`group relative overflow-hidden rounded-2xl border ${stat.borderColor} bg-white p-4 shadow-sm transition-shadow duration-300 hover:shadow-lg sm:p-5`}
        >
          <motion.div
            className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.accent}`}
            initial={{ scaleX: 0, transformOrigin: "left" }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          />
          <div className="relative">
            <motion.div
              whileHover={{ rotate: -6, scale: 1.08 }}
              className={`mb-3 inline-flex rounded-xl ${stat.bgColor} p-2.5`}
            >
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </motion.div>
            <div className="text-2xl font-black text-[#06224C] sm:text-3xl">
              <AnimatedCounter value={stat.value} />
            </div>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:text-xs">
              {stat.label}
            </p>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }

    const duration = 650;
    const steps = 32;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  return <span>{display}</span>;
}
