"use client";
 
import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "../../components/Footer";
import { FaEye, FaLaptop, FaTabletAlt, FaMobileAlt } from "react-icons/fa";
import { FaBars, FaRightFromBracket, FaUser, FaXmark } from "react-icons/fa6";
 
const START_BUILDING_HREF = "/signup";
 
function scrollToSection(sectionId: string) {
  const target = document.getElementById(sectionId);
  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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
 
// Updated navigation links to include Menu, About Us, and Contact
const navLinks = [
  { label: "Home", hash: "#restaurant-home" },
  { label: "Menu", hash: "#restaurant-menu" },
  { label: "About Us", hash: "#restaurant-about" },
  { label: "Features", hash: "#restaurant-features" },
  { label: "FAQ", hash: "#restaurant-faq" },
  { label: "Contact", hash: "#restaurant-contact" },
] as const;
 
function RestaurantHeader({ deviceMode }: { deviceMode: "desktop" | "tablet" | "mobile" }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const r = useCallback((classes: string) => getModeClasses(classes, deviceMode), [deviceMode]);
 
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
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (mobileOpen && headerRef.current && !headerRef.current.contains(target)) {
        setMobileOpen(false);
      }
    };
 
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [profileOpen, mobileOpen]);
 
  const showDesktopNav = deviceMode === "desktop";
 
  return (
    <header ref={headerRef} className={r("bg-[#0A1E3D] text-white w-full max-w-full relative z-50")}>
      <div className={r(`w-full mx-auto py-4 flex items-center justify-between px-4 sm:px-6 lg:px-8 ${deviceMode === "desktop" ? "max-w-7xl" : ""
        }`)}>
        <button
          type="button"
          className="text-xl font-black text-white no-underline shrink-0 bg-none border-none cursor-pointer p-0 hover:opacity-90 focus-visible:outline-none"
          onClick={() => scrollToSection("restaurant-home")}
        >
          Stackly Restaurant.
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
 
        <div className="flex items-center gap-3 shrink-0">
          <div ref={profileRef} className={r("relative hidden sm:block")}>
            <button
              type="button"
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/80 text-white bg-transparent transition-all hover:bg-white/20 hover:scale-105"
              onClick={() => { setProfileOpen((open) => !open); setMobileOpen(false); }}
            >
              <FaUser size={14} aria-hidden />
            </button>
            {profileOpen && (
              <div className="absolute top-12 right-0 w-40 py-2 bg-white rounded-lg shadow-xl border border-gray-100 z-60">
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
 
          <button
            type="button"
            className={r(`${deviceMode === "desktop" ? "md:hidden" : "flex"} inline-flex items-center justify-center w-10 h-10 rounded-md border text-white transition-colors ${mobileOpen ? "bg-white/20 border-white" : "border-white/60 hover:bg-white/20"
              }`)}
            onClick={() => { setMobileOpen((open) => !open); setProfileOpen(false); }}
          >
            {mobileOpen ? <FaXmark size={18} /> : <FaBars size={18} />}
          </button>
        </div>
      </div>
 
      {/* MOBILE NAV WITH PT-6 GAP AND HIGHLIGHTS */}
      {mobileOpen && (
        <nav className={r("absolute top-full left-0 w-full bg-[#0A1E3D] border-t border-white/10 shadow-2xl flex flex-col pt-6 pb-6 px-6 gap-4 z-50")}>
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              className="py-3 px-4 text-white text-base font-bold text-left w-full transition-all duration-300 hover:bg-white/20 hover:pl-6 rounded-md border border-transparent hover:border-white/20"
              onClick={() => { scrollToSection(link.hash.replace("#", "")); setMobileOpen(false); }}
            >
              {link.label}
            </button>
          ))}
          <div className="mt-4 pt-4 border-t border-white/10">
            <button
              type="button"
              className="flex items-center gap-3 py-3 px-4 w-full text-left text-red-400 text-base font-bold hover:bg-white/10 transition-colors rounded-md"
              onClick={handleLogout}
            >
              <FaRightFromBracket size={16} /> Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}
 
// Renamed from templates to foods, keeping exact images requested
const foodItems = [
  { title: "Premium Ribeye Steak", price: "$45", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop" },
  { title: "Artisan Cafe Pastries", price: "$12", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800&auto=format&fit=crop" },
  { title: "Authentic Wood-Fired Pizza", price: "$18", image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop" },
  { title: "Avocado Brunch Toast", price: "$14", image: "https://images.unsplash.com/photo-1493770348161-369560ae357d?q=80&w=800&auto=format&fit=crop" },
  { title: "Gourmet Street Tacos", price: "$16", image: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?q=80&w=800&auto=format&fit=crop" },
  { title: "Classic Cheeseburger", price: "$15", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop" },
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
 
export default function RestaurantTemplatesPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
 
  const r = useCallback((classes: string) => getModeClasses(classes, deviceMode), [deviceMode]);
 
  return (
    <main className="flex flex-col min-h-screen bg-[#F3F4F6] overflow-x-hidden font-sans text-gray-900 pt-6">
 
      {/* FLOATING DEVICE TOOLBAR */}
      <div className="fixed z-[100] transition-all duration-500 ease-in-out shrink-0 bottom-6 left-1/2 -translate-x-1/2 hidden md:block">
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
 
      <div className={`flex-1 flex justify-center w-full transition-all duration-500 ${deviceMode !== "desktop" ? "py-4 md:py-8 px-2 md:px-4" : ""}`}>
        {/* RESPONSIVE CANVAS FRAME */}
        <div
          ref={canvasScrollRef}
          className={`bg-white relative flex flex-col overflow-x-hidden overflow-y-auto transition-all duration-500 ease-in-out ${deviceMode === "mobile" ? "w-full max-w-[375px] h-[85vh] rounded-[2.5rem] border-[8px] border-gray-800 shadow-2xl"
              : deviceMode === "tablet" ? "w-full max-w-[768px] h-[90vh] rounded-[2rem] border-[8px] border-gray-800 shadow-2xl"
                : "w-full min-h-screen"
            }`}
        >
          <div className="w-full max-w-full overflow-x-hidden min-w-0">
            <RestaurantHeader deviceMode={deviceMode} />
 
            {/* 1. HERO SECTION */}
            <div id="restaurant-home" className={`w-full bg-[#FFF5F5] text-center min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className="max-w-3xl mx-auto break-words">
                <h1 className={`font-black text-balance leading-[1.15] text-[#0A1E3D] mb-6 ${deviceMode === "desktop" ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl" : "text-3xl"
                  }`}>
                  Create a Mouth-Watering Restaurant Website
                </h1>
                <p className="text-base text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Attract hungry customers with a stunning, mobile-friendly website. Showcase your menu, take online reservations, and grow your restaurant business without writing a single line of code.
                </p>
                <Link href={START_BUILDING_HREF} className="inline-flex items-center justify-center min-h-[3.5rem] px-8 rounded-full bg-[#0A1E3D] text-white text-base font-bold shadow-xl transition-all hover:bg-red-800 hover:-translate-y-1">
                  Start Building Free
                </Link>
              </div>
            </div>
 
            {/* 2. MENU GRID (Changed from Templates to Foods) */}
            <section id="restaurant-menu" className={`bg-white min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10 break-words">
                  <h2 className={`font-black text-[#0A1E3D] mb-4 text-balance ${deviceMode === "desktop" ? "text-3xl md:text-4xl" : "text-2xl"
                    }`}>Our Signature Menu</h2>
                  <p className="text-base text-gray-600 max-w-2xl mx-auto">Explore our carefully curated selection of fresh, delicious dishes made from scratch.</p>
                </div>
 
                <div className={`grid ${deviceMode === "desktop" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" :
                    deviceMode === "tablet" ? "grid-cols-1 sm:grid-cols-2 gap-6" :
                      "grid-cols-1 gap-6"
                  }`}>
                  {foodItems.map((item) => (
                    <article key={item.title} className="group flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-red-100 min-w-0">
                      <div className="overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] mb-5">
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start mb-5 gap-3">
                          <h3 className="text-lg font-bold text-[#0A1E3D] truncate leading-tight">{item.title}</h3>
                          <span className="font-black text-[#b91c1c] shrink-0">{item.price}</span>
                        </div>
                        <div className="mt-auto">
                          <button type="button" className="w-full rounded-xl bg-[#b91c1c] flex items-center justify-center py-3 text-sm font-bold text-white hover:bg-red-800 transition-colors">
                            Order Now
                          </button>
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
              <div className={`max-w-7xl mx-auto grid items-center ${deviceMode === "desktop" ? "grid-cols-1 lg:grid-cols-2 gap-16" : "grid-cols-1 gap-10"
                }`}>
                <div className="rounded-[2rem] overflow-hidden shadow-xl">
                  <img
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop"
                    alt="Restaurant Interior"
                    className="w-full h-auto aspect-[4/3] object-cover"
                  />
                </div>
                <div className="break-words">
                  <h2 className="text-[#b91c1c] font-black uppercase tracking-[0.2em] text-sm mb-3">Our Story</h2>
                  <h3 className={`font-black text-[#0A1E3D] text-balance leading-tight mb-6 ${deviceMode === "desktop" ? "text-3xl md:text-4xl" : "text-2xl"
                    }`}>Tradition meets modern flavor.</h3>
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
 
            {/* 4. BUILD YOUR WAY (FEATURES) */}
            <section id="restaurant-features" className={`bg-[#FFF5F5] min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className={`max-w-7xl mx-auto grid items-center ${deviceMode === "desktop" ? "grid-cols-1 lg:grid-cols-2 gap-16" : "grid-cols-1 gap-10"
                }`}>
                <div className="break-words order-2 lg:order-1">
                  <h2 className={`font-black text-[#0A1E3D] text-balance leading-tight mb-8 ${deviceMode === "desktop" ? "text-3xl md:text-4xl" : "text-2xl"
                    }`}>Build your restaurant site your way.</h2>
                  <div className="space-y-8">
                    {buildFeatures.map((item) => (
                      <div key={item.title}>
                        <h3 className="text-lg font-bold text-[#0A1E3D] mb-2">{item.title}</h3>
                        <p className="text-base text-gray-600 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                  <Link href={START_BUILDING_HREF} className="inline-flex items-center justify-center min-h-[3.5rem] mt-10 px-8 rounded-full bg-[#0A1E3D] text-white text-base font-bold transition-all hover:bg-[#112a52] hover:-translate-y-1 hover:shadow-lg">
                    Create Your Site
                  </Link>
                </div>
                <div className="rounded-[2rem] overflow-hidden shadow-2xl order-1 lg:order-2 w-full">
                  <img
                    src="https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?q=80&w=800&auto=format&fit=crop"
                    alt="Chef plating food"
                    className="w-full h-auto aspect-[4/3] object-cover"
                  />
                </div>
              </div>
            </section>
 
            {/* 5. INFRASTRUCTURE */}
            <section className={`bg-[#0A1E3D] text-white min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className="max-w-7xl mx-auto">
                <div className={`bg-white/5 rounded-3xl border border-white/10 ${deviceMode === "desktop" ? "p-10 lg:p-16" : "p-6"
                  }`}>
                  <h2 className={`font-black mb-10 max-w-2xl text-balance leading-tight ${deviceMode === "desktop" ? "text-3xl md:text-4xl" : "text-2xl"
                    }`}>The powerful infrastructure behind your restaurant.</h2>
                  <div className={`grid ${deviceMode === "desktop" ? "grid-cols-1 md:grid-cols-3 gap-12" :
                      deviceMode === "tablet" ? "grid-cols-1 sm:grid-cols-2 gap-8" :
                        "grid-cols-1 gap-8"
                    }`}>
                    {infraItems.map((item) => (
                      <div key={item.title} className="border-t border-white/20 pt-6">
                        <h3 className="text-lg font-bold mb-3">{item.title}</h3>
                        <p className="text-gray-300 leading-relaxed text-sm">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
 
            {/* 6. FAQ */}
            <section id="restaurant-faq" className={`bg-white min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12 break-words">
                  <h2 className={`font-black text-[#0A1E3D] mb-4 text-balance ${deviceMode === "desktop" ? "text-3xl md:text-4xl" : "text-2xl"
                    }`}>Frequently Asked Questions</h2>
                  <p className="text-base text-gray-600">Everything you need to know about building your restaurant website.</p>
                </div>
 
                <div className="space-y-4">
                  {faqItems.map((item, index) => {
                    const isOpen = openFaq === index;
                    return (
                      <div key={index} className="border border-gray-200 rounded-xl overflow-hidden transition-colors hover:border-gray-300">
                        <button
                          type="button"
                          className="w-full flex items-center justify-between p-5 bg-gray-50/50 text-left"
                          onClick={() => setOpenFaq(isOpen ? -1 : index)}
                        >
                          <span className="font-bold text-[#0A1E3D] pr-4 text-base">{item.q}</span>
                          <span className="text-2xl text-gray-400 shrink-0 font-light" aria-hidden>{isOpen ? "−" : "+"}</span>
                        </button>
                        {isOpen && (
                          <div className="p-5 pt-2 text-base text-gray-600 leading-relaxed border-t border-gray-100 bg-white">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
 
            {/* 7. CONTACT SECTION */}
            <section id="restaurant-contact" className={`bg-gray-50 min-w-0 ${deviceMode === "desktop" ? "py-16 sm:py-24 px-4 sm:px-6 lg:px-8" : "py-12 px-4"
              }`}>
              <div className="max-w-5xl mx-auto text-center break-words">
                <h2 className="text-[#b91c1c] font-black uppercase tracking-[0.2em] text-sm mb-3">Get in Touch</h2>
                <h3 className={`font-black text-[#0A1E3D] text-balance leading-tight mb-10 ${deviceMode === "desktop" ? "text-3xl md:text-4xl" : "text-2xl"
                  }`}>Visit Us or Reach Out</h3>
 
                <div className={`grid ${deviceMode === "desktop" ? "grid-cols-3 gap-8" : "grid-cols-1 gap-6"
                  }`}>
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-[#0A1E3D] mb-3 text-lg">Location</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">123 Culinary Avenue<br />Food District, FD 10020</p>
                  </div>
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-[#0A1E3D] mb-3 text-lg">Hours</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">Mon - Fri: 11AM - 10PM<br />Sat - Sun: 10AM - 11PM</p>
                  </div>
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-bold text-[#0A1E3D] mb-3 text-lg">Contact</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">info@stacklyfood.com<br />+1 (555) 123-4567</p>
                  </div>
                </div>
              </div>
            </section>
 
            {/* DEDICATED RESTAURANT FOOTER (200% Zoom Responsive) */}
            <footer className={r("bg-[#051124] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-white/10 min-w-0 break-words mt-12 sm:mt-16 md:mt-20")}>
              <div className={r("max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12")}>
                <div className="flex flex-col">
                  <h3 className="text-xl font-black mb-4">Stackly Restaurant.</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">Experience the best culinary delights with our signature dishes and exceptional service in a modern, welcoming atmosphere.</p>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                  <div className="flex flex-col gap-3">
                    {navLinks.map((link) => (
                      <button
                        key={link.label}
                        onClick={() => scrollToSection(link.hash.replace("#", ""))}
                        className="text-left text-sm text-gray-400 hover:text-white transition-colors w-fit focus-visible:outline-none"
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-lg font-bold mb-4">Opening Hours</h4>
                  <p className="text-sm text-gray-400 mb-2">Mon - Fri: 11:00 AM - 10:00 PM</p>
                  <p className="text-sm text-gray-400 mb-2">Sat - Sun: 10:00 AM - 11:00 PM</p>
                  <p className="text-sm text-gray-400">Holidays: Closed</p>
                </div>
                <div className="flex flex-col">
                  <h4 className="text-lg font-bold mb-4">Contact Us</h4>
                  <p className="text-sm text-gray-400 mb-2">123 Culinary Avenue, Food District</p>
                  <p className="text-sm text-gray-400 mb-2 hover:text-white cursor-pointer transition-colors w-fit">info@stacklyfood.com</p>
                  <p className="text-sm text-gray-400 hover:text-white cursor-pointer transition-colors w-fit">+1 (555) 123-4567</p>
                </div>
              </div>
            </footer>
 
            {/* Wrapped Global Footer to prevent overflow */}
            <div className={r("w-full max-w-full shrink-0 overflow-hidden bg-[#071936] relative z-20 mt-12 sm:mt-16 md:mt-20")}>
              <Footer />
            </div>
 
          </div>
        </div>
      </div>
    </main>
  );
}
 