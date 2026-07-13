"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fadeUp } from "@/lib/motion";
import type { WeeklyTraffic } from "@/types/analytics";

interface VisitorsChartProps {
  data: WeeklyTraffic[];
}

export default function VisitorsChart({ data }: VisitorsChartProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#06224C]">
        Weekly Visitors
      </h3>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="week"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 600 }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
              dx={-4}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#06224C",
                border: "none",
                borderRadius: "12px",
                padding: "10px 14px",
                boxShadow: "0 12px 28px rgba(6, 34, 76, 0.25)",
              }}
              labelStyle={{ color: "#94a3b8", fontSize: 10, fontWeight: 700, marginBottom: 4 }}
              itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 700 }}
              cursor={{ fill: "rgba(59, 130, 246, 0.06)" }}
            />
            <Bar
              dataKey="visitors"
              name="Visitors"
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            />
            <Bar
              dataKey="views"
              name="Views"
              fill="#e2e8f0"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              opacity={0.5}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500" />
          <span className="text-xs font-semibold text-slate-500">Visitors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          <span className="text-xs font-semibold text-slate-500">Views</span>
        </div>
      </div>
    </motion.div>
  );
}
