"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fadeUp } from "@/lib/motion";
import type { DailyTraffic } from "@/types/analytics";

interface ViewsChartProps {
  data: DailyTraffic[];
  title?: string;
}

export default function ViewsChart({ data, title = "Traffic Overview" }: ViewsChartProps) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#06224C]">
        {title}
      </h3>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }}
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
              labelStyle={{ color: "#94a3b8", fontSize: 11, fontWeight: 700, marginBottom: 4 }}
              itemStyle={{ color: "#ffffff", fontSize: 12, fontWeight: 700 }}
              cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }}
            />
            <Area
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#viewsGradient)"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff", fill: "#3b82f6" }}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              name="Visitors"
              stroke="#8b5cf6"
              strokeWidth={2}
              fill="url(#visitorsGradient)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#8b5cf6" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-5">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
          <span className="text-xs font-semibold text-slate-500">Page Views</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-violet-500" />
          <span className="text-xs font-semibold text-slate-500">Visitors</span>
        </div>
      </div>
    </motion.div>
  );
}
