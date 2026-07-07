"use client";

import React from "react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainer, staggerChild } from "@/lib/motion";
import { Clock, FileText } from "lucide-react";
import type { AnalyticsEvent } from "@/types/analytics";

interface ActivityTableProps {
  events: AnalyticsEvent[];
}

export default function ActivityTable({ events }: ActivityTableProps) {
  if (events.length === 0) {
    return (
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
      >
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#06224C]">
          Recent Activity
        </h3>
        <p className="py-8 text-center text-sm text-slate-400">No recent activity recorded.</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-[#06224C]">
        Recent Activity
      </h3>

      {/* Desktop Table */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-100 sm:block">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/80">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Page</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Session</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Time</th>
            </tr>
          </thead>
          <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
            {events.map((event) => (
              <motion.tr
                key={event.id}
                variants={staggerChild}
                className="border-t border-slate-50 transition-colors hover:bg-blue-50/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-sm font-semibold text-[#06224C]">{event.page}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                    {event.sessionId.slice(0, 8)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(event.timestamp)}
                  </div>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-2 sm:hidden">
        {events.slice(0, 10).map((event) => (
          <motion.div
            key={event.id}
            variants={staggerChild}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs font-semibold text-[#06224C]">{event.page}</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              {formatTimestamp(event.timestamp)}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
