"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { FaEye, FaLaptop, FaTabletAlt, FaMobileAlt } from "react-icons/fa";
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

const START_BUILDING_HREF = "/signup";

function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

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
      if (cls.startsWith("p-") || cls.startsWith("pt-") || cls.startsWith("pb-") || cls.startsWith("pl-") || cls.startsWith("pr-") || cls.startsWith("px-") || cls.startsWith("py-")) {
        return cls.split("-")[0];
      }
      if (cls.startsWith("m-") || cls.startsWith("mt-") || cls.startsWith("mb-") || cls.startsWith("ml-") || cls.startsWith("mr-") || cls.startsWith("mx-") || cls.startsWith("my-")) {
        return cls.split("-")[0];
      }
      if (cls.startsWith("grid-cols-")) return "grid-cols";
      if (cls.startsWith("col-span-")) return "col-span";
      if (cls === "flex-row" || cls === "flex-col" || cls === "flex-row-reverse" || cls === "flex-col-reverse") return "flex-dir";
      if (cls.startsWith("w-") || cls === "w-full" || cls === "w-auto" || cls === "w-fit") return "width";
      if (cls.startsWith("h-") || cls === "h-full" || cls === "h-auto" || cls === "h-screen") return "height";
      if (cls.startsWith("rounded-")) return "rounded";
      if (cls.startsWith("gap-") || cls.startsWith("gap-x-") || cls.startsWith("gap-y-")) {
        return cls.split("-")[0] + (cls.includes("-x-") ? "-x" : cls.includes("-y-") ? "-y" : "");
      }
      if (cls.startsWith("items-")) return "items-align";
      if (cls.startsWith("justify-")) return "justify-align";
      if (cls.startsWith("opacity-")) return "opacity";
      if (cls.startsWith("left-") || cls.startsWith("right-") || cls.startsWith("top-") || cls.startsWith("bottom-")) {
        return cls.split("-")[0];
      }
      if (cls.startsWith("shadow-") || cls === "shadow") return "shadow";
      if (cls.startsWith("text-")) {
        const value = cls.slice(5);
        if (value.startsWith("[") || /^(xs|sm|base|lg|\d*xl)$/.test(value)) {
          return "text-size";
        }
      }
      if (cls === "hidden" || cls === "block" || cls === "flex" || cls === "grid" || cls === "inline-flex" || cls === "inline-block") return "display";
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
  { label: "Resources", hash: "#const-resources" },
] as const;

// =========================================================================
// HEADER
// =========================================================================
function ConstructionHeader({ deviceMode }: { deviceMode: "desktop" | "tablet" | "mobile" }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // State to manage the mobile Projects dropdown
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem("stackly-auth-token");
    setProfileOpen(false);
    setMobileOpen(false);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!profileOpen && !mobileOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (mobileOpen && headerRef.current && !headerRef.current.contains(target)) {
        setMobileOpen(false);
        setMobileProjectsOpen(false); // Close submenu when closing main menu
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileOpen, mobileOpen]);

  const showDesktopNav = deviceMode === "desktop";

  return (
    <header ref={headerRef} className="bg-[#06224C] text-white w-full relative z-50">
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
                      className="text-sm font-bold text-white/90 group-hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap p-2"
                      onClick={() => scrollToSection(link.hash.replace("#", ""))}
                    >
                      {link.label}
                      <FaChevronDown size={10} className="mt-0.5 shrink-0 transition-transform duration-300 group-hover:rotate-180" />
                    </button>
                    {/* Invisible hover bridge & dropdown box */}
                    <div className="absolute top-full left-0 pt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="bg-white rounded-xl shadow-xl border border-gray-100 flex flex-col py-2">
                        {["All Projects", "Construction", "Architecture", "Renovation"].map(item => (
                          <button
                            key={item}
                            onClick={() => scrollToSection("const-projects")}
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
                  className="text-sm font-bold text-white/90 hover:text-white transition-colors flex items-center gap-1 whitespace-nowrap p-2"
                  onClick={() => scrollToSection(link.hash.replace("#", ""))}
                >
                  {link.label}
                  {link.label === "Resources" && <FaChevronDown size={10} className="mt-0.5 shrink-0" />}
                </button>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-2 shrink-0">
          {showDesktopNav && (
            <div className="hidden sm:flex items-center gap-4">
              <button className="text-white/80 hover:text-white" aria-label="Search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  aria-label="Profile"
                  className="w-9 h-9 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setMobileOpen(false);
                  }}
                >
                  <FaUser size={14} />
                </button>
                {profileOpen && (
                  <div className="absolute top-12 right-0 w-40 py-2 bg-white rounded-lg shadow-xl border border-gray-100 z-[60]">
                    <button
                      type="button"
                      className="flex items-center gap-3 w-full py-2.5 px-4 text-left text-sm font-bold text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <FaRightFromBracket size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <Link
            href={START_BUILDING_HREF}
            className="hidden sm:inline-flex bg-white text-[#0A1E3D] px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg whitespace-nowrap"
          >
            Get Started
          </Link>

          <button
            type="button"
            aria-label="Menu"
            className={`${showDesktopNav ? "md:hidden" : "flex"} w-11 h-11 sm:w-12 sm:h-12 items-center justify-center rounded-[12px] border border-white/30 text-white hover:bg-white/10 active:scale-95 transition-all shrink-0`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FaXmark size={22} /> : <FaBars size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="absolute top-full left-0 w-full bg-[#06224C] border-b border-white/10 shadow-2xl flex flex-col py-6 px-4 z-50 max-h-[75vh] overflow-y-auto items-center text-center">
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

                  {mobileProjectsOpen && (
                    <div className="flex flex-col bg-[#041633] w-full pb-2 mb-2 rounded-lg overflow-hidden border border-white/5 items-center">
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
                  )}
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
            className="mt-6 bg-white text-[#0A1E3D] px-8 py-3 rounded-full text-sm font-bold text-center hover:bg-gray-100 transition-colors shadow-lg"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </nav>
      )}
    </header>
  );
}

// --- DATA ARRAYS ---
const allProjectsData = [
  { id: 1, title: "Build Master", category: "Construction", desc: "Delivering reliable construction solutions with exceptional craftsmanship, innovative design, and lasting quality for every project.", img: "https://images.unsplash.com/photo-1623990670247-b2258ecf2b2a?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { id: 2, title: "Architect", category: "Architecture", desc: "Transforming ideas into innovative architectural designs that blend functionality, aesthetics, and sustainability for lasting impact.", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800&auto=format&fit=crop" },
  { id: 3, title: "Restaurant", category: "Renovation", desc: "Transforming existing spaces into modern, functional, and visually stunning environments through expert renovation solutions.", img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop" },
  { id: 4, title: "Skyline Tower", category: "Building", desc: "A towering achievement in modern commercial building engineering, offering sustainable and intelligent workspace solutions.", img: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop" },
  { id: 5, title: "Luxe Living", category: "Interior", desc: "Premium interior design solutions that maximize space utility while delivering breathtaking visual aesthetics.", img: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800&auto=format&fit=crop" },
  { id: 6, title: "Oakwood Homes", category: "Residential", desc: "Beautiful, family-friendly residential construction built with sustainable materials and modern amenities.", img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop" },
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
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?q=80&w=800&auto=format&fit=crop",
];

const faqs = [
  "How long does a typical construction project take?",
  "What is included in your project estimate?",
  "Do you provide warranties on your work?",
  "Are your contractors licensed and insured?",
  "Do you handle all permits and inspections?",
  "Can you help with project design and planning?",
  "How do you ensure project stays on budget?",
  "Do you offer financing options?",
  "How do you ensure quality and safety on every project?",
];

const testimonialsData = [
  { name: "Michael Anderson", role: "CEO, Anderson Realty Group", text: "BuildNest Construction exceeded our expectations from start to finish. Their team was professional, transparent, and delivered our project on time with exceptional quality. We couldn't be happier with the results.", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop" },
  { name: "Sarah Thompson", role: "Homeowner", text: "Working with BuildNest Construction was a fantastic experience. Their attention to detail, craftsmanship, and commitment to customer satisfaction made our renovation project stress-free and successful.", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop" },
  { name: "David Wilson", role: "Property Developer", text: "The team demonstrated outstanding expertise and professionalism throughout the entire construction process. They kept us informed at every stage and delivered exactly what they promised.", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop" },
  { name: "Elena Rodriguez", role: "Commercial Investor", text: "From the initial consultation to the final handover, the process was seamless. They managed our commercial build flawlessly, keeping us strictly within our budget without compromising on materials.", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop" },
  { name: "Marcus Chen", role: "Restaurant Owner", text: "Renovating our flagship restaurant while keeping operations running was a massive challenge. BuildNest coordinated everything perfectly. The new interior design is absolutely breathtaking.", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop" },
  { name: "Sophia Patel", role: "Residential Client", text: "We trusted them with our dream home, and they delivered beyond measure. Their landscape development team specifically did an incredible job tying the outdoor living space to our architecture.", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=150&auto=format&fit=crop" },
];

// =========================================================================
// MAIN TEMPLATE
// =========================================================================
export default function ConstructionTemplatePage() {
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const r = useCallback((classes: string) => getModeClasses(classes, deviceMode), [deviceMode]);
  const [activeTab, setActiveTab] = useState("All Projects");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);

  const recentWorkScrollRef = useRef<HTMLDivElement | null>(null);
  const scrollRecentWork = (direction: "left" | "right") => {
    if (recentWorkScrollRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      recentWorkScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const testimonialsScrollRef = useRef<HTMLDivElement | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(1);

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
  // Ensure active state runs once on mount so initial center card highlights
  useEffect(() => {
    const timeout = setTimeout(handleTestimonialScroll, 100);
    return () => clearTimeout(timeout);
  }, [handleTestimonialScroll]);

  const scrollTestimonials = (direction: "left" | "right") => {
    if (testimonialsScrollRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      testimonialsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const filteredProjects =
    activeTab === "All Projects" ? allProjectsData.slice(0, 3) : allProjectsData.filter((p) => p.category === activeTab);

  return (
    <main className="flex flex-col min-h-screen bg-[#F3F4F6] overflow-x-hidden font-sans text-gray-900 pt-6">
      {/* FLOATING DEVICE TOOLBAR */}
      <div className="fixed z-[100] bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
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

      <div className={`flex-1 flex justify-center w-full ${deviceMode !== "desktop" ? "py-4 md:py-8 px-2 md:px-4" : ""}`}>
        <div
          ref={canvasScrollRef}
          className={`bg-white relative flex flex-col overflow-x-hidden overflow-y-auto ${deviceMode === "mobile"
              ? "w-full max-w-[375px] h-[85vh] rounded-[2.5rem] border-[8px] border-gray-800 shadow-2xl"
              : deviceMode === "tablet"
                ? "w-full max-w-[768px] h-[90vh] rounded-[2rem] border-[8px] border-gray-800 shadow-2xl"
                : "w-full min-h-screen"
            }`}
        >
          <div className="w-full overflow-x-hidden bg-[#FDF8F5]">
            <ConstructionHeader deviceMode={deviceMode} />

            {/* =================================================================
                1. HERO
            ================================================================= */}
            <section id="const-home" className={r("w-full py-5 px-4 sm:py-8 sm:px-6 lg:px-8")}>
              <div className="max-w-7xl mx-auto">
                <div className={r("relative w-full rounded-3xl sm:rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-[#CDC7C0] flex flex-col md:flex-row shadow-sm")}>
                  <div className={r("absolute inset-0 md:left-1/3")}>
                    <div className={r("absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-[#CDC7C0] via-[#CDC7C0]/85 to-[#CDC7C0]/40 md:to-transparent z-10")} />
                    <img
                      src="https://images.unsplash.com/photo-1508450859948-4e04fabaa4ea?q=80&w=1200&auto=format&fit=crop"
                      alt="Construction Silhouette"
                      className={r("w-full h-full object-cover object-center mix-blend-multiply opacity-40 md:opacity-90")}
                      loading="eager"
                    />
                  </div>

                  <div className={r("relative z-20 w-full md:w-3/5 p-6 sm:p-10 md:p-14 lg:p-20 flex flex-col justify-center")}>
                    <h1 className={r("font-black text-[#0A1E3D] leading-[1.15] mb-3 text-[28px] sm:text-4xl lg:text-5xl")}>
                      WE TURN DREAMS TO
                      <br />
                      IDEAL REALITY
                    </h1>
                    <p className={r("text-[#0A1E3D]/80 mb-6 text-sm leading-relaxed max-w-md sm:mb-8")}>
                      Innovative and functional architectural solutions tailored to your vision and needs.
                    </p>

                    <div className={r("grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-4 mb-7 sm:gap-x-4 sm:gap-y-5 sm:mb-10 w-full")}>
                      <div className={r("flex items-center sm:items-start gap-3 sm:gap-2.5 text-xs font-bold text-[#0A1E3D] leading-snug")}>
                        <div className={r("shrink-0 w-8 h-8 rounded-full bg-[#0A1E3D] flex items-center justify-center text-white sm:mt-0.5")}>
                          <FaHammer size={12} />
                        </div>
                        <span>
                          Interior Design
                          <br className={r("hidden sm:block")} />& Fit-Out
                        </span>
                      </div>
                      <div className={r("flex items-center sm:items-start gap-3 sm:gap-2.5 text-xs font-bold text-[#0A1E3D] leading-snug")}>
                        <div className={r("shrink-0 w-8 h-8 rounded-full bg-[#0A1E3D] flex items-center justify-center text-white sm:mt-0.5")}>
                          <FaLeaf size={12} />
                        </div>
                        <span>
                          Landscape Design
                          <br className={r("hidden sm:block")} />& Development
                        </span>
                      </div>
                      <div className={r("flex items-center sm:items-start gap-3 sm:gap-2.5 text-xs font-bold text-[#0A1E3D] leading-snug")}>
                        <div className={r("shrink-0 w-8 h-8 rounded-full bg-[#0A1E3D] flex items-center justify-center text-white sm:mt-0.5")}>
                          <FaBuilding size={12} />
                        </div>
                        <span>
                          Office Construction
                          <br className={r("hidden sm:block")} />& Renovation
                        </span>
                      </div>
                      <div className={r("flex items-center sm:items-start gap-3 sm:gap-2.5 text-xs font-bold text-[#0A1E3D] leading-snug")}>
                        <div className={r("shrink-0 w-8 h-8 rounded-full bg-[#0A1E3D] flex items-center justify-center text-white sm:mt-0.5")}>
                          <FaPenRuler size={12} />
                        </div>
                        <span>Architectural Design</span>
                      </div>
                    </div>

                    <div className={r("flex flex-col items-start gap-3 xs:flex-row xs:flex-wrap xs:items-center sm:gap-4")}>
                      <button
                        onClick={() => scrollToSection("const-contact")}
                        className="bg-[#0A1E3D] text-white px-5 py-3 rounded-md font-bold hover:bg-blue-900 transition-colors shadow-md text-sm text-center w-fit"
                      >
                        Free Consultation
                      </button>
                      <button
                        onClick={() => scrollToSection("const-process")}
                        className={r("border-b-2 border-transparent text-[#0A1E3D] py-2 font-bold hover:border-[#0A1E3D] transition-all text-sm text-center w-full xs:w-auto")}
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
                  <p className="text-gray-500 font-medium text-xs">Our Projects</p>
                  <span className="w-6 h-[2px] bg-gray-300 block" />
                </div>

                <div className={r("relative hidden sm:flex items-center justify-center mb-10")}>
                  <div className={r("absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-4")}>
                    <span className="w-8 h-[2px] bg-gray-300 block" />
                    <p className="text-gray-500 font-medium text-sm">Our Projects</p>
                  </div>
                  <h2 className="font-black text-[#0A1E3D] text-center text-3xl">Our Construction Projects</h2>
                </div>
                <h2 className={r("font-black text-[#0A1E3D] text-center text-2xl mb-8 sm:hidden")}>Our Construction Projects</h2>

                <div className={r("flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4 snap-x snap-mandatory sm:flex-wrap sm:overflow-visible sm:justify-center sm:gap-3 sm:mx-0 sm:px-0 sm:pb-0 sm:mb-12")}>
                  {["All Projects", "Construction", "Building", "Architecture", "Renovation", "Interior", "Residential"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={r(`shrink-0 snap-start px-4 py-2 sm:px-6 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm transition-all shadow-sm whitespace-nowrap ${activeTab === tab ? "bg-[#0A1E3D] text-white" : "bg-white text-[#0A1E3D] hover:bg-gray-50"
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
                          className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col border border-gray-100"
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
                              {p.title} <span className="text-sm font-medium text-gray-500 font-sans tracking-wide">({p.category})</span>
                            </h3>
                            <p className={r("text-gray-500 text-sm mb-5 leading-relaxed flex-1 sm:mb-6")}>{p.desc}</p>
                            <div className="flex justify-end">
                              <button
                                onClick={() => scrollToSection("const-projects")}
                                className="text-xs font-bold text-[#0A1E3D] hover:text-blue-600 transition-colors whitespace-nowrap"
                              >
                                View More...
                              </button>
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
                    className={r("inline-flex items-center gap-2 border border-[#0A1E3D]/20 bg-transparent px-7 py-3 rounded-md font-bold text-[#0A1E3D] hover:bg-[#0A1E3D]/5 transition-colors text-sm whitespace-nowrap")}
                  >
                    View All Projects <FaArrowRight size={12} />
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
                    { icon: FaClipboardList, num: "27+", label: "Years Industry Experience" },
                    { icon: FaUserGroup, num: "2000+", label: "Happy Customer" },
                    { icon: FaHelmetSafety, num: "150+", label: "Certified Construction" },
                    { icon: FaCertificate, num: "100%", label: "Client Satisfaction Rating" },
                  ].map((s, i) => (
                    <div key={i} className={r("flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3")}>
                      <s.icon className={r("text-3xl text-[#FBBF24] shrink-0 sm:text-4xl sm:mt-1")} />
                      <div className="flex flex-col">
                        <span className={r("text-xl font-black leading-tight sm:text-2xl")}>{s.num}</span>
                        <span className={r("text-xs font-bold text-gray-300 leading-snug sm:text-xs mt-1 sm:mt-0")}>{s.label}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={r("bg-[#EAF2FA] px-5 pt-10 pb-10 rounded-b-2xl sm:px-12 sm:pt-16 sm:pb-16 sm:rounded-b-3xl")}>
                  <div className={r("grid grid-cols-1 gap-8 items-center lg:grid-cols-2 lg:gap-12")}>
                    <div>
                      <p className={r("text-gray-500 font-medium text-sm flex items-center gap-3 mb-4 sm:gap-4")}>
                        <span className={r("w-6 h-[2px] bg-gray-400 block shrink-0 sm:w-8")} /> Best Service
                      </p>
                      <h2 className={r("text-2xl font-black text-[#0A1E3D] mb-5 leading-tight sm:text-3xl lg:text-4xl sm:mb-6")}>
                        Our Services That We Provide.
                      </h2>
                      <p className="text-gray-600 text-sm leading-relaxed max-w-md">
                        We deliver reliable construction solutions with quality craftsmanship and industry expertise. From planning to project completion, our team ensures every detail is built to perfection.
                      </p>
                    </div>
                    <div className={r("rounded-2xl overflow-hidden shadow-lg h-52 sm:h-64 lg:h-[350px]")}>
                      <img
                        src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=800&auto=format&fit=crop"
                        className="w-full h-full object-cover"
                        alt="Construction team"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                <div className={r("mt-6 lg:-mt-16 lg:px-12 relative z-10 sm:mt-8")}>
                  <div className={r("grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3")}>
                    {services.map((s, i) => (
                      <div
                        key={i}
                        className={r(`flex flex-col p-6 rounded-2xl shadow-xl transition-transform hover:-translate-y-2 sm:p-8 lg:p-10 lg:min-h-[400px] ${s.isDark ? "bg-[#0A1E3D] text-white" : "bg-white text-[#0A1E3D]"
                          }`)}
                      >
                        <h3 className={r("text-lg font-black mb-4 leading-snug whitespace-pre-line sm:text-xl sm:mb-6 lg:text-2xl")}>{s.title}</h3>
                        <p className={r(`text-sm mb-7 leading-relaxed flex-1 sm:mb-10 ${s.isDark ? "text-gray-300" : "text-gray-600"}`)}>{s.desc}</p>
                        <button
                          onClick={() => scrollToSection("const-contact")}
                          className={r(`px-3 py-2 rounded-full font-bold text-xs transition-colors border w-fit text-center whitespace-nowrap sm:px-6 sm:py-3 sm:text-sm ${s.isDark
                              ? "bg-transparent text-white border-white/30 hover:bg-white hover:text-[#0A1E3D]"
                              : "bg-transparent text-[#0A1E3D] border-[#0A1E3D]/30 hover:bg-[#0A1E3D] hover:text-white"
                            }`)}
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
                      src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800&auto=format&fit=crop"
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
                        <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
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
                        className={r("w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A1E3D] text-white flex items-center justify-center hover:bg-blue-900 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-md shrink-0")}
                      >
                        <FaArrowLeft size={16} />
                      </button>
                      <button
                        aria-label="Next"
                        onClick={() => scrollRecentWork("right")}
                        className={r("w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A1E3D] text-white flex items-center justify-center hover:bg-blue-900 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-md shrink-0")}
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
                  {recentProjects.map((img, i) => (
                    <div
                      key={i}
                      className={r("shrink-0 snap-center w-[85%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] rounded-2xl overflow-hidden shadow-xl h-56 sm:h-80 lg:h-[450px] sm:rounded-[2rem]")}
                    >
                      <img src={img} alt="Recent Project" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
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

                <div className={r("grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4")}>
                  {faqs.map((q, i) => {
                    const isActive = activeFaq === i;
                    return (
                      <div
                        key={i}
                        className={`rounded-xl shadow-sm overflow-hidden h-fit flex flex-col transition-colors duration-300 ${isActive ? "bg-[#0A1E3D] text-white" : "bg-white text-[#0A1E3D] hover:bg-gray-50"
                          }`}
                      >
                        <button
                          aria-expanded={isActive}
                          className={r("w-full px-5 py-4 text-left font-bold text-sm flex justify-between items-center gap-3 sm:px-6 sm:py-5 sm:text-base")}
                          onClick={() => setActiveFaq(isActive ? null : i)}
                        >
                          <span>{q}</span>
                          <FaChevronDown
                            className={`shrink-0 transform transition-transform duration-300 ${isActive ? "rotate-180 text-white" : "rotate-0 text-[#0A1E3D]"}`}
                          />
                        </button>
                        {isActive && (
                          <div className={r("px-5 pb-4 text-gray-300 text-sm leading-relaxed border-t border-white/10 pt-2 mt-[-8px] sm:px-6 sm:pb-5")}>
                            {i < 4
                              ? "Project timelines vary based on scope and complexity, but our team works efficiently to deliver every project on schedule while maintaining the highest standards of quality and safety."
                              : "We ensure every phase is communicated thoroughly and handled with expert care to give you the most efficient results possible."}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* =================================================================
                7. TESTIMONIALS
            ================================================================= */}
            <section className={r("w-full bg-[#FDF8F5] py-10 px-4 sm:py-24 sm:px-6 lg:px-8")}>
              <div className="max-w-7xl mx-auto">
                <div className={r("mb-10 sm:mb-16 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-end")}>
                  <div>
                    <p className={r("text-gray-500 font-medium uppercase tracking-widest text-xs sm:text-sm flex items-center gap-3 mb-3 sm:gap-4 sm:mb-4")}>
                      <span className={r("w-8 h-px bg-gray-400 block shrink-0 sm:w-12")} /> Testimonials
                    </p>
                    <h2 className={r("text-2xl font-black text-[#0A1E3D] leading-tight sm:text-4xl lg:text-5xl")}>
                      Trusted For Professional Construction Excellence.
                    </h2>
                  </div>
                  <p className={r("text-gray-600 text-sm leading-relaxed mt-4 lg:mt-0 lg:text-base")}>
                    See how our commitment to quality, craftsmanship, and customer satisfaction has earned the trust of clients across every project we build.
                  </p>
                </div>

                <div
                  ref={testimonialsScrollRef}
                  onScroll={handleTestimonialScroll}
                  className={r("flex overflow-x-auto gap-6 sm:gap-8 pb-12 pt-12 mb-4 snap-x snap-mandatory relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]")}
                >
                  {testimonialsData.map((t, i) => {
                    const isHighlighted = i === activeTestimonial;
                    return (
                      <div
                        key={i}
                        className={r(`shrink-0 snap-center w-[85%] sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-21px)] p-6 rounded-2xl shadow-xl border relative flex flex-col justify-between sm:p-8 transition-all duration-500 ${isHighlighted
                            ? "bg-[#0A1E3D] text-white border-[#0A1E3D] scale-110 z-10"
                            : "bg-[#F4FAFF] border-white/50 text-[#0A1E3D] scale-95 opacity-70"
                          }`)}
                      >
                        <div className="flex flex-col flex-1">
                          <div className={r("flex gap-1 text-yellow-400 mb-5 sm:mb-6")}>
                            <FaStar />
                            <FaStar />
                            <FaStar />
                            <FaStar />
                            <FaStar />
                          </div>
                          <p className={r(`text-sm leading-relaxed mb-10 flex-1 ${isHighlighted ? "text-gray-300" : "text-gray-600"}`)}>&quot;{t.text}&quot;</p>
                        </div>

                        <div className={r(`border-t flex flex-col items-center text-center relative pt-8 ${isHighlighted ? "border-gray-600" : "border-gray-300"}`)}>
                          <img src={t.img} alt={t.name} className="w-16 h-16 rounded-full object-cover shadow-md absolute -top-8 bg-white" />
                          <p className="font-black text-base mb-1">{t.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{t.role}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    aria-label="Previous Testimonial"
                    onClick={() => scrollTestimonials("left")}
                    className={r("w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A1E3D] text-white flex items-center justify-center hover:bg-blue-900 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-md shrink-0")}
                  >
                    <FaArrowLeft size={16} />
                  </button>
                  <button
                    aria-label="Next Testimonial"
                    onClick={() => scrollTestimonials("right")}
                    className={r("w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#0A1E3D] text-white flex items-center justify-center hover:bg-blue-900 active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all shadow-md shrink-0")}
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
              <div className={r("max-w-7xl mx-auto bg-[#EAF2FA] rounded-3xl p-6 flex flex-col gap-8 overflow-hidden shadow-sm border border-white sm:rounded-[2.5rem] sm:p-10 md:p-16 md:flex-row md:items-center md:gap-12")}>
                <div className="w-full md:w-1/2">
                  <h2 className={r("text-2xl font-black text-[#0A1E3D] leading-tight mb-4 sm:text-3xl md:text-5xl sm:mb-6")}>
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
                <div className={r("w-full md:w-1/2 relative h-44 sm:h-60 md:h-auto flex items-center justify-center")}>
                  <img
                    src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop"
                    className={r("absolute w-28 h-28 sm:w-40 sm:h-40 md:w-64 md:h-64 object-cover rounded-xl shadow-2xl -rotate-12 -translate-x-5 sm:-translate-x-8 md:-translate-x-12 z-10 grayscale hover:grayscale-0 transition-all duration-500")}
                    alt="Architecture"
                    loading="lazy"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop"
                    className={r("absolute w-28 h-28 sm:w-40 sm:h-40 md:w-64 md:h-64 object-cover rounded-xl shadow-2xl rotate-12 translate-x-5 sm:translate-x-8 md:translate-x-12 z-20 grayscale hover:grayscale-0 transition-all duration-500")}
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
                <div className="w-full md:w-1/2">
                  <p className={r("text-gray-500 font-medium uppercase tracking-widest text-xs sm:text-sm flex items-center gap-3 mb-3 sm:gap-4 sm:mb-4")}>
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
                    <div className={r("grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6")}>
                      <label className="flex flex-col">
                        <span className="text-sm font-bold text-[#0A1E3D] mb-2">First Name</span>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={r(`w-full p-3.5 sm:p-4 rounded-xl border ${formErrors.firstName ? 'border-red-500 bg-red-50' : 'border-transparent bg-[#C6D4E1] focus:bg-white'} focus:border-blue-400 focus:ring-0 text-sm shadow-sm transition-colors placeholder:text-gray-500`)}
                          placeholder="Enter your first name"
                        />
                        {formErrors.firstName && <span className="text-red-500 text-xs mt-1.5 font-semibold">{formErrors.firstName}</span>}
                      </label>
                      <label className="flex flex-col">
                        <span className="text-sm font-bold text-[#0A1E3D] mb-2">Last Name</span>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={r(`w-full p-3.5 sm:p-4 rounded-xl border ${formErrors.lastName ? 'border-red-500 bg-red-50' : 'border-transparent bg-[#C6D4E1] focus:bg-white'} focus:border-blue-400 focus:ring-0 text-sm shadow-sm transition-colors placeholder:text-gray-500`)}
                          placeholder="Enter your last name"
                        />
                        {formErrors.lastName && <span className="text-red-500 text-xs mt-1.5 font-semibold">{formErrors.lastName}</span>}
                      </label>
                    </div>
                    <label className="flex flex-col">
                      <span className="text-sm font-bold text-[#0A1E3D] mb-2">Email</span>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={r(`w-full p-3.5 sm:p-4 rounded-xl border ${formErrors.email ? 'border-red-500 bg-red-50' : 'border-transparent bg-[#C6D4E1] focus:bg-white'} focus:border-blue-400 focus:ring-0 text-sm shadow-sm transition-colors placeholder:text-gray-500`)}
                        placeholder="Enter your email address"
                      />
                      {formErrors.email && <span className="text-red-500 text-xs mt-1.5 font-semibold">{formErrors.email}</span>}
                    </label>
                    <label className="flex flex-col">
                      <span className="text-sm font-bold text-[#0A1E3D] mb-2">How can we help you?</span>
                      <textarea
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className={r(`w-full p-3.5 sm:p-4 rounded-xl border ${formErrors.message ? 'border-red-500 bg-red-50' : 'border-transparent bg-[#C6D4E1] focus:bg-white'} focus:border-blue-400 focus:ring-0 text-sm resize-none shadow-sm transition-colors placeholder:text-gray-500`)}
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

            {/* Construction Template Footer */}
            <footer id="const-footer" className={r("w-full bg-[#0A1E3D] text-white py-12 px-4 sm:py-16 sm:px-6 lg:px-8 border-b border-white/10 relative z-20 mt-12 sm:mt-16 md:mt-20")}>
              <div className="max-w-7xl mx-auto">
                <div className={r("grid grid-cols-1 md:grid-cols-4 gap-8 mb-12")}>
                  {/* Column 1: Brand */}
                  <div className="flex flex-col gap-4">
                    <h3 className="text-xl font-black tracking-tight text-white">BuildNest</h3>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      Delivering reliable construction and innovative architectural solutions tailored to your vision and needs.
                    </p>
                  </div>
                  {/* Column 2: Services */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-200">Services</h4>
                    <ul className="flex flex-col gap-2.5 text-sm text-gray-300">
                      <li><button onClick={() => scrollToSection("const-features")} className="hover:text-white transition-colors text-left focus:outline-none">General Construction</button></li>
                      <li><button onClick={() => scrollToSection("const-features")} className="hover:text-white transition-colors text-left focus:outline-none">Property Maintenance</button></li>
                      <li><button onClick={() => scrollToSection("const-features")} className="hover:text-white transition-colors text-left focus:outline-none">Virtual Design & Build</button></li>
                      <li><button onClick={() => scrollToSection("const-features")} className="hover:text-white transition-colors text-left focus:outline-none">Architectural Design</button></li>
                    </ul>
                  </div>
                  {/* Column 3: Links */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-200">Quick Links</h4>
                    <ul className="flex flex-col gap-2.5 text-sm text-gray-300">
                      <li><button onClick={() => scrollToSection("const-home")} className="hover:text-white transition-colors text-left focus:outline-none">Home</button></li>
                      <li><button onClick={() => scrollToSection("const-projects")} className="hover:text-white transition-colors text-left focus:outline-none">Projects</button></li>
                      <li><button onClick={() => scrollToSection("const-process")} className="hover:text-white transition-colors text-left focus:outline-none">Process</button></li>
                      <li><button onClick={() => scrollToSection("const-contact")} className="hover:text-white transition-colors text-left focus:outline-none">Contact Us</button></li>
                    </ul>
                  </div>
                  {/* Column 4: Opening Hours */}
                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-200">Working Hours</h4>
                    <ul className="flex flex-col gap-2 text-sm text-gray-300">
                      <li>Monday - Friday: <span className="text-white font-semibold">9:00 AM - 6:00 PM</span></li>
                      <li>Saturday: <span className="text-white font-semibold">10:00 AM - 4:00 PM</span></li>
                      <li>Sunday: <span className="text-white font-semibold">Closed</span></li>
                    </ul>
                  </div>
                </div>
                <div className={r("border-t border-white/10 pt-6 flex flex-col sm:flex-row sm:justify-between items-center gap-4 text-xs text-gray-400")}>
                  <p>© 2026 BuildNest Construction. All rights reserved.</p>
                  <div className="flex gap-4">
                    <button onClick={() => scrollToSection("const-home")} className="hover:text-white transition-colors focus:outline-none">Privacy Policy</button>
                    <button onClick={() => scrollToSection("const-home")} className="hover:text-white transition-colors focus:outline-none">Terms of Service</button>
                  </div>
                </div>
              </div>
            </footer>

            {/* Wrapped Global Footer */}
            <div className={r("w-full overflow-hidden bg-[#071936] relative z-20 mt-12 sm:mt-16 md:mt-20")}>
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}