"use client";

import { useRef, useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useMotionValueEvent, useReducedMotion, useScroll, animate, useMotionValue, useTransform, useInView } from "framer-motion";
import {
  FaEye,
  FaLaptop,
  FaTabletAlt,
  FaMobileAlt,
  FaRegCheckCircle,
} from "react-icons/fa";
import {
  FaBars,
  FaArrowRight,
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaLocationDot,
  FaCheck,
  FaStar,
  FaPaperPlane,
  FaClipboardList,
  FaUsers,
  FaClock,
  FaCircleCheck,
} from "react-icons/fa6";
import { assetPath } from "@/lib/paths";
import Footer from "@/components/Footer";
import { useBlockpagesEditor } from "@/lib/blockpagesEditorContext";

function dmAsset(path: string) {
  return encodeURI(assetPath(path));
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

const fadeInUp: any = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const slideInLeft: any = {
  hidden: { opacity: 0, x: -50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const slideInRight: any = {
  hidden: { opacity: 0, x: 50 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const sliderVariants: any = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 1
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 1
  })
};

const navItems = [
  { name: "Home", id: "home" },
  { name: "About", id: "about" },
  { name: "Services", id: "services" },
  { name: "Blog", id: "blog" },
  { name: "Contact", id: "contact" },
] as const;

const services = [
  {
    title: "Web & App Development",
    desc: "Build modern, responsive websites that deliver exceptional user experiences. Powerful online presence with professionally designed websites that combine stunning visuals, intuitive navigation, and high performance. We develop scalable web solutions that help your business connect with customers and achieve its digital goals.",
  },
  {
    title: "Content Marketing",
    desc: "Create valuable, engaging, and SEO-friendly content that attracts your target audience, builds brand authority, and drives meaningful customer engagement. Our content marketing strategies help increase website traffic, generate quality leads, and support long-term business growth.",
  },
  {
    title: "Email Marketing",
    desc: "Build stronger customer relationships with targeted email campaigns that engage your audience and drive conversions. We create personalized, results-driven email marketing strategies that increase brand awareness, customer retention, and business growth.",
  },
  {
    title: "SEO Optimization",
    desc: "Improve your website's visibility and attract more organic traffic with our expert SEO strategies. We optimize your content, keywords, and site performance to achieve higher search engine rankings. Our data-driven approach helps increase brand awareness, leads, and long-term business growth.",
  },
  {
    title: "PPC Advertising",
    desc: "Drive instant traffic and generate high-quality leads with targeted pay-per-click advertising campaigns. Our data-driven strategies maximize your return on investment by reaching the right audience at the right time. Increase conversions, boost brand visibility, and achieve measurable business growth.",
  },
  {
    title: "Social Media Marketing",
    desc: "We create engaging social media strategies that help your brand connect with the right audience, increase visibility, and build lasting customer relationships. Through creative content, targeted campaigns, and performance-driven insights, we drive meaningful engagement and business growth.",
  },
];

const planningCards = [
  { title: "Roadmapping", desc: "We provide strategic planning and roadmapping solutions to keep your business moving forward." },
  { title: "Diversification", desc: "We empower businesses to grow beyond their core markets with innovative diversification strategies." },
  { title: "Financial Modeling", desc: "We deliver accurate financial modeling and forecasting solutions to help businesses make confident." },
  { title: "Operational Efficiency", desc: "We enhance operational efficiency by identifying opportunities to reduce costs and maximize results." },
];

const whyChooseItems = [
  "Data -Driven Strategies",
  "Experienced & Certified Team",
  "Transparent Reporting",
  "Customized Solutions",
  "Focus on ROI & Growth",
];

const statsBar = [
  { icon: FaClipboardList, targetValue: 250, suffix: "+", label: "Projects Completed" },
  { icon: FaUsers, targetValue: 150, suffix: "+", label: "Happy Customers" },
  { icon: FaClock, targetValue: 10, suffix: "+", label: "Years of Experience" },
  { icon: FaCircleCheck, targetValue: 98, suffix: "%", label: "Client Satisfaction Rating" },
];

const testimonials = [
  {
    name: "Michael Anderson",
    role: "CEO, Anderson Realty Group",
    text: "BuildNest Construction exceeded our expectations from start to finish. Their team was professional, transparent, and delivered our project on time with exceptional quality. We couldn't be happier with the results.",
    img: dmAsset("/Michael Anderson.webp"),
    isDark: false,
  },
  {
    name: "Sarah Thompson",
    role: "",
    text: "Working with BuildNest Construction was a fantastic experience. Their attention to detail, craftsmanship, and commitment to customer satisfaction made our renovation project stress-free and successful",
    img: dmAsset("/Sarah Thompson.webp"),
    isDark: true,
  },
  {
    name: "David Wilson",
    role: "",
    text: "The team demonstrated outstanding expertise and professionalism throughout the entire construction process. They kept us informed at every stage and delivered exactly what they promised.",
    img: dmAsset("/David Wilson.webp"),
    isDark: false,
  },
];

function TemplateFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  const isEmailValid = /^[^\s@]+@gmail\.com$/.test(email);

  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) return;
    setStatus("loading");
    setTimeout(() => {
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 5000);
    }, 1500);
  };

  return (
    <footer className="bg-[#0A1E3D] text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 @md:px-8 @md:py-16">
        <div className="grid grid-cols-1 gap-10 @md:grid-cols-2 @4xl:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-black">Digital Marketing</h3>
            <p className="text-sm font-medium leading-relaxed text-white/60 @md:text-base">
              The precision-first agency for high-growth enterprises. Driven by data, defined by results. Headquarters in SF &amp; NYC.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-black uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              {["SEO Performance", "Paid Media", "Growth Consulting", "Email Marketing"].map((link) => (
                <li key={link}>
                  <Link href="/404" className="transition hover:text-white">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-black uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              {["Privacy Policy", "Terms of Use", "Cookie Policy", "Careers"].map((link) => (
                <li key={link}>
                  {link === "Privacy Policy" || link === "Terms of Use" ? (
                    <button
                      type="button"
                      className="transition hover:text-white"
                      onClick={() => {
                        if (link === "Privacy Policy") setIsPrivacyModalOpen(true);
                        else if (link === "Terms of Use") setIsTermsModalOpen(true);
                      }}
                    >
                      {link}
                    </button>
                  ) : (
                    <Link href="/404" className="transition hover:text-white">
                      {link}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-black uppercase tracking-wider">Newsletter</h4>
            <p className="mb-4 text-sm font-medium leading-relaxed text-white/60 @md:text-base">Get performance marketing insights delivered weekly to your inbox.</p>
            <form onSubmit={handleNewsletter} className="flex flex-col gap-2">
              <div className="relative flex w-full min-w-0 items-center rounded-full bg-white ring-1 ring-gray-200 transition-all duration-300 hover:ring-2 hover:ring-[#1E56E5]/50 focus-within:ring-2 focus-within:ring-[#1E56E5] focus-within:hover:ring-[#1E56E5]">
                <div className="pointer-events-none absolute left-4 text-gray-400 transition-colors duration-300 group-focus-within:text-gray-300">
                  <FaEnvelope size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="min-w-0 w-full rounded-full bg-transparent py-3.5 pl-11 pr-14 text-sm text-[#0A1E3D] placeholder-[#0A1E3D] outline-none transition-colors duration-300 hover:text-gray-500 hover:placeholder-gray-400 focus:text-gray-500 focus:placeholder-gray-400"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  disabled={!isEmailValid || status === "loading" || email.length === 0}
                  className="absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#0A1E3D] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1E56E5] hover:shadow-lg active:scale-95 disabled:pointer-events-none"
                >
                  {status === "loading" ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    <FaPaperPlane size={14} />
                  )}
                </button>
              </div>
              {!isEmailValid && email.length > 0 && <span className="text-xs text-red-400">Please enter a valid email address.</span>}
              {status === "success" && (
                <div className="rounded-lg bg-green-500/10 p-2 text-xs font-medium text-green-400">
                  Thank you for subscribing to our newsletter!
                </div>
              )}
              {status === "error" && (
                <div className="rounded-lg bg-red-500/10 p-2 text-xs font-medium text-red-400">
                  Something went wrong. Please try again.
                </div>
              )}
            </form>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 @sm:flex-row">
          <p className="text-xs text-white/50">© 2026 Ad-Precision Marketing. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-white/50">
            <button type="button" onClick={() => setIsTermsModalOpen(true)} className="transition hover:text-white">
              Terms of Use
            </button>
            <button type="button" onClick={() => setIsPrivacyModalOpen(true)} className="transition hover:text-white">
              Privacy Policy
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isPrivacyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm @md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-[#F8F9FA] shadow-2xl text-left"
            >
              <div className="flex-none border-b border-gray-300 p-6 @md:p-8">
                <h2 className="text-[clamp(1rem,4.5cqw,1.25rem)] font-bold tracking-widest text-[#0A1E3D] uppercase">Privacy Policy</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6 @md:p-8 text-[#4A5568]">
                <p className="mb-8 text-sm font-medium leading-relaxed @md:text-base">
                  Your privacy is important to us. This policy explains how Stackly collects, uses, and protects your information.
                </p>

                <div className="space-y-6 text-sm @md:text-base">
                  <div>
                    <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">1. Information We Collect</h3>
                    <p className="text-sm font-medium leading-relaxed @md:text-base">We collect account details, contact information, usage data, and project preferences needed to operate the platform.</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">2. How We Use Data</h3>
                    <p className="text-sm font-medium leading-relaxed @md:text-base">We use data to provide services, improve templates, process payments, prevent abuse, and send important updates.</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">3. Security</h3>
                    <p className="text-sm font-medium leading-relaxed @md:text-base">We use reasonable safeguards to protect user data, though no internet transmission is completely risk free.</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">4. Your Rights</h3>
                    <p className="text-sm font-medium leading-relaxed @md:text-base">You can request access, correction, or deletion of personal data by contacting <a href="mailto:privacy@thestackly.com" className="font-bold text-[#1E56E5] hover:underline">privacy@thestackly.com</a>.</p>
                  </div>
                </div>
              </div>

              <div className="flex-none border-t border-gray-300 p-6 flex justify-center">
                <button
                  onClick={() => setIsPrivacyModalOpen(false)}
                  className="rounded-full bg-[#0A1E3D] px-10 py-3 text-sm font-bold tracking-widest text-white transition hover:bg-[#06152b] uppercase"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isTermsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm @md:p-8"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-[#F8F9FA] shadow-2xl text-left"
            >
              <div className="flex-none border-b border-gray-300 p-6 @md:p-8">
                <h2 className="text-[clamp(1rem,4.5cqw,1.25rem)] font-bold tracking-widest text-[#0A1E3D] uppercase">Terms of Use</h2>
              </div>

              <div className="flex-1 overflow-y-auto p-6 @md:p-8 text-[#4A5568]">
                <p className="mb-8 text-sm font-medium leading-relaxed @md:text-base">
                  Welcome to Stackly. By accessing or using our platform, you agree to these Terms of Use.
                </p>

                <div className="space-y-6 text-sm @md:text-base">
                  <div>
                    <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">1. Account Responsibilities</h3>
                    <p className="text-sm font-medium leading-relaxed @md:text-base">You are responsible for maintaining your login credentials and all activity under your account.</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">2. Template Usage</h3>
                    <p className="text-sm font-medium leading-relaxed @md:text-base">Templates may be customized for your own projects. Redistribution or resale without permission is not allowed.</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">3. Payments</h3>
                    <p className="text-sm font-medium leading-relaxed @md:text-base">Paid assets and subscriptions are billed according to the plan selected at purchase.</p>
                  </div>
                  <div>
                    <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">4. Platform Changes</h3>
                    <p className="text-sm font-medium leading-relaxed @md:text-base">We may improve, update, or discontinue features to keep Stackly reliable and secure.</p>
                  </div>
                </div>
              </div>

              <div className="flex-none border-t border-gray-300 p-6 flex justify-center">
                <button
                  onClick={() => setIsTermsModalOpen(false)}
                  className="rounded-full bg-[#0A1E3D] px-10 py-3 text-sm font-bold tracking-widest text-white transition hover:bg-[#06152b] uppercase"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}

function CountUp({ targetValue, suffix = "", prefix = "", decimals = 0 }: { targetValue: number; suffix?: string; prefix?: string; decimals?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => decimals > 0 ? latest.toFixed(decimals) : Math.round(latest).toString());
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (inView) {
      const controls = animate(count, targetValue, { duration: 2.5, ease: "easeOut" });
      return controls.stop;
    }
  }, [count, inView, targetValue]);

  return (
    <span ref={ref} className="inline-flex">
      {prefix}<motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

export default function DigitalMarketingPreviewPage() {
  const blockpagesEditor = useBlockpagesEditor();
  const isBlockpages = Boolean(blockpagesEditor?.enabled);
  const [deviceMode, setDeviceMode] = useState<"preview" | "desktop" | "tablet" | "mobile">("preview");
  const [innerMobileMenuOpen, setInnerMobileMenuOpen] = useState(false);
  const [innerNavHidden, setInnerNavHidden] = useState(false);
  const [testimonialIndex, setTestimonialIndex] = useState(1);
  const [slideDirection, setSlideDirection] = useState(1);
  const [isHoveredTestimonials, setIsHoveredTestimonials] = useState(false);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const { scrollY: canvasScrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const [contactForm, setContactForm] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [contactStatus, setContactStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const isEmailValid = /^[^\s@]+@gmail\.com$/.test(contactForm.email);
  const isFormValid = contactForm.firstName.trim() && contactForm.lastName.trim() && isEmailValid && contactForm.message.trim();

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSubmitted(true);
    if (!isFormValid) return;
    setContactStatus("loading");
    setTimeout(() => {
      setContactStatus("success");
      setContactForm({ firstName: "", lastName: "", email: "", message: "" });
      setHasSubmitted(false);
      setTimeout(() => setContactStatus("idle"), 5000);
    }, 1500);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (isHoveredTestimonials) return;
    const interval = setInterval(() => {
      setSlideDirection(1);
      setTestimonialIndex((i) => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isHoveredTestimonials]);

  useMotionValueEvent(canvasScrollY, "change", (current) => {
    if (isBlockpages) return;
    const previous = canvasScrollY.getPrevious() ?? 0;
    setInnerNavHidden(!innerMobileMenuOpen && current > previous && current > 150);
  });

  const previewNavHidden = innerNavHidden && !innerMobileMenuOpen && !prefersReducedMotion;

  const visibleTestimonials = [
    testimonials[(testimonialIndex + testimonials.length - 1) % testimonials.length],
    testimonials[testimonialIndex],
    testimonials[(testimonialIndex + 1) % testimonials.length],
  ];

  return (
    <main
      className={
        isBlockpages
          ? "@container dm-shell w-full min-w-0 max-w-full overflow-x-hidden overflow-y-visible bg-white font-sans text-gray-900 box-border [&_button]:cursor-pointer [&_a]:cursor-pointer"
          : "flex flex-col min-h-screen bg-[#F3F4F6] overflow-x-hidden font-sans text-gray-900 pt-6"
      }
    >
      {!isBlockpages && (
        <div className="fixed z-[100] transition-all duration-500 ease-in-out shrink-0 bottom-6 left-1/2 -translate-x-1/2 hidden md:block" data-template-chrome="true" data-device-preview-toolbar="true">
          <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-xl px-4 py-2">
            <Link href="/landing#templates" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-50 text-[#06224C] transition focus-visible:outline-none" title="Back to Landing">
              <FaEye size={16} />
            </Link>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button onClick={() => setDeviceMode("desktop")} className={`w-10 h-10 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition focus-visible:outline-none ${deviceMode === "desktop" ? "border-gray-300 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "border-gray-100 text-gray-500"}`} title="Desktop View">
              <FaLaptop size={16} />
            </button>
            <button onClick={() => setDeviceMode("tablet")} className={`w-10 h-10 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition focus-visible:outline-none ${deviceMode === "tablet" ? "border-gray-300 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "border-gray-100 text-gray-500"}`} title="Tablet View">
              <FaTabletAlt size={16} />
            </button>
            <button onClick={() => setDeviceMode("mobile")} className={`w-10 h-10 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition focus-visible:outline-none ${deviceMode === "mobile" ? "border-gray-300 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "border-gray-100 text-gray-500"}`} title="Mobile View">
              <FaMobileAlt size={16} />
            </button>
          </div>
        </div>
      )}

      <div className={isBlockpages ? "w-full min-w-0" : `flex-1 flex justify-center w-full transition-all duration-500 ${deviceMode !== "preview" ? "py-4 md:py-8 px-2 md:px-4" : ""}`}>
        {/* RESPONSIVE CANVAS FRAME */}
        <div
          ref={isBlockpages ? undefined : canvasScrollRef}
          className={isBlockpages ? "@container w-full min-w-0" : `@container bg-white relative flex flex-col overflow-x-hidden overflow-y-auto transition-all duration-500 ease-in-out ${deviceMode === "mobile" ? "w-full max-w-[375px] h-[85vh] rounded-[2.5rem] border-[8px] border-gray-800 shadow-2xl"
            : deviceMode === "tablet" ? "w-full max-w-[768px] h-[90vh] rounded-[2rem] border-[8px] border-gray-800 shadow-2xl"
            : deviceMode === "desktop" ? "w-full max-w-[1200px] h-[85vh] rounded-[1.75rem] border-2 border-gray-300 shadow-2xl"
            : "w-full min-h-screen"
            }`}
        >
          <div className="w-full max-w-full overflow-x-hidden min-w-0">
            <motion.div
              className="sticky top-0 z-50 flex w-full flex-wrap items-center justify-between gap-2 border-b border-gray-300 bg-[#06224C]/95 px-3 py-2 backdrop-blur-md @sm:gap-4 @sm:px-4 @sm:py-3 @md:px-8 @xl:flex-nowrap"
              animate={{ y: previewNavHidden ? -96 : 0, opacity: previewNavHidden ? 0 : 1 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                  <div className="relative flex w-full items-center justify-between px-1 @3xl:hidden">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <Link
                        href="/landing"
                        className="flex h-7 w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[50%] bg-white px-1 @sm:h-8 @sm:w-[72px]"
                      >
                        <img
                          src={assetPath("/stackly-logo.webp")}
                          alt="Stackly logo"
                          width={80}
                          height={24}
                          className="h-[10px] w-auto object-contain @sm:h-[12px]"
                        />
                      </Link>
                      <span className="break-words text-[clamp(0.75rem,2.5vw,0.875rem)] font-semibold text-white @sm:text-sm">
                        Digital Marketing
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInnerMobileMenuOpen((v) => !v)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/25 text-white transition hover:bg-white/10 @sm:h-8 @sm:w-8"
                    >
                      <FaBars size={12} />
                    </button>
                  </div>

                  <div className="relative hidden w-full items-center justify-between @3xl:flex">
                    <div className="z-10 flex shrink-0 items-center justify-start">
                      <Link href="/landing" className="flex h-10 min-w-[92px] items-center justify-center rounded-[50%] bg-white px-3">
                        <img src={assetPath("/stackly-logo.webp")} alt="Stackly logo" width={92} height={28} className="h-[18px] w-auto object-contain" />
                      </Link>
                    </div>
                    <span className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold text-white">
                      Digital Marketing
                    </span>
                    <div className="z-10 flex shrink-0 flex-wrap justify-end gap-x-6">
                      {navItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => scrollToSection(item.id)}
                          className="group relative text-sm text-white"
                        >
                          {item.name}
                          <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-white transition-all duration-300 group-hover:w-full" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${innerMobileMenuOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-2 bg-[#06224C] px-3 pb-3 pt-2">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          scrollToSection(item.id);
                          setInnerMobileMenuOpen(false);
                        }}
                        className="rounded-md border border-white/25 px-3 py-2 text-xs text-white transition hover:scale-105 hover:bg-white/10"
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>


                {/* Hero */}
                <section id="home" className="relative flex min-h-[320px] w-full items-center justify-center overflow-hidden @sm:min-h-[420px] @md:min-h-[520px]">
                  <div className="absolute inset-0 bg-[#0A1E3D]">
                    <motion.img
                      initial={{ scale: 1.1, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 1 }}
                      viewport={{ once: true }}
                      src={dmAsset("/Digital Marketing.webp")}
                      alt="Precision Marketing"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                  </div>
                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                    className="relative z-10 mx-auto min-w-0 max-w-3xl px-4 py-16 text-center @md:px-8 @md:py-24"
                  >
                    <motion.h1 variants={fadeInUp} className="mb-10 text-[clamp(1.5rem,7cqw,2.25rem)] font-black leading-tight text-white break-words @md:text-[clamp(2rem,8cqw,3rem)] @lg:text-[clamp(2.5rem,10cqw,3.75rem)]">
                      Precision Marketing for <br className="hidden @sm:block" />
                      Ambitious Brands
                    </motion.h1>
                    <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => scrollToSection("contact")}
                        className="cursor-pointer rounded-lg bg-white px-8 py-3.5 text-[15px] font-bold text-[#0A1E3D] transition hover:scale-105"
                      >
                        Get Started
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToSection("about")}
                        className="cursor-pointer rounded-lg bg-[#0A1E3D] px-8 py-3.5 text-[15px] font-bold text-white transition hover:scale-105"
                      >
                        Learn More
                      </button>
                    </motion.div>
                  </motion.div>
                </section>

                {/* Mission & Vision */}
                <section id="about" className="bg-[#FFF0F0] px-4 py-12 @md:px-8 @md:py-20">
                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                    className="mx-auto min-w-0 max-w-6xl text-center"
                  >
                    <motion.h2 variants={fadeInUp} className="mb-4 text-[clamp(1.125rem,5cqw,1.5rem)] font-black text-[#0A1E3D] @md:text-[clamp(1.5rem,7cqw,2.25rem)]">
                      Empowering Brands Through Digital Innovation
                    </motion.h2>
                    <motion.p variants={fadeInUp} className="mx-auto mb-12 max-w-3xl text-sm font-medium leading-relaxed text-[#4A5568] @md:text-base">
                      We help businesses grow online with innovative digital marketing strategies,
                      creative solutions, and data-driven campaigns that deliver measurable
                      results and lasting success.
                    </motion.p>

                    <div className="space-y-8">
                      {[
                        {
                          badge: "Mission",
                          text: "Our mission is to help businesses grow through innovative digital marketing strategies that increase visibility, engagement, and measurable results.",
                          img: dmAsset("/Digital marketing mission.webp"),
                          reverse: false,
                        },
                        {
                          badge: "Vision",
                          text: "To empower businesses with innovative digital marketing solutions that drive growth, enhance brand visibility, and create lasting success in the digital world.",
                          img: dmAsset("/Digital marketing vision.webp"),
                          reverse: true,
                        },
                      ].map((card) => (
                        <motion.div
                          variants={fadeInUp}
                          key={card.badge}
                          className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm @sm:p-6 @md:p-10"
                        >
                          <div className={`grid items-center gap-10 @2xl:grid-cols-2 ${card.reverse ? "@2xl:[&>*:first-child]:order-2" : ""}`}>
                            <div className="flex min-w-0 flex-col items-start text-left">
                              <span className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#0A1E3D] px-3 py-1.5 text-[clamp(10px,3cqw,14px)] font-medium text-white shadow-sm @sm:mb-6 @sm:gap-2.5 @sm:px-5 @sm:py-2">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-green-400 @sm:h-2.5 @sm:w-2.5" />
                                {card.badge}
                              </span>
                              <p className="w-full min-w-0 break-words text-[clamp(1rem,4.5cqw,1.25rem)] font-semibold leading-snug text-[#0A1E3D] @md:text-[clamp(1.125rem,5cqw,1.5rem)] @xl:text-[clamp(1.25rem,6cqw,1.75rem)]">
                                {card.text}
                              </p>
                            </div>
                            <div className="overflow-hidden rounded-xl">
                              <img src={card.img} alt={card.badge} className="w-full h-auto object-cover" loading="lazy" />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </section>

                {/* Services */}
                <section id="services" className="bg-[#0A1E3D] px-4 py-12 @md:px-8 @md:py-20">
                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                    className="mx-auto max-w-6xl"
                  >
                    <motion.h2 variants={fadeInUp} className="mb-4 text-[clamp(1.25rem,6cqw,1.875rem)] font-bold text-white @md:text-[clamp(1.5rem,7cqw,2.25rem)]">Our Services</motion.h2>
                    <motion.p variants={fadeInUp} className="mb-12 max-w-md text-sm font-medium leading-relaxed text-white/80 @md:text-base">
                      Delivering innovative solutions that help businesses grow, improve efficiency, and achieve lasting success.
                    </motion.p>
                    <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @4xl:grid-cols-3 @4xl:gap-6">
                      {services.map((service) => (
                        <motion.div
                          variants={fadeInUp}
                          whileHover={{ y: -5 }}
                          whileFocus={{ y: -5 }}
                          key={service.title}
                          tabIndex={0}
                          className="group min-w-0 rounded-xl bg-[#123163] p-6 shadow-sm transition-colors hover:bg-[#163a75] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0A1E3D] @md:p-8"
                        >
                          <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
                            <h3 className="w-full min-w-0 break-words text-base font-semibold text-white @md:text-lg">{service.title}</h3>
                            <FaArrowRight className="shrink-0 text-white/70 transition group-hover:translate-x-1 group-hover:text-white group-focus:translate-x-1 group-focus:text-white" />
                          </div>
                          <p className="min-w-0 break-words text-sm font-medium leading-relaxed text-white/80 @md:text-base">{service.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </section>

                {/* Business Planning */}
                <section className="bg-[#FFF0F0] px-4 py-12 @md:px-8 @md:py-20">
                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                    className="mx-auto grid max-w-6xl items-center gap-10 @3xl:grid-cols-2"
                  >
                    <motion.div variants={slideInLeft} className="min-w-0 @container pr-0 @3xl:pr-10">
                      <h2 className="mb-6 w-full max-w-[24rem] text-[clamp(1.25rem,6cqw,1.875rem)] font-bold leading-tight text-[#0A1E3D] break-words @md:text-[clamp(1.5rem,7cqw,2.25rem)]">Business Planning and Development</h2>
                      <p className="mb-10 text-sm font-medium leading-relaxed text-[#4A5568] @md:text-base">
                        At <span className="text-[#1E56E5]">Elevate Digital</span>, we help businesses turn ideas into actionable strategies for sustainable growth and success.
                      </p>
                      <div className="grid grid-cols-1 gap-5 @md:grid-cols-2">
                        {planningCards.map((card) => (
                          <div key={card.title} className="min-w-0 rounded-xl bg-white p-6 shadow-sm">
                            <div className="mb-3 flex min-w-0 items-center gap-2">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E56E5]" />
                              <h3 className="min-w-0 break-words text-sm font-bold text-[#0A1E3D]">{card.title}</h3>
                            </div>
                            <p className="min-w-0 break-words text-sm font-medium leading-relaxed text-[#4A5568] @md:text-base">{card.desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                    <motion.div variants={slideInRight} className="min-w-0 w-full overflow-hidden rounded-2xl shadow-xl">
                      <img
                        src={dmAsset("/Business planning.webp")}
                        alt="Business planning"
                        className="w-full h-auto object-cover"
                        loading="lazy"
                      />
                    </motion.div>
                  </motion.div>
                </section>

                {/* Why Choose Us */}
                <section className="bg-[#FFF0F0] px-4 pb-12 @md:px-8 @md:pb-20">
                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                    className="mx-auto max-w-6xl"
                  >
                    <div className="bg-white shadow-sm overflow-hidden">
                      <div className="p-4 @sm:p-6 @md:p-8 @lg:p-12">
                        <motion.h2 variants={fadeInUp} className="mb-12 text-center text-[clamp(1.25rem,6cqw,1.875rem)] font-bold text-[#1E56E5] @md:text-[clamp(1.5rem,7cqw,2.25rem)]">Why Choose US</motion.h2>
                        <div className="grid items-center gap-10 @2xl:grid-cols-2 @2xl:gap-16">
                          <motion.div variants={slideInLeft} className="min-w-0 w-full flex items-center justify-center">
                            <div className="relative w-fit max-w-full">
                              <div className="w-full max-w-md border-2 border-[#1E56E5] p-1">
                                <img
                                  src={dmAsset("/Organic traffic.webp")}
                                  alt="Analytics dashboard"
                                  className="w-auto h-auto max-w-full max-h-[45vh] object-contain"
                                  loading="lazy"
                                />
                              </div>
                              <motion.div variants={fadeInUp} className="absolute right-0 bottom-0 translate-x-2 translate-y-2 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-4 shadow-xl scale-75 origin-bottom-right @sm:translate-x-[10%] @sm:translate-y-[10%] @md:translate-x-[20%] @md:translate-y-[20%] @sm:scale-90 @md:scale-100">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Organic Traffic</p>
                                <div className="flex items-baseline gap-2">
                                  <p className="text-2xl font-black leading-none text-[#0A1E3D]"><CountUp targetValue={18.2} decimals={1} suffix="K" /></p>
                                  <span className="text-sm font-bold leading-none text-green-700"><CountUp targetValue={14.8} decimals={1} prefix="+" suffix="%" /></span>
                                </div>
                              </motion.div>
                            </div>
                          </motion.div>
                          <motion.div variants={slideInRight} className="min-w-0">
                            <h3 className="min-w-0 break-words mb-8 max-w-[24rem] text-[clamp(1.125rem,5cqw,1.5rem)] font-bold leading-snug text-[#0A1E3D] @md:text-[clamp(1.25rem,6cqw,1.875rem)]">
                              We Deliver Results That Drive Business Growth
                            </h3>
                            <ul className="space-y-6">
                              {whyChooseItems.map((item) => (
                                <motion.li variants={fadeInUp} key={item} className="flex min-w-0 items-center gap-4">
                                  <FaRegCheckCircle className="shrink-0 text-[22px] text-[#0A1E3D]" />
                                  <span className="min-w-0 break-words text-sm font-medium leading-relaxed text-[#4A5568] @md:text-base">{item}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 @xs:grid-cols-2 @2xl:grid-cols-4 gap-4 @md:gap-6 bg-[#0A1E3D] px-4 py-6 @md:px-6 @md:py-8 @2xl:px-10 @2xl:py-8">
                        {statsBar.map((stat) => (
                          <motion.div variants={fadeInUp} key={stat.label} className="flex min-w-0 items-center gap-3 @md:gap-4">
                            <stat.icon className="shrink-0 text-[clamp(24px,6cqw,32px)] text-[#FBBF24] @md:text-[40px]" />
                            <div className="min-w-0">
                              <p className="min-w-0 break-words text-[clamp(16px,4cqw,18px)] font-bold text-[#FBBF24] @md:text-[clamp(1rem,4.5cqw,1.25rem)]">
                                <CountUp targetValue={stat.targetValue} suffix={stat.suffix} />
                              </p>
                              <p className="min-w-0 break-words text-[clamp(9px,2.5cqw,11px)] font-medium leading-tight text-white/90 @md:text-xs">{stat.label}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </section>

                {/* Testimonials */}
                <section id="blog" className="bg-[#FFF0F0] px-4 py-12 @md:px-8 @md:py-20">
                  <div
                    className="mx-auto max-w-6xl text-center"
                    onMouseEnter={() => setIsHoveredTestimonials(true)}
                    onMouseLeave={() => setIsHoveredTestimonials(false)}
                  >
                    <motion.div
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, margin: "-50px" }}
                      variants={fadeInUp}
                    >
                      <h2 className="mb-4 text-[clamp(1.25rem,6cqw,1.875rem)] font-bold text-[#0A1E3D] @md:text-[clamp(1.5rem,7cqw,2.25rem)]">What Client Says</h2>
                      <p className="mx-auto mb-12 max-w-xl text-sm font-medium leading-relaxed text-[#4A5568] @md:text-base">
                        Our client&apos;s success stories showcase the impact of <br className="hidden @sm:block" /> our digital marketing expertise.
                      </p>
                    </motion.div>

                    <div className="relative min-h-[300px] overflow-hidden">
                      <AnimatePresence mode="popLayout" custom={slideDirection}>
                        <motion.div
                          key={testimonialIndex}
                          custom={slideDirection}
                          variants={sliderVariants}
                          initial="enter"
                          animate="center"
                          exit="exit"
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="grid w-full grid-cols-1 items-stretch gap-6 @3xl:grid-cols-3"
                        >
                          {visibleTestimonials.map((t, i) => (
                            <motion.div
                              key={`${t.name}-${i}`}
                              className={`group flex w-full min-w-0 flex-col rounded-2xl p-6 shadow-sm @md:p-8 transition-colors duration-500 bg-white text-[#0A1E3D] hover:bg-[#0A1E3D] hover:text-white ${i === 1 ? "flex" : "hidden @3xl:flex"
                                }`}
                            >
                              <img src={t.img} alt={t.name} className="mx-auto mb-4 h-16 w-16 rounded-full object-cover" />
                              <div className="mb-6 flex justify-center gap-1 text-[#FBBF24]">
                                {Array.from({ length: 5 }).map((_, si) => (
                                  <FaStar key={si} size={14} />
                                ))}
                              </div>
                              <p className="min-w-0 break-words flex-1 text-left text-sm font-medium leading-relaxed transition-colors duration-500 @md:text-base text-[#4A5568] group-hover:text-gray-300">
                                {t.text}
                              </p>
                              <div className="min-w-0 mt-6 text-right">
                                <p className="min-w-0 break-words font-bold transition-colors duration-500 text-[#0A1E3D] group-hover:text-white">{t.name}</p>
                                {t.role && (
                                  <p className="min-w-0 break-words mt-0.5 text-[10px] font-medium transition-colors duration-500 text-gray-500 group-hover:text-gray-400 @sm:text-xs">{t.role}</p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                    <div className="mt-10 flex justify-center gap-4">
                      <button
                        type="button"
                        aria-label="Previous testimonial"
                        onClick={() => {
                          setSlideDirection(-1);
                          setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0A1E3D] shadow-sm transition hover:bg-gray-50 active:bg-[#0A1E3D] active:text-white @sm:h-12 @sm:w-12"
                      >
                        <FaArrowLeft size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Next testimonial"
                        onClick={() => {
                          setSlideDirection(1);
                          setTestimonialIndex((i) => (i + 1) % testimonials.length);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0A1E3D] shadow-sm transition hover:bg-gray-50 active:bg-[#0A1E3D] active:text-white @sm:h-12 @sm:w-12"
                      >
                        <FaArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </section>

                {/* CTA Banner */}
                <motion.section
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={staggerContainer}
                  className="relative overflow-hidden bg-[#0A1E3D] px-4 py-16 text-center @md:px-8 @md:py-24"
                >
                  <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap text-[clamp(1.75rem,10cqw,10rem)] font-black uppercase tracking-widest text-white/10 @sm:text-[clamp(3rem,12cqw,10rem)] @md:text-[clamp(4rem,15cqw,10rem)]">
                    PRECISION
                  </p>
                  <div className="relative z-10 mx-auto max-w-2xl">
                    <motion.h2 variants={fadeInUp} className="mb-4 text-[clamp(1.125rem,5cqw,1.5rem)] font-black text-white @md:text-[clamp(1.5rem,7cqw,2.25rem)]">Ready to Scale Your Growth?</motion.h2>
                    <motion.p variants={fadeInUp} className="mb-8 text-sm font-medium leading-relaxed text-white/90 @md:text-base">
                      Stop guessing. Start growing. Our performance audits reveal exactly where you&apos;re leaving money on the table. Join 100+ brands scaling with precision.
                    </motion.p>
                    <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => scrollToSection("contact")}
                        className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#0A1E3D] transition hover:scale-105"
                      >
                        Get Started
                      </button>
                      <button
                        type="button"
                        onClick={() => scrollToSection("contact")}
                        className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-[#0A1E3D] transition hover:scale-105"
                      >
                        Schedule a Call
                      </button>
                    </motion.div>
                  </div>
                </motion.section>

                {/* Contact */}
                <section id="contact" className="bg-[#FFF0F0] px-4 py-12 @md:px-8 @md:py-20">
                  <motion.div
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    variants={staggerContainer}
                    className="mx-auto flex max-w-6xl flex-col gap-12 @md:flex-row @md:gap-16"
                  >
                    <motion.div variants={slideInLeft} className="w-full min-w-0 @md:w-1/2 @md:pr-10">
                      <h2 className="mb-6 w-full max-w-[16rem] text-[clamp(1.25rem,6cqw,1.875rem)] font-bold leading-tight text-[#0A1E3D] break-words @md:text-[clamp(1.5rem,7cqw,2.25rem)]">
                        Get in<br />touch with us
                      </h2>
                      <p className="mb-10 text-sm font-medium leading-relaxed text-[#4A5568] @md:text-base">
                        We&apos;re here to help! Whether you have a question about our services, need assistance with your account or want to provide feedback, our team is ready to assist you.
                      </p>
                      <div className="mb-10 space-y-6">
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EA4335" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                          </span>
                          <p className="min-w-0 break-words text-[15px] font-bold text-[#0A1E3D] @md:text-base">buildnest@gmail.com</p>
                        </div>
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[#0A1E3D]">
                            <FaPhone size={16} />
                          </span>
                          <p className="min-w-0 break-words text-[15px] font-bold text-[#0A1E3D] @md:text-base">+91 9455678937</p>
                        </div>
                        <div className="flex min-w-0 items-center gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-300 text-[#34A853]">
                            <FaLocationDot size={16} />
                          </span>
                          <p className="min-w-0 break-words text-[15px] font-bold text-[#0A1E3D] @md:text-base">
                            245 Business Park Road, Austin, TX 78701, USA
                          </p>
                        </div>
                      </div>
                      <div className="mb-8 flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <p className="text-sm font-medium text-[#6B7280]">
                          Available Monday to Friday, 9:30 AM - 6:30 PM GMT.
                        </p>
                      </div>

                    </motion.div>

                    <motion.div variants={slideInRight} className="w-full min-w-0 rounded-2xl border-2 border-[#2196F3] bg-white p-4 shadow-sm @sm:p-6 @md:w-1/2 @md:p-10">
                      <form className="flex flex-col gap-4 @md:gap-6" onSubmit={handleContactSubmit}>
                        <div className="grid min-w-0 grid-cols-1 gap-6 @md:grid-cols-2">
                          <label className="flex min-w-0 flex-col">
                            <span className="mb-2 text-[clamp(12px,3cqw,15px)] font-bold text-[#4A5568]">First Name <span className="text-red-500">*</span></span>
                            <input
                              type="text"
                              value={contactForm.firstName}
                              onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                              placeholder="Enter your first name"
                              className="w-full min-w-0 rounded-lg border-none bg-[#CBD5E1] px-3 py-2.5 @sm:px-4 @sm:py-3.5 text-[clamp(11px,2.5cqw,13px)] text-[#0A1E3D] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                            />
                            {hasSubmitted && contactForm.firstName.trim() === "" && <span className="mt-1 text-xs text-red-500">First name is required.</span>}
                          </label>
                          <label className="flex min-w-0 flex-col">
                            <span className="mb-2 text-[clamp(12px,3cqw,15px)] font-bold text-[#4A5568]">Last Name <span className="text-red-500">*</span></span>
                            <input
                              type="text"
                              value={contactForm.lastName}
                              onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                              placeholder="Enter your last name"
                              className="w-full min-w-0 rounded-lg border-none bg-[#CBD5E1] px-3 py-2.5 @sm:px-4 @sm:py-3.5 text-[clamp(11px,2.5cqw,13px)] text-[#0A1E3D] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                            />
                            {hasSubmitted && contactForm.lastName.trim() === "" && <span className="mt-1 text-xs text-red-500">Last name is required.</span>}
                          </label>
                        </div>
                        <label className="flex min-w-0 flex-col">
                          <span className="mb-2 text-[clamp(12px,3cqw,15px)] font-bold text-[#4A5568]">Email <span className="text-red-500">*</span></span>
                          <input
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="Enter your email address"
                            className="w-full min-w-0 rounded-lg border-none bg-[#CBD5E1] px-3 py-2.5 @sm:px-4 @sm:py-3.5 text-[clamp(11px,2.5cqw,13px)] text-[#0A1E3D] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                          />
                          {hasSubmitted && !isEmailValid && contactForm.email.length > 0 && <span className="mt-1 text-xs text-red-500">Please enter a valid email.</span>}
                          {hasSubmitted && contactForm.email.length === 0 && <span className="mt-1 text-xs text-red-500">Email is required.</span>}
                        </label>
                        <label className="flex min-w-0 flex-col">
                          <span className="mb-2 text-[clamp(12px,3cqw,15px)] font-bold text-[#4A5568]">How can we help you? <span className="text-red-500">*</span></span>
                          <textarea
                            rows={4}
                            value={contactForm.message}
                            onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                            placeholder="Enter your message"
                            className="w-full min-w-0 resize-none rounded-lg border-none bg-[#CBD5E1] px-3 py-2.5 @sm:px-4 @sm:py-3.5 text-[clamp(11px,2.5cqw,13px)] text-[#0A1E3D] placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2196F3]"
                          />
                          {hasSubmitted && contactForm.message.trim() === "" && <span className="mt-1 text-xs text-red-500">Message is required.</span>}
                        </label>
                        {contactStatus === "success" && (
                          <div className="rounded-lg bg-green-50 p-3 text-sm font-medium text-green-800">
                            Your message has been sent successfully.
                          </div>
                        )}
                        {contactStatus === "error" && (
                          <div className="w-full min-w-0 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-800">
                            There was an error sending your message. Please try again.
                          </div>
                        )}
                        <div className="mt-2 flex w-full min-w-0 justify-center">
                          <button
                            type="submit"
                            disabled={contactStatus === "loading"}
                            className="group flex w-full min-w-0 items-center justify-center gap-2 @sm:gap-3 rounded-full bg-[#0A1E3D] px-2 py-2 @sm:pl-8 @sm:pr-2 text-[clamp(10px,3cqw,15px)] font-semibold text-white transition hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <span className="min-w-0 whitespace-normal leading-tight text-center">{contactStatus === "loading" ? "Sending..." : "Send Message"}</span>
                            <span className="flex h-6 w-6 @sm:h-8 @sm:w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0A1E3D]">
                              <FaArrowRight size={14} className="h-3 w-3 @sm:h-3.5 @sm:w-3.5" />
                            </span>
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                </section>

                <TemplateFooter />
              </div>
            </div>
          </div>

      {!isBlockpages && (deviceMode === "desktop" || deviceMode === "preview") && <Footer />}
    </main>
  );
}
