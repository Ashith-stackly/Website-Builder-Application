/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, ReactNode, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaLinkedinIn,
  FaPaperPlane,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { assetPath } from "@/lib/paths";

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
  ["Company", [["About", "about"], ["Privacy Policy", "privacy"], ["Terms of Service", "terms"], ["Contact", "contact"]]],
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

export default function Footer() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<ModalKey | null>(null);
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

    if (!email.trim()) {
      showToast("Please enter an email address.");
      return;
    }

    if (!valid) {
      showToast("Please enter a valid email.");
      return;
    }

    setEmail("");
    showToast("Subscribed successfully!");
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
        className="stackly-footer relative mt-auto w-full overflow-hidden bg-[#071936] py-10 md:py-12"
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
                  <FaEnvelope className="absolute left-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email"
                    className="w-full min-w-0 bg-transparent py-2.5 pl-11 pr-2 text-sm text-gray-800 focus:outline-none"
                  />
                </label>
                <button type="submit" aria-label="Subscribe with email" className="mr-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0A2357] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-blue-600 hover:shadow-lg active:scale-95">
                  <FaPaperPlane className="text-sm" />
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
                <img src={assetPath("/stackly-logo.webp")} alt="Stackly Logo" className="h-5 w-auto object-contain" />
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
                <span className="whitespace-nowrap text-center">Copyright 2018-2026 TheStackly.com INC</span>
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
