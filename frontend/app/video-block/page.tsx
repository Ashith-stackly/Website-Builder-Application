"use client";
import React from 'react';
import Footer from '@/components/Footer';
import { motion, type Variants } from 'framer-motion';
import { FaPlay, FaPen } from 'react-icons/fa6';
import { assetPath } from "@/lib/paths";
 
const revealContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
};
 
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
 
const slideInRight: Variants = {
  hidden: { opacity: 0, x: 36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.65, ease: "easeOut" } },
};
 
export default function VideoBlockPage() {
  return (
    <main className="site-page flex min-h-screen flex-col bg-[#0A1931]">
      <motion.section
        className="relative w-full flex-grow flex items-center justify-center py-20 px-4 sm:px-8 md:px-14 lg:px-24 overflow-hidden"
        variants={revealContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="relative mx-auto flex w-full max-w-7xl flex-col-reverse lg:flex-row items-center justify-between gap-12 lg:gap-8 bg-[#0B1D40] rounded-[2.5rem] p-8 md:p-16 lg:p-20 shadow-2xl border border-white/5">
         
          {/* LEFT COLUMN: Text Content */}
          <motion.div className="flex w-full flex-col justify-center space-y-6 lg:w-1/2 relative z-10" variants={revealContainer}>
            <motion.div variants={fadeUp}>
              <p className="text-[#38BDF8] font-bold tracking-widest uppercase text-sm md:text-base mb-4">
                Creative Marketing
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
                Showreel 2026
              </h1>
              <p className="text-gray-300 text-base sm:text-lg md:text-xl font-medium max-w-md leading-relaxed mb-8">
                We Create digital experience that drives results.
              </p>
            </motion.div>
 
            <motion.div variants={fadeUp}>
              <button
                type="button"
                className="group flex items-center gap-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-8 py-4 rounded-full font-bold uppercase text-sm tracking-wider hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/30"
              >
                Watch Now
                <div className="bg-white text-blue-600 rounded-full w-8 h-8 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FaPlay className="text-xs ml-0.5" aria-hidden="true" />
                </div>
              </button>
            </motion.div>
          </motion.div>
 
          {/* RIGHT COLUMN: Image */}
          <motion.div
            className="relative w-full lg:w-1/2 flex justify-center lg:justify-end"
            variants={slideInRight}
          >
            <div className="relative w-full max-w-[500px] aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl">
              <img
                src={assetPath("/video_block_bg.png")}
                alt="Workspace Desk"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay"></div>
            </div>
          </motion.div>
 
          {/* CENTER: Edit Button Overlay (as shown in design) */}
          <motion.button
            variants={fadeUp}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-1/2 top-[40%] lg:top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] border-4 border-[#0B1D40] text-blue-600 transition-transform"
            aria-label="Edit Video Block"
          >
            <FaPen className="text-xl" />
          </motion.button>
         
        </div>
      </motion.section>
      <Footer />
    </main>
  );
}