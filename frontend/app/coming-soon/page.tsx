"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FaWandMagicSparkles, FaArrowLeft } from "react-icons/fa6";

export default function ComingSoonPage() {
  return (
    <main className="min-h-screen bg-[#FFF1F2] text-gray-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white p-10 text-center shadow-[0_24px_70px_rgba(6,34,76,0.15)] ring-1 ring-slate-100/50"
      >
        {/* Animated Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <FaWandMagicSparkles className="text-3xl animate-pulse" />
        </div>

        <h1 className="mb-3 text-3xl font-black text-[#06224C] md:text-4xl">Coming Soon</h1>
        <p className="mb-8 text-sm md:text-base font-semibold text-gray-500 leading-relaxed">
          This template is currently under design and will be available very soon. Stay tuned for updates!
        </p>

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-[#06224C] py-4 text-xs font-black uppercase tracking-widest text-white shadow-md transition hover:bg-blue-900 hover:scale-[1.02] active:scale-[0.98]"
        >
          <FaArrowLeft className="text-xs" />
          Back to Home
        </Link>
      </motion.div>
    </main>
  );
}
