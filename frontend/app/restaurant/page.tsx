"use client";

import { useState, useRef, useCallback, useEffect, FormEvent } from "react";
import Link from "next/link";
import Footer from "../../components/Footer";
import { assetPath } from "@/lib/paths";
import { FaEye, FaLaptop, FaTabletAlt, FaMobileAlt, FaEnvelope, FaPaperPlane, FaUtensils, FaUsers, FaCouch, FaLeaf, FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { FaBars, FaXmark } from "react-icons/fa6";
import { useBlockpagesEditor } from "@/lib/blockpagesEditorContext";
import { resolveBlockpagesDeviceMode } from "@/lib/blockpagesEditorInteraction";
import { scrollBlockpagesCanvasToSection } from "@/lib/blockpagesTemplateSections";
import { motion, AnimatePresence } from "framer-motion";

const START_BUILDING_HREF = "/signup";

function scrollToSection(sectionId: string) {
  scrollBlockpagesCanvasToSection(sectionId);
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

// Updated navigation links to include Menu, About Us, and Contact
const navLinks = [
  { label: "Home", hash: "#restaurant-home" },
  { label: "Menu", hash: "#restaurant-menu" },
  { label: "About Us", hash: "#restaurant-about" },
  { label: "Features", hash: "#restaurant-why-choose-us" },
  { label: "FAQ", hash: "#restaurant-faq" },
  { label: "Contact", hash: "#restaurant-contact" },
] as const;

interface RestaurantHeaderProps {
  deviceMode: "desktop" | "tablet" | "mobile";
}

function RestaurantHeader({ deviceMode }: RestaurantHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const r = useCallback((classes: string) => getModeClasses(classes, deviceMode), [deviceMode]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (mobileOpen && headerRef.current && !headerRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [mobileOpen]);

  return (
    <header ref={headerRef} data-blockpages-template-header="true" className={r("bg-[#0A1E3D] text-white w-full max-w-full sticky top-0 z-50 shadow-md")}>
      <div className={r(`w-full mx-auto py-4 flex items-center justify-between px-4 sm:px-6 lg:px-8 ${deviceMode === "desktop" ? "max-w-7xl" : ""
        }`)}>
        <button
          type="button"
          className="text-sm sm:text-lg md:text-xl font-black text-white no-underline bg-none border-none cursor-pointer p-0 hover:opacity-90 focus-visible:outline-none min-w-0 break-words text-left"
          onClick={() => scrollToSection("restaurant-home")}
        >
          Stackly Restaurant
        </button>

        {/* DESKTOP NAV WITH HIGHLIGHTS AND GAPS */}
        <nav className={r(`${deviceMode === "desktop" ? "hidden md:flex" : "hidden"} items-center gap-6 lg:gap-8`)}>
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              className="bg-transparent border border-transparent cursor-pointer py-2 px-4 rounded-lg transition-all duration-300 hover:bg-white/20 hover:text-white hover:border-white/30 hover:shadow-sm hover:-translate-y-0.5 text-sm font-bold text-white/90"
              onClick={() => scrollToSection(link.hash.replace("#", ""))}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <button
            type="button"
            data-blockpages-interactive="true"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-controls="restaurant-mobile-nav"
            aria-expanded={mobileOpen}
            className={r(`${deviceMode === "desktop" ? "md:hidden" : "flex"} inline-flex items-center justify-center w-10 h-10 rounded-md border text-white transition-colors ${mobileOpen ? "bg-white/20 border-white" : "border-white/60 hover:bg-white/20"
              }`)}
            onClick={() => { setMobileOpen((open) => !open); }}
          >
            {mobileOpen ? <FaXmark size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>

      <nav
        id="restaurant-mobile-nav"
        aria-hidden={!mobileOpen}
        className={r(`absolute top-full left-0 w-full bg-[#0A1E3D] border-t border-white/10 shadow-2xl flex flex-col pt-6 pb-6 px-6 gap-4 z-50 ${mobileOpen ? "" : "hidden"}`)}
      >
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              className="py-3 px-4 text-white text-base font-bold text-left w-full transition-all duration-300 hover:bg-white/20 hover:pl-6 rounded-md border border-transparent hover:border-white/20 cursor-pointer"
              onClick={() => { scrollToSection(link.hash.replace("#", "")); setMobileOpen(false); }}
            >
              {link.label}
            </button>
          ))}
      </nav>
    </header>
  );
}

// Renamed from templates to foods, keeping exact images requested
const foodItems = [
  {
    title: "Premium Ribeye Steak",
    price: "₹450",
    image: assetPath("/premium-ribeye-steak.webp"),
  },
  {
    title: "Artisan Cafe Pastries",
    price: "₹120",
    image: assetPath("/artisan-cafe-pastries.webp"),
  },
  {
    title: "Authentic Wood-Fired Pizza",
    price: "₹180",
    image: assetPath("/authentic-wood-fired-pizza.webp"),
  },
  {
    title: "Avocado Brunch Toast",
    price: "₹140",
    image: assetPath("/avocado-brunch-toast.webp"),
  },
  {
    title: "Gourmet Street Tacos",
    price: "₹160",
    image: assetPath("/gourmet-street-tacos.webp"),
  },
  {
    title: "Classic Cheeseburger",
    price: "₹150",
    image: assetPath("/classic-cheeseburger.webp"),
  },
];

const buildFeatures = [
  { title: "Design a mouth-watering menu", text: "Showcase your dishes with stunning galleries, categorize your offerings, and easily update prices and seasonal specials in real-time." },
  { title: "Take online reservations", text: "Never double-book a table again. Integrate built-in reservation systems so customers can book their spot directly from their phone." },
  { title: "Accept online orders", text: "Add e-commerce capabilities to your restaurant site for pickup or delivery orders, completely commission-free." },
];

const infraItems = [
  { title: "Mobile-optimized design", text: "Hungry customers are searching on their phones. Our templates are automatically formatted to look perfect on any device." },
  { title: "Local SEO tools", text: "Get found by diners in your area. Built-in SEO settings help your restaurant rank higher on Google Maps and local search results." },
  { title: "Fast loading times", text: "We use a worldwide CDN to ensure your menus and high-quality restaurant images load instantly, providing a seamless browsing experience." },
];

const faqItems = [
  { q: "Can I easily update my menu prices?", answer: "Yes! The Stackly drag-and-drop builder makes it incredibly easy to update text, swap out seasonal dishes, and adjust pricing instantly without touching a line of code." },
  { q: "Do I need to pay commission for online orders?", answer: "No. Unlike third-party delivery apps, setting up an online ordering system through your Stackly website is commission-free. You keep 100% of your profits." },
  { q: "Can customers book tables through the website?", answer: "Absolutely. You can integrate booking forms and reservation widgets that sync directly with your preferred management software." },
  { q: "Are the restaurant templates mobile friendly?", answer: "Yes, all our restaurant templates are 100% responsive. Your menus, contact info, and booking buttons will look perfect and be easy to tap on smartphones." },
];

const testimonials = [
  {
    quote: "Absolutely delicious! The food, the service, and the atmosphere were all perfect. Highly recommended.",
    name: "John Smith",
    role: "Besnik",
  },
  {
    quote: "An unforgettable dining experience. Every dish was a masterpiece, full of rich flavors and beautiful presentation.",
    name: "Sarah Jenkins",
    role: "Gourmet Life",
  },
  {
    quote: "The service was incredibly warm and friendly, and the relaxing ambience made our anniversary dinner truly special.",
    name: "Michael Chang",
    role: "DineOut",
  }
];

export default function RestaurantTemplatesPage() {
  const blockpagesEditor = useBlockpagesEditor();
  const isBlockpages = Boolean(blockpagesEditor?.enabled);
  const [openFaq, setOpenFaq] = useState(0);
  const [faqList, setFaqList] = useState(faqItems);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [localDeviceMode, setLocalDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const deviceMode = resolveBlockpagesDeviceMode(isBlockpages, blockpagesEditor?.deviceMode, localDeviceMode);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);

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

  const r = useCallback((classes: string) => getModeClasses(classes, deviceMode), [deviceMode]);



  return (
    <main className={isBlockpages ? "@container restaurant-shell w-full min-w-0 max-w-full overflow-x-hidden bg-white font-sans text-gray-900 box-border [&_button]:cursor-pointer [&_a]:cursor-pointer" : "flex flex-col min-h-screen bg-[#F3F4F6] overflow-x-hidden font-sans text-gray-900 pt-6"}>

      {!isBlockpages && (
        <div className="fixed z-[100] transition-all duration-500 ease-in-out shrink-0 bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
          <div className="flex items-center gap-2 bg-white rounded-full border border-gray-200 shadow-xl px-4 py-2">
            <Link href="/landing#templates" className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm hover:shadow-md hover:bg-gray-50 text-[#06224C] transition focus-visible:outline-none" title="Back to Landing">
              <FaEye size={16} />
            </Link>
            <div className="w-px h-6 bg-gray-300 mx-1"></div>
            <button onClick={() => setLocalDeviceMode("desktop")} className={`w-10 h-10 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition focus-visible:outline-none ${deviceMode === "desktop" ? "border-gray-300 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "border-gray-100 text-gray-500"}`} title="Desktop View">
              <FaLaptop size={16} />
            </button>
            <button onClick={() => setLocalDeviceMode("tablet")} className={`w-10 h-10 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition focus-visible:outline-none ${deviceMode === "tablet" ? "border-gray-300 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "border-gray-100 text-gray-500"}`} title="Tablet View">
              <FaTabletAlt size={16} />
            </button>
            <button onClick={() => setLocalDeviceMode("mobile")} className={`w-10 h-10 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition focus-visible:outline-none ${deviceMode === "mobile" ? "border-gray-300 ring-2 ring-[#0A1E3D] text-[#0A1E3D]" : "border-gray-100 text-gray-500"}`} title="Mobile View">
              <FaMobileAlt size={16} />
            </button>
          </div>
        </div>
      )}

      <div className={isBlockpages ? "w-full min-w-0" : `flex-1 flex justify-center w-full transition-all duration-500 ${deviceMode !== "desktop" ? "py-4 md:py-8 px-2 md:px-4" : ""}`}>
        <div
          ref={isBlockpages ? undefined : canvasScrollRef}
          className={isBlockpages ? "w-full min-w-0" : `bg-white relative flex flex-col overflow-x-hidden overflow-y-auto transition-all duration-500 ease-in-out ${deviceMode === "mobile" ? "w-full max-w-[375px] h-[85vh] rounded-[2.5rem] border-[8px] border-gray-800 shadow-2xl"
            : deviceMode === "tablet" ? "w-full max-w-[768px] h-[90vh] rounded-[2rem] border-[8px] border-gray-800 shadow-2xl"
              : "w-full min-h-screen"
            }`}
        >
          <div className="w-full max-w-full overflow-x-hidden min-w-0">
            <RestaurantHeader
              deviceMode={deviceMode}
            />

            {/* 1. HERO SECTION */}
            <div id="restaurant-home" className={`w-full bg-[#FFF5F5] min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className={`mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16 ${deviceMode === "desktop" ? "max-w-7xl w-full" : "max-w-3xl"
                }`}>
                {/* Left side: Text content */}
                <div className="flex-1 text-left break-words w-full max-w-xl min-w-0">
                  <h1 className={r("font-black text-balance leading-[1.15] text-[#0A1E3D] mb-6 text-2xl sm:text-3xl md:text-5xl lg:text-6xl break-words")}>
                    We Serve The Taste You Love
                  </h1>
                  <div className="text-sm sm:text-base text-gray-600 mb-8 space-y-2 leading-relaxed break-words">
                    <p>Welcome to a place where every meal tells a story.</p>
                    <p>We serve handcrafted dishes made from premium, locally sourced ingredients.</p>
                    <p>Relax, unwind, and enjoy a dining experience designed to delight.</p>
                    <p>Creating unforgettable memories, one plate at a time.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-start w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => scrollToSection("restaurant-menu")}
                      className="inline-flex items-center justify-center min-h-[3.5rem] px-4 sm:px-8 rounded-full bg-transparent border-2 border-[#0A1E3D] text-[#0A1E3D] text-sm sm:text-base font-bold transition-all hover:bg-[#0A1E3D] hover:text-white hover:-translate-y-0.5 w-full sm:w-auto text-center cursor-pointer"
                    >
                      Explore Food
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToSection("restaurant-contact")}
                      className="inline-flex items-center justify-center min-h-[3.5rem] px-4 sm:px-8 rounded-full bg-transparent border-2 border-[#0A1E3D] text-[#0A1E3D] text-sm sm:text-base font-bold transition-all hover:bg-[#0A1E3D] hover:text-white hover:-translate-y-0.5 w-full sm:w-auto text-center cursor-pointer"
                    >
                      Reserve Table
                    </button>
                  </div>
                </div>

                {/* Right side: Two Overlapping Images */}
                <div className="flex-1 w-full max-w-[550px] relative aspect-[4/3] flex items-center justify-center min-w-0">
                  {/* Base / Right Image */}
                  <div className="w-[60%] h-[90%] absolute right-0 top-[5%] rounded-3xl overflow-hidden shadow-lg z-10">
                    <img
                      src={assetPath("/Image - 2.webp")}
                      alt="Chef plating food in kitchen"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  {/* Overlapping / Left Image */}
                  <div className="w-[55%] aspect-[1.3] absolute left-0 bottom-[5%] rounded-3xl overflow-hidden shadow-2xl z-20 border-[4px] sm:border-[6px] border-[#FFF5F5]">
                    <img
                      src={assetPath("/Image -1.webp")}
                      alt="Drinks and gourmet dishes"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. MENU GRID (Changed from Templates to Foods) */}
            <section id="restaurant-menu" className={`bg-white min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 break-words">
                  <h2 className={r("font-black text-[#0A1E3D] mb-4 text-balance text-xl sm:text-2xl md:text-3xl lg:text-4xl break-words")}>Our Signature Menu</h2>
                  <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed break-words">Explore our carefully curated selection of fresh, delicious dishes made from scratch.</p>
                </div>

                <div className={r("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8")}>
                  {foodItems.map((item) => (
                    <article
                      key={item.title}
                      className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-red-100 min-w-0"
                    >
                      <div className="overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] mb-5">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-center gap-3 flex-wrap min-w-0 w-full">
                          <h3 className="text-base sm:text-lg font-bold text-[#0A1E3D] break-words leading-tight flex-1 min-w-0">{item.title}</h3>
                          <span className="inline-flex items-center justify-center bg-[#0F2D5C] text-white text-xs sm:text-sm font-black px-3.5 py-1 rounded-full shrink-0 max-w-full ml-auto">
                            {item.price}
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* 3. ABOUT US SECTION */}
            <section id="restaurant-about" className={`bg-gray-50 border-y border-gray-100 min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className={r("max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center")}>
                <div className="rounded-[2rem] overflow-hidden shadow-xl w-full min-w-0">
                  <img
                    src={assetPath("/Restaurant-OurStory.webp")}
                    alt="Restaurant Our Story"
                    className="w-full h-auto aspect-[4/3] object-cover max-w-full"
                  />
                </div>
                <div className="break-words min-w-0">
                  <h2 className="text-[#0F2D5C] font-black uppercase tracking-[0.2em] text-xs sm:text-sm mb-3">Our Story</h2>
                  <h3 className={r("font-black text-[#0A1E3D] text-balance leading-tight mb-6 text-xl sm:text-2xl md:text-3xl lg:text-4xl break-words")}>Tradition meets modern flavor.</h3>
                  <p className="text-base text-gray-600 leading-relaxed mb-6">Founded with a passion for exceptional food, we started as a small family kitchen dedicated to bringing authentic, vibrant flavors to our neighborhood.</p>
                  <p className="text-base text-gray-600 leading-relaxed mb-8">Today, we continue that tradition by sourcing the freshest local ingredients and applying modern culinary techniques to classic recipes. Every bite is crafted to make your dining experience memorable.</p>

                  <div className="flex gap-8 border-t border-gray-200 pt-6">
                    <div>
                      <p className="text-3xl font-black text-[#0A1E3D]">10+</p>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Years</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-[#0A1E3D]">5k+</p>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Guests</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3.5 WHY CHOOSE US SECTION */}
            <section id="restaurant-why-choose-us" className={`bg-white min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"}`}>
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 break-words">
                  <span className="text-[#0F2D5C] uppercase tracking-[0.2em] text-xs sm:text-sm font-black">Why Choose Us</span>
                </div>

                <div className={r("w-full bg-[#0F2D5C] rounded-[2rem] shadow-xl p-6 sm:p-12 lg:p-16")}>
                  <div className="text-center mb-12 max-w-3xl mx-auto break-words">
                    <h3 className={r("font-black text-[#FFFFFF] mb-4 text-balance text-xl sm:text-2xl md:text-3xl lg:text-4xl break-words")}>
                      Loved By Food Lovers
                    </h3>
                    <p className="text-sm sm:text-base text-[#FFFFFF]/80 max-w-2xl mx-auto leading-relaxed break-words">
                      Join thousands of happy diners who enjoy delicious meals, warm hospitality, and unforgettable dining experiences with every visit.
                    </p>
                  </div>

                  <div className={r("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6")}>
                    {/* Card 1 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full min-w-0 w-full max-w-none">
                      <div className="min-w-0 break-words">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border border-dashed border-gray-300 rounded-2xl mb-6 text-[#0A1E3D] mx-auto shrink-0">
                          <FaUtensils size={28} className="sm:hidden" />
                          <FaUtensils size={32} className="hidden sm:block" />
                        </div>
                        <h4 className="text-[#0A1E3D] text-base sm:text-lg font-black text-center mb-3 break-words">Signature Flavors</h4>
                        <p className="text-gray-600 text-xs sm:text-sm text-center leading-relaxed break-words">
                          Every signature dish is carefully prepared to deliver the perfect balance of taste, quality, and creativity.
                        </p>
                      </div>
                    </div>

                    {/* Card 2 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full min-w-0 w-full max-w-none">
                      <div className="min-w-0 break-words">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border border-dashed border-gray-300 rounded-2xl mb-6 text-[#0A1E3D] mx-auto shrink-0">
                          <FaUsers size={28} className="sm:hidden" />
                          <FaUsers size={32} className="hidden sm:block" />
                        </div>
                        <h4 className="text-[#0A1E3D] text-base sm:text-lg font-black text-center mb-3 break-words">Friendly Service</h4>
                        <p className="text-gray-600 text-xs sm:text-sm text-center leading-relaxed break-words">
                          Experience warm hospitality and attentive service that makes every guest feel right at home.
                        </p>
                      </div>
                    </div>

                    {/* Card 3 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full min-w-0 w-full max-w-none">
                      <div className="min-w-0 break-words">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border border-dashed border-gray-300 rounded-2xl mb-6 text-[#0A1E3D] mx-auto shrink-0">
                          <FaCouch size={28} className="sm:hidden" />
                          <FaCouch size={32} className="hidden sm:block" />
                        </div>
                        <h4 className="text-[#0A1E3D] text-base sm:text-lg font-black text-center mb-3 break-words">Relaxing Ambience</h4>
                        <p className="text-gray-600 text-xs sm:text-sm text-center leading-relaxed break-words">
                          Step into a calm and stylish environment where delicious food and a relaxing ambiance come together beautifully.
                        </p>
                      </div>
                    </div>

                    {/* Card 4 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full min-w-0 w-full max-w-none">
                      <div className="min-w-0 break-words">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center border border-dashed border-gray-300 rounded-2xl mb-6 text-[#0A1E3D] mx-auto shrink-0">
                          <FaLeaf size={28} className="sm:hidden" />
                          <FaLeaf size={32} className="hidden sm:block" />
                        </div>
                        <h4 className="text-[#0A1E3D] text-base sm:text-lg font-black text-center mb-3 break-words">Quality Ingredients</h4>
                        <p className="text-gray-600 text-xs sm:text-sm text-center leading-relaxed break-words">
                          Our commitment to quality starts with the ingredients, ensuring every dish is crafted with freshness, flavor, and care.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. FAQ */}
            <section id="restaurant-faq" className={`bg-white min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12 break-words">
                  <h2 className={r("font-black text-[#0A1E3D] mb-4 text-balance text-xl sm:text-2xl md:text-3xl lg:text-4xl break-words")}>Frequently Asked Questions</h2>
                  <p className="text-sm sm:text-base text-gray-600 break-words max-w-full leading-relaxed">Everything you need to know about building your restaurant website.</p>
                </div>

                <div className="space-y-4">
                  {faqList.map((item, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-gray-300">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-5 bg-gray-50/50 text-left"
                          onClick={() => setOpenFaq(isOpen ? -1 : index)}
                        >
                          <span
                            className="font-bold text-[#0A1E3D] pr-4 text-sm sm:text-base break-words whitespace-normal text-left flex-1"
                            suppressContentEditableWarning
                            onBlur={(e) => {
                              const text = e.currentTarget.textContent ?? "";
                              setFaqList((prev) =>
                                prev.map((faq, i) => (i === index ? { ...faq, q: text } : faq))
                              );
                            }}
                          >
                            {item.q}
                          </span>
                          <span className="text-xl sm:text-2xl text-gray-400 shrink-0 font-light" aria-hidden>{isOpen ? "−" : "+"}</span>
                        </button>
                        <div
                          className={`p-5 pt-2 text-sm sm:text-base text-gray-600 leading-relaxed border-t border-gray-100 bg-white break-words whitespace-normal ${isOpen ? "block" : "hidden"}`}
                          suppressContentEditableWarning
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent ?? "";
                            setFaqList((prev) =>
                              prev.map((faq, i) => (i === index ? { ...faq, answer: text } : faq))
                            );
                          }}
                        >
                          {item.answer}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 6.5 GUEST EXPERIENCES (TESTIMONIALS) */}
            <section id="restaurant-testimonials" className={`bg-white min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"}`}>
              <div className="max-w-7xl mx-auto">
                <div className={r("w-full bg-[#0F2D5C] rounded-[2rem] sm:rounded-[2.5rem] shadow-xl p-6 sm:p-12 lg:p-16")}>
                  <div className="text-center mb-8 break-words" style={{ overflowWrap: "anywhere" }}>
                    <h2 className="text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm mb-3">Guest Experiences</h2>
                  </div>

                  <div className={r("flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 min-h-[320px] w-full min-w-0 text-center lg:text-left")}>
                    {/* Left Image (John Smith or active testimonial guest) */}
                    <div className={r("flex-1 max-w-[200px] sm:max-w-[240px] w-full flex justify-center min-w-0")}>
                      <div className="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px] rounded-[2rem] overflow-hidden shadow-md transition-all duration-500 hover:scale-105">
                        <img
                          src={assetPath("/testimonial-1.webp")}
                          alt="Guest Experience 1"
                          className="w-full h-auto object-cover max-w-full"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {/* Center Testimonial Content */}
                    <div className="flex-[2] text-center flex flex-col items-center justify-center w-full max-w-full px-4 min-w-0">
                      <span className="text-[white] text-5xl sm:text-6xl font-serif leading-none select-none mb-2">❝</span>
                      
                      <div className="min-h-[140px] flex flex-col justify-center w-full max-w-full min-w-0">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={activeTestimonial}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col items-center w-full max-w-full min-w-0"
                          >
                            <p className="text-[white] text-base sm:text-lg lg:text-xl font-bold leading-relaxed mb-6 italic break-words whitespace-normal text-center w-full max-w-full" style={{ overflowWrap: "anywhere" }}>
                              &quot;{testimonials[activeTestimonial].quote}&quot;
                            </p>
                            <h4 className="text-[white] text-sm sm:text-base font-black tracking-wide uppercase break-words" style={{ overflowWrap: "anywhere" }}>
                              {testimonials[activeTestimonial].name}
                            </h4>
                            <p className="text-[white]/70 text-xs sm:text-sm font-semibold mt-1 break-words" style={{ overflowWrap: "anywhere" }}>
                              {testimonials[activeTestimonial].role}
                            </p>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Navigation Arrows */}
                      <div className="flex gap-4 mt-6">
                        <button
                          type="button"
                          onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-[#0F2D5C] transition-all duration-300 shadow-sm cursor-pointer font-bold text-base sm:text-lg"
                          aria-label="Previous Testimonial"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                          className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-[#0F2D5C] transition-all duration-300 shadow-sm cursor-pointer font-bold text-base sm:text-lg"
                          aria-label="Next Testimonial"
                        >
                          →
                        </button>
                      </div>
                    </div>

                    {/* Right Image */}
                    <div className={r(`flex-1 max-w-[200px] sm:max-w-[240px] w-full justify-center min-w-0 ${deviceMode === "desktop" ? "lg:flex hidden" : "hidden"}`)}>
                      <div className="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px] rounded-[2rem] overflow-hidden shadow-md transition-all duration-500 hover:scale-105">
                        <img
                          src={assetPath("/testimonial-2.webp")}
                          alt="Guest Experience 2"
                          className="w-full h-auto object-cover max-w-full"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>


            {/* 7. CONTACT SECTION */}
            <section id="restaurant-contact" className={`bg-gray-50 min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className="max-w-5xl mx-auto text-center break-words">
                <h2 className="text-[#0A1E3D] font-black uppercase tracking-[0.2em] text-xs sm:text-sm mb-3">Get in Touch</h2>
                <h3 className={r("font-black text-[#0A1E3D] text-balance leading-tight mb-10 text-xl sm:text-2xl md:text-3xl lg:text-4xl break-words")}>Visit Us or Reach Out</h3>

                <div className={r("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8")}>
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow min-w-0 w-full break-words">
                    <h4 className="font-bold text-[#0A1E3D] mb-3 text-base sm:text-lg">Location</h4>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">770 Marthalli<br />Food District, 560037</p>
                  </div>
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow min-w-0 w-full break-words">
                    <h4 className="font-bold text-[#0A1E3D] mb-3 text-base sm:text-lg">Hours</h4>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">Mon - Fri: 11AM - 10PM<br />Sat - Sun: 10AM - 11PM</p>
                  </div>
                  <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow min-w-0 w-full break-words">
                    <h4 className="font-bold text-[#0A1E3D] mb-3 text-base sm:text-lg">Contact</h4>
                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">info@stacklyfood.com<br />+91 9745684731 </p>
                  </div>
                </div>
              </div>
            </section>

            <footer id="restaurant-footer" data-blockpages-template-footer="true" className={`@container bg-[#FFF5F5] min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"}`}>
              <div className="mx-auto max-w-7xl w-full">
                <div className="grid grid-cols-1 gap-10 @md:grid-cols-2 @4xl:grid-cols-4">
                  <div>
                    <h3 className="mb-4 text-lg font-bold text-[#0A1E3D]">Stackly Restaurant</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      Experience the best culinary delights with our signature dishes and exceptional service in a modern, welcoming atmosphere.
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-4 text-lg font-bold text-[#0A1E3D]">Follow Us On</h4>
                    <ul className="space-y-2.5 text-sm text-gray-600">
                      <li>
                        <a
                          href="https://facebook.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 transition-all duration-300 hover:text-[#0A1E3D] hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1E3D]/50 focus-visible:rounded"
                        >
                          <FaFacebookF className="shrink-0" />
                          <span>Facebook</span>
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://twitter.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 transition-all duration-300 hover:text-[#0A1E3D] hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1E3D]/50 focus-visible:rounded"
                        >
                          <FaTwitter className="shrink-0" />
                          <span>Twitter</span>
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://instagram.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 transition-all duration-300 hover:text-[#0A1E3D] hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1E3D]/50 focus-visible:rounded"
                        >
                          <FaInstagram className="shrink-0" />
                          <span>Instagram</span>
                        </a>
                      </li>
                      <li>
                        <a
                          href="https://youtube.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 transition-all duration-300 hover:text-[#0A1E3D] hover:translate-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A1E3D]/50 focus-visible:rounded"
                        >
                          <FaYoutube className="shrink-0" />
                          <span>YouTube</span>
                        </a>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-4 text-lg font-bold text-[#0A1E3D]">Opening Hours</h4>
                    <ul className="space-y-2.5 text-sm text-gray-600">
                      <li>Mon - Fri: 11:00 AM - 10:00 PM</li>
                      <li>Sat - Sun: 10:00 AM - 11:00 PM</li>
                      <li>Holidays: Closed</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-4 text-lg font-bold text-[#0A1E3D]">Newsletter</h4>
                    <p className="mb-4 text-sm text-gray-600">Get updates and exclusive offers delivered to your inbox.</p>
                    <form onSubmit={handleNewsletter} className="flex flex-col gap-2 w-full min-w-0">
                      <div className="relative flex flex-col sm:flex-row w-full min-w-0 items-stretch sm:items-center rounded-2xl sm:rounded-full bg-white ring-1 ring-gray-200 transition-all duration-300 hover:ring-2 hover:ring-[#0A1E3D]/50 focus-within:ring-2 focus-within:ring-[#0A1E3D] p-1.5 sm:p-0 gap-2 sm:gap-0">
                        <div className="relative flex items-center w-full min-w-0">
                          <div className="pointer-events-none absolute left-4 text-gray-400">
                            <FaEnvelope size={16} />
                          </div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email"
                            className="min-w-0 w-full rounded-full bg-transparent py-3.5 pl-11 pr-4 sm:pr-14 text-sm text-[#0A1E3D] placeholder-[#0A1E3D]/60 outline-none transition-colors duration-300 hover:text-[#0A1E3D] hover:placeholder-[#0A1E3D]/40 focus:text-[#0A1E3D] focus:placeholder-[#0A1E3D]/40"
                          />
                        </div>
                        <button
                          type="submit"
                          aria-label="Subscribe"
                          disabled={!isEmailValid || newsletterStatus === "loading" || email.length === 0}
                          className="sm:absolute sm:right-1.5 flex h-10 w-full sm:w-10 shrink-0 items-center justify-center rounded-full bg-[#0A1E3D] text-white transition-all duration-300 hover:-translate-y-1 hover:bg-[#112a52] hover:shadow-lg active:scale-95 disabled:pointer-events-none cursor-pointer"
                        >
                          {newsletterStatus === "loading" ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <span className="sm:hidden text-xs font-bold uppercase tracking-wider">Subscribe</span>
                              <FaPaperPlane size={14} />
                            </span>
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

                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row text-center sm:text-left">
                  <p className="text-xs text-gray-600 break-words w-full sm:w-auto">Copyright 2018-2026 TheStackly.com INC. All rights reserved.</p>

                  <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-600 w-full sm:w-auto">
                    <button type="button" onClick={() => setIsTermsModalOpen(true)} className="transition hover:text-[#0A1E3D] cursor-pointer">Terms of Use</button>
                    <button type="button" onClick={() => setIsPrivacyModalOpen(true)} className="transition hover:text-[#0A1E3D] cursor-pointer">Privacy Policy</button>
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