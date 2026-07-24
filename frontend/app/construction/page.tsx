"use client";

import { useState, useRef, useCallback, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { FaEye, FaLaptop, FaTabletAlt, FaMobileAlt, FaPaperPlane } from "react-icons/fa";
import {
  FaBars,
  FaRightFromBracket,
  FaUser,
  FaXmark,
  FaHammer,
  FaLeaf,
  FaBuilding,
  FaPenRuler,
  FaArrowRight,
  FaChevronDown,
  FaStar,
  FaLocationDot,
  FaEnvelope,
  FaPhone,
  FaArrowLeft,
  FaClipboardList,
  FaUserGroup,
  FaHelmetSafety,
  FaCertificate,
} from "react-icons/fa6";
import { motion, AnimatePresence } from "framer-motion";
import { assetPath } from "@/lib/paths";
import { scrollBlockpagesCanvasToSection } from "@/lib/blockpagesTemplateSections";
import { resolveBlockpagesDeviceMode } from "@/lib/blockpagesEditorInteraction";
import { useBlockpagesEditor } from "@/lib/blockpagesEditorContext";

const START_BUILDING_HREF = "/signup";

function scrollToSection(sectionId: string) {
  scrollBlockpagesCanvasToSection(sectionId);
}

// SAFELIST FOR TAILWIND JIT (Required for getModeClasses dynamically generated tablet widths)
// w-[calc(50%-12px)] w-[calc(33.333%-16px)] w-[calc(50%-16px)] w-[calc(33.333%-21px)]
// bg-gradient-to-r block flex flex-1 flex-row flex-wrap gap-12 gap-16 gap-2.5 gap-3 gap-4 gap-6 gap-8 gap-x-4 gap-x-8 gap-y-4 gap-y-5 grid grid-cols-2 h-12 h-40 h-48 h-56 h-60 h-64 h-72 h-80 h-auto hidden inline-flex items-center items-start justify-between justify-center justify-end left-1/3 mb-10 mb-12 mb-16 mb-3 mb-4 mb-6 mb-8 min-w-[250px] mt-0 mt-0.5 mt-1 mt-12 mt-8 mx-0 opacity-90 overflow-visible p-10 p-12 p-14 p-16 p-4 p-6 p-8 pb-0 pb-16 pb-20 pb-24 pb-5 pt-16 pt-2 pt-8 px-0 px-12 px-4 px-6 px-8 py-16 py-2.5 py-24 py-3 py-3.5 py-5 py-8 rounded-[2.5rem] rounded-[2rem] rounded-[3rem] rounded-3xl rounded-b-3xl rounded-t-3xl shrink-0 space-y-6 text-2xl text-3xl text-4xl text-5xl text-base text-left text-lg text-sm text-xl text-xs to-transparent translate-x-8 -translate-x-8 w-1/2 w-12 w-3/5 w-40 w-48 w-8 w-auto
function getModeClasses(classesStr: string, deviceMode: "desktop" | "tablet" | "mobile") {
  if (deviceMode === "desktop") return classesStr;

  const classes = classesStr.split(/\s+/).filter(Boolean);

  if (deviceMode === "mobile") {
    return classes
      .filter(cls => !/^(sm|md|lg|xl|2xl):/.test(cls))
      .join(" ");
  }

  if (deviceMode === "tablet") {
    const baseMap = new Map<string, string>();

    const getBaseKey = (cls: string) => {
      let prefix = "";
      let coreCls = cls;
      const prefixes = ["first:", "last:", "hover:", "focus:", "active:", "group-hover:"];
      for (const p of prefixes) {
        if (coreCls.startsWith(p)) {
          prefix += p;
          coreCls = coreCls.slice(p.length);
        }
      }

      if (coreCls.startsWith("p-") || coreCls.startsWith("pt-") || coreCls.startsWith("pb-") || coreCls.startsWith("pl-") || coreCls.startsWith("pr-") || coreCls.startsWith("px-") || coreCls.startsWith("py-")) {
        return prefix + coreCls.split("-")[0];
      }
      if (coreCls.startsWith("m-") || coreCls.startsWith("mt-") || coreCls.startsWith("mb-") || coreCls.startsWith("ml-") || coreCls.startsWith("mr-") || coreCls.startsWith("mx-") || coreCls.startsWith("my-")) {
        return prefix + coreCls.split("-")[0];
      }
      if (coreCls.startsWith("grid-cols-")) return prefix + "grid-cols";
      if (coreCls.startsWith("col-span-")) return prefix + "col-span";
      if (coreCls === "flex-row" || coreCls === "flex-col" || coreCls === "flex-row-reverse" || coreCls === "flex-col-reverse") return prefix + "flex-dir";
      if (coreCls.startsWith("w-") || coreCls === "w-full" || coreCls === "w-auto" || coreCls === "w-fit") return prefix + "width";
      if (coreCls.startsWith("h-") || coreCls === "h-full" || coreCls === "h-auto" || coreCls === "h-screen") return prefix + "height";
      if (coreCls.startsWith("rounded-")) return prefix + "rounded";
      if (coreCls.startsWith("gap-") || coreCls.startsWith("gap-x-") || coreCls.startsWith("gap-y-")) {
        return prefix + coreCls.split("-")[0] + (coreCls.includes("-x-") ? "-x" : coreCls.includes("-y-") ? "-y" : "");
      }
      if (coreCls.startsWith("items-")) return prefix + "items-align";
      if (coreCls.startsWith("justify-")) return prefix + "justify-align";
      if (coreCls.startsWith("opacity-")) return prefix + "opacity";
      if (coreCls.startsWith("left-") || coreCls.startsWith("right-") || coreCls.startsWith("top-") || coreCls.startsWith("bottom-")) {
        return prefix + coreCls.split("-")[0];
      }
      if (coreCls.startsWith("shadow-") || coreCls === "shadow") return prefix + "shadow";
      if (coreCls.startsWith("text-")) {
        const value = coreCls.slice(5);
        if (value.startsWith("[#")) return prefix + "text-color";
        if (value.startsWith("[") || /^(xs|sm|base|lg|\d*xl)$/.test(value)) {
          return prefix + "text-size";
        }
      }
      if (coreCls === "hidden" || coreCls === "block" || coreCls === "flex" || coreCls === "grid" || coreCls === "inline-flex" || coreCls === "inline-block") return prefix + "display";
      return cls;
    };

    for (const cls of classes) {
      if (!/^(sm|md|lg|xl|2xl):/.test(cls)) {
        baseMap.set(getBaseKey(cls), cls);
      }
    }

    for (const cls of classes) {
      if (cls.startsWith("sm:")) {
        const stripped = cls.slice(3);
        baseMap.set(getBaseKey(stripped), stripped);
      }
    }

    for (const cls of classes) {
      if (cls.startsWith("md:")) {
        const stripped = cls.slice(3);
        baseMap.set(getBaseKey(stripped), stripped);
      }
    }

    return Array.from(baseMap.values()).join(" ");
  }

  return classesStr;
}

const navLinks = [
  { label: "Home", hash: "#const-home" },
  { label: "Projects", hash: "#const-projects" },
  { label: "Features", hash: "#const-features" },
  { label: "Process", hash: "#const-process" },
  { label: "Contact Us", hash: "#const-contact" },
] as const;

// =========================================================================
// HEADER
// =========================================================================
function ConstructionHeader({ deviceMode }: { deviceMode: "desktop" | "tablet" | "mobile" }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  // State to manage the mobile Projects dropdown
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (mobileOpen && headerRef.current && !headerRef.current.contains(target)) {
        setMobileOpen(false);
        setMobileProjectsOpen(false); // Close submenu when closing main menu
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [mobileOpen]);

  const showDesktopNav = deviceMode === "desktop";

  return (
    <header ref={headerRef} data-blockpages-template-header="true" className="bg-[#06224C] text-white w-full relative z-50">
      <div className="w-full mx-auto flex items-center justify-between gap-3 py-4 px-4 sm:px-6 lg:px-8 max-w-7xl">
        <button
          type="button"
          className="text-xl font-black tracking-tight hover:opacity-80 transition-opacity shrink-0 sm:text-2xl"
          onClick={() => scrollToSection("const-home")}
        >
          BuildNest
        </button>

        {showDesktopNav && (
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => {
              if (link.label === "Projects") {
                return (
                  <div key={link.label} className="relative group">
                    <button
                      type="button"
                      className="text-sm font-bold text-white/90 group-hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap p-2 relative"
                      onClick={() => scrollToSection(link.hash.replace("#", ""))}
                    >
                      {link.label}
                      <FaChevronDown size={10} className="mt-0.5 shrink-0 transition-transform duration-300 group-hover:rotate-180" />
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                    </button>
                    {/* Invisible hover bridge & dropdown box */}
                    <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50" data-blockpages-dropdown-panel="true">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col py-2">
                        {["All Projects", "Construction", "Architecture", "Renovation"].map(item => (
                          <button
                            key={item}
                            onClick={(event) => {
                              if (event.currentTarget.isContentEditable) return;
                              scrollToSection("const-projects");
                            }}
                            className="px-4 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard Desktop Links
              return (
                <button
                  key={link.label}
                  type="button"
                  className="text-sm font-bold text-white/90 hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap p-2 relative group"
                  onClick={() => scrollToSection(link.hash.replace("#", ""))}
                >
                  {link.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
                </button>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {showDesktopNav && (
            <div className="hidden sm:flex items-center gap-4">
              {/* <button className="text-white/80 hover:text-white" aria-label="Search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button> */}

            </div>
          )}

          <Link
            href={START_BUILDING_HREF}
            data-blockpages-interactive="true"
            data-blockpages-header-cta="true"
            data-blockpages-button-id="const-header-get-started"
            className="construction-header-cta hidden sm:inline-flex bg-white text-[#0A1E3D] px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
          >
            Get Started
          </Link>

          <button
            type="button"
            data-blockpages-interactive="true"
            aria-label="Menu"
            aria-controls="construction-mobile-nav"
            aria-expanded={mobileOpen}
            className={`${showDesktopNav ? "md:hidden" : "flex"} w-11 h-11 sm:w-12 sm:h-12 items-center justify-center rounded-[12px] border border-white/30 text-white hover:bg-white/10 active:scale-95 transition-all shrink-0`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FaXmark size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      <nav
        id="construction-mobile-nav"
        aria-hidden={!mobileOpen}
        className={`absolute top-full left-0 w-full bg-[#06224C] border-b border-white/10 shadow-2xl flex flex-col py-6 px-4 z-50 max-h-[75vh] overflow-y-auto items-center text-center ${mobileOpen ? "" : "hidden"}`}
      >
          {navLinks.map((link) => {
            if (link.label === "Projects") {
              return (
                <div key={link.label} className="w-full flex flex-col border-b border-white/10 items-center">
                  <button
                    type="button"
                    className="py-4 text-white font-bold w-full flex justify-center items-center gap-2 text-[15px]"
                    onClick={() => setMobileProjectsOpen(!mobileProjectsOpen)}
                  >
                    <span>{link.label}</span>
                    <FaChevronDown size={12} className={`transition-transform duration-300 ${mobileProjectsOpen ? "rotate-180 text-blue-400" : ""}`} />
                  </button>

                  <div className={`flex flex-col bg-[#041633] w-full pb-2 mb-2 rounded-lg overflow-hidden border border-white/5 items-center ${mobileProjectsOpen ? "" : "hidden"}`}>
                      {["All Projects", "Construction", "Architecture", "Renovation"].map(item => (
                        <button
                          key={item}
                          onClick={() => {
                            scrollToSection("const-projects");
                            setMobileOpen(false);
                            setMobileProjectsOpen(false);
                          }}
                          className="py-3 px-6 text-sm font-semibold text-white/80 hover:text-white transition-colors"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                </div>
              );
            }

            return (
              <button
                key={link.label}
                type="button"
                className="py-4 text-white font-bold w-full border-b border-white/10 flex justify-center items-center gap-2 text-[15px]"
                onClick={() => {
                  scrollToSection(link.hash.replace("#", ""));
                  setMobileOpen(false);
                }}
              >
                <span>{link.label}</span>
              </button>
            );
          })}
          <Link
            href={START_BUILDING_HREF}
            data-blockpages-interactive="true"
            data-blockpages-header-cta="true"
            data-blockpages-button-id="const-header-get-started-mobile"
            className="construction-header-cta mt-6 bg-white text-[#0A1E3D] px-8 py-3 rounded-full text-sm font-bold text-center hover:bg-gray-100 transition-colors shadow-lg"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
      </nav>
    </header>
  );
}

// --- DATA ARRAYS ---
const allProjectsData = [
  { id: 1, title: "Build Master", category: "Construction", desc: "Delivering reliable construction solutions with exceptional craftsmanship, innovative design, and lasting quality for every project.", img: assetPath("/construction1.webp") },
  { id: 2, title: "Architect", category: "Architecture", desc: "Transforming ideas into innovative architectural designs that blend functionality, aesthetics, and sustainability for lasting impact.", img: assetPath("/architech.webp") },
  { id: 3, title: "Restaurant", category: "Renovation", desc: "Transforming existing spaces into modern, functional, and visually stunning environments through expert renovation solutions.", img: assetPath("/Restaurant.webp") },
  { id: 4, title: "Skyline Tower", category: "Building", desc: "A towering achievement in modern commercial building engineering, offering sustainable and intelligent workspace solutions.", img: assetPath("/skyline.webp") },
  { id: 5, title: "Luxe Living", category: "Interior", desc: "Premium interior design solutions that maximize space utility while delivering breathtaking visual aesthetics.", img: assetPath("/interio.webp") },
  { id: 6, title: "Oakwood Homes", category: "Residential", desc: "Beautiful, family-friendly residential construction built with sustainable materials and modern amenities.", img: assetPath("/residential.webp") },
];

const services = [
  { title: "General\nConstruction", desc: "We provide comprehensive construction solutions for residential, commercial, and industrial projects. With a focus on quality, safety, and innovation, our experienced team delivers reliable results on time and within budget. From concept to completion, we deliver high-quality construction services tailored to your needs.", isDark: true },
  { title: "Property\nMaintenance", desc: "Keep your property in excellent condition with our professional maintenance services. We provide regular inspections, repairs, and preventive solutions to ensure safety, functionality, and long-term value. Our experienced team delivers reliable support for residential and commercial properties.", isDark: false },
  { title: "Virtual Design\n& Build", desc: "Transform your construction ideas into reality with our Virtual Design & Build solutions. Visualize projects before construction begins, streamline collaboration, and make informed decisions with confidence. Reduce costly revisions, improve project accuracy, and accelerate delivery timelines.", isDark: true },
];

const processSteps = [
  { step: "STEP - 1", title: "Initial Consultation", desc: "We begin by understanding your goals, requirements, and project vision. Our experts discuss your needs and provide tailored recommendations to ensure a strong foundation for success." },
  { step: "STEP - 2", title: "Planning & Estimation", desc: "Create a clear roadmap for your construction project with strategic planning and precise estimations. Build with confidence through accurate insights and well-defined project goals." },
  { step: "STEP - 3", title: "Construction & Execution", desc: "Turn approved plans into reality with expert construction and seamless execution. Our skilled team ensures every phase is completed with precision, quality, and safety." },
  { step: "STEP - 4", title: "Final Inspection & Handover", desc: "The final stage focuses on quality checks, project verification, and seamless handover. We ensure your construction is completed to the highest standards and ready for occupancy." },
];

const recentProjects = [
  {
    img: assetPath("/luxury.webp"),
    title: "Luxury Resort",
    category: "Hospitality",
    desc: "A breathtaking luxury resort featuring modern amenities and stunning natural surroundings."
  },
  {
    img: assetPath("/interior.webp"),
    title: "Corporate HQ",
    category: "Commercial",
    desc: "State-of-the-art corporate headquarters designed for collaboration and innovation."
  },
  {
    img: assetPath("/residental1.webp"),
    title: "Eco Residence",
    category: "Residential",
    desc: "Environmentally friendly home construction with sustainable materials and smart energy solutions."
  },
  {
    img: assetPath("/infra.webp"),
    title: "Skyline Bridge",
    category: "Infrastructure",
    desc: "A marvel of modern engineering connecting the city's key financial districts."
  },
  {
    img: assetPath("/Architect.webp"),
    title: "Urban Center",
    category: "Architecture",
    desc: "A modern commercial building offering sustainable and intelligent workspace solutions."
  },
  {
    img: assetPath("/renov.webp"),
    title: " Renovation Works",
    category: "Renovation",
    desc: "Renovating residential and commercial buildings to improve aesthetics, comfort, functionality, and long-term durability."
  },
];

const faqs = [
  { question: "How long does a typical construction project take?", answer: "Project timelines vary based on scope and complexity. Small renovations may take 4-8 weeks, while custom homes or commercial builds can range from 6 to 12+ months. We provide a detailed schedule during the planning phase." },
  { question: "What is included in your project estimate?", answer: "Our comprehensive estimates cover all materials, labor, permits, subcontractor fees, and project management costs. We provide a transparent breakdown so you know exactly where your investment is going, with no hidden surprises." },
  { question: "Do you provide warranties on your work?", answer: "Yes, we offer comprehensive warranties on both materials and labor. Specific warranty periods depend on the project type, but we stand firmly behind our workmanship and ensure your complete satisfaction long after the project is finished." },
  { question: "Are your contractors licensed and insured?", answer: "Absolutely. BuildNest Construction is fully licensed, bonded, and insured. Every subcontractor we partner with is thoroughly vetted and required to maintain up-to-date insurance and proper licensing for their specific trade." },
  { question: "Do you handle all permits and inspections?", answer: "Yes, we manage the entire permitting and inspection process on your behalf. Our team works closely with local municipalities to ensure all plans meet building codes and pass mandatory inspections without unnecessary delays." },
  { question: "Can you help with project design and planning?", answer: "We offer full design-build services. Our in-house architectural designers and engineers collaborate with you from the initial concept and blueprints all the way through to material selection and final construction." },
  { question: "How do you ensure project stays on budget?", answer: "We utilize detailed upfront planning, locked-in material pricing where possible, and transparent communication. If any unexpected issues arise or changes are requested, we immediately provide cost implications before proceeding." },
  { question: "Do you offer financing options?", answer: "Yes, we partner with several leading financial institutions to offer flexible financing solutions. Whether you are looking for construction-to-permanent loans or renovation financing, we can help connect you with the right lender." },
  { question: "How do you ensure quality and safety on every project?", answer: "Safety is our top priority. We conduct regular site inspections, enforce strict OSHA compliance, and hold weekly safety meetings. Quality is ensured through multi-point inspections by our dedicated project managers at every major milestone." },
];

const testimonialsData = [
  { name: "Michael Anderson", role: "CEO, Anderson Realty Group", text: "BuildNest Construction exceeded our expectations from start to finish. Their team was professional, transparent, and delivered our project on time with exceptional quality. We couldn't be happier with the results.", img: assetPath("/mical.webp") },
  { name: "Sarah Thompson", role: "Homeowner", text: "Working with BuildNest Construction was a fantastic experience. Their attention to detail, craftsmanship, and commitment to customer satisfaction made our renovation project stress-free and successful.", img: assetPath("/sara.webp") },
  { name: "David Wilson", role: "Property Developer", text: "The team demonstrated outstanding expertise and professionalism throughout the entire construction process. They kept us informed at every stage and delivered exactly what they promised.", img: assetPath("/david.webp") },
  { name: "Elena Rodriguez", role: "Commercial Investor", text: "From the initial consultation to the final handover, the process was seamless. They managed our commercial build flawlessly, keeping us strictly within our budget without compromising on materials.", img: assetPath("/elina.webp") },
  { name: "Marcus Chen", role: "Restaurant Owner", text: "Renovating our flagship restaurant while keeping operations running was a massive challenge. BuildNest coordinated everything perfectly. The new interior design is absolutely breathtaking.", img: assetPath("/marcus.webp") },
  { name: "Sophia Patel", role: "Residential Client", text: "We trusted them with our dream home, and they delivered beyond measure. Their landscape development team specifically did an incredible job tying the outdoor living space to our architecture.", img: assetPath("/sopia.webp") },
];

const infiniteTestimonials = Array(50).fill(testimonialsData).flat();

// =========================================================================
// MAIN TEMPLATE
// =========================================================================
export default function ConstructionTemplatePage() {
  const blockpagesEditor = useBlockpagesEditor();
  const isBlockpages = Boolean(blockpagesEditor?.enabled);
  const [deviceMode, setDeviceMode] = useState<"preview" | "desktop" | "tablet" | "mobile">("preview");
  const activeDeviceMode: "desktop" | "tablet" | "mobile" = resolveBlockpagesDeviceMode(
    isBlockpages,
    blockpagesEditor?.deviceMode,
    deviceMode === "preview" ? "desktop" : deviceMode
  );
  const [email, setEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleNewsletter = (e: FormEvent) => {
    e.preventDefault();
    if (!isEmailValid) return;
    setNewsletterStatus("loading");
    setTimeout(() => {
      setNewsletterStatus("success");
      setEmail("");
      setTimeout(() => setNewsletterStatus("idle"), 5000);
    }, 1500);
  };
  const r = useCallback((classes: string) => getModeClasses(classes, activeDeviceMode), [activeDeviceMode]);
  const [activeTab, setActiveTab] = useState("All Projects");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [faqList, setFaqList] = useState(faqs);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);

  const recentWorkScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollRecentWork = (direction: "left" | "right") => {
    if (recentWorkScrollRef.current) {
      const child = recentWorkScrollRef.current.firstElementChild as HTMLElement;
      const childWidth = child ? child.offsetWidth : 350;
      const gap = window.innerWidth >= 640 ? 24 : 16;
      const scrollAmount = direction === "left" ? -(childWidth + gap) : (childWidth + gap);
      recentWorkScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const testimonialsScrollRef = useRef<HTMLDivElement | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(150);

  // Scroll to the middle of the infinite list on mount
  useEffect(() => {
    if (testimonialsScrollRef.current) {
      const container = testimonialsScrollRef.current;
      const child = container.children[150] as HTMLElement;
      if (child) {
        // Calculate the scroll position to center the 150th child
        container.scrollLeft = child.offsetLeft - container.clientWidth / 2 + child.clientWidth / 2;
      }
    }
  }, []);

  // Calculates which testimonial is visually in the center of the scroll container
  const handleTestimonialScroll = useCallback(() => {
    if (!testimonialsScrollRef.current) return;
    const container = testimonialsScrollRef.current;
    const scrollCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIndex = 0;
    let minDistance = Infinity;

    const children = Array.from(container.children) as HTMLElement[];
    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(childCenter - scrollCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (activeTestimonial !== closestIndex) {
      setActiveTestimonial(closestIndex);
    }
  }, [activeTestimonial]);

  // ==========================================
  // ADDED: Contact Form Validation State
  // ==========================================
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [formErrors, setFormErrors] = useState({ firstName: "", lastName: "", email: "", message: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let errors = { firstName: "", lastName: "", email: "", message: "" };
    let isValid = true;

    // Regex to allow ONLY letters (upper and lowercase) and spaces
    const nameRegex = /^[A-Za-z\s]+$/;

    // First Name Validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
      isValid = false;
    } else if (!nameRegex.test(formData.firstName)) {
      errors.firstName = "Only letters are allowed";
      isValid = false;
    }

    // Last Name Validation
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
      isValid = false;
    } else if (!nameRegex.test(formData.lastName)) {
      errors.lastName = "Only letters are allowed";
      isValid = false;
    }

    // Email Validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email";
      isValid = false;
    }

    // Message Validation
    if (!formData.message.trim()) {
      errors.message = "Message is required";
      isValid = false;
    }

    setFormErrors(errors);

    if (isValid) {
      setIsSubmitted(true);
      // Simulate an API call
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({ firstName: "", lastName: "", email: "", message: "" });
        alert("Message sent successfully!");
      }, 1500);
    }
  };
  // Center the second card on mount so the left side is not empty
  useEffect(() => {
    if (testimonialsScrollRef.current) {
      const container = testimonialsScrollRef.current;
      const secondCard = container.children[1] as HTMLElement;
      if (secondCard) {
        const scrollPosition = secondCard.offsetLeft - container.clientWidth / 2 + secondCard.clientWidth / 2;
        container.scrollLeft = scrollPosition;
      }
    }
    const timeout = setTimeout(handleTestimonialScroll, 100);
    return () => clearTimeout(timeout);
  }, []);

  const scrollTestimonials = (direction: "left" | "right") => {
    if (testimonialsScrollRef.current) {
      const container = testimonialsScrollRef.current;
      const firstCard = container.firstElementChild as HTMLElement;
      const scrollAmount = firstCard ? firstCard.offsetWidth + 32 : 350; // 32px is roughly the gap (sm:gap-8)

      const isAtStart = container.scrollLeft <= 5;
      const isAtEnd = Math.ceil(container.scrollLeft + container.clientWidth) >= container.scrollWidth - 5;

      if (direction === "left" && isAtStart) {
        container.scrollTo({ left: container.scrollWidth, behavior: "smooth" });
      } else if (direction === "right" && isAtEnd) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        const finalScroll = direction === "left" ? -scrollAmount : scrollAmount;
        container.scrollBy({ left: finalScroll, behavior: "smooth" });
      }
    }
  };

  const filteredProjects =
    activeTab === "All Projects" ? allProjectsData : allProjectsData.filter((p) => p.category === activeTab);

  return (
    <main className={isBlockpages ? "@container construction-shell w-full min-w-0 max-w-full overflow-x-hidden bg-[#FDF8F5] font-sans text-gray-900 box-border [&_button]:cursor-pointer [&_a]:cursor-pointer" : "flex flex-col min-h-screen bg-[#F3F4F6] overflow-x-hidden font-sans text-gray-900 pt-6 [&_button]:cursor-pointer [&_a]:cursor-pointer"}>
      {!isBlockpages && (
        <div className="fixed z-[100] bottom-6 left-1/2 -translate-x-1/2 hidden md:block" data-template-chrome="true" data-device-preview-toolbar="true">
          <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-xl px-4 py-2">
            <Link
              href="/landing#templates"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-50 text-[#0A1E3D] transition"
              title="Back to Landing"
            >
              <FaEye size={16} />
            </Link>
            <div className="w-px h-6 bg-gray-300 mx-1" />
            <button
              aria-label="Desktop View"
              onClick={() => setDeviceMode("desktop")}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition ${deviceMode === "desktop" ? "bg-gray-100 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "text-gray-500"}`}
            >
              <FaLaptop size={16} />
            </button>
            <button
              aria-label="Tablet View"
              onClick={() => setDeviceMode("tablet")}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition ${deviceMode === "tablet" ? "bg-gray-100 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "text-gray-500"}`}
            >
              <FaTabletAlt size={16} />
            </button>
            <button
              aria-label="Mobile View"
              onClick={() => setDeviceMode("mobile")}
              className={`w-10 h-10 flex items-center justify-center rounded-full transition ${deviceMode === "mobile" ? "bg-gray-100 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "text-gray-500"}`}
            >
              <FaMobileAlt size={16} />
            </button>
          </div>
        </div>
      )}

      <div className={isBlockpages ? "w-full min-w-0" : `flex-1 flex justify-center w-full transition-all duration-500 ${deviceMode !== "preview" ? "py-4 md:py-8 px-2 md:px-4" : ""}`}>
        <div
          ref={isBlockpages ? undefined : canvasScrollRef}
          className={isBlockpages ? "w-full min-w-0" : `bg-white relative flex flex-col overflow-x-hidden overflow-y-auto transition-all duration-500 ease-in-out ${deviceMode === "mobile"
            ? "w-full max-w-[375px] h-[85vh] rounded-[2.5rem] border-[8px] border-gray-800 shadow-2xl"
            : deviceMode === "tablet"
              ? "w-full max-w-[768px] h-[90vh] rounded-[2rem] border-[8px] border-gray-800 shadow-2xl"
              : deviceMode === "desktop"
                ? "w-full max-w-[1200px] h-[85vh] rounded-[1.75rem] border-2 border-gray-300 shadow-2xl"
                : "w-full min-h-screen"
            }`}
        >
          <div className="w-full overflow-x-hidden bg-[#FDF8F5]">
            <ConstructionHeader deviceMode={activeDeviceMode} />

            {/* =================================================================
                1. HERO
            ================================================================= */}
            <section id="const-home" className={r("w-full py-5 px-4 sm:py-8 sm:px-6 lg:px-8")}>
              <div className="max-w-7xl mx-auto">
                <div className={r("relative w-full rounded-3xl sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-[#CDC7C0] flex flex-col md:flex-row shadow-sm")}>
                  <div className={r("absolute inset-0 md:left-1/3")}>
                    <div className={r("absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#CDC7C0] via-[#CDC7C0]/85 to-[#CDC7C0]/40 md:to-transparent z-10")} />
                    <img
                      src={assetPath("/construnction.webp")}
                      alt="Construction Silhouette"
                      className={r("w-full h-full object-cover object-center mix-blend-multiply opacity-40 md:opacity-90")}
                      loading="eager"
                    />
                  </div>

                  <div className={r("relative z-20 w-full md:w-3/5 p-6 sm:p-10 md:p-14 lg:p-20 flex flex-col justify-center")}>
                    <h1 className={r("font-black text-[#0A1E3D] leading-[1.15] mb-3 text-[28px] sm:text-4xl lg:text-5xl")}>
                      WE TURN YOUR DREAMS
                      <br />
                      INTO REALITY
                    </h1>

                    <p className={r("text-gray-600 mb-6 text-sm leading-relaxed max-w-md sm:mb-8 text-justify")}>
                      Innovative and functional architectural solutions tailored to your vision and needs.
                    </p>

                    <div className={r("grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-4 mb-7 sm:gap-x-4 sm:gap-y-5 sm:mb-10 w-full")}>
                      <div className={r("flex items-center sm:items-start gap-3 sm:gap-2.5 text-xs font-bold text-[#0A1E3D] leading-snug")}>
                        <div className={r("shrink-0 w-8 h-8 rounded-full bg-[#0A1E3D] flex items-center justify-center text-white sm:mt-0.5")} data-blockpages-icon-slot="true" data-blockpages-icon-id="const-hero-hammer">
                          <FaHammer size={12} />
                        </div>
                        <span>
                          Interior Design
                          <br className={r("hidden sm:block")} />& Fit-Out
                        </span>
                      </div>
                      <div className={r("flex items-center sm:items-start gap-3 sm:gap-2.5 text-xs font-bold text-[#0A1E3D] leading-snug")}>
                        <div className={r("shrink-0 w-8 h-8 rounded-full bg-[#0A1E3D] flex items-center justify-center text-white sm:mt-0.5")} data-blockpages-icon-slot="true" data-blockpages-icon-id="const-hero-leaf">
                          <FaLeaf size={12} />
                        </div>
                        <span>
                          Landscape Design
                          <br className={r("hidden sm:block")} />& Development
                        </span>
                      </div>
                      <div className={r("flex items-center sm:items-start gap-3 sm:gap-2.5 text-xs font-bold text-[#0A1E3D] leading-snug")}>
                        <div className={r("shrink-0 w-8 h-8 rounded-full bg-[#0A1E3D] flex items-center justify-center text-white sm:mt-0.5")} data-blockpages-icon-slot="true" data-blockpages-icon-id="const-hero-building">
                          <FaBuilding size={12} />
                        </div>
                        <span>
                          Office Construction
                          <br className={r("hidden sm:block")} />& Renovation
                        </span>
                      </div>
                      <div className={r("flex items-center sm:items-start gap-3 sm:gap-2.5 text-xs font-bold text-[#0A1E3D] leading-snug")}>
                        <div className={r("shrink-0 w-8 h-8 rounded-full bg-[#0A1E3D] flex items-center justify-center text-white sm:mt-0.5")} data-blockpages-icon-slot="true" data-blockpages-icon-id="const-hero-ruler">
                          <FaPenRuler size={12} />
                        </div>
                        <span>Architectural Design</span>
                      </div>
                    </div>

                    <div className={r("flex flex-row items-center gap-3 flex-wrap sm:gap-4")}>
                      <button
                        onClick={() => scrollToSection("const-contact")}
                        className="bg-[#0A1E3D] text-white px-5 py-3 rounded-md font-bold hover:bg-blue-900 transition-colors shadow-md text-sm text-center w-fit cursor-pointer"
                      >
                        Free Consultation
                      </button>
                      <button
                        onClick={() => scrollToSection("const-process")}
                        className="bg-transparent border-2 border-[#0A1E3D] text-[#0A1E3D] px-5 py-2.5 rounded-md font-bold hover:bg-[#0A1E3D] hover:text-white transition-colors shadow-sm text-sm text-center w-fit cursor-pointer"
                      >
                        View How It Works
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================================
                2. PROJECTS
            ================================================================= */}
            <section id="const-projects" className={r("w-full py-10 px-4 sm:py-16 sm:px-6 lg:px-8")}>
              <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-3 sm:hidden">
                  <span className="w-6 h-[2px] bg-gray-300 block" />
                  <p className="text-gray-900 font-medium text-xs">Our Projects</p>
                  <span className="w-6 h-[2px] bg-gray-300 block" />
                </div>

                <div className={r("relative hidden sm:flex items-center justify-center mb-10")}>
                  <div className={r("absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-4")}>
                    <span className="w-8 h-[2px] bg-gray-300 block" />
                    <p className="text-gray-700 font-medium text-sm">Our Projects</p>
                  </div>
                  <h2 className="font-black text-[#0A1E3D] text-center text-3xl">Our Construction Projects</h2>
                </div>
                <h2 className={r("font-black text-[#0A1E3D] text-center text-2xl mb-8 sm:hidden")}>Our Construction Projects</h2>

                <div className={r("flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:justify-center sm:gap-3 sm:mx-0 sm:px-0 sm:pb-0 sm:mb-12")}>
                  {["All Projects", "Construction", "Building", "Architecture", "Renovation", "Interior", "Residential"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={r(`shrink-0 snap-start px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap ${activeTab === tab ? "bg-[#0A1E3D] text-white" : "bg-white text-[#0A1E3D] hover:bg-[#0A1E3D] hover:text-white"
                        }`)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {filteredProjects.length > 0 ? (
                  <div className={r("grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-8")}>
                    {filteredProjects.map((p) => {
                      return (
                        <div
                          key={p.id}
                          className="blockpages-card group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col border border-gray-100"
                        >
                          <div className="relative h-44 sm:h-56 overflow-hidden bg-gray-100">
                            <img
                              src={p.img}
                              alt={p.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </div>

                          <div className={r("p-5 flex flex-col flex-1 sm:p-6")}>
                            <h3 className={r("text-base font-black text-[#0A1E3D] mb-2.5 leading-snug sm:text-lg sm:mb-3")}>
                              {p.title} <span className="text-sm font-medium text-gray-700 font-sans tracking-wide">({p.category})</span>
                            </h3>
                            <p className={r("text-sm leading-relaxed text-gray-600 text-justify mb-5 flex-1 sm:mb-6")}>{p.desc}</p>
                            <div className="flex justify-end">
                              {/* <button
                                onClick={() => scrollToSection("const-projects")}
                                className="text-xs font-bold text-[#0A1E3D] hover:text-blue-600 transition-colors whitespace-nowrap"
                              >
                                View More...
                              </button> */}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500 font-medium px-4">No projects found for {activeTab}. Please try another category.</div>
                )}

                <div className={r("mt-9 text-center sm:mt-12")}>
                  <button
                    onClick={() => {
                      setActiveTab("All Projects");
                      scrollToSection("const-projects");
                    }}
                    className={r("inline-flex flex-wrap justify-center items-center gap-2 border border-[#0A1E3D]/20 bg-transparent px-5 sm:px-7 py-3 rounded-md font-bold text-[#0A1E3D] hover:bg-[#0A1E3D]/5 transition-colors text-sm max-w-full")}
                  >
                    <span>View All Projects</span> <FaArrowRight size={12} className="shrink-0" />
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================================
                3. STATS + SERVICES
            ================================================================= */}
            <section id="const-features" className={r("w-full bg-[#FDF8F5] pb-10 px-4 sm:pb-20 sm:px-6 lg:px-8")}>
              <div className="max-w-7xl mx-auto">
                <div className={r("bg-[#0A1E3D] text-white py-7 px-5 grid grid-cols-2 gap-4 rounded-t-2xl sm:py-8 sm:px-12 sm:gap-8 lg:grid-cols-4 sm:rounded-t-3xl")}>
                  {[
                    { icon: FaClipboardList, num: "27+", label: "Years Industry Experience", id: "const-stat-0" },
                    { icon: FaUserGroup, num: "2000+", label: "Happy Customers", id: "const-stat-1" },
                    { icon: FaHelmetSafety, num: "150+", label: "Certified Projects", id: "const-stat-2" },
                    { icon: FaCertificate, num: "100%", label: "Client Satisfaction Rating", id: "const-stat-3" },
                  ].map((s) => (
                    <div key={s.id} className={r("flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3")}>
                      <div data-blockpages-icon-slot="true" data-blockpages-icon-id={s.id} className="shrink-0">
                        <s.icon className={r("text-3xl text-[#FBBF24] shrink-0 sm:text-4xl sm:mt-1")} />
                      </div>
                      <div className="flex flex-col">
                        <span className={r("text-xl font-black leading-tight sm:text-2xl")}>{s.num}</span>
                        <span className={r("text-xs font-bold text-gray-300 leading-snug sm:text-xs mt-1 sm:mt-0")}>{s.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={r("bg-[#EAF2FA] px-5 pt-10 pb-16 rounded-b-2xl sm:px-12 sm:pt-16 sm:pb-24 sm:rounded-b-3xl")}>
                  <div className={r("grid grid-cols-1 gap-8 items-center lg:grid-cols-2 lg:gap-12")}>
                    <div>
                      <p className={r("text-gray-500 font-medium text-sm flex items-center gap-3 mb-4 sm:gap-4")}>
                        <span className={r("w-6 h-[2px] bg-gray-400 block shrink-0 sm:w-8")} /> Best Service
                      </p>
                      <h2 className={r("text-2xl font-black text-[#0A1E3D] mb-5 leading-tight sm:text-3xl lg:text-4xl sm:mb-6")}>
                        Our Services That We Provide.
                      </h2>
                      <p className="text-sm leading-relaxed text-gray-600 text-justify max-w-md">
                        We deliver reliable construction solutions with quality craftsmanship and industry expertise. From planning to project completion, our team ensures every detail is built to perfection.
                      </p>
                    </div>
                    <div className={r("rounded-2xl overflow-hidden shadow-lg h-52 sm:h-64 lg:h-[350px]")}>
                      <img
                        src={assetPath("/Build.webp")}
                        className="w-full h-full object-cover"
                        alt="Construction team"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                <div className={r("-mt-10 lg:-mt-20 lg:px-12 relative z-10 sm:-mt-16")}>
                  <div className={r("grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3")}>
                    {services.map((s, i) => (
                      <div
                        key={i}
                        className={r("blockpages-card group flex flex-col p-6 rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-2 sm:p-8 lg:p-10 lg:min-h-[400px] bg-white text-[#0A1E3D] hover:bg-[#0A1E3D] hover:text-white")}
                      >
                        <h3 className={r("text-lg font-black mb-4 leading-snug whitespace-pre-line sm:text-xl sm:mb-6 lg:text-2xl")}>{s.title}</h3>
                        <p className={r("text-sm mb-7 leading-relaxed flex-1 sm:mb-10 text-gray-600 group-hover:text-gray-300 transition-colors duration-300 text-justify")}>{s.desc}</p>
                        <button
                          onClick={() => scrollToSection("const-contact")}
                          className={r("px-3 py-2 rounded-full font-bold text-xs transition-all duration-300 border w-fit text-center whitespace-nowrap sm:px-6 sm:py-3 sm:text-sm border-[#0A1E3D]/30 text-[#0A1E3D] group-hover:border-white/30 group-hover:text-white hover:!bg-white hover:!text-[#0A1E3D]")}
                        >
                          Explore Service
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================================
                4. PROCESS
            ================================================================= */}
            <section id="const-process" className={r("w-full bg-[#FDF8F5] pb-10 pt-2 px-4 sm:pb-24 sm:pt-8 sm:px-6 lg:px-8")}>
              <div className={r("max-w-7xl mx-auto grid grid-cols-1 gap-8 items-start lg:grid-cols-2 lg:gap-16")}>
                <div className="flex flex-col">
                  <div className={r("flex items-center gap-3 mb-4 sm:gap-4 sm:mb-6")}>
                    <span className={r("w-6 h-[2px] bg-gray-300 block shrink-0 sm:w-8")} />
                    <p className="text-gray-500 font-medium text-sm">How We Works</p>
                  </div>
                  <h2 className={r("font-black text-[#0A1E3D] leading-tight mb-6 text-2xl sm:text-4xl sm:mb-10")}>
                    Our Streamlined Four-Step
                    <br className="hidden lg:block" /> Construction Process.
                  </h2>
                  <div className={r("rounded-2xl overflow-hidden shadow-lg w-full h-56 sm:h-72 lg:h-[400px]")}>
                    <img
                      src={assetPath("/plan.webp")}
                      alt="Construction Process"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className={r("flex flex-col gap-6 sm:gap-8 lg:gap-10 lg:pt-16")}>
                  {processSteps.map((step, i) => {
                    const isDark = i % 2 !== 0;
                    return (
                      <div key={i} className="flex flex-col">
                        <div
                          className={r(`inline-flex items-center gap-2 px-3.5 py-1.5 rounded text-[11px] sm:text-xs font-bold tracking-widest uppercase mb-3 self-start shadow-sm border whitespace-nowrap ${isDark ? "bg-[#0A1E3D] text-white border-[#0A1E3D]" : "bg-white text-[#0A1E3D] border-gray-100"
                            }`)}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? "bg-white" : "bg-[#0A1E3D]"}`} />
                          {step.step}
                        </div>
                        <h3 className={r("text-lg font-black text-[#0A1E3D] mb-2 sm:text-xl sm:mb-3")}>{step.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed text-justify">{step.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* =================================================================
                5. RECENT WORK
            ================================================================= */}
            <section className={r("w-full relative pt-8 bg-[#EAF2FA] sm:pt-16")}>
              <div className="absolute top-0 left-0 w-full h-1/2 bg-[#FDF8F5]" />

              <div className="max-w-7xl mx-auto px-4 relative sm:px-6 lg:px-8">
                <div className={r("flex items-center justify-center gap-3 mb-3 sm:gap-4 sm:mb-4")}>
                  <span className={r("w-8 h-[1px] bg-gray-400 block shrink-0 sm:w-12")} />
                  <p className="text-gray-500 font-medium text-xs whitespace-nowrap sm:text-sm">Recent Work</p>
                  <span className={r("w-8 h-[1px] bg-gray-400 block shrink-0 sm:w-12")} />
                </div>

                <h2 className={r("font-black text-[#0A1E3D] text-center mb-8 text-2xl sm:text-4xl sm:mb-12")}>Explore Our Latest Projects</h2>

                <div className={r("flex flex-col gap-6 mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-8 sm:mb-12 w-full")}>
                  <p className={r("text-gray-500 text-sm leading-relaxed max-w-sm w-full sm:flex-1 sm:min-w-[250px]")}>
                    Stay ahead of potential issues with regular maintenance that reduces downtime and avoids costly repairs.
                  </p>

                  <div className={r("hidden md:flex flex-1 items-center justify-center px-8 min-w-[100px]")}>
                    <div className="w-full flex items-center">
                      <div className="h-[1px] bg-gray-400 flex-1" />
                      <FaArrowRight className="text-gray-400 -ml-1 shrink-0" size={12} />
                    </div>
                  </div>

                  <div className={r("flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:shrink-0 w-full sm:w-auto")}>
                    <div className="flex items-center gap-3">
                      <button
                        aria-label="Previous"
                        onClick={() => scrollRecentWork("left")}
                        className={`${r("w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A1E3D] text-white flex items-center justify-center hover:bg-blue-900 active:scale-95 transition-all shadow-md shrink-0")} focus:outline-none focus:ring-4 focus:ring-blue-300`}
                      >
                        <FaArrowLeft size={16} />
                      </button>
                      <button
                        aria-label="Next"
                        onClick={() => scrollRecentWork("right")}
                        className={`${r("w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A1E3D] text-white flex items-center justify-center hover:bg-blue-900 active:scale-95 transition-all shadow-md shrink-0")} focus:outline-none focus:ring-4 focus:ring-blue-300`}
                      >
                        <FaArrowRight size={16} />
                      </button>
                    </div>
                    <button
                      onClick={() => scrollToSection("const-projects")}
                      className={r("bg-[#0A1E3D] text-white px-5 py-2.5 rounded-full font-bold text-xs shadow-md hover:bg-blue-900 active:scale-95 transition-all whitespace-nowrap sm:px-8 sm:py-3 sm:text-sm")}
                    >
                      Explore Now...
                    </button>
                  </div>
                </div>

                <div
                  ref={recentWorkScrollRef}
                  className={r("flex overflow-x-auto gap-4 sm:gap-6 pb-8 snap-x snap-mandatory relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]")}
                >
                  {recentProjects.map((project, i) => (
                    <div
                      key={i}
                      className={r("blockpages-card group shrink-0 snap-center w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-2xl overflow-hidden shadow-xl h-56 sm:h-80 lg:h-[450px] sm:rounded-[2rem] relative")}
                    >
                      <img src={project.img} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A1E3D] via-[#0A1E3D]/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 sm:p-8">
                        <span className={r("text-blue-400 text-xs sm:text-sm font-bold uppercase tracking-widest mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500")}>{project.category}</span>
                        <h3 className={r("text-white font-black text-xl sm:text-3xl mb-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75")}>{project.title}</h3>
                        <p className={r("text-white/80 text-sm leading-relaxed line-clamp-none sm:line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-150 text-justify")}>{project.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* =================================================================
                6. FAQ
            ================================================================= */}
            <section id="const-faq" className={r("w-full bg-[#EAF2FA] pb-10 pt-8 px-4 sm:pb-24 sm:pt-16 sm:px-6 lg:px-8")}>
              <div className="max-w-7xl mx-auto">
                <div className={r("mb-6 sm:hidden")}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-6 h-[2px] bg-gray-400 block shrink-0" />
                    <p className="text-gray-500 font-medium text-xs uppercase tracking-widest">FAQS</p>
                  </div>
                  <h2 className="font-black text-[#0A1E3D] leading-tight text-2xl">Everything to Know About Our Construction Process</h2>
                  <p className="text-gray-600 text-sm leading-relaxed mt-3">
                    Explore answers to common questions about our construction services, project timelines, quality standards, and the seamless process we follow to deliver exceptional results from start to finish.
                  </p>
                </div>

                <div className={r("hidden sm:grid grid-cols-2 gap-x-8 gap-y-8")}>
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <span className="w-8 h-[2px] bg-gray-400 block shrink-0" />
                      <p className="text-gray-500 font-medium text-sm uppercase tracking-widest">FAQS</p>
                    </div>
                    <h2 className="font-black text-[#0A1E3D] leading-tight text-4xl">
                      Everything to Know About
                      <br className="hidden lg:block" />
                      Our Construction Process
                    </h2>
                  </div>
                  <div className="lg:pt-14">
                    <p className="text-gray-600 text-base leading-relaxed">
                      Explore answers to common questions about our construction services, project timelines, quality standards, and the seamless process we follow to deliver exceptional results from start to finish.
                    </p>
                  </div>
                </div>

                <div className={r("grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-8 items-start")}>
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {faqList.map((faq, i) => {
                      if (i % 2 !== 0) return null;
                      const isActive = activeFaq === i;
                      return (
                        <div
                          key={i}
                          className={`blockpages-card rounded-xl shadow-sm overflow-hidden h-fit flex flex-col transition-colors duration-300 ${isActive ? "bg-[#0A1E3D] text-white" : "bg-white text-[#0A1E3D] hover:bg-gray-50"
                            }`}
                        >
                          <button
                            aria-expanded={isActive}
                            className={`${r("w-full px-5 py-4 text-left font-bold text-sm flex justify-between items-center gap-3 sm:px-6 sm:py-5 sm:text-base")} ${isActive ? "rounded-t-xl" : "rounded-xl"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset`}
                            onClick={() => setActiveFaq(isActive ? null : i)}
                          >
                            <span
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const text = e.currentTarget.textContent ?? "";
                                setFaqList((prev) =>
                                  prev.map((item, index) => (index === i ? { ...item, question: text } : item))
                                );
                              }}
                            >
                              {faq.question}
                            </span>
                            <FaChevronDown
                              className={`shrink-0 transform transition-transform duration-300 ${isActive ? "rotate-180 text-white" : "rotate-0 text-[#0A1E3D]"}`}
                            />
                          </button>
                          <div
                            className={`${r("px-5 pb-4 text-gray-300 text-sm leading-relaxed border-t border-white/10 sm:px-6 sm:pb-5")} ${isActive ? "block" : "hidden"}`}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const text = e.currentTarget.textContent ?? "";
                              setFaqList((prev) =>
                                prev.map((item, index) => (index === i ? { ...item, answer: text } : item))
                              );
                            }}
                          >
                            {faq.answer}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-4">
                    {faqList.map((faq, i) => {
                      if (i % 2 === 0) return null;
                      const isActive = activeFaq === i;
                      return (
                        <div
                          key={i}
                          className={`blockpages-card rounded-xl shadow-sm overflow-hidden h-fit flex flex-col transition-colors duration-300 ${isActive ? "bg-[#0A1E3D] text-white" : "bg-white text-[#0A1E3D] hover:bg-gray-50"
                            }`}
                        >
                          <button
                            aria-expanded={isActive}
                            className={`${r("w-full px-5 py-4 text-left font-bold text-sm flex justify-between items-center gap-3 sm:px-6 sm:py-5 sm:text-base")} ${isActive ? "rounded-t-xl" : "rounded-xl"} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-inset`}
                            onClick={() => setActiveFaq(isActive ? null : i)}
                          >
                            <span
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const text = e.currentTarget.textContent ?? "";
                                setFaqList((prev) =>
                                  prev.map((item, index) => (index === i ? { ...item, question: text } : item))
                                );
                              }}
                            >
                              {faq.question}
                            </span>
                            <FaChevronDown
                              className={`shrink-0 transform transition-transform duration-300 ${isActive ? "rotate-180 text-white" : "rotate-0 text-[#0A1E3D]"}`}
                            />
                          </button>
                          <div
                            className={`${r("px-5 pb-4 text-gray-300 text-sm leading-relaxed border-t border-white/10 sm:px-6 sm:pb-5")} ${isActive ? "block" : "hidden"}`}
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const text = e.currentTarget.textContent ?? "";
                              setFaqList((prev) =>
                                prev.map((item, index) => (index === i ? { ...item, answer: text } : item))
                              );
                            }}
                          >
                            {faq.answer}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* =================================================================
                7. TESTIMONIALS
            ================================================================= */}
            <section className={r("w-full bg-[#FDF8F5] pt-10 pb-4 px-4 sm:pt-24 sm:pb-8 sm:px-6 lg:px-8")}>
              <div className="max-w-7xl mx-auto">
                <div className={r("mb-10 sm:mb-16 lg:grid lg:grid-cols-3 lg:gap-8 lg:items-end")}>
                  <div className="lg:col-span-2">
                    <p className={r("text-gray-500 font-medium uppercase tracking-widest text-xs sm:text-sm flex items-center gap-3 mb-3 sm:gap-4 sm:mb-4")}>
                      <span className={r("w-8 h-px bg-gray-400 block shrink-0 sm:w-12")} /> Testimonials
                    </p>
                    <h2 className={r("text-2xl font-black text-[#0A1E3D] leading-tight sm:text-4xl lg:text-5xl")}>
                      Trusted for Professional Construction Excellence
                    </h2>
                  </div>
                  <div className="lg:col-span-1">
                    <p className={r("text-gray-600 text-sm leading-relaxed mt-4 lg:mt-0")}>
                      See how our commitment to quality, craftsmanship, and customer satisfaction has earned the trust of clients across every project we build.
                    </p>
                  </div>
                </div>

                <div
                  ref={testimonialsScrollRef}
                  onScroll={handleTestimonialScroll}
                  className={r("flex overflow-x-auto gap-6 sm:gap-8 pb-12 pt-12 mb-4 snap-x snap-mandatory relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]")}
                >
                  {infiniteTestimonials.map((t, i) => {
                    return (
                      <div
                        key={`${i}-${t.name}`}
                        className={r("blockpages-card group shrink-0 snap-center w-[85%] sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-21px)] p-6 rounded-2xl shadow-xl border relative flex flex-col justify-between sm:p-8 transition-all duration-500 bg-[#F4FAFF] border-white/50 text-[#0A1E3D] hover:bg-[#0A1E3D] hover:text-white hover:border-[#0A1E3D] hover:-translate-y-2")}
                      >
                        <div className="flex flex-col flex-1">
                          <div className={r("flex gap-1 text-yellow-400 mb-5 sm:mb-6")}>
                            <FaStar />
                            <FaStar />
                            <FaStar />
                            <FaStar />
                            <FaStar />
                          </div>
                          <p className={r("text-sm leading-relaxed mb-10 flex-1 text-gray-600 group-hover:text-gray-300 transition-colors duration-500 text-justify")}>&quot;{t.text}&quot;</p>
                        </div>

                        <div className={r("border-t flex flex-col items-center text-center relative pt-8 border-gray-300 group-hover:border-gray-600 transition-colors duration-500")}>
                          <img src={t.img} alt={t.name} className="w-16 h-16 rounded-full object-cover shadow-md absolute -top-8 bg-white" />
                          <p className="font-black text-base mb-1">{t.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-80 transition-opacity duration-500">{t.role}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    aria-label="Previous Testimonial"
                    onClick={() => scrollTestimonials("left")}
                    className={`${r("w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A1E3D] text-white flex items-center justify-center hover:bg-blue-900 active:scale-95 transition-all shadow-md shrink-0")} focus:outline-none focus:ring-4 focus:ring-blue-300`}
                  >
                    <FaArrowLeft size={16} />
                  </button>
                  <button
                    aria-label="Next Testimonial"
                    onClick={() => scrollTestimonials("right")}
                    className={`${r("w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A1E3D] text-white flex items-center justify-center hover:bg-blue-900 active:scale-95 transition-all shadow-md shrink-0")} focus:outline-none focus:ring-4 focus:ring-blue-300`}
                  >
                    <FaArrowRight size={16} />
                  </button>
                </div>
              </div>
            </section>

            {/* =================================================================
                8. CTA
            ================================================================= */}
            <section className={r("w-full bg-[#FDF8F5] pb-10 px-4 sm:pb-24 sm:px-6 lg:px-8")}>
              <div className={r("max-w-7xl mx-auto bg-[#EAF2FA] rounded-3xl p-6 flex flex-col gap-8 overflow-hidden shadow-sm border border-white sm:rounded-[2.5rem] sm:p-10 md:p-16 lg:flex-row lg:items-center lg:gap-12")}>
                <div className={r("w-full lg:w-1/2 relative z-30")}>
                  <h2 className={r("text-2xl font-black text-[#0A1E3D] leading-tight mb-4 sm:text-3xl lg:text-5xl sm:mb-6")}>
                    Let&apos;s Build Together with Expert Construction Services
                  </h2>
                  <p className={r("text-gray-600 text-sm leading-relaxed mb-6 max-w-md sm:text-base sm:mb-8")}>
                    Ready to start your next project? Our expert team is committed to delivering high-quality construction solutions that bring your vision to life with precision, reliability, and excellence.
                  </p>
                  <button
                    onClick={() => scrollToSection("const-contact")}
                    className={r("bg-[#0A1E3D] text-white px-7 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-blue-900 transition-colors shadow-lg text-sm w-full xs:w-fit")}
                  >
                    Call Us Now <FaArrowRight />
                  </button>
                </div>
                <div className={r("w-full lg:w-1/2 relative h-44 sm:h-60 md:h-72 lg:h-auto flex items-center justify-center")}>
                  <img
                    src={assetPath("/draw.webp")}
                    className={r("absolute w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 object-cover rounded-xl shadow-2xl -rotate-12 -translate-x-5 sm:-translate-x-8 md:-translate-x-8 lg:-translate-x-12 z-10 grayscale hover:grayscale-0 transition-all duration-500")}
                    alt="Architecture"
                    loading="lazy"
                  />
                  <img
                    src={assetPath("/skyline.webp")}
                    className={r("absolute w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-64 lg:h-64 object-cover rounded-xl shadow-2xl rotate-12 translate-x-5 sm:translate-x-8 md:translate-x-8 lg:translate-x-12 z-20 grayscale hover:grayscale-0 transition-all duration-500")}
                    alt="Building"
                    loading="lazy"
                  />
                </div>
              </div>
            </section>

            {/* =================================================================
                9. CONTACT
            ================================================================= */}
            <section id="const-contact" className={r("w-full bg-[#FDF8F5] pb-10 px-4 sm:pb-24 sm:px-6 lg:px-8")}>
              <div className={r("max-w-7xl mx-auto flex flex-col gap-10 md:flex-row md:gap-16 lg:gap-24")}>
                <div className={r("w-full md:w-1/2")}>
                  <p className={r("text-gray-900 font-medium uppercase tracking-widest text-xs sm:text-sm flex items-center gap-3 mb-3 sm:gap-4 sm:mb-4")}>
                    <span className={r("w-8 h-px bg-gray-400 block shrink-0 sm:w-12")} /> Contact Us
                  </p>
                  <h2 className={r("text-2xl font-black text-[#0A1E3D] leading-tight mb-4 sm:text-4xl md:text-5xl sm:mb-6")}>Get in touch with us</h2>
                  <p className={r("text-gray-600 text-sm leading-relaxed mb-7 sm:text-base sm:mb-10")}>
                    We&apos;re here to help! Whether you have a question about our services, need assistance with your account or want to provide feedback, our team is ready to assist you.
                  </p>

                  <div className={r("space-y-4 mb-7 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:space-y-6 sm:mb-10 sm:p-8")}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={r("shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center")}>
                        <FaEnvelope size={16} />
                      </div>
                      <p className={r("font-bold text-[#0A1E3D] text-sm sm:text-base break-all")}>buildnest@gmail.com</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={r("shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center")}>
                        <FaPhone size={16} />
                      </div>
                      <p className={r("font-bold text-[#0A1E3D] text-sm sm:text-base")}>+91 9455678937</p>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={r("shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center")}>
                        <FaLocationDot size={16} />
                      </div>
                      <p className={r("font-bold text-[#0A1E3D] text-sm sm:text-base")}>245 Business Park Road, Austin, TX 78701, USA</p>
                    </div>
                  </div>

                  <div className={r("flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6")}>
                    <button className={r("bg-[#EAF2FA] text-[#0A1E3D] px-6 py-3 rounded-full font-bold flex items-center justify-center gap-2 hover:bg-[#0A1E3D] hover:text-white transition-colors text-sm w-full sm:w-auto sm:px-8 sm:py-3.5 whitespace-nowrap")}>
                      <span className="w-2 h-2 rounded-full bg-green-500" /> Live chat <FaArrowRight />
                    </button>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
                      Available Monday to Friday,
                      <br />
                      9:30 AM - 6:30 PM GMT.
                    </p>
                  </div>
                </div>

                <div className={r("w-full md:w-1/2 bg-[#EAF2FA] p-5 rounded-2xl border border-white shadow-sm h-fit sm:p-8 md:p-12 sm:rounded-3xl")}>
                  <form className={r("flex flex-col gap-4 sm:gap-6")} onSubmit={handleContactSubmit}>
                    <div className={r("grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-6")}>
                      <label className="flex flex-col">
                        <span className="text-sm font-bold text-[#0A1E3D] mb-2">
                          First Name <span className="text-red-600">*</span>
                        </span>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => {
                            setFormData({ ...formData, firstName: e.target.value });
                            if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: "" });
                          }}
                          className={r(`w-full p-3.5 sm:p-4 rounded-xl border ${formErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-blue-400'} focus:ring-4 focus:ring-blue-400/10 text-[#0A1E3D] text-sm shadow-sm transition-all placeholder:text-gray-500`)}
                          placeholder="Enter your first name"
                        />
                        {formErrors.firstName && <span className="text-red-500 text-xs mt-1.5 font-semibold">{formErrors.firstName}</span>}
                      </label>
                      <label className="flex flex-col">
                        <span className="text-sm font-bold text-[#0A1E3D] mb-2">Last Name <span className="text-red-600">*</span></span>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => {
                            setFormData({ ...formData, lastName: e.target.value });
                            if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: "" });
                          }}
                          className={r(`w-full p-3.5 sm:p-4 rounded-xl border ${formErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-blue-400'} focus:ring-4 focus:ring-blue-400/10 text-[#0A1E3D] text-sm shadow-sm transition-all placeholder:text-gray-500`)}
                          placeholder="Enter your last name"
                        />
                        {formErrors.lastName && <span className="text-red-500 text-xs mt-1.5 font-semibold">{formErrors.lastName}</span>}
                      </label>
                    </div>
                    <label className="flex flex-col">
                      <span className="text-sm font-bold text-[#0A1E3D] mb-2">Email <span className="text-red-600">*</span></span>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (formErrors.email) setFormErrors({ ...formErrors, email: "" });
                        }}
                        className={r(`w-full p-3.5 sm:p-4 rounded-xl border ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-blue-400'} focus:ring-4 focus:ring-blue-400/10 text-[#0A1E3D] text-sm shadow-sm transition-all placeholder:text-gray-500`)}
                        placeholder="Enter your email address"
                      />
                      {formErrors.email && <span className="text-red-500 text-xs mt-1.5 font-semibold">{formErrors.email}</span>}
                    </label>
                    <label className="flex flex-col">
                      <span className="text-sm font-bold text-[#0A1E3D] mb-2">How can we help you?</span>
                      <textarea
                        rows={5}
                        value={formData.message}
                        onChange={(e) => {
                          setFormData({ ...formData, message: e.target.value });
                          if (formErrors.message) setFormErrors({ ...formErrors, message: "" });
                        }}
                        className={r(`w-full p-3.5 sm:p-4 rounded-xl border ${formErrors.message ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white focus:border-blue-400'} focus:ring-4 focus:ring-blue-400/10 text-[#0A1E3D] text-sm resize-none shadow-sm transition-all placeholder:text-gray-500`)}
                        placeholder="Enter your message"
                      ></textarea>
                      {formErrors.message && <span className="text-red-500 text-xs mt-1.5 font-semibold">{formErrors.message}</span>}
                    </label>
                    <div className={r("flex justify-end pt-1 sm:pt-2")}>
                      <button
                        type="submit"
                        disabled={isSubmitted}
                        className={r(`text-white px-6 py-3 rounded-full font-bold flex items-center justify-center gap-3 transition-colors shadow-lg text-sm w-full sm:w-auto sm:px-8 sm:py-3.5 whitespace-nowrap ${isSubmitted ? 'bg-green-600' : 'bg-[#0A1E3D] hover:bg-blue-900'}`)}
                      >
                        {isSubmitted ? "Sending..." : "Send Message"}
                        {!isSubmitted && (
                          <div className="bg-white/20 p-1 rounded-full">
                            <FaArrowRight size={10} />
                          </div>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* Construction Template Footer (Matched to Digital Marketing Layout) */}
            <footer id="const-footer" data-blockpages-template-footer="true" className="@container bg-[#0A1E3D] text-white relative z-20">
              <div className="mx-auto max-w-7xl px-4 py-12 @md:px-8 @md:py-16">
                <div className="grid grid-cols-1 gap-10 @md:grid-cols-2 @4xl:grid-cols-4">
                  {/* Column 1: Brand */}
                  <div>
                    <h3 className="mb-4 text-lg font-black">BuildNest</h3>
                    <p className="text-sm leading-relaxed text-white/60">
                      Delivering reliable construction and innovative architectural solutions tailored to your vision and needs.
                    </p>
                  </div>
                  {/* Column 2: Services */}
                  <div>
                    <h4 className="mb-4 text-xs font-black uppercase tracking-wider">Services</h4>
                    <ul className="space-y-2.5 text-sm text-white/60">
                      <li><button onClick={() => scrollToSection("const-features")} className="transition hover:text-white focus:outline-none text-left">struction</button></li>
                      <li><button onClick={() => scrollToSection("const-features")} className="transition hover:text-white focus:outline-none text-left">Property Maintenance</button></li>
                      <li><button onClick={() => scrollToSection("const-features")} className="transition hover:text-white focus:outline-none text-left">Virtual Design & Build</button></li>
                      <li><button onClick={() => scrollToSection("const-features")} className="transition hover:text-white focus:outline-none text-left">Architectural Design</button></li>
                    </ul>
                  </div>
                  {/* Column 3: Links */}
                  <div>
                    <h4 className="mb-4 text-xs font-black uppercase tracking-wider">Quick Links</h4>
                    <ul className="space-y-2.5 text-sm text-white/60">
                      <li><button onClick={() => scrollToSection("const-home")} className="transition hover:text-white focus:outline-none text-left">Home</button></li>
                      <li><button onClick={() => scrollToSection("const-projects")} className="transition hover:text-white focus:outline-none text-left">Projects</button></li>
                      <li><button onClick={() => scrollToSection("const-process")} className="transition hover:text-white focus:outline-none text-left">Process</button></li>
                      <li><button onClick={() => scrollToSection("const-contact")} className="transition hover:text-white focus:outline-none text-left">Contact Us</button></li>
                    </ul>
                  </div>
                  {/* Column 4: Newsletter */}
                  <div>
                    <h4 className="mb-4 text-xs font-black uppercase tracking-wider">Newsletter</h4>
                    <p className="mb-4 text-sm text-white/60">Get updates and exclusive offers delivered to your inbox.</p>
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
                          disabled={!isEmailValid || newsletterStatus === "loading" || email.length === 0}
                          className="absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#0A1E3D] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1E56E5] hover:shadow-lg active:scale-95 disabled:pointer-events-none"
                        >
                          {newsletterStatus === "loading" ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          ) : (
                            <FaPaperPlane size={14} />
                          )}
                        </button>
                      </div>
                      {!isEmailValid && email.length > 0 && <span className="text-xs text-red-400">Please enter a valid email address.</span>}
                      {newsletterStatus === "success" && (
                        <div className="rounded-lg bg-green-500/10 p-2 text-xs font-medium text-green-400">
                          Thank you for subscribing!
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 @sm:flex-row">
                  <p className="text-xs text-white/50">© 2026 BuildNest Construction. All rights reserved.</p>

                  <div className="flex gap-6 text-xs text-white/50">
                    <button onClick={() => setIsTermsModalOpen(true)} className="transition hover:text-white focus:outline-none">Terms of Service</button>
                    <button onClick={() => setIsPrivacyModalOpen(true)} className="transition hover:text-white focus:outline-none">Privacy Policy</button>
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
                        <p className="mb-8 text-sm leading-relaxed @md:text-base">
                          Your privacy is important to us. This policy explains how Stackly collects, uses, and protects your information.
                        </p>

                        <div className="space-y-6 text-sm @md:text-base">
                          <div>
                            <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">1. Information We Collect</h3>
                            <p className="leading-relaxed">We collect account details, contact information, usage data, and project preferences needed to operate the platform.</p>
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">2. How We Use Data</h3>
                            <p className="leading-relaxed">We use data to provide services, improve templates, process payments, prevent abuse, and send important updates.</p>
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">3. Security</h3>
                            <p className="leading-relaxed">We use reasonable safeguards to protect user data, though no internet transmission is completely risk free.</p>
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">4. Your Rights</h3>
                            <p className="leading-relaxed">You can request access, correction, or deletion of personal data by contacting <a href="mailto:privacy@thestackly.com" className="font-bold text-[#1E56E5] hover:underline">privacy@thestackly.com</a>.</p>
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
                        <p className="mb-8 text-sm leading-relaxed @md:text-base">
                          Welcome to Stackly. By accessing or using our platform, you agree to these Terms of Use.
                        </p>

                        <div className="space-y-6 text-sm @md:text-base">
                          <div>
                            <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">1. Account Responsibilities</h3>
                            <p className="leading-relaxed">You are responsible for maintaining your login credentials and all activity under your account.</p>
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">2. Template Usage</h3>
                            <p className="leading-relaxed">Templates may be customized for your own projects. Redistribution or resale without permission is not allowed.</p>
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">3. Payments</h3>
                            <p className="leading-relaxed">Paid assets and subscriptions are billed according to the plan selected at purchase.</p>
                          </div>
                          <div>
                            <h3 className="mb-2 text-sm font-bold tracking-widest text-[#0A1E3D] uppercase">4. Platform Changes</h3>
                            <p className="leading-relaxed">We may improve, update, or discontinue features to keep Stackly reliable and secure.</p>
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

          </div>
        </div>
      </div>

      {!isBlockpages && (
        <div className="mt-4 md:mt-8 w-full">
          <Footer />
        </div>
      )}
    </main>
  );
}