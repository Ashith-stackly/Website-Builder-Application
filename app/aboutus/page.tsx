"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { FaArrowRight, FaBullseye, FaEye, FaGem, FaHeart, FaFlag, FaUsers, FaRocket, FaStar, FaGlobe, FaLayerGroup, FaHeadset } from "react-icons/fa6";

export default function AboutPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#FFF1F2] text-[#06224C] font-sans flex flex-col">
      <div className="flex-grow pb-12">
        {/* ── Marquee Banner ───────────────────────────────────────────────── */}
        <section className="py-12 md:py-20 bg-white/30 text-center border-y border-[#06224C]/5 overflow-hidden">
          <h1
            className="text-5xl md:text-8xl font-black text-[#06224C] opacity-25 tracking-tighter uppercase pointer-events-none select-none break-words"
            aria-hidden="true"
          >
            Innovation * Growth
          </h1>
        </section>

        {/* ── Existing Mission / Vision / Why Us ───────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {/* 01 Mission */}
            <div className="bg-[#06224C] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-lg group text-white">
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
            </div>

            {/* 02 Vision */}
            <div className="bg-[#06224C] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-lg group text-white">
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
            </div>

            {/* 03 Why Us */}
            <div className="bg-[#06224C] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-lg group text-white">
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
            </div>
          </div>
        </section>

        {/* ── Existing Stats Row ────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 md:pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8">
            {[
              { value: "500K +", label: "Users Worldwide" },
              { value: "120 +",  label: "Team Members"    },
              { value: "2015",   label: "Founded"         },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-md text-center border border-gray-50"
              >
                <p className="text-2xl md:text-4xl font-black text-[#06224C]">
                  {stat.value}
                </p>
                <p className="mt-1 text-[11px] md:text-xs font-bold uppercase tracking-widest text-gray-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Expanded Content (Now Always Visible) ────────────────────────── */}
        <div className="bg-white pt-16 border-t border-gray-200">
          
          {/* New Hero Section */}
          <section className="bg-[#EAF1FA] py-16 md:py-24 px-4 sm:px-6 rounded-t-[3rem]">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              <div className="w-full lg:w-1/2 space-y-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-blue-600">About Us</h3>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif italic font-black text-[#0A2357] leading-tight">
                  Building Better Websites for a Better Future
                </h2>
                <p className="text-gray-600 text-base md:text-lg leading-relaxed max-w-xl">
                  Stackly is a powerful website builder that empowers individuals, businesses, and organizations to create stunning websites without any coding. We combine simplicity with flexibility to help you build, grow, and succeed online.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link href="/products" className="bg-[#0A2357] text-white px-8 py-3.5 rounded-lg text-sm font-bold shadow-lg hover:bg-blue-900 transition">
                    Explore Our Products
                  </Link>
                  <Link href="/contact" className="bg-white text-[#0A2357] border border-gray-200 px-8 py-3.5 rounded-lg text-sm font-bold shadow-sm hover:border-gray-300 transition">
                    Contact Us
                  </Link>
                </div>
              </div>
              <div className="w-full lg:w-1/2">
                <img 
                  src="/about.webp" 
                  alt="Team shaking hands" 
                  className="rounded-2xl shadow-2xl object-cover w-full h-[300px] md:h-[450px]"
                />
              </div>
            </div>
          </section>

          {/* Mission / Vision / Values / Promise Bar */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
            <div className="bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100 p-2 md:p-4">
              {[
                { icon: <FaBullseye />, title: "Our Mission", desc: "To make website building easy, accessible, and effective for everyone." },
                { icon: <FaEye />, title: "Our Vision", desc: "To be the world's most trusted website platform for creators and businesses." },
                { icon: <FaGem />, title: "Our Values", desc: "Simplicity, innovation, reliability, and customer success drive everything we do." },
                { icon: <FaHeart />, title: "Our Promise", desc: "We're committed to your success with tools, support, and continuous improvement." },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 p-6 flex gap-4 items-start">
                  <div className="bg-[#0A2357] text-white p-2.5 rounded-lg flex-shrink-0 mt-1">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A2357] mb-2">{item.title}</h4>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Our Story Timeline */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28">
            <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
              
              <div className="w-full lg:w-1/3 space-y-6">
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
                <button className="text-blue-600 hover:text-blue-800 transition">
                  <FaArrowRight />
                </button>
              </div>

              <div className="w-full lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                  { icon: <FaFlag />, year: "2015", title: "The Beginning", desc: "Stackly was founded with a mission to simplify website creation for all." },
                  { icon: <FaUsers />, year: "2018", title: "Growing Together", desc: "We reached our first 10,000 users and expanded our team and features." },
                  { icon: <FaRocket />, year: "2021", title: "Expanding Horizons", desc: "New tools, templates, and integrations helped businesses scale online." },
                  { icon: <FaStar />, year: "Today", title: "Stronger Than Ever", desc: "Thousands of users trust Stackly to build, manage, and grow their online presence." },
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl transition duration-300 group flex flex-col items-center">
                    <div className="bg-[#EAF1FA] text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition duration-300">
                      {item.icon}
                    </div>
                    <h4 className="font-bold text-[#0A2357] text-sm mb-1">{item.year}</h4>
                    <h5 className="font-bold text-[#0A2357] text-sm mb-3">{item.title}</h5>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

            </div>
          </section>

          {/* Dark Stats Banner */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
            <div className="bg-[#06183A] rounded-2xl md:rounded-[2rem] p-8 md:p-12 shadow-2xl">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/10">
                {[
                  { icon: <FaUsers />, stat: "50K+", label: "Happy Users" },
                  { icon: <FaGlobe />, stat: "120+", label: "Countries" },
                  { icon: <FaLayerGroup />, stat: "100+", label: "Templates" },
                  { icon: <FaHeadset />, stat: "24/7", label: "Customer Support" },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-4 ${idx !== 0 && idx !== 2 ? 'pl-4 sm:pl-8' : ''} ${idx === 2 ? 'pl-0 md:pl-8' : ''}`}>
                    <div className="text-white text-3xl opacity-80">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg md:text-xl">{item.stat}</h4>
                      <p className="text-white/60 text-[10px] md:text-xs font-medium">{item.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
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