"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { motion, type Variants } from "framer-motion";
import { FaArrowRight, FaBullseye, FaEye, FaGem, FaHeart, FaFlag, FaUsers, FaRocket, FaStar, FaGlobe, FaLayerGroup, FaHeadset } from "react-icons/fa6";

const revealContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.06 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FFF1F2] text-[#06224C] font-sans flex flex-col">
      <div className="flex-grow pb-12">
        {/* ── Marquee Banner ───────────────────────────────────────────────── */}
        <motion.section className="py-12 md:py-20 bg-white/30 text-center border-y border-[#06224C]/5 overflow-hidden" initial="hidden" animate="visible" variants={fadeUp}>
          <motion.h1
            className="text-5xl md:text-8xl font-black text-[#06224C] opacity-25 tracking-tighter uppercase pointer-events-none select-none break-words"
            aria-hidden="true"
            animate={{ x: [-12, 12, -12] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            Innovation * Growth
          </motion.h1>
        </motion.section>

        {/* ── Existing Mission / Vision / Why Us ───────────────────────────── */}
        <motion.section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20" variants={revealContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }}>
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10" variants={revealContainer}>
            {/* 01 Mission */}
            <motion.div className="bg-[#06224C] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-lg group text-white" variants={fadeUp} whileHover={{ y: -8, boxShadow: "0 28px 60px rgba(6,34,76,0.24)" }}>
              <span className="text-4xl md:text-5xl font-black text-blue-400/30 group-hover:text-blue-500 transition duration-500 block" aria-hidden="true">
                01.
              </span>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-4 mb-4 break-words" style={{ letterSpacing: "-1px" }}>
                Our Mission
              </h3>
              <p className="text-xs text-blue-100/70 leading-relaxed mb-6 break-words" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                Our mission is simple—create tools that solve real problems. We aim to enhance your experience through innovation and reliability.
              </p>
              <div className="rounded-2xl overflow-hidden h-36 md:h-40">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=800"
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                  alt="Team collaborating in office"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* 02 Vision */}
            <motion.div className="bg-[#06224C] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-lg group text-white" variants={fadeUp} whileHover={{ y: -8, boxShadow: "0 28px 60px rgba(6,34,76,0.24)" }}>
              <span className="text-4xl md:text-5xl font-black text-blue-400/30 group-hover:text-blue-500 transition duration-500 block" aria-hidden="true">
                02.
              </span>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-4 mb-4 break-words" style={{ letterSpacing: "-1px" }}>
                Our Vision
              </h3>
              <p className="text-xs text-blue-100/70 leading-relaxed mb-6 break-words" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                We envision a future where technology serves as an enabler for creativity. Stackly strives to be a leader in scalable tools.
              </p>
              <div className="rounded-2xl overflow-hidden h-36 md:h-40">
                <img
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=500"
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                  alt="Meeting room discussion"
                  loading="lazy"
                />
              </div>
            </motion.div>

            {/* 03 Why Us */}
            <motion.div className="bg-[#06224C] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-lg group text-white" variants={fadeUp} whileHover={{ y: -8, boxShadow: "0 28px 60px rgba(6,34,76,0.24)" }}>
              <span className="text-4xl md:text-5xl font-black text-blue-400/30 group-hover:text-blue-500 transition duration-500 block" aria-hidden="true">
                03.
              </span>
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-4 mb-4 break-words" style={{ letterSpacing: "-1px" }}>
                Why Us?
              </h3>
              <p className="text-xs text-blue-100/70 leading-relaxed mb-6 break-words" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
                Our team brings a wealth of knowledge to every project. We prioritize your needs to deliver solutions that truly add value.
              </p>
              <div className="rounded-2xl overflow-hidden h-36 md:h-40 grayscale group-hover:grayscale-0 transition duration-500">
                <img
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=500"
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                  alt="Team working together"
                  loading="lazy"
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* ── Existing Stats Row ────────────────────────────────────────────── */}
        <motion.section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 md:pb-16" variants={revealContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8" variants={revealContainer}>
            {[
              { value: "500K +", label: "Users Worldwide" },
              { value: "120 +",  label: "Team Members"    },
              { value: "2015",   label: "Founded"         },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-md text-center border border-gray-50"
                variants={scaleIn}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                <p className="text-2xl md:text-4xl font-black text-[#06224C]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] md:text-xs font-bold uppercase tracking-widest text-gray-500">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Expanded Content (Now Always Visible) ────────────────────────── */}
        <div className="bg-white pt-16 border-t border-gray-200">
          
          {/* New Hero Section */}
          <motion.section className="bg-[#EAF1FA] py-16 md:py-24 px-4 sm:px-6 rounded-t-[3rem]" variants={revealContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }}>
            <motion.div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20" variants={revealContainer}>
              <motion.div className="w-full lg:w-1/2 space-y-6" variants={fadeUp}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">About Us</h3>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif italic font-black text-[#0A2357] leading-tight">
                  Building Better Websites for a Better Future
                </h2>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-xl">
                  Stackly is a powerful website builder that empowers individuals, businesses, and organizations to create stunning websites without any coding. We combine simplicity with flexibility to help you build, grow, and succeed online.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  {/* ADDED FOCUS RING */}
                  <Link href="/products" className="bg-[#0A2357] text-white px-8 py-3.5 rounded-lg text-sm font-bold shadow-lg hover:bg-blue-900 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EAF1FA]">
                    Explore Our Products
                  </Link>
                  {/* ADDED FOCUS RING */}
                  <Link href="/contact" className="bg-white text-[#0A2357] border border-gray-200 px-8 py-3.5 rounded-lg text-sm font-bold shadow-sm hover:border-gray-300 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#EAF1FA]">
                    Contact Us
                  </Link>
                </div>
              </motion.div>
              <motion.div className="w-full lg:w-1/2" variants={scaleIn} whileHover={{ y: -7, rotate: 0.4 }}>
                <img 
                  src="/about.webp" 
                  alt="Team shaking hands" 
                  className="rounded-2xl shadow-2xl object-cover w-full h-[300px] md:h-[450px]"
                />
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Mission / Vision / Values / Promise Bar */}
          <motion.section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-10" variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }}>
            <motion.div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100 p-2 md:p-4" variants={revealContainer}>
              {[
                { icon: <FaBullseye />, title: "Our Mission", desc: "To make website building easy, accessible, and effective for everyone." },
                { icon: <FaEye />, title: "Our Vision", desc: "To be the world's most trusted website platform for creators and businesses." },
                { icon: <FaGem />, title: "Our Values", desc: "Simplicity, innovation, reliability, and customer success drive everything we do." },
                { icon: <FaHeart />, title: "Our Promise", desc: "We're committed to your success with tools, support, and continuous improvement." },
              ].map((item, idx) => (
                <motion.div key={idx} className="flex-1 p-6 flex gap-4 items-start" variants={fadeUp} whileHover={{ y: -4 }}>
                  <div className="bg-[#0A2357] text-white p-2.5 rounded-lg flex-shrink-0 mt-1">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A2357] mb-2">{item.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

          {/* Our Story Timeline */}
          <motion.section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28" variants={revealContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.14 }}>
            <motion.div className="flex flex-col lg:flex-row gap-12 lg:gap-16" variants={revealContainer}>
              
              <motion.div className="w-full lg:w-1/3 space-y-6" variants={fadeUp}>
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">Our Story</h3>
                <h2 className="text-3xl md:text-4xl font-black text-[#0A2357] leading-tight">
                  From an Idea to a Powerful Platform
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Founded in 2015, Stackly began with a simple goal: to help people create professional websites without technical barriers. What started as a small idea has grown into a powerful platform trusted by thousands of users worldwide.
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Today, we continue to innovate and expand our features to deliver the best website building experience possible.
                </p>
                {/* ADDED FOCUS RING */}
                <button aria-label="Read more about our story" className="text-blue-600 hover:text-blue-800 transition rounded-md p-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
                  <FaArrowRight />
                </button>
              </motion.div>

              <motion.div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6" variants={revealContainer}>
                {[
                  { icon: <FaFlag />, year: "2015", title: "The Beginning", desc: "Stackly was founded with a mission to simplify website creation for all." },
                  { icon: <FaUsers />, year: "2018", title: "Growing Together", desc: "We reached our first 10,000 users and expanded our team and features." },
                  { icon: <FaRocket />, year: "2021", title: "Expanding Horizons", desc: "New tools, templates, and integrations helped businesses scale online." },
                  { icon: <FaStar />, year: "Today", title: "Stronger Than Ever", desc: "Thousands of users trust Stackly to build, manage, and grow their online presence." },
                ].map((item, idx) => (
                  <motion.div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl transition duration-300 group flex flex-col items-center" variants={fadeUp} whileHover={{ y: -8, scale: 1.02 }}>
                    <div className="bg-[#EAF1FA] text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition duration-300">
                      {item.icon}
                    </div>
                    <h4 className="font-bold text-[#0A2357] text-sm mb-1">{item.year}</h4>
                    <h5 className="font-bold text-[#0A2357] text-sm mb-3">{item.title}</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </motion.div>

            </motion.div>
          </motion.section>

          {/* Dark Stats Banner */}
          <motion.section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20" variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
            <motion.div className="bg-[#06183A] rounded-2xl md:rounded-[2rem] p-8 md:p-12 shadow-2xl" variants={scaleIn}>
              <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10" variants={revealContainer}>
                {[
                  { icon: <FaUsers />, stat: "50K+", label: "Happy Users" },
                  { icon: <FaGlobe />, stat: "120+", label: "Countries" },
                  { icon: <FaLayerGroup />, stat: "100+", label: "Templates" },
                  { icon: <FaHeadset />, stat: "24/7", label: "Customer Support" },
                ].map((item, idx) => (
                  <motion.div key={idx} className={`flex items-center gap-4 ${idx !== 0 && idx !== 2 ? 'pl-4 sm:pl-8' : ''} ${idx === 2 ? 'pl-0 md:pl-8' : ''}`} variants={fadeUp} whileHover={{ scale: 1.05 }}>
                    <div className="text-white text-3xl opacity-80">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg md:text-xl">{item.stat}</h4>
                      <p className="text-white/60 text-[10px] md:text-xs font-medium">{item.label}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </motion.section>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <Footer />

      {/* ── Zoom-safe global styles ───────────────────────────────────────── */}
      <style>{`
        h1, h2, h3, h4, p {
          overflow-wrap: break-word;
          word-wrap: break-word;
          hyphens: auto;
        }
        @media (max-width: 480px) {
          section {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}