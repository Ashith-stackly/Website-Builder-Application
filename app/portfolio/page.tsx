"use client";

import { MutableRefObject, useEffect, useRef, useState, FormEvent, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, type Variants } from "framer-motion";


import {
  FaBars,
  FaArrowRight,
  FaMobileAlt,
  FaEnvelope,
  FaPaperPlane,
  FaLaptop,
  FaTabletAlt,
} from "react-icons/fa";

import {
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
  FaYoutube,
  FaEnvelope as FaEnvelope6,
  FaPaperPlane as FaPaperPlane6,
} from "react-icons/fa6";

import { FaEye } from "react-icons/fa";
import { assetPath } from "@/lib/paths";

function useLocalInView<T extends HTMLElement>({
  threshold = 0.3,
  triggerOnce = false,
}: {
  threshold?: number;
  triggerOnce?: boolean;
} = {}): { ref: MutableRefObject<T | null>; inView: boolean } {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = Boolean(entry?.isIntersecting);
        setInView(isVisible);
        if (isVisible && triggerOnce) observer.disconnect();
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, triggerOnce]);

  return { ref, inView };
}

function AnimatedCount({
  start = 0,
  end,
  suffix = "",
  duration = 1.2,
}: {
  start?: number;
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [value, setValue] = useState(start);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();
    const durationMs = duration <= 20 ? duration * 1000 : duration;

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1);
      setValue(Math.round(start + (end - start) * progress));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [duration, end, start]);

  return (
    <>
      {value}
      {suffix}
    </>
  );
}

type ModalKey =
  | "features"
  | "templates"
  | "pricing"
  | "changelog"
  | "documentation"
  | "api"
  | "blog"
  | "status"
  | "privacy"
  | "terms";

const modalContent: Record<ModalKey, { title: string; body: ReactNode }> = {
  terms: {
    title: "Terms of Use",
    body: (
      <>
        <p>Welcome to Stackly. By accessing or using our platform, you agree to these Terms of Use.</p>
        <h4>1. Account Responsibilities</h4>
        <p>You are responsible for maintaining your login credentials and all activity under your account.</p>
        <h4>2. Template Usage</h4>
        <p>Templates may be customized for your own projects. Redistribution or resale without permission is not allowed.</p>
        <h4>3. Payments</h4>
        <p>Paid assets and subscriptions are billed according to the plan selected at purchase.</p>
        <h4>4. Platform Changes</h4>
        <p>We may improve, update, or discontinue features to keep Stackly reliable and secure.</p>
      </>
    ),
  },
  privacy: {
    title: "Privacy Policy",
    body: (
      <>
        <p>Your privacy is important to us. This policy explains how Stackly collects, uses, and protects your information.</p>
        <h4>1. Information We Collect</h4>
        <p>We collect account details, contact information, usage data, and project preferences needed to operate the platform.</p>
        <h4>2. How We Use Data</h4>
        <p>We use data to provide services, improve templates, process payments, prevent abuse, and send important updates.</p>
        <h4>3. Security</h4>
        <p>We use reasonable safeguards to protect user data, though no internet transmission is completely risk free.</p>
        <h4>4. Your Rights</h4>
        <p>You can request access, correction, or deletion of personal data by contacting privacy@thestackly.com.</p>
      </>
    ),
  },
  documentation: {
    title: "Documentation & User Guides",
    body: (
      <>
        <h4>Project Initialization</h4>
        <p>Start with a template, choose your category, and customize page sections with the visual editor.</p>
        <h4>Visual Editor Essentials</h4>
        <p>Adjust text, images, spacing, colors, and responsive layouts from the builder workspace.</p>
        <h4>Publishing</h4>
        <p>Preview changes, save drafts, and publish when your design is ready.</p>
      </>
    ),
  },
  api: {
    title: "API Reference",
    body: (
      <>
        <p>The Stackly API helps manage templates, accounts, and publishing workflows over HTTPS.</p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-blue-600">
          GET /api/v2/templates
        </div>
        <p>Use secure bearer tokens for authentication and never expose secret keys in client-side code.</p>
      </>
    ),
  },
  blog: {
    title: "Stackly Engineering Blog",
    body: (
      <>
        <h4>Optimizing for 200% Zoom and Beyond</h4>
        <p>How fluid layouts and accessible focus states improve marketplace experiences.</p>
        <h4>Moving to a Multi-Region AWS Setup</h4>
        <p>Reducing latency for creators across Asia, Europe, and North America.</p>
      </>
    ),
  },
  status: {
    title: "Real-time System Status",
    body: (
      <>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 font-bold text-green-800">
          All Systems Operational
        </div>
        <p>Marketplace Frontend, Template Builder, Payment Processing, and Database services are operational.</p>
        <p className="font-black text-[#06224C]">Uptime last 30 days: 99.98%</p>
      </>
    ),
  },
  features: {
    title: "Platform Features",
    body: (
      <>
        <p>Stackly bridges visual design and modern web development with drag-and-drop editing.</p>
        <h4>High-Fidelity Drag & Drop</h4>
        <p>Position, style, and organize page sections using a friendly visual workflow.</p>
        <h4>Responsive Breakpoints</h4>
        <p>Style layouts for mobile, tablet, and desktop views.</p>
      </>
    ),
  },
  templates: {
    title: "Template Marketplace",
    body: (
      <>
        <p>Explore professionally designed templates across e-commerce, portfolio, business, blog, and landing pages.</p>
        <p>Every template can be customized for colors, typography, spacing, and content.</p>
      </>
    ),
  },
  pricing: {
    title: "Pricing Plans",
    body: (
      <>
        <h4>Starter Plan</h4>
        <p>Free plan for personal projects and learning.</p>
        <h4>Professional</h4>
        <p>$150/month for serious creators, custom domains, and priority hosting.</p>
      </>
    ),
  },
  changelog: {
    title: "Product Changelog",
    body: (
      <>
        <h4>May 2026 - Accessibility Update</h4>
        <p>Improved focus indicators, keyboard navigation, and zoom-safe layouts.</p>
        <h4>April 2026 - Performance Patch</h4>
        <p>Optimized image delivery and template preview load times.</p>
      </>
    ),
  },
};

const footerGroups = [
  ["Product", [["Features", "features"], ["Templates", "templates"], ["Pricing", "pricing"], ["Changelog", "changelog"]]],
  ["Resources", [["User Guide", "documentation"], ["API Reference", "api"], ["Blog", "blog"], ["Status", "status"]]],
  ["Company", [["About", "about"], ["Privacy Policy", "privacy"], ["Terms of Use", "terms"], ["Contact", "contact"]]],
] as const;

const socials = [
  ["Facebook", FaFacebookF, "https://www.facebook.com/thestackly/", "hover:bg-blue-500"],
  ["YouTube", FaYoutube, "https://www.youtube.com/@TheStackly", "hover:bg-red-600"],
  ["Instagram", FaInstagram, "https://www.instagram.com/the_stackly", "hover:bg-pink-500"],
  ["X", FaXTwitter, "https://x.com/The_Stackly", "hover:bg-black"],
  ["LinkedIn", FaLinkedinIn, "https://in.linkedin.com/company/the-stackly/", "hover:bg-blue-700"],
  ["Website", FaGlobe, "https://www.thestackly.com/", "hover:bg-blue-600"],
] as const;

const footerReveal: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const footerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42, ease: "easeOut" } },
};

const socialReveal: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

const socialItem: Variants = {
  hidden: { opacity: 0, scale: 0.7, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } },
};

function Footer() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const validateEmail = (email: string) => {
    const trimmedEmail = email.trim();

    const emailRegex =
      /^[a-zA-Z][a-zA-Z0-9._%+-]*@[a-zA-Z0-9.-]+\.[a-zA-Z]{3,}$/;

    return emailRegex.test(trimmedEmail);
  };

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      showToast("Please enter your email address");
      return;
    }

    if (!validateEmail(email)) {
      showToast("Please enter a valid email address");
      return;
    }

    setEmail("");
    showToast("Subscribed Successfully");
  };

  const openFooterItem = (key: string) => {
    if (key === "about") {
      router.push("/aboutus");
      return;
    }

    if (key === "contact") {
      router.push("/contact");
      return;
    }

    setActiveModal(key as ModalKey);
  };

  const modal = activeModal ? modalContent[activeModal] : null;

  return (
    <>
      <motion.footer
        id="contact"
        className="stackly-footer relative mt-auto w-full overflow-hidden bg-[#071936] pt-10 pb-24 md:pt-12 md:pb-32"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.12 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />
        <div className="pointer-events-none absolute -right-24 top-8 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-8 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <div className="mb-8 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.20)] backdrop-blur md:flex-row md:items-center md:justify-between md:p-7">
            <div className="w-full md:w-1/2">
              <h3 className="mb-2 text-sm font-black uppercase tracking-wider text-white">Subscribe to our Updates</h3>
              <p className="mb-4 max-w-md text-sm leading-relaxed text-white/60">Get template drops, builder updates, and product notes in your inbox.</p>
              <form onSubmit={handleSubscribe} className="flex w-full max-w-md items-center overflow-hidden rounded-full bg-white p-1 shadow-[0_18px_40px_rgba(0,0,0,0.18)] ring-1 ring-white/30 transition focus-within:ring-2 focus-within:ring-sky-300" aria-label="Subscribe to updates form" noValidate>
                <label className="relative flex flex-grow items-center">
                  <span className="sr-only">Email address</span>
                  <FaEnvelope6 className="absolute left-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email"
                    className="w-full min-w-0 bg-transparent py-2.5 pl-11 pr-2 text-sm text-gray-800 focus:outline-none"
                  />
                </label>
                <button type="submit" aria-label="Subscribe with email" className="mr-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0A2357] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg active:scale-95">
                  <FaPaperPlane6 className="text-sm" />
                </button>
              </form>
            </div>

            <div className="flex w-full flex-col justify-center md:w-auto md:self-stretch md:text-right">
              <h3 className="mb-2 text-sm font-black uppercase tracking-wider text-white">Headquarters</h3>
              <p className="text-sm leading-relaxed text-white/70">
                MMR Complex, Salem,<br />Tamil Nadu 636008
              </p>
            </div>
          </div>

          <motion.div
            className="mb-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4"
            variants={footerReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.18 }}
          >
            {footerGroups.map(([title, links]) => (
              <motion.div key={title} variants={footerItem}>
                <h4 className="mb-4 text-sm font-black uppercase tracking-wider text-white">{title}</h4>
                <ul className="space-y-3 text-sm font-medium text-white/70">
                  {links.map(([label, key]) => (
                    <li key={key}>
                      <button type="button" onClick={() => openFooterItem(key)} className="stackly-footer-link text-left focus:text-blue-300 focus:outline-none">
                        {label}
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}

            <motion.div className="col-span-2 mt-2 flex flex-col items-start md:col-span-1 md:mt-0" variants={footerItem}>
              <Link href="../landing" className="mb-4 inline-flex aspect-[2/1] min-w-[90px] items-center justify-center rounded-[60%] bg-white px-4 py-3 shadow-[0_14px_32px_rgba(255,255,255,0.16)] transition duration-300 hover:-translate-y-0.5 hover:scale-105">
                <img src={assetPath("/stackly-logo.webp")} alt="Stackly Logo" className="stackly-footer-logo h-5 w-auto object-contain" />
              </Link>
              <p className="mb-2 max-w-[215px] text-[11px] font-bold uppercase leading-relaxed tracking-tight text-white/70">
                The <span className="text-blue-400">NO-CODE</span> website builder for everyone. Powered by AWS.
              </p>
              <p className="text-[10px] font-medium uppercase text-white/40">Infrastructure built by the Stackly team.</p>
            </motion.div>
          </motion.div>

          <div className="border-t border-white/10 pt-5">
            <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-between">
              <motion.div
                className="flex w-full flex-wrap items-center justify-center gap-2 lg:w-auto lg:justify-start"
                variants={socialReveal}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {socials.map(([label, Icon, href, hoverClass]) => (
                  <motion.a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label} variants={socialItem} whileHover={{ y: -4, scale: 1.15, transition: { duration: 0.18 } }} className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#0A1E3D] shadow-sm transition-colors duration-300 hover:text-white hover:shadow-xl md:h-8 md:w-8 ${hoverClass}`}>
                    <Icon className="text-xs md:text-sm" />
                  </motion.a>
                ))}
              </motion.div>

              <div className="flex w-full flex-col items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-white/50 lg:w-auto lg:flex-row lg:gap-6">
                <button type="button" onClick={() => setActiveModal("terms")} className="stackly-footer-link whitespace-nowrap">Terms of Use</button>
                <button type="button" onClick={() => setActiveModal("privacy")} className="stackly-footer-link whitespace-nowrap">Privacy Policy</button>
                <span
                  className="w-full max-w-full whitespace-normal break-words text-center px-4 text-[9px] md:text-[10px] lg:w-auto lg:px-0"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    whiteSpace: "normal",
                    overflowWrap: "break-word",
                    wordBreak: "break-word",
                  }}
                >
                  Copyright 2018-2026 TheStackly.com INC
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>

      {modal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="legal-modal-title">
          <button type="button" aria-label="Close legal popup" onClick={() => setActiveModal(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="stackly-modal-pop relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b p-5 md:p-7">
              <h3 id="legal-modal-title" className="text-lg font-black uppercase tracking-widest text-[#06224C]">{modal.title}</h3>
            </div>
            <div className="legal-modal-body flex-grow space-y-5 overflow-y-auto p-5 text-sm leading-relaxed text-gray-700 md:p-8">
              {modal.body}
            </div>
            <div className="flex-shrink-0 border-t bg-gray-50 p-4 text-center">
              <button type="button" onClick={() => setActiveModal(null)} className="rounded-full bg-[#06224C] px-8 py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-blue-900">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="stackly-toast fixed bottom-5 right-5 z-[20001] rounded-xl bg-[#06224C] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {toast}
        </div>
      )}
    </>
  );
}

export default function Portfolioedit() {
  const [innerMobileMenuOpen, setInnerMobileMenuOpen] = useState(false);
  const [innerNavHidden, setInnerNavHidden] = useState(false);
  const [previewMode, setPreviewMode] = useState("preview");
  const [isEditMode, setIsEditMode] = useState(false);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const { scrollY: canvasScrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const [heroImageProps] = useState({
    width: 165,
    height: 245,
    borderRadius: 50, // 50% for full round
    shadow: false,
    opacity: 100
  });

  //animations for stats and progress bars
  const { ref: skillsRef, inView: skillsInView } = useLocalInView<HTMLDivElement>({
    triggerOnce: false,
    threshold: 0.3,
  });

  const { ref: statsRef, inView: statsInView } = useLocalInView<HTMLDivElement>({
    triggerOnce: false,
    threshold: 0.3,
  });

  const { ref: processRef, inView: processInView } = useLocalInView<HTMLDivElement>({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { ref: testimonialsRef, inView: testimonialsInView } = useLocalInView<HTMLDivElement>({
    triggerOnce: true,
    threshold: 0.2,
  });

  const [stats, setStats] = useState([
    { value: 5, suffix: "+", label: "Years of Experience" },
    { value: 120, suffix: "+", label: "Projects Done" },
    { value: 98, suffix: "%", label: "Client Satisfaction" },
  ]);

  const [skills, setSkills] = useState([
    { name: "Photoshop", value: 90, color: "#1a3636" },
    { name: "Figma", value: 80, color: "#e84b72" },
    { name: "HTML", value: 85, color: "#e44d26" },
    { name: "CSS", value: 75, color: "#264de4" },
  ]);

  const [processSteps, setProcessSteps] = useState([
    {
      step: "01",
      title: "Discover",
      desc: "Map goals, user needs, brand tone, and the moments that matter most.",
    },
    {
      step: "02",
      title: "Design",
      desc: "Create clean wireframes, polished screens, and responsive interaction states.",
    },
    {
      step: "03",
      title: "Deliver",
      desc: "Prepare developer-ready assets with smooth handoff notes and launch support.",
    },
  ]);

  const [testimonials, setTestimonials] = useState([
    {
      quote: "The design felt premium, fast, and very easy for our team to present to clients.",
      name: "Aarav Mehta",
      role: "Product Lead",
    },
    {
      quote: "Every screen had a clear reason behind it. The final website looked sharp on all devices.",
      name: "Priya Shah",
      role: "Startup Founder",
    },
  ]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  useMotionValueEvent(canvasScrollY, "change", (current) => {
    const previous = canvasScrollY.getPrevious() ?? 0;
    setInnerNavHidden(!innerMobileMenuOpen && current > previous && current > 150);
  });

  const portfolioNavHidden = innerNavHidden && !innerMobileMenuOpen && !prefersReducedMotion;

  return (
    <main className="site-page flex flex-col min-h-screen bg-white w-full max-w-full overflow-x-hidden">
      {/* ====== MAIN BUILDER LAYOUT ====== */}
      <div className="flex flex-1 overflow-x-hidden max-w-full w-full">
        {/* MAIN CONTENT */}
        <div className="flex-1 bg-white p-4 @md:p-7 flex justify-center min-w-0 overflow-x-hidden max-w-full w-full">
          <div className="w-full max-w-[1200px] relative flex flex-col min-w-0 overflow-x-hidden">
            {/* FIXED/FLOATING PREVIEW TOOLBAR */}
            <div className="fixed z-[100] bottom-6 left-1/2 -translate-x-1/2 @lg:top-[50%] @lg:bottom-auto @lg:-translate-y-1/2 shrink-0 hidden md:block">
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-full border border-[#E5E7EB] shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-3 py-1.5">
                 <button
                   onClick={() => setPreviewMode("preview")}
                   className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white border shadow-sm transition ${
                     previewMode === "preview"
                       ? "border-[#06224C] ring-2 ring-[#06224C] bg-gray-50 text-[#06224C] font-bold"
                       : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"
                   }`}
                   title="Preview"
                 >
                    <FaEye size={14} />
                 </button>
                 <button
                   onClick={() => setPreviewMode("desktop")}
                   className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white border shadow-sm transition ${
                     previewMode === "desktop"
                       ? "border-[#06224C] ring-2 ring-[#06224C] bg-gray-50 text-[#06224C] font-bold"
                       : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"
                   }`}
                   title="Desktop View"
                 >
                    <FaLaptop size={14} />
                 </button>
                 <button
                   onClick={() => setPreviewMode("tablet")}
                   className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white border shadow-sm transition ${
                     previewMode === "tablet"
                       ? "border-[#06224C] ring-2 ring-[#06224C] bg-gray-50 text-[#06224C] font-bold"
                       : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"
                   }`}
                   title="Tablet View"
                 >
                    <FaTabletAlt size={14} />
                 </button>
                 <button
                   onClick={() => setPreviewMode("mobile")}
                   className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white border shadow-sm transition ${
                     previewMode === "mobile"
                       ? "border-[#06224C] ring-2 ring-[#06224C] bg-gray-50 text-[#06224C] font-bold"
                       : "border-gray-100 text-[#06224C]/70 hover:bg-gray-50"
                   }`}
                   title="Mobile View"
                 >
                    <FaMobileAlt size={14} />
                 </button>
              </div>
            </div>

            {/* Canvas Box */}
            <div ref={canvasScrollRef} className={`flex-1 overflow-visible min-w-0 relative z-0 transition-colors duration-300 ${(previewMode === "tablet" || previewMode === "mobile") ? "bg-gray-200/50 p-2 @sm:p-4 rounded-xl" : ""}`}>
              <div className={`@container mx-auto min-h-[530px] bg-[#F2F2F2] flex flex-col relative portfolio-shell overflow-hidden box-border transition-all duration-500 ease-in-out ${
                previewMode === "mobile"
                  ? "w-[375px] max-w-full shadow-2xl rounded-xl border-2 border-gray-300"
                  : previewMode === "tablet"
                    ? "w-[768px] max-w-full shadow-2xl rounded-xl border-2 border-gray-300"
                    : previewMode === "desktop"
                      ? "w-full max-w-[1200px] rounded-xl border-2 border-gray-300"
                      : "w-full max-w-full"
              }`}>


                {/* <div className="flex w-full flex-wrap items-center justify-between gap-2 @sm:gap-4 px-3 @sm:px-4 py-2 @sm:py-3 @md:px-8 @xl:flex-nowrap border-b border-gray-300 bg-[#06224C] rounded-t-xl"> */}
                <motion.div
                  className="sticky top-0 z-50 backdrop-blur-md bg-[#06224C]/95 flex w-full flex-wrap items-center justify-between gap-2 @sm:gap-4 px-3 @sm:px-4 py-2 @sm:py-3 @md:px-8 @xl:flex-nowrap border-b border-gray-300 rounded-t-xl"
                  animate={{
                    y: portfolioNavHidden ? -96 : 0,
                    opacity: portfolioNavHidden ? 0 : 1,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >

                  {/* ✅ MOBILE LAYOUT */}
                  <div className="flex w-full items-center justify-between @3xl:hidden relative px-1 flex-wrap gap-2">

                    {/* LEFT/CENTER → Logo & Title Container */}
                    <div className="flex items-center gap-2 flex-wrap min-w-0 flex-1">
                      {/* Logo */}
                      <Link
                        href="/landing"
                        className="flex h-7 w-[60px] @sm:h-8 @sm:w-[72px] items-center justify-center overflow-hidden rounded-[50%] bg-white px-1 shrink-0"
                      >
                        <Image
                          src={assetPath("/stackly-logo.webp")}
                          alt="Stackly logo"
                          width={80}
                          height={24}
                          className="h-[10px] @sm:h-[12px] object-contain"
                          unoptimized
                        />
                      </Link>
                      
                      {/* Title */}
                      <span className="text-[clamp(0.75rem,2.5vw,0.875rem)] @sm:text-sm font-semibold text-white break-words">
                        Portfolio
                      </span>
                    </div>

                    {/* RIGHT → Menu */}
                    <div className="flex items-center justify-end shrink-0">
                      <button
                        onClick={() => setInnerMobileMenuOpen((v) => !v)}
                        className="h-7 w-7 @sm:h-8 @sm:w-8 border border-white/25 text-white rounded-md hover:bg-white/10 transition flex items-center justify-center shrink-0"
                      >
                        <FaBars size={12} />
                      </button>
                    </div>

                  </div>

                  {/* ✅ DESKTOP */}
                  <div className="w-full items-center justify-between hidden @3xl:flex relative">

                    {/* LEFT: Logo */}
                    <div className="flex shrink-0 items-center justify-start z-10">
                      <Link href="/landing" className="flex h-10 min-w-[92px] items-center justify-center rounded-[50%] bg-white px-3">
                        <Image src={assetPath("/stackly-logo.webp")} alt="Stackly logo" width={92} height={28} className="h-[18px] w-auto" unoptimized />
                      </Link>
                    </div>

                    {/* CENTER → Title */}
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold text-white pointer-events-none z-0">
                      Portfolio
                    </span>

                    {/* RIGHT: Nav Links */}
                    <div className="flex shrink-0 items-center gap-x-6 z-10">

                      {/* NAV LINKS */}
                      <div className="flex flex-wrap gap-x-6 justify-end">
                        {[
                          { name: "Home", id: "home" },
                          { name: "About Me", id: "about" },
                          { name: "Projects", id: "projects" },
                          { name: "Contacts", id: "contact" },
                        ].map((item, i) => (
                          <button
                            key={i}
                            onClick={() => scrollToSection(item.id)}
                            className="relative text-white text-sm group"
                          >
                            {item.name}
                            <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-white transition-all duration-300 group-hover:w-full"></span>
                          </button>
                        ))}
                      </div>

                    </div>
                  </div>

                </motion.div>

                {/* MOBILE MENU */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${innerMobileMenuOpen ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-3 pb-3 pt-2 bg-[#06224C] grid grid-cols-2 gap-2">
                    {/* {["Home", "About Us", "Projects", "Contact"].map((item, i) => (
                      <button key={i} onClick={() => setInnerMobileMenuOpen(false)} className="border border-white/25 px-3 py-2 text-xs text-white rounded-md hover:bg-white/10 transition hover:scale-105">
                        {item}
                      </button>
                    ))} */}
                    {[
                      { name: "Home", id: "home" },
                      { name: "About Us", id: "about" },
                      { name: "Projects", id: "projects" },
                      { name: "Contact", id: "contact" },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          scrollToSection(item.id);
                          setInnerMobileMenuOpen(false);
                        }}
                        className="border border-white/25 px-3 py-2 text-xs text-white rounded-md hover:bg-white/10 transition hover:scale-105"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>


                {/* HERO SECTION WRAPPER */}
                <div id="home" className="relative w-full overflow-hidden flex flex-col portfolio-hero">

                  {/* HERO CONTENT */}

                  <div className="flex-1 flex flex-col px-4 @sm:px-6 @md:px-8 @lg:px-12 py-6 @md:py-8 relative z-10">
                    <div className="flex flex-col @lg:flex-row items-center @lg:items-stretch justify-between w-full gap-8">

                      <div className="w-full @xl:w-[55%] shrink-0 flex flex-col relative z-30 text-center @lg:w-[50%] @lg:text-left">
                        <div className="mx-auto mb-4 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-[#63e5ff]/60 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#06224C] shadow-sm @lg:mx-0">
                          <span className="h-2 w-2 rounded-full bg-[#63e5ff] animate-pulse"></span>
                          Available for freelance work
                        </div>
                        <h1 className="text-[clamp(1.75rem,5cqi,3rem)] @md:text-4xl @lg:text-5xl font-bold mt-4 @md:mt-6 text-gray-800 leading-snug @md:leading-normal break-words whitespace-normal min-w-0 max-w-full">
                          <div className="mb-2 min-w-0 break-words">Hello, I&apos;m</div>
                          <div className="text-[#63e5ff] mb-2 leading-snug break-words min-w-0 max-w-full">Srinivas Pentakota</div>
                          <div className="leading-snug break-words min-w-0 max-w-full">UI/UX Designer</div>
                        </h1>

                        <p className="text-[clamp(0.875rem,2.5cqi,1.125rem)] @md:text-lg text-gray-600 mt-4 @md:mt-6 max-w-xl mx-auto break-words relative z-20 @lg:mx-0 min-w-0 max-w-full">
                          I design sleek digital products, landing pages, and brand experiences that feel clear, fast, and memorable.
                        </p>

                        {/* MOBILE BLOBS + IMAGE */}
                        <div className="mt-8 mb-4 flex justify-center px-4 @sm:px-6 w-full @lg:hidden">
                          <div className="relative w-full max-w-[240px] portfolio-portrait-wrap flex items-center justify-center">

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                              <div className="w-[90%] h-[90%] bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-300 opacity-20 blur-2xl rounded-full animate-[float_6s_ease-in-out_infinite]"></div>

                              <div className="absolute w-[70%] h-[50%] bg-cyan-300 opacity-20 blur-2xl rounded-full animate-[float_7s_ease-in-out_infinite]"></div>

                              <div className="absolute w-[40%] h-[40%] bg-pink-400 opacity-20 rounded-full bottom-2 right-2 animate-[float_5s_ease-in-out_infinite]"></div>

                              <div className="absolute w-[60%] h-[80%] bg-cyan-300 opacity-20 blur-2xl rounded-[60%_40%_55%_45%] -top-4 -left-4 animate-[float_6s_ease-in-out_infinite]"></div>

                              <div className="absolute w-[65%] h-[95%] bg-white/70 rounded-[80px] rotate-[-30deg] shadow-md animate-[float_6s_ease-in-out_infinite]"></div>
                            </div>

                            <div className="absolute -right-2 bottom-6 z-30 rounded-xl border border-white/80 bg-white/90 px-3.5 py-2 text-left shadow-lg portfolio-floating-badge">
                              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">Focus</p>
                              <p className="text-xs font-extrabold text-gray-900 whitespace-nowrap">Human centered UI</p>
                            </div>

                            <div className="relative overflow-hidden border-4 border-white z-20 animate-[float_6s_ease-in-out_infinite] transition-all duration-300 mx-auto"
                              style={{
                                width: `${heroImageProps.width}px`,
                                height: 'auto',
                                aspectRatio: `${heroImageProps.width} / ${heroImageProps.height}`,
                                maxWidth: '100%',
                                borderRadius: `${heroImageProps.borderRadius}%`,
                                boxShadow: heroImageProps.shadow ? '0 10px 25px rgba(0,0,0,0.3)' : 'none',
                                opacity: heroImageProps.opacity / 100
                              }}>
                              <Image
                                src={assetPath("/portfoliologo.webp")}
                                alt="Srinivas Pentakota - UI/UX Designer Portfolio"
                                fill
                                sizes="220px"
                                className="object-cover"
                                unoptimized
                              />
                            </div>

                          </div>
                        </div>


                        <div className="flex flex-wrap gap-4 mt-8 justify-center @lg:justify-start">

                          <button
                            type="button"
                            onClick={() => scrollToSection("projects")}
                            className="w-auto min-w-[140px] flex justify-center items-center px-3 py-2 bg-gradient-to-r from-[#06224C] to-[#1A5BBC] text-white rounded-lg text-sm transition transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] break-words"
                          >
                            View My Works
                          </button>

                          <Link
                            href="/page-not-found"
                            className="w-auto min-w-[140px] flex justify-center items-center px-3 py-2 bg-gradient-to-r from-[#06224C] to-[#1A5BBC] text-white rounded-lg text-sm transition transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg outline-none focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] break-words"
                          >
                            Download CV
                          </Link>

                        </div>

                        <div className="mt-8 grid grid-cols-1 @sm:grid-cols-3 gap-3 max-w-xl mx-auto @lg:mx-0 min-w-0 max-w-full">
                          {["Research-led", "Pixel perfect", "Mobile first"].map((item, i) => (
                            <div
                              key={item}
                              className="portfolio-mini-card rounded-lg border border-white/80 bg-white/75 px-4 py-3 text-[clamp(0.75rem,2cqi,0.875rem)] font-bold text-gray-800 shadow-sm backdrop-blur break-words min-w-0 max-w-full overflow-hidden"
                              style={{ animationDelay: `${i * 90}ms` }}
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>


                      {/* DESKTOP BLOBS */}
                      <div className="w-[45%] @xl:w-[40%] items-center justify-center relative min-h-[400px] hidden @lg:flex">
                        <div className="relative w-full max-w-[400px] h-full flex items-center justify-center portfolio-portrait-wrap">
                          <div className="absolute w-[300px] h-[300px] bg-gradient-to-r from-purple-500 via-blue-400 to-cyan-300 opacity-20 blur-2xl rounded-full animate-[float_6s_ease-in-out_infinite]"></div>
                          <div className="absolute w-[200px] h-[150px] right-10 top-10 bg-cyan-300 opacity-20 blur-2xl rounded-full animate-[float_7s_ease-in-out_infinite]"></div>
                          <div className="absolute w-[100px] h-[100px] left-17 bottom-22 bg-pink-400 opacity-20 rounded-full animate-[float_5s_ease-in-out_infinite]"></div>
                          <div className="absolute w-[140px] h-[230px] bg-white/70 rounded-[80px] rotate-[-30deg] shadow-md animate-[float_6s_ease-in-out_infinite]"></div>
                          <div className="absolute right-4 bottom-14 z-30 rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-left shadow-xl portfolio-floating-badge">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">Focus</p>
                            <p className="text-sm font-extrabold text-gray-900">Human centered UI</p>
                          </div>
                          <div className="relative overflow-hidden border-4 border-white z-20 animate-[float_6s_ease-in-out_infinite] transition-all duration-300"
                            style={{
                              width: `${heroImageProps.width}px`,
                              height: 'auto',
                              aspectRatio: `${heroImageProps.width} / ${heroImageProps.height}`,
                              maxWidth: '100%',
                              borderRadius: `${heroImageProps.borderRadius}%`,
                              boxShadow: heroImageProps.shadow ? '0 10px 25px rgba(0,0,0,0.3)' : 'none',
                              opacity: heroImageProps.opacity / 100
                            }}>
                            <Image src={assetPath("/portfoliologo.webp")} alt="Srinivas Pentakota - UI/UX Designer Portfolio" fill sizes="245px" className="object-cover" unoptimized />
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* STATS */}

                    <div ref={statsRef} className="flex flex-wrap items-stretch justify-center gap-4 @sm:gap-6 @lg:gap-8 mt-12 @md:mt-15 mb-2 w-full min-w-0 max-w-full">
                      {stats.map((item, i) => (
                        <div
                          key={i}
                          className="portfolio-stat-card flex-1 min-w-[140px] @sm:min-w-[160px] max-w-[280px] mx-auto @sm:mx-0 bg-white py-4 min-h-[6rem] px-4 rounded-lg shadow-md flex flex-col items-center justify-center text-gray-700 transition transform hover:-translate-y-2 hover:shadow-xl text-center min-w-0 break-words overflow-hidden"
                          style={{ animationDelay: `${i * 110}ms` }}
                        >
                          <h5 className="text-[clamp(1.25rem,3.5cqi,1.5rem)] font-bold min-w-0 break-words">
                            {statsInView ? (
                              <AnimatedCount
                                key={statsInView ? "start" : "reset"} // 👈 important fix
                                start={0}
                                end={item.value}
                                duration={2}
                                suffix={item.suffix}
                              />
                            ) : (
                              "0"
                            )}
                          </h5>

                          <span className="text-[clamp(0.75rem,2cqi,0.875rem)] mt-1 break-words min-w-0 max-w-full">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
                {/* FLOAT ANIMATION */}
                <style jsx>{`
                  @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                    100% { transform: translateY(0px); }
                  }

                  @keyframes portfolio-rise {
                    from { opacity: 0; transform: translateY(18px); }
                    to { opacity: 1; transform: translateY(0); }
                  }

                  @keyframes portfolio-slide-left {
                    from { opacity: 0; transform: translateX(-24px); }
                    to { opacity: 1; transform: translateX(0); }
                  }

                  @keyframes portfolio-glow {
                    0%, 100% { transform: scale(0.95); opacity: 0.6; }
                    50% { transform: scale(1.08); opacity: 0.95; }
                  }

                  .portfolio-shell {
                    background:
                      radial-gradient(circle at 12% 12%, rgba(99, 229, 255, 0.28), transparent 18rem),
                      radial-gradient(circle at 88% 18%, rgba(232, 75, 114, 0.13), transparent 18rem),
                      linear-gradient(180deg, #f8fbff 0%, #f2f2f2 34%, #f7fafc 100%);
                  }

                  .portfolio-hero::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    pointer-events: none;
                    background:
                      linear-gradient(115deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.28)),
                      radial-gradient(circle at 76% 38%, rgba(99, 229, 255, 0.2), transparent 16rem);
                  }

                  .portfolio-hero-copy {
                    animation: portfolio-slide-left 0.65s ease both;
                  }

                  .portfolio-mini-card,
                  .portfolio-stat-card,
                  .portfolio-service-card,
                  .portfolio-project-card {
                    animation: portfolio-rise 0.58s ease both;
                  }

                  .portfolio-portrait-wrap::before {
                    content: "";
                    position: absolute;
                    width: 18rem;
                    height: 18rem;
                    border-radius: 999px;
                    background: radial-gradient(circle, rgba(99, 229, 255, 0.35), transparent 64%);
                    animation: portfolio-glow 4.5s ease-in-out infinite;
                  }

                  .portfolio-floating-badge {
                    animation: float 5.5s ease-in-out infinite;
                  }

                  .portfolio-reveal {
                    opacity: 0;
                    transform: translateY(22px);
                    transition: opacity 650ms ease, transform 650ms ease;
                  }

                  .portfolio-reveal.is-visible {
                    opacity: 1;
                    transform: translateY(0);
                  }

                  @media (prefers-reduced-motion: reduce) {
                    .portfolio-hero-copy,
                    .portfolio-mini-card,
                    .portfolio-stat-card,
                    .portfolio-service-card,
                    .portfolio-project-card,
                    .portfolio-floating-badge,
                    .portfolio-portrait-wrap::before,
                    .portfolio-reveal {
                      animation: none !important;
                      transition: none !important;
                      opacity: 1;
                      transform: none;
                    }
                  }

                  .portfolio-services-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(min(100%, 15rem), 1fr));
                  }

                  .portfolio-service-card h4,
                  .portfolio-service-card p {
                    overflow-wrap: anywhere;
                    word-break: normal;
                  }

                  .process-card {
                    width: 100%;
                    min-width: 0;
                    max-width: 100%;
                    box-sizing: border-box;
                    word-break: normal;
                    overflow-wrap: break-word;
                    hyphens: none;
                  }

                  .process-card-title {
                    white-space: nowrap;
                    word-break: normal;
                    overflow-wrap: normal;
                  }

                  .process-card-desc {
                    line-height: 1.6;
                    word-break: normal;
                    overflow-wrap: break-word;
                    hyphens: none;
                  }

                  @media (min-width: 768px) and (max-width: 1024px) {
                    .process-grid {
                      display: flex !important;
                      flex-direction: column !important;
                      gap: 16px !important;
                      width: 100% !important;
                    }

                    .process-card {
                      width: 100% !important;
                      min-width: 0 !important;
                      max-width: 100% !important;
                      flex: none !important;
                    }

                    .portfolio-shell,
                    .portfolio-hero,
                    .site-page {
                      max-width: 100% !important;
                      overflow-x: hidden !important;
                      box-sizing: border-box !important;
                    }
                  }
                `}</style>


                {/* ABOUT SECTION */}
                {/* <div className="w-full bg-[#F2F2F2] px-6 @md:px-12 @lg:px-20 py-16 @md:py-24"> */}
                <div id="about" className="w-full max-w-full overflow-x-hidden bg-[#F2F2F2] px-4 @sm:px-6 @md:px-12 @lg:px-20 py-10 @md:py-16">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <h2 className="text-3xl @sm:text-4xl @md:text-5xl @lg:text-6xl font-extrabold text-gray-900 tracking-tight break-words leading-tight">About</h2>
                    <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl @sm:text-3xl @md:text-4xl @lg:text-5xl tracking-tight leading-none break-words">Me</span>
                  </div>

                  <h3 className="text-sm @sm:text-base @md:text-xl @lg:text-2xl font-extrabold text-gray-800 mb-8 @md:mb-16 max-w-full @md:max-w-3xl leading-relaxed break-words text-center @md:text-left">
                    Described Briefly My Professional Background Skills and Accomplishments
                  </h3>

                  {/* <div className="grid grid-cols-1 @lg:grid-cols-12 gap-12 @lg:gap-20 border-b border-white pb-6"> */}
                  <div className="grid grid-cols-1 @lg:grid-cols-2 gap-8 @md:gap-12 border-b border-white pb-6 min-w-0 max-w-full">

                    {/* LEFT → TEXT */}
                    <div className="flex flex-col justify-center min-w-0 max-w-full">

                      <p className="font-extrabold text-gray-800 text-[clamp(1.125rem,3cqi,1.5rem)] @md:text-2xl mb-4 @md:mb-6 leading-snug min-w-0 break-words">
                        Hello! I&apos;m a UI/UX Designer providing awesome and modern design solutions for clients. My vision is to satisfy my clients.
                      </p>

                      <p className="text-gray-500 mb-6 @md:mb-0 leading-relaxed text-[clamp(0.875rem,2.5cqi,1.125rem)] @md:text-lg min-w-0 break-words">
                        I turn rough ideas into visual systems, interactive prototypes, and responsive layouts that help users move confidently from first impression to final action.
                      </p>

                    </div>


                    <div ref={skillsRef} className="space-y-6 @md:space-y-8">
                      {skills.map((skill, index) => (
                        <div key={skill.name}>
                          <div className="flex justify-between mb-2 @md:mb-3">
                            <span className="font-bold text-gray-800 text-sm @md:text-lg">
                              {skill.name}
                            </span>
                            <span className="text-gray-500 text-xs @md:text-sm">
                              {skill.value}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-300 h-[4px] @md:h-[6px] overflow-hidden">
                            <div
                              className="h-full transition-all duration-1000 ease-out"
                              style={{
                                width: skillsInView ? `${skill.value}%` : "0%",
                                transitionDelay: `${index * 150}ms`,
                                backgroundColor: skill.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* EDUCATION & EXPERIENCE SECTION */}
                <div className="w-full max-w-full overflow-x-hidden bg-[#F2F2F2] px-4 @sm:px-6 @md:px-12 @lg:px-20 pb-12 @md:pb-16 @lg:pb-24">

                  <div className="grid grid-cols-1 @lg:grid-cols-2 gap-8 @md:gap-12 @lg:gap-20 min-w-0 max-w-full">

                    {/* EDUCATION */}
                    <div className="min-w-0 max-w-full">
                      <h3 className="text-[clamp(1.125rem,3cqi,1.25rem)] @md:text-xl font-bold text-gray-800 mb-4 @md:mb-6 border-b border-gray-200 pb-3 min-w-0 break-words">
                        Education
                      </h3>

                      <div className="space-y-5 @md:space-y-6 min-w-0 max-w-full">

                        {[
                          { id: "01", date: "March 2013 - 2016", title: "Computer Science" },
                          { id: "02", date: "March 2017 - 2018", title: "Graphic Design" },
                          { id: "03", date: "June 2019 - 2021", title: "Web Development" },
                        ].map((item) => (
                          <div
                            key={item.id}
                            className="portfolio-reveal is-visible flex items-start @sm:items-center gap-4 @sm:gap-6 border-b border-gray-200 pb-4 @sm:pb-6 min-w-0 max-w-full overflow-hidden break-words"
                          >
                            {/* NUMBER */}
                            <div className="w-10 h-10 @sm:w-12 @sm:h-12 shrink-0 bg-[#1a3636] text-white rounded-full flex justify-center items-center font-bold text-xs @sm:text-sm">
                              {item.id}
                            </div>

                            {/* TEXT */}
                            <div className="flex-1 min-w-0 max-w-full">
                              <p className="text-gray-500 text-[clamp(0.75rem,2cqi,0.875rem)] @sm:text-sm mb-1 font-medium break-words min-w-0 w-full">
                                {item.date}
                              </p>
                              <h4 className="text-[clamp(1rem,3cqi,1.125rem)] @sm:text-lg font-bold text-gray-800 break-words min-w-0 w-full">
                                {item.title}
                              </h4>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                    {/* EXPERIENCE */}
                    <div className="min-w-0 max-w-full">
                      <h3 className="text-[clamp(1.125rem,3cqi,1.25rem)] @md:text-xl font-bold text-gray-800 mb-4 @md:mb-6 border-b border-gray-200 pb-3 min-w-0 break-words">
                        Experience
                      </h3>

                      <div className="space-y-5 @md:space-y-6 min-w-0 max-w-full">

                        {[
                          { id: "01", date: "January 2021 - 2022", title: "Microsoft" },
                          { id: "02", date: "March 2022 - 2023", title: "Google Inc" },
                        ].map((item) => (
                          <div
                            key={item.id}
                            className="portfolio-reveal is-visible flex items-start @sm:items-center gap-4 @sm:gap-6 border-b border-gray-200 pb-4 @sm:pb-6 min-w-0 max-w-full overflow-hidden break-words"
                          >
                            {/* NUMBER */}
                            <div className="w-10 h-10 @sm:w-12 @sm:h-12 shrink-0 bg-[#1a3636] text-white rounded-full flex justify-center items-center font-bold text-xs @sm:text-sm">
                              {item.id}
                            </div>

                            {/* TEXT */}
                            <div className="flex-1 min-w-0 max-w-full">
                              <p className="text-gray-500 text-[clamp(0.75rem,2cqi,0.875rem)] @sm:text-sm mb-1 font-medium break-words min-w-0 w-full">
                                {item.date}
                              </p>
                              <h4 className="text-[clamp(1rem,3cqi,1.125rem)] @sm:text-lg font-bold text-gray-800 break-words min-w-0 w-full">
                                {item.title}
                              </h4>
                            </div>
                          </div>
                        ))}

                      </div>
                    </div>

                  </div>
                </div>
                {/* </div> */}

                {/* MY SERVICES SECTION */}
                <div className="w-full max-w-full overflow-x-hidden bg-[#F2F2F2] px-4 @sm:px-6 @md:px-12 @lg:px-20 pb-16 @lg:pb-24">
                  <div className="text-center mb-16">
                    {/* <h3 className="text-base font-bold flex items-center justify-center gap-1 mb-4 text-gray-800 tracking-wide"> */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <h2 className="text-3xl @sm:text-4xl @md:text-5xl @lg:text-6xl font-extrabold text-gray-900 tracking-tight break-words leading-tight">My</h2>
                      <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl @sm:text-3xl @md:text-4xl @lg:text-5xl tracking-tight leading-none break-words">Services</span>
                    </div>
                    {/* <h3 className="text-3xl @md:text-4xl @lg:text-5xl font-extrabold text-gray-900 max-w-2xl mx-auto leading-tight"> */}

                    <h3 className="text-sm @sm:text-base @md:text-xl @lg:text-2xl font-extrabold text-gray-800 mb-8 @md:mb-16 max-w-full @md:max-w-3xl leading-relaxed break-words text-center @md:text-left">
                      Provide Wide Range of  Digital Services
                    </h3>
                  </div>

                  <div className="grid portfolio-services-grid gap-4 @sm:gap-6 max-w-7xl mx-auto min-w-0 max-w-full">
                    {[
                      { id: "01", title: "Web Development", desc: "Responsive, clean websites with purposeful layouts and polished front-end details." },
                      { id: "02", title: "UI / UX DESIGN", desc: "User journeys, wireframes, visual systems, and prototypes that make products easier to use." },
                      { id: "03", title: "eCommerce Solution", desc: "Storefront experiences built around discovery, trust, and smooth checkout flows." },
                      { id: "04", title: "CMS Development", desc: "Editable content structures for teams that need control after launch." },
                      { id: "05", title: "Web Design", desc: "Landing pages and brand sites with strong hierarchy, spacing, and conversion focus." },
                      { id: "06", title: "3D Printing", desc: "Product visuals and concept presentations that help technical ideas feel tangible." },
                      { id: "07", title: "App Development", desc: "Mobile-first screens, component states, and interaction patterns for product teams." },
                      { id: "08", title: "Marketing", desc: "Campaign visuals, social assets, and creative direction for stronger digital presence." },
                    ].map((service) => (
                      <div key={service.id} className="portfolio-service-card border border-gray-200 rounded-[20px] p-5 @sm:p-6 @lg:p-8 flex flex-col items-start transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-white group hover:border-gray-300 cursor-pointer h-full min-w-0 max-w-full break-words overflow-hidden" style={{ animationDelay: `${Number(service.id) * 45}ms` }}>
                        <div className="w-12 h-12 mb-4 @sm:mb-6 flex items-center justify-center text-gray-800 shrink-0">
                          {service.id === "01" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>}
                          {service.id === "02" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
                          {service.id === "03" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>}
                          {service.id === "04" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line><circle cx="12" cy="10" r="2"></circle></svg>}
                          {service.id === "05" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path></svg>}
                          {service.id === "06" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>}
                          {service.id === "07" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>}
                          {service.id === "08" && <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.76a1 1 0 0 1 .84.45l2.4 3.6a1 1 0 0 1-.84 1.55H11z"></path><path d="M18 10h-2V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4z"></path></svg>}
                        </div>
                        <h4 className="text-[clamp(1rem,3cqi,1.0625rem)] font-bold text-gray-900 mb-2 @sm:mb-3 min-w-0 break-words">{service.title}</h4>
                        <p className="text-gray-500 text-[13px] leading-relaxed mb-6 @sm:mb-8 flex-1 min-w-0 break-words w-full">
                          {service.desc}
                        </p>
                        <div className="mt-auto flex flex-wrap items-center gap-1.5 w-full shrink-0 min-w-0">
                          <div className="w-[30px] h-[30px] rounded-full bg-[#1a3636] text-white flex items-center justify-center text-[11px] font-semibold shrink-0 group-hover:bg-[#63e5ff] group-hover:text-gray-900 transition-colors">
                            {service.id}
                          </div>
                          <div className="flex items-center text-gray-300 group-hover:text-gray-900 transition-colors min-w-0">
                            <span className="w-8 h-[1px] bg-current"></span>
                            <FaArrowRight size={10} className="-ml-[2px]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DESIGN PROCESS SECTION */}
                <div ref={processRef} className="w-full max-w-full overflow-x-hidden bg-[#F2F2F2] px-4 @sm:px-6 @md:px-12 @lg:px-20 pb-16 @lg:pb-24">
                  <div className="overflow-hidden rounded-2xl bg-[#06224C] px-5 py-8 @sm:px-8 @md:px-10 @md:py-12 text-white shadow-xl relative">
                    <div className="absolute right-[-5rem] top-[-5rem] h-56 w-56 rounded-full bg-[#63e5ff]/20 blur-3xl"></div>
                    <div className="absolute left-[-4rem] bottom-[-5rem] h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="relative grid grid-cols-1 @min-[1025px]:grid-cols-[0.9fr_1.4fr] gap-8 @min-[1025px]:gap-12 items-start min-w-0 max-w-full">
                      <div className={`portfolio-reveal min-w-0 max-w-full break-words ${processInView ? "is-visible" : ""}`}>
                        <div className="flex flex-wrap items-center gap-2 mb-4 min-w-0 max-w-full">
                          <h2 className="text-3xl @sm:text-4xl @md:text-5xl @lg:text-6xl font-extrabold tracking-tight min-w-0 break-words leading-tight">Design</h2>
                          <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl @sm:text-3xl @md:text-4xl @lg:text-5xl tracking-tight leading-none min-w-0 break-words">Process</span>
                        </div>
                        <p className="text-sm @md:text-base text-blue-100 leading-relaxed max-w-md min-w-0 break-words">
                          A simple workflow keeps every project moving from rough idea to polished launch without losing the user&apos;s needs along the way.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 @min-[1025px]:grid-cols-3 gap-4 min-w-0 max-w-full w-full process-grid">
                        {processSteps.map((item, i) => (
                          <div
                            key={item.step}
                            className={`portfolio-reveal rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 min-w-0 max-w-full process-card ${processInView ? "is-visible" : ""}`}
                            style={{ transitionDelay: `${i * 120}ms` }}
                          >
                            <div className="mb-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#63e5ff] text-sm font-extrabold text-[#06224C]">
                              {item.step}
                            </div>
                            <h3 className="mb-2 text-lg font-extrabold min-w-0 process-card-title">{item.title}</h3>
                            <p className="text-sm text-blue-100 min-w-0 process-card-desc">{item.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* MY PROJECTS SECTION */}

                <div id="projects" className="w-full max-w-full bg-[#F2F2F2] px-0 @md:px-6 @lg:px-12 pb-16 @lg:pb-24 relative overflow-x-hidden box-border">

                  <div className="text-center mb-16">
                    <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                      <h2 className="text-3xl @sm:text-4xl @md:text-5xl @lg:text-6xl font-extrabold text-gray-900 tracking-tight break-words leading-tight">My</h2>
                      <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl @sm:text-3xl @md:text-4xl @lg:text-5xl tracking-tight leading-none break-words">Projects</span>
                    </div>

                    <h3 className="text-sm @sm:text-base @md:text-xl @lg:text-2xl font-extrabold text-gray-800 mb-8 @md:mb-16 max-w-full @md:max-w-3xl leading-relaxed break-words text-center mx-auto">
                      Showcase Your Talent with Our <br className="hidden @md:block" /> Latest Works
                    </h3>
                  </div>

                  <div
                    id="projects-grid"
                    className="w-full max-w-full grid grid-cols-1 gap-6 px-4 justify-items-center @min-[769px]:grid-cols-2 @min-[1025px]:grid-cols-3 @min-[769px]:gap-6 @min-[769px]:px-6 @min-[1025px]:px-8 pb-8 overflow-x-hidden box-border"
                  >
                    {[
                      {
                        tag: "Graphics Design",
                        title: "UI / UX Mobile App Design",
                        img: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "UI UX Design",
                        title: "Website Template Design",
                        img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "Programming",
                        title: "ISO App Development",
                        img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "Graphics Design",
                        title: "Handcraft With Palm Fan",
                        img: "https://images.unsplash.com/photo-1542744094-3a31f272c490?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "Marketing",
                        title: "Social Media Marketing",
                        img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&h=500&fit=crop"
                      },
                      {
                        tag: "Development",
                        title: "Full Stack Web Application",
                        img: "https://images.unsplash.com/photo-1555421689-491a97ff2040?w=500&h=500&fit=crop"
                      }
                    ].map((proj, i) => (
                      <div key={i} className="portfolio-project-card flex flex-col w-full max-w-[320px] cursor-pointer group box-border" style={{ animationDelay: `${i * 80}ms` }}>
                        <div className="w-full rounded-[20px] overflow-hidden mb-4 @sm:mb-5 border border-gray-100 shadow-sm">
                          <Image
                            src={proj.img}
                            alt={proj.title}
                            width={500}
                            height={500}
                            sizes="(max-width: 768px) 100vw, 320px"
                            className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700"
                            unoptimized
                          />
                        </div>
                        <div className="flex items-start mb-3">
                          <span className="bg-[#63e5ff] border border-gray-900 text-gray-900 px-3.5 py-1.5 rounded-full text-[11px] font-semibold leading-none break-words [overflow-wrap:anywhere] max-w-full">
                            {proj.tag}
                          </span>
                        </div>
                        <h4 className="font-bold text-[15px] text-gray-900 leading-snug group-hover:text-[#1a3636] transition-colors mt-1 break-words [overflow-wrap:anywhere] max-w-full w-full">{proj.title}</h4>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TESTIMONIALS SECTION */}
                <div ref={testimonialsRef} className="w-full max-w-full overflow-x-hidden bg-[#F2F2F2] px-4 @sm:px-6 @md:px-12 @lg:px-20 pb-16 @lg:pb-24">
                  <div className="grid grid-cols-1 @lg:grid-cols-[0.8fr_1.2fr] gap-6 @lg:gap-10 items-stretch min-w-0 max-w-full">
                    <div className={`portfolio-reveal rounded-2xl bg-white p-6 @md:p-8 shadow-lg border border-gray-100 min-w-0 max-w-full break-words overflow-hidden ${testimonialsInView ? "is-visible" : ""}`}>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#1a3636] mb-4 min-w-0 break-words">Client Words</p>
                      <h2 className="text-[clamp(1.5rem,4cqi,2.25rem)] @md:text-4xl font-extrabold text-gray-900 leading-tight mb-4 min-w-0 break-words">
                        Designs that feel clear before they feel clever.
                      </h2>
                      <p className="text-gray-600 text-sm @md:text-base leading-relaxed min-w-0 break-words">
                        Strong visuals are only useful when they help people understand, trust, and take action.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4 min-w-0 max-w-full">
                      {testimonials.map((item, i) => (
                        <div
                          key={item.name}
                          className={`portfolio-reveal rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl min-w-0 max-w-full break-words overflow-hidden ${testimonialsInView ? "is-visible" : ""}`}
                          style={{ transitionDelay: `${i * 140}ms` }}
                        >
                          <div className="mb-5 text-5xl font-black leading-none text-[#63e5ff] shrink-0">“</div>
                          <p className="mb-6 text-[clamp(0.875rem,2.5cqi,1rem)] leading-relaxed text-gray-600 min-w-0 break-words">{item.quote}</p>
                          <div className="flex flex-wrap items-center gap-3 min-w-0">
                            <div className="h-11 w-11 shrink-0 rounded-full bg-[#06224C] text-white flex items-center justify-center text-sm font-black">
                              {item.name.charAt(0)}
                            </div>
                            <div className="min-w-0 break-words flex-1">
                              <p className="font-extrabold text-gray-900 min-w-0 break-words">{item.name}</p>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 min-w-0 break-words">{item.role}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CONTACT SECTION */}
                <div id="contact" className="w-full max-w-full overflow-x-hidden bg-[#F2F2F2] px-4 @sm:px-6 @md:px-12 @lg:px-20 py-12 @sm:py-16 @lg:py-24 relative border-t border-gray-100">
                  <div className="max-w-7xl mx-auto grid grid-cols-1 @lg:grid-cols-2 gap-8 @md:gap-12 @lg:gap-20 items-start @lg:items-center">

                    <div>
                      {/* <h2 className="text-base font-bold flex items-center gap-1 mb-4 text-gray-800 tracking-wide w-max">
                        Get In <span className="bg-[#c4ff0b] text-gray-900 px-2 py-0.5 rounded-full text-sm font-extrabold ml-1 leading-none shadow-sm flex items-center h-6">Touch</span>
                      </h2> */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <h2 className="text-3xl @sm:text-4xl @md:text-5xl @lg:text-6xl font-extrabold text-gray-900 tracking-tight break-words leading-tight">Get In</h2>
                        <span className="bg-[#63e5ff] text-gray-900 font-extrabold px-3 py-1 rounded-full text-2xl @sm:text-3xl @md:text-4xl @lg:text-5xl tracking-tight leading-none break-words">Touch</span>
                      </div>
                      <h3 className="text-3xl @sm:text-4xl @md:text-5xl font-extrabold text-gray-900 max-w-2xl leading-tight mb-6 break-words">
                        Let’s build something <br className="hidden @md:block" />  great together.
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md">
                        Fill out the form or reach out via email to discuss how we can work together to bring your ideas to life.
                      </p>

                      <div className="space-y-6">
                        <div className="flex items-center gap-4 min-w-0 max-w-full">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-[#1a3636] shrink-0">
                            <FaEnvelope size={18} className="shrink-0" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</p>
                            <p className="text-gray-900 font-bold break-all [overflow-wrap:anywhere] max-w-full">hello@example.com</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 min-w-0 max-w-full">
                          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-[#1a3636] shrink-0">
                            <FaMobileAlt size={18} className="shrink-0" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Phone</p>
                            <p className="text-gray-900 font-bold break-all [overflow-wrap:anywhere] max-w-full">+1 (555) 000-0000</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 @md:p-8 shadow-xl shadow-gray-200/50 border border-gray-100 min-w-0 max-w-full overflow-hidden">
                      <form className="space-y-4 @sm:space-y-5 min-w-0 w-full" onSubmit={(e) => e.preventDefault()}>
                        <div className="grid grid-cols-1 @md:grid-cols-2 gap-4 @sm:gap-5 min-w-0 w-full">
                          <div className="min-w-0 w-full">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 break-words">Your Name</label>
                            <input type="text" placeholder="John Doe" className="w-full max-w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#63e5ff] focus:border-transparent transition-all min-w-0" />
                          </div>
                          <div className="min-w-0 w-full">
                            <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 break-words">Your Email</label>
                            <input type="email" placeholder="john@example.com" className="w-full max-w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#63e5ff] focus:border-transparent transition-all min-w-0" />
                          </div>
                        </div>
                        <div className="min-w-0 w-full">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 break-words">Subject</label>
                          <input type="text" placeholder="Web Design Inquiry" className="w-full max-w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#63e5ff] focus:border-transparent transition-all min-w-0" />
                        </div>
                        <div className="min-w-0 w-full">
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 break-words">Message</label>
                          <textarea rows={4} placeholder="Tell us about your project..." className="w-full max-w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#63e5ff] focus:border-transparent transition-all resize-none min-w-0"></textarea>
                        </div>
                        <button className="w-full max-w-full break-words flex-wrap bg-[#1a3636] hover:bg-gray-900 text-white font-bold rounded-xl px-4 py-3.5 text-sm transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-gray-900/20 overflow-hidden">
                          Send Message
                          <FaPaperPlane className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform shrink-0" />
                        </button>
                      </form>
                    </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      {(previewMode === "desktop" || previewMode === "preview" || previewMode === "tablet") && <Footer />}
    </main>
  );
}
