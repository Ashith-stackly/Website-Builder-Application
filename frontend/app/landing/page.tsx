"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import CreateProjectFlow from "@/components/CreateProjectFlow";
import { useEffect, useMemo, useState, useRef } from "react";
import { motion, type TargetAndTransition, AnimatePresence, animate, useInView } from "framer-motion";

function StatCounter({ endValue, suffix = "" }: { endValue: number, suffix?: string }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true });

  useEffect(() => {
    if (isInView && nodeRef.current) {
      const controls = animate(0, endValue, {
        duration: 2,
        onUpdate(value) {
          if (nodeRef.current) {
            nodeRef.current.textContent = Math.round(value).toString() + suffix;
          }
        }
      });
      return () => controls.stop();
    }
  }, [isInView, endValue, suffix]);

  return <span ref={nodeRef}>0{suffix}</span>;
}
import {
  FaArrowRight,
  FaCartShopping,
  FaCheck,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaHeart,
  FaInstagram,
  FaLinkedinIn,
  FaLocationDot,
  FaMagnifyingGlass,
  FaMinus,
  FaPaperPlane,
  FaPhoneVolume,
  FaPlus,
  FaStar,
  FaStarHalfStroke,
  FaRegStar,
  FaWandMagicSparkles,
  FaWhatsapp,
  FaXmark,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { fadeUp, scaleIn, staggerContainer } from "@/lib/motion";
import { hasDemoSubscription } from "@/lib/demoAuth";
import { assetPath } from "@/lib/paths";
import {
  loadRazorpayCheckoutScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  openRazorpayCheckout,
} from "@/lib/razorpayClient";
import MockCheckoutModal from "@/components/MockCheckoutModal";
type TemplateCategory = "portfolio" | "blog" | "ecommerce" | "business";

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
  loading: () => <div className="h-64 bg-[#0A1E3D]" />,
});

const popularSearches = [
  "Restaurant",
  "Blog",
  "Hotel",
  "News",
  "Travel",
  "Education",
  "Portfolio",
  "Newspaper",
  "E-Commerce",
  "Real Estate",
  "Photography",
  "Dashboard",
  "Landing Page",
  "Construction",
];

const categories = [
  { title: "Portfolio", image: "/landing-optimized/port.webp", alt: "Portfolio website preview", previewHref: "/portfolio", editHref: "/blockpages?template=portfolio" },
  { title: "E-Commerce Templates", image: "/landing-optimized/ecommerce.webp", alt: "E-commerce website preview", previewHref: "/e-commerce", editHref: "/blockpages?template=ecommerce" },
  { title: "Digital Marketing Templates", image: "/landing-optimized/digital01.webp", alt: "Digital marketing website preview", previewHref: "/digital-marketing", editHref: "/blockpages?template=digital-marketing" },

  {
    title: "Blogging",
    image: "/landing-optimized/bloggg.webp",
    alt: "Blogging website preview",
    previewHref: "/blog",
    editHref: "/blockpages?template=blog",
  },
  {
    title: "Construction Themes",
    image: "/landing-optimized/construction02.webp",
    alt: "Construction website preview",
    previewHref: "/construction",
    editHref: "/blockpages?template=construction"
  },
  {
    title: "Restaurant",
    image: "/landing-optimized/foodd03.webp",
    alt: "Restaurant website preview",
    previewHref: "/restaurant",
    editHref: "/blockpages?template=restaurant"
  },
];

const topProducts = [
  { title: "ShopNest", type: "E-commerce Website", price: 290, sales: "10.5K", image: "/landing-optimized/shopnest.webp", alt: "ShopNest template preview", rating: 5.0 },
  { title: "BuySphere", type: "Template Website", price: 100, sales: "3.4K", image: "/landing-optimized/buysphere.webp", alt: "BuySphere template preview", rating: 4.5 },
  { title: "TurboCart", type: "Template Website", price: 350, sales: "2.9K", image: "/landing-optimized/turbocart.webp", alt: "TurboCart template preview", rating: 4.8 },
  { title: "MegaBasket", type: "Template Website", price: 290, sales: "4.2K", image: "/landing-optimized/megabasket.webp", alt: "MegaBasket template preview", rating: 4.7 },
  { title: "NexaStore", type: "Template Website", price: 100, sales: "4.7K", image: "/landing-optimized/nexastore1.webp", alt: "NexaStore template preview", rating: 4.3 },
  { title: "SampleStore", type: "Template Website", price: 350, sales: "5.0K", image: "/landing-optimized/samplestore.webp", alt: "SampleStore template preview", rating: 5.0 },
];

const bannerSlides = [
  {
    id: "portfolio",
    title: "Portfolio",
    description: "A modern and visually engaging portfolio design crafted to showcase creativity, skills and projects with clarity. Designed with clean layouts, smooth user experience and strong visual storytelling to create a lasting impression.",
    image: "/landing-optimized/port.webp",
    bg: "linear-gradient(135deg, #4A2F8B 0%, #201048 100%)", // Purple gradient
  },
  {
    id: "blog",
    title: "Blog",
    description: "A modern and visually engaging blog design crafted to showcase creativity, skills and projects with clarity. Designed with clean layouts, smooth user experience and strong visual storytelling to create a lasting impression.",
    image: "/landing-optimized/bloggg.webp",
    bg: "linear-gradient(135deg, #3a3a3a 0%, #151515 100%)", // Dark Grey gradient
  },
  {
    id: "ecommerce",
    title: "E-Commerce",
    description: "A modern and visually engaging e-commerce design crafted to showcase creativity, skills and projects with clarity. Designed with clean layouts, smooth user experience and strong visual storytelling to create a lasting impression.",
    image: "/landing-optimized/ecommerce.webp",
    bg: "linear-gradient(135deg, #59331C 0%, #261208 100%)", // Brown gradient
  },
  {
    id: "business",
    title: "Business",
    description: "A modern and visually engaging business design crafted to showcase creativity, skills and projects with clarity. Designed with clean layouts, smooth user experience and strong visual storytelling to create a lasting impression.",
    image: "/landing-optimized/business09.webp",
    bg: "linear-gradient(135deg, #372173 0%, #150B33 100%)", // Deep Indigo gradient
  },
];

type WishlistItem = {
  title: string;
  type: string;
  price: number;
  image: string;
  alt: string;
  rating?: number;
};

type CartItem = WishlistItem & {
  quantity: number;
};

const STORAGE_SYNC_EVENT = "stackly-storage-change";

const templates = [
  { title: "Classic Portfolio", category: "portfolio", image: "/landing-optimized/port.webp", alt: "Classic Portfolio template", description: "Perfect for individual creators.", badge: "Free" },
  { title: "Digital Marketing", category: "portfolio", image: "/portfolio03.webp", alt: "Agency Pro template", description: "A polished showcase for design teams.", price: 190, badge: "Premium" },
  { title: "Restaurant", category: "portfolio", image: "/portfolio04.webp", alt: "Minimal Studio template", description: "Clean white-space focused layout.", badge: "Free" },
  { title: "Blogging Page", category: "blog", image: "/landing-optimized/blog1.webp", alt: "Personal Blog template", description: "Clean layout for storytellers.", badge: "Free" },
  { title: "Tech Insights", category: "blog", image: "/landing-optimized/blog2.webp", alt: "Tech Insights template", description: "Professional layout for tech news.", price: 150, badge: "Premium" },
  { title: "Store", category: "ecommerce", image: "/landing-optimized/store11.webp", alt: "Store template", description: "A product-first storefront layout.", price: 290, badge: "Premium" },
  { title: "Fashion", category: "ecommerce", image: "/landing-optimized/fashion06.webp", alt: "Fashion store template", description: "Editorial product grid for apparel.", price: 190, badge: "Premium" },
  { title: "Jewelry", category: "ecommerce", image: "/landing-optimized/jewellery07.webp", alt: "Jewelry store template", description: "Elegant catalog for premium items.", price: 250, badge: "Premium" },
  { title: "Business", category: "business", image: "/landing-optimized/business09.webp", alt: "Business template", description: "Executive layout for company sites.", price: 290, badge: "Premium" },
  { title: "Construction", category: "business", image: "/landing-optimized/constrctio10.webp", alt: "Construction template", description: "Strong service-site starter.", price: 250, badge: "Premium" },
] satisfies Array<{
  title: string;
  category: TemplateCategory;
  image: string;
  alt: string;
  description: string;
  price?: number;
  badge: "Free" | "Premium";
}>;

const features = [
  {
    title: "Sections",
    description: "Design your website content using ready-made layout options with more than 100 professionally crafted designs.",
    image: "/landing-optimized/sections.webp",
    quote: "Present your work in a visually impressive and engaging way.",
  },
  {
    title: "Shapers",
    description: "Enhance your website with abstract-style layouts and unique shape-based designs.",
    image: "/shapers.webp",
    quote: "Shape-based layouts make your site feel creative, polished, and professional.",
  },
  {
    title: "Widgets",
    description: "Deliver a more interactive browsing experience using fixed and scroll-based visual features.",
    image: "/landing-optimized/dynamic.webp",
    quote: "Interactive backgrounds create a stylish and captivating browsing experience.",
  },
];

const faqs = [
  {
    question: "What is a drag & drop website builder?",
    answer: "It is a user-friendly tool that lets you design and customize your website by dragging elements onto a page, so you do not need coding skills.",
  },
  {
    question: "What is the best drag & drop website builder?",
    answer: "The best builder combines simplicity with templates, design flexibility, and growth tools. Stackly is built around that balance.",
  },
  {
    question: "How much does Stackly cost?",
    answer: "Stackly offers flexible pricing, including a free starting point and paid plans for larger business needs.",
  },
  {
    question: "What kind of websites can I build?",
    answer: "You can build business sites, portfolios, blogs, landing pages, eCommerce stores, and more without writing code.",
  },
  {
    question: "What are the uses of a drag & drop builder?",
    answer: "The main uses are ease of use, faster development, flexible editing, and built-in tools that help you launch quickly.",
  },
  {
    question: "How long does it take to build a website?",
    answer: "A basic website can be created in a few hours. Larger sites may take a few days depending on content and features.",
  },
];

const templateFilters = [
  { label: "All Templates", value: "all" },
  { label: "Portfolio", value: "portfolio" },
  { label: "Blog", value: "blog" },
  { label: "E-commerce", value: "ecommerce" },
  { label: "Business", value: "business" },
] as const;

const steps = [
  ["Sign up for our free drag & drop website builder.", "Pick your site type and start shaping your online presence."],
  ["Customize a template or have a website tailored for you.", "Select the best starting point for your online journey."],
  ["Drag & drop thousands of design features.", "Add text, galleries, videos, vector art, and more."],
];

const softHover: TargetAndTransition = {
  y: -5,
  scale: 1.015,
  boxShadow: "0 24px 60px rgba(6, 34, 76, 0.16)",
  borderColor: "rgba(59, 130, 246, 0.42)",
  transition: { duration: 0.22, ease: "easeOut" },
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-8 border-l-4 border-blue-600 pl-3 text-xs font-black uppercase tracking-[0.3em] text-[#0A2357] md:mb-10">
      {children}
    </h2>
  );
}

function LandingContactSection() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  });
  const [emailError, setEmailError] = useState("");

  const socialLinks = [
    { icon: FaFacebookF, color: "text-[#1877F2]", label: "Facebook", url: "https://www.facebook.com/thestackly/" },
    { icon: FaYoutube, color: "text-[#FF0000]", label: "YouTube", url: "https://www.youtube.com/@TheStackly" },
    { icon: FaInstagram, color: "text-[#E4405F]", label: "Instagram", url: "https://www.instagram.com/the_stackly" },
    { icon: FaLinkedinIn, color: "text-[#0A66C2]", label: "LinkedIn", url: "https://in.linkedin.com/company/the-stackly" },
    { icon: FaXTwitter, color: "text-black", label: "X", url: "https://x.com/The_Stackly" },
    { icon: FaGlobe, color: "text-[#06224C]", label: "Website", url: "https://www.thestackly.com/" },
  ];

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const nextValue = name === "firstName" || name === "lastName" ? value.replace(/[^A-Za-z]/g, "") : value;

    setFormData((current) => ({ ...current, [name]: nextValue }));

    if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|live\.com|icloud\.com|me\.com|mac\.com|aol\.com|proton\.me|protonmail\.com|zoho\.com|yandex\.com|mail\.com|gmx\.com|rediffmail\.com)$/i;
      setEmailError(value && !emailRegex.test(value.trim()) ? "Please enter a valid email address (e.g., ranade@gmail.com)" : "");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|live\.com|icloud\.com|me\.com|mac\.com|aol\.com|proton\.me|protonmail\.com|zoho\.com|yandex\.com|mail\.com|gmx\.com|rediffmail\.com)$/i;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      setEmailError("Please enter a valid email address (e.g., ranade@gmail.com)");
      return;
    }

    if (!emailError && formData.email) {
      alert("Message Sent Successfully!");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        message: "",
      });
      setEmailError("");
    }
  };

  return (
    <motion.section id="contact" className="mx-auto mt-6 mb-12 max-w-7xl px-4 md:mt-8 md:mb-24 md:px-8" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.16 }}>
      <SectionHeading>Contact</SectionHeading>
      <motion.div className="flex flex-col items-stretch gap-6 rounded-[2rem] bg-[#E6EFF1] p-4 sm:p-8 lg:flex-row lg:items-start lg:gap-16 lg:rounded-[3rem] lg:p-14" variants={staggerContainer}>
        <motion.div className="flex w-full flex-col justify-center gap-6 sm:gap-8 lg:w-5/12" variants={fadeUp}>
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-black text-[#06224C]">
              <FaPhoneVolume className="text-xl" aria-hidden="true" />
              <span className="text-xs uppercase tracking-[0.2em]">Contact</span>
            </div>
            <h2 className="text-3xl font-black leading-tight text-[#06224C] sm:text-4xl md:text-5xl">
              Let&apos;s Get In Touch
            </h2>
            <p className="text-base font-medium text-gray-600 sm:text-lg">
              Or simply reach out directly to
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: FaEnvelope, label: "Email", value: "thestackly@gmail.com", color: "text-[#EA4335]" },
              { icon: FaLocationDot, label: "Location", value: "MMR Complex, Chinna Thirupathi, Salem, Tamil Nadu 636008.", color: "text-[#EA4335]" },
              { icon: FaWhatsapp, label: "Whatsapp", value: "+91 7010792745", color: "text-[#25D366]" },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                    <Icon className={`${item.color} text-2xl`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{item.label}</p>
                    <p className="text-sm font-bold leading-relaxed text-[#06224C] break-all sm:break-normal">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4">
            <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-blue-600">Social Media hereby :</p>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-100 bg-white shadow-md transition hover:scale-110">
                    <Icon className={`${social.color} text-lg`} aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>
        </motion.div>

        <motion.div className="w-full rounded-[2rem] border border-white bg-white p-4 sm:p-10 lg:w-7/12" variants={fadeUp} whileHover={{ y: -4, boxShadow: "0 28px 70px rgba(6,34,76,0.16)", transition: { duration: 0.22 } }}>
          <h3 className="mb-1 text-2xl font-black text-[#06224C] sm:text-3xl">Send a Message</h3>
          <p className="mb-8 text-xs font-bold uppercase tracking-wide text-gray-400 sm:text-sm">
            we will get back to you within 48 hours
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-[#06224C]">First Name <span className="text-red-500">*</span></span>
                <input name="firstName" type="text" maxLength={50} value={formData.firstName} onChange={handleInputChange} placeholder="First Name" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white" />
              </label>
              <label className="space-y-2">
                <span className="block text-[10px] font-black uppercase tracking-widest text-[#06224C]">Last Name <span className="text-red-500">*</span></span>
                <input name="lastName" type="text" maxLength={50} value={formData.lastName} onChange={handleInputChange} placeholder="Last Name" required className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white" />
              </label>
            </div>
 
            <label className="block space-y-2">
              <span className="block text-[10px] font-black uppercase tracking-widest text-[#06224C]">Email Address <span className="text-red-500">*</span></span>
              <input name="email" type="email" maxLength={254} value={formData.email} onChange={handleInputChange} placeholder="test@gmail.com" required className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white ${emailError ? "border-red-500" : "border-gray-200"}`} />
              {emailError && <span className="block text-[10px] font-bold text-red-500">{emailError}</span>}
            </label>



            <label className="block space-y-2">
              <span className="block text-[10px] font-black uppercase tracking-widest text-[#06224C]">Message <span className="text-red-500">*</span></span>
              <textarea name="message" rows={4} value={formData.message} onChange={handleInputChange} placeholder="Tell me about your project..." required className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 text-sm outline-none transition focus:border-blue-400 focus:bg-white" />
            </label>

            <button type="submit" className="cursor-pointer flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#06224C] px-4 py-4 text-xs font-black uppercase tracking-wider sm:tracking-[0.2em] text-white shadow-lg transition hover:scale-[1.02] hover:bg-blue-900 hover:brightness-110 active:scale-[0.98]">
              <span>Send Message</span>
              <FaPaperPlane className="text-[10px] shrink-0" aria-hidden="true" />
            </button>
          </form>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

export default function Home() {
  const router = useRouter(); // Added router for navigation intercepts
  const [activeFilter, setActiveFilter] = useState<(typeof templateFilters)[number]["value"]>("all");
  const [isFilterMounted, setIsFilterMounted] = useState(false);

  useEffect(() => {
    const savedFilter = sessionStorage.getItem("landing-active-filter");
    if (savedFilter) {
      setActiveFilter(savedFilter as any);
    }
    setIsFilterMounted(true);
  }, []);

  useEffect(() => {
    if (isFilterMounted) {
      sessionStorage.setItem("landing-active-filter", activeFilter);
    }
  }, [activeFilter, isFilterMounted]);
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(-1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [hasLoadedWishlist, setHasLoadedWishlist] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonTemplate, setComingSoonTemplate] = useState("");
  const [checkoutProduct, setCheckoutProduct] = useState<WishlistItem | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const handleBuyNow = (product: WishlistItem) => {
    setCheckoutProduct(product);
  };

  const executePayment = async (product: WishlistItem) => {
    setCheckoutProduct(null);
    setPaymentLoading(true);
    try {
      await loadRazorpayCheckoutScript();

      const totalPaise = Math.round(product.price * 100);
      const planName = product.title;

      const order = await createRazorpayOrder({
        amountPaise: totalPaise,
        planName,
        billingPeriod: "One-Time",
      });

      openRazorpayCheckout({
        order,
        planLabel: `Purchase of ${planName} Template`,
        customerName: "Demo Customer",
        customerEmail: "customer@example.com",
        customerPhone: "9876543210",
        onDismiss: () => setPaymentLoading(false),
        onSuccess: async (response) => {
          setPaymentLoading(true);
          try {
            const verified = await verifyRazorpayPayment(response);
            if (!verified) throw new Error("Payment verification failed");

            alert(`Payment Successful for ${product.title}!`);
          } catch (err) {
            alert(err instanceof Error ? err.message : "Payment verification failed");
          } finally {
            setPaymentLoading(false);
          }
        },
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not initialize payment");
      setPaymentLoading(false);
    }
  };

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselSpread, setCarouselSpread] = useState(160);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const updateSpread = () => setCarouselSpread(mql.matches ? 240 : 160);
    updateSpread();
    mql.addEventListener("change", updateSpread);
    return () => mql.removeEventListener("change", updateSpread);
  }, []);

  // Scroll Restoration on Refresh (Hard Reload)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prevent native browser scroll restoration to avoid race conditions/clashing
    if (window.history && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const navigationEntry = window.performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const isReload = navigationEntry?.type === "reload";

    if (isReload) {
      const savedScrollPos = sessionStorage.getItem("landing-page-scroll-position");
      if (savedScrollPos) {
        const scrollPos = parseInt(savedScrollPos, 10);
        // Wait two animation frames to ensure hydration and layout are stable
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo(0, scrollPos);
          });
        });
      }
    }

    const saveScrollPosition = () => {
      sessionStorage.setItem("landing-page-scroll-position", window.scrollY.toString());
    };

    window.addEventListener("beforeunload", saveScrollPosition);
    return () => {
      window.removeEventListener("beforeunload", saveScrollPosition);
    };
  }, []);

  const [cartTitles, setCartTitles] = useState<string[]>([]);

  useEffect(() => {
    const syncCartFromStorage = () => {
      const rawCart = window.localStorage.getItem("cartItems") || "[]";
      try {
        const parsedCart = JSON.parse(rawCart) as CartItem[];
        setCartTitles((current) => {
          const nextTitles = parsedCart.map((item) => item.title);
          return JSON.stringify(current) === JSON.stringify(nextTitles) ? current : nextTitles;
        });
      } catch {
        setCartTitles([]);
      }
    };

    syncCartFromStorage();

    window.addEventListener("storage", syncCartFromStorage);
    window.addEventListener(STORAGE_SYNC_EVENT, syncCartFromStorage);

    return () => {
      window.removeEventListener("storage", syncCartFromStorage);
      window.removeEventListener(STORAGE_SYNC_EVENT, syncCartFromStorage);
    };
  }, []);

  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => {
      setHasActiveSubscription(hasDemoSubscription());
    });
  }, []);

  const checkSubscriptionAndRoute = (event: React.MouseEvent, targetUrl: string) => {
    event.preventDefault();
    // Demo login stores subscription in sessionStorage (current tab only).
    // BACKEND TEAM: replace hasDemoSubscription() with real API/context state.
    if (hasDemoSubscription()) {
      router.push(targetUrl);
    } else {
      router.push("/planning");
    }
  };

  const normalizedSearch = submittedSearch.trim().toLowerCase();
  const visibleTemplates = useMemo(
    () => templates.filter((template) => {
      const matchesFilter = activeFilter === "all" || template.category === activeFilter;
      const matchesSearch = !normalizedSearch || [
        template.title,
        template.category,
        template.description,
        template.badge,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesFilter && matchesSearch;
    }),
    [activeFilter, normalizedSearch],
  );
  const visibleCategories = useMemo(
    () => categories.filter((category) => !normalizedSearch || [
      category.title,
      category.alt,
    ].some((value) => value.toLowerCase().includes(normalizedSearch))),
    [normalizedSearch],
  );
  const visibleTopProducts = useMemo(
    () => topProducts.filter((product) => !normalizedSearch || [
      product.title,
      product.type,
      product.alt,
    ].some((value) => value.toLowerCase().includes(normalizedSearch))),
    [normalizedSearch],
  );
  const selectedFeature = features[activeFeature];

  useEffect(() => {
    if (!hasLoadedWishlist) {
      return;
    }

    window.localStorage.setItem("wishlistItems", JSON.stringify(wishlistItems));
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
  }, [hasLoadedWishlist, wishlistItems]);

  useEffect(() => {
    const syncWishlistFromStorage = () => {
      const rawWishlist = window.localStorage.getItem("wishlistItems") || "[]";

      try {
        const parsedWishlist = JSON.parse(rawWishlist) as WishlistItem[];
        setWishlistItems((currentItems) => (
          JSON.stringify(currentItems) === rawWishlist ? currentItems : parsedWishlist
        ));
      } catch {
        window.localStorage.removeItem("wishlistItems");
        setWishlistItems([]);
      }
    };
    const loadStoredWishlist = window.setTimeout(() => {
      syncWishlistFromStorage();
      setHasLoadedWishlist(true);
    }, 0);

    window.addEventListener("storage", syncWishlistFromStorage);
    window.addEventListener(STORAGE_SYNC_EVENT, syncWishlistFromStorage);

    return () => {
      window.clearTimeout(loadStoredWishlist);
      window.removeEventListener("storage", syncWishlistFromStorage);
      window.removeEventListener(STORAGE_SYNC_EVENT, syncWishlistFromStorage);
    };
  }, []);

  useEffect(() => {
    const openSearch = () => {
      setIsSearchOpen(true);
      window.setTimeout(() => document.getElementById("landing-search-input")?.focus(), 0);
    };

    if (window.sessionStorage.getItem("stackly-open-search-on-landing") === "true") {
      window.sessionStorage.removeItem("stackly-open-search-on-landing");
      openSearch();
    }

    window.addEventListener("stackly-open-search", openSearch);

    return () => {
      window.removeEventListener("stackly-open-search", openSearch);
    };
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }

    const closeSearch = (event: globalThis.MouseEvent) => {
      const target = event.target as Element | null;

      if (!target?.closest("[data-landing-search]")) {
        setIsSearchOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("mousedown", closeSearch);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("mousedown", closeSearch);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const processSearchQuery = (query: string) => {
      const cleanQuery = query.toLowerCase().trim();
      if (!cleanQuery) return;

      if (cleanQuery.includes("about") || cleanQuery.includes("who we are")) {
        document.getElementById("about")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (cleanQuery.includes("contact") || cleanQuery.includes("touch") || cleanQuery.includes("message")) {
        document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (cleanQuery.includes("category") || cleanQuery.includes("categories")) {
        document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (cleanQuery.includes("top selling") || cleanQuery.includes("top sell") || cleanQuery.includes("selling") || cleanQuery.includes("product") || cleanQuery.includes("sales")) {
        document.getElementById("top-selling")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (cleanQuery.includes("popular") || cleanQuery.includes("search")) {
        document.getElementById("popular-searches")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (cleanQuery.includes("template") || cleanQuery.includes("templates")) {
        document.getElementById("templates")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (cleanQuery.includes("feature") || cleanQuery.includes("features") || cleanQuery.includes("why choose")) {
        document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setSubmittedSearch(query);
        setActiveFilter("all");
        document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    // Check URL parameters on mount
    const params = new URLSearchParams(window.location.search);
    const searchQueryParam = params.get("search");
    if (searchQueryParam) {
      const newUrl = window.location.pathname;
      window.history.replaceState(null, "", newUrl);
      window.setTimeout(() => processSearchQuery(searchQueryParam), 300);
    }

    // Listen to custom search event from navbar
    const handleNavbarSearch = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      processSearchQuery(customEvent.detail);
    };

    window.addEventListener("stackly-navbar-search", handleNavbarSearch);

    return () => {
      window.removeEventListener("stackly-navbar-search", handleNavbarSearch);
    };
  }, []);

  const showWishlistToast = (message: string) => {
    setWishlistToast(message);
    window.setTimeout(() => setWishlistToast(null), 2200);
  };

  const toggleWishlistItem = (product: WishlistItem) => {
    setWishlistItems((currentItems) => {
      const exists = currentItems.some((item) => item.title === product.title);

      if (exists) {
        showWishlistToast(`${product.title} removed from wishlist.`);
        return currentItems.filter((item) => item.title !== product.title);
      }

      showWishlistToast(`${product.title} added to wishlist!`);
      return [...currentItems, product];
    });
  };

  const addToCart = (product: WishlistItem) => {
    let currentCart: CartItem[] = [];

    try {
      const storedCart = window.localStorage.getItem("cartItems");
      currentCart = storedCart ? JSON.parse(storedCart) as CartItem[] : [];
    } catch {
      currentCart = [];
    }

    const existingItem = currentCart.find((item) => item.title === product.title);
    if (existingItem) {
      return;
    }

    const nextCart = [...currentCart, { ...product, quantity: 1 }];
    const nextCartCount = nextCart.reduce((total, item) => total + (item.quantity || 1), 0);

    window.localStorage.setItem("cartItems", JSON.stringify(nextCart));
    window.localStorage.setItem("cartCount", String(nextCartCount));
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
    showWishlistToast(`${product.title} added to cart!`);
  };

  const submitSearch = (query: string) => {
    const nextQuery = query.trim();

    if (!nextQuery) {
      setSubmittedSearch("");
      setSearchQuery("");
      setIsSearchOpen(false);
      setActiveFilter("all");
      return;
    }

    setSearchQuery("");
    setSubmittedSearch(nextQuery);
    setIsSearchOpen(false);
    setActiveFilter("all");
    window.setTimeout(() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  // Slider Handlers
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === bannerSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? bannerSlides.length - 1 : prev - 1));
  };

  // Auto-play the slider (every 4 seconds)
  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev === bannerSlides.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="landing-page bg-[#fff1f2] text-gray-900">
      <motion.div
        className={`fixed inset-x-0 top-[82px] z-[6000] px-4 transition ${isSearchOpen ? "visible" : "invisible pointer-events-none"}`}
        initial={false}
        animate={isSearchOpen ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        <motion.div
          data-landing-search
          className="mx-auto w-full max-w-3xl rounded-[1.4rem] border border-white/70 bg-white/90 p-2 shadow-[0_24px_70px_rgba(6,34,76,0.20)] ring-1 ring-[#06224C]/10 backdrop-blur-xl md:max-w-4xl"
          initial={false}
          animate={isSearchOpen ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -14, scale: 0.985 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch(searchQuery);
            }}
            className="group flex items-center overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-50/90 shadow-inner transition focus-within:border-blue-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10"
          >
            <FaMagnifyingGlass className="ml-4 hidden flex-shrink-0 text-sm text-slate-400 transition group-focus-within:text-blue-500 sm:block" />
            <input
              id="landing-search-input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="What are you looking for?"
              className="min-w-0 flex-grow bg-transparent py-3.5 pl-3 pr-1 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 sm:py-4 md:text-base"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="mx-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:scale-105 hover:bg-slate-200/80 hover:text-slate-700 active:scale-95"
              aria-label="Close search"
            >
              <FaXmark />
            </button>
            <button type="submit" className="m-1 flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#06224C] text-white shadow-lg transition hover:scale-105 hover:bg-blue-800 hover:brightness-110 active:scale-95 md:w-14" aria-label="Search websites">
              <FaMagnifyingGlass />
            </button>
          </form>
        </motion.div>
      </motion.div>

      <section className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-8">
        {/* 1. MOBILE VIEW: Static Image Only (Hidden on Desktop) */}
        <motion.div
          className="relative min-h-[480px] overflow-hidden rounded-[2rem] bg-[#fde2e4] md:hidden"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.picture variants={fadeUp}>
            <img
              src={assetPath("/landing-optimized/landinmble3.webp")}
              alt="Stackly drag and drop website builder preview"
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </motion.picture>

          <motion.div
            className="relative z-10 flex min-h-[480px] items-end justify-center p-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.45, ease: "easeOut" },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <CreateProjectFlow />
          </motion.div>
        </motion.div>

        {/* 2. DESKTOP VIEW: Carousel Effect (Hidden on Mobile) */}
        <motion.div
          className="relative hidden md:flex min-h-[540px] lg:min-h-[600px] w-full overflow-hidden rounded-[3rem] shadow-2xl"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 z-0"
            animate={{ background: bannerSlides[currentSlide].bg }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          />

          <div className="flex w-full flex-row items-center justify-between p-12 lg:p-20 relative z-10 h-full">
            {/* Left Content */}
            <div className="flex w-1/2 flex-col items-start pr-12 text-white h-full justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  <h1 className="mb-6 text-5xl font-black lg:text-[5.5rem] tracking-tight leading-none">{bannerSlides[currentSlide].title}</h1>
                  <p className="mb-8 text-sm leading-relaxed text-white/80 lg:text-base max-w-md">
                    {bannerSlides[currentSlide].description}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-2 w-full max-w-sm">
                <CreateProjectFlow />
              </div>
            </div>

            {/* Right Image Carousel */}
            <div className="relative flex h-[400px] w-1/2 items-center justify-center">
              {bannerSlides.map((slide, index) => {
                let offset = index - currentSlide;
                if (offset < -1) offset += bannerSlides.length;
                if (offset > 1) offset -= bannerSlides.length;

                const isCenter = offset === 0;

                if (offset < -1 || offset > 1) return null;

                return (
                  <motion.div
                    key={slide.id}
                    className={`absolute w-[260px] h-[260px] lg:w-[340px] lg:h-[340px] rounded-[2rem] overflow-hidden cursor-pointer shadow-2xl ${isCenter ? 'border-2 border-white/20' : 'border border-transparent hover:border-white/20'}`}
                    initial={false}
                    animate={{
                      x: offset * carouselSpread,
                      scale: isCenter ? 1 : 0.8,
                      opacity: isCenter ? 1 : 0.3,
                      zIndex: isCenter ? 30 : 20,
                    }}
                    transition={{ type: "spring", stiffness: 150, damping: 25 }}
                    onClick={() => {
                      if (!isCenter) setCurrentSlide(index);
                    }}
                  >
                    <img
                      src={assetPath(slide.image)}
                      alt={slide.title}
                      className="h-full w-full object-cover pointer-events-none"
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-3">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all duration-300 ${currentSlide === index ? "w-8 bg-white" : "w-2.5 bg-white/30 hover:bg-white/50"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── WHO WE ARE SECTION ─────────────────────────────── */}
      <motion.div
        id="about"
        className="mt-16 md:mt-24 flex flex-col lg:flex-row gap-8 md:gap-12 items-center max-w-7xl mx-auto px-4 md:px-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <motion.div className="w-full lg:w-1/2 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white flex-shrink-0 aspect-video" variants={fadeUp} whileHover={softHover}>
          <img
            src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800"
            alt="Stackly office"
            className="w-full h-full object-cover transition duration-700 hover:scale-105"
            loading="lazy"
          />
        </motion.div>

        <motion.div className="w-full lg:w-1/2 space-y-4 md:space-y-6 text-left" variants={staggerContainer}>
          {/* Added About Us box and Blue Line */}
          <motion.div className="" variants={fadeUp}>
            <span className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              About us
            </span>
          </motion.div>

          <motion.div className="flex items-center gap-3" variants={fadeUp}>
            <div className="w-1.5 h-6 bg-blue-600"></div>
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#0A2357]">Who We Are</h2>
          </motion.div>

          <motion.p className="text-base md:text-lg leading-relaxed font-bold text-[#0A2357] italic" variants={fadeUp}>
            Stackly is a powerful platform that streamlines workflows, enhances efficiency, and drives digital success.
          </motion.p>
          <motion.p className="text-sm leading-relaxed text-gray-600" variants={fadeUp}>
            Founded in 2015, Stackly has grown into one of the leading and most trusted companies in the industry.
          </motion.p>

          <motion.button
            onClick={() => router.push("/aboutus")}
            className="cursor-pointer inline-flex items-center justify-center gap-3 rounded-xl bg-[#0A2357] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-blue-900 active:scale-95"
            variants={fadeUp}
            whileHover={{ scale: 1.04, filter: "brightness(1.08)" }}
            whileTap={{ scale: 0.98 }}
          >
            READ MORE...
          </motion.button>
        </motion.div>
      </motion.div>
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}

      <motion.div id="popular-searches" className="mt-8 text-center md:mt-12 max-w-7xl mx-auto px-4 md:px-8" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-800">Popular Searches</p>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {popularSearches.map((search) => (
            <button
              key={search}
              type="button"
              onClick={() => submitSearch(search)}
              className="cursor-pointer truncate rounded-full border border-gray-100 bg-white px-4 py-2 text-[11px] font-bold text-gray-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
            >
              {search}
            </button>
          ))}
        </div>
        {submittedSearch && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-bold text-gray-600">
            <span>
              Showing websites for <span className="text-blue-600">&quot;{submittedSearch}&quot;</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setSubmittedSearch("");
                setSearchQuery("");
                setActiveFilter("all"); // Added to ensure reset
              }}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
            >
              Clear
            </button>
          </div>
        )}
      </motion.div>

      <section id="categories" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <SectionHeading>Categories</SectionHeading>
        {/* Added key to force re-render/re-animation when state changes */}
        <motion.div key={`categories-${submittedSearch}`} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {visibleCategories.map((category) => (
            <motion.article key={category.title} className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl" variants={scaleIn} whileHover={softHover}>
              <div className="h-44 overflow-hidden md:h-52">
                <img src={assetPath(category.image)} alt={category.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-base font-bold uppercase tracking-tight text-gray-800 md:text-lg">{category.title}</h3>
                <div className="mt-4 flex justify-center gap-6 text-[10px] font-black uppercase text-blue-600 underline">
                  <Link
                    href={hasActiveSubscription ? (category.editHref ?? "#templates") : "/planning"}
                    onClick={(e) => checkSubscriptionAndRoute(e, category.editHref ?? "#templates")}
                  >
                    Edit
                  </Link>
                  <Link href={category.previewHref ?? "#templates"}>Preview</Link>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
        <div className="mt-10 flex justify-center">
          <Link href="/templates" className="inline-flex items-center gap-2 rounded-xl bg-[#06224C] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-blue-900 hover:scale-[1.02] active:scale-95">
            View All Templates <FaArrowRight className="text-[10px]" />
          </Link>
        </div>
      </section>
 
      <section id="top-selling" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <SectionHeading>Top Selling This Week</SectionHeading>
        {/* Added key to force re-render/re-animation when state changes */}
        <motion.div key={`top-products-${submittedSearch}`} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {visibleTopProducts.map((product) => {
            const isWishlisted = wishlistItems.some((item) => item.title === product.title);
            const isInCart = cartTitles.includes(product.title);

            return (
              <motion.article key={product.title} className="group flex flex-col rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-2xl" variants={scaleIn} whileHover={softHover}>
                <div className="mb-5 h-52 overflow-hidden rounded-[1.5rem] bg-gray-50">
                  <img src={assetPath(product.image)} alt={product.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="flex flex-1 flex-col px-2">
                  <div className="flex items-center justify-between gap-3 mb-1 w-full min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-bold text-[#06224C] sm:text-xl truncate" title={product.title}>
                        {product.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleWishlistItem(product)}
                      aria-label={`${isWishlisted ? "Remove" : "Add"} ${product.title} ${isWishlisted ? "from" : "to"} wishlist`}
                      aria-pressed={isWishlisted}
                      className={`p-1 transition hover:text-red-500 shrink-0 ${isWishlisted ? "text-red-500" : "text-gray-300"}`}
                    >
                      <FaHeart className="text-xl" />
                    </button>
                  </div>
                  <p className="mb-4 text-xs italic text-gray-500">{product.type}</p>
                  <div className="mb-6 mt-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-[#06224C]">₹ {product.price}</span>
                      <span className="text-[10px] font-bold text-gray-400">({product.sales} Sales)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-[#06224C]">{(product.rating || 5).toFixed(1)}</span>
                      <div className="flex items-center gap-0.5 text-yellow-400" aria-label={`Rating ${product.rating || 5} out of 5`}>
                        {(() => {
                          const rating = product.rating || 5;
                          const fullStars = Math.floor(rating);
                          const hasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;
                          const extraFull = rating % 1 >= 0.75 ? 1 : 0;
                          const totalFull = fullStars + extraFull;
                          const emptyStars = 5 - totalFull - (hasHalf ? 1 : 0);

                          return (
                            <>
                              {Array.from({ length: totalFull }).map((_, idx) => (
                                <FaStar key={`full-${idx}`} className="text-xs" />
                              ))}
                              {hasHalf && (
                                <FaStarHalfStroke key="half" className="text-xs" />
                              )}
                              {Array.from({ length: emptyStars }).map((_, idx) => (
                                <FaRegStar key={`empty-${idx}`} className="text-xs text-gray-300" />
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2.5">
                    <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        disabled={isInCart}
                        aria-label={isInCart ? `${product.title} is already in cart` : `Add ${product.title} to cart`}
                        className={`cursor-pointer flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-blue-400 text-blue-500 transition ${isInCart ? "opacity-60 !cursor-not-allowed bg-blue-50/50 border-solid" : "hover:bg-blue-50"}`}
                      >
                        {isInCart ? <FaCheck className="text-sm" /> : <FaCartShopping />}
                      </button>
                      <button
                        type="button"
                        disabled={paymentLoading}
                        onClick={() => handleBuyNow(product)}
                        className="cursor-pointer flex h-10 flex-1 items-center justify-center rounded-xl bg-[#06224C] text-sm font-bold text-white transition hover:scale-[1.02] hover:bg-blue-900 hover:brightness-110 active:scale-95 shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Buy Now
                      </button>
                    </div>
                    <a href="#templates" className="flex h-10 w-full sm:flex-1 items-center justify-center rounded-xl border-2 border-dashed border-blue-400 text-sm font-bold text-blue-500 transition hover:scale-[1.02] hover:bg-blue-50 hover:brightness-105 whitespace-nowrap">
                      View Template
                    </a>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      <section id="templates" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <SectionHeading>All Templates</SectionHeading>
        <motion.div className="rounded-[2rem] border border-gray-100 bg-white p-4 shadow-sm md:rounded-[2.5rem] md:p-10" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <div className="mb-12 flex flex-wrap justify-center gap-3" aria-label="Template categories">
            {templateFilters.map((filter) => {
              const active = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`cursor-pointer inline-flex items-center rounded-xl border px-5 py-2.5 text-sm font-semibold shadow-sm transition hover:scale-[1.03] hover:brightness-105 ${active
                    ? "border-[#06224C] bg-[#06224C] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600"
                    }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Added key to force re-render/re-animation when state changes */}
          <motion.div key={`templates-${activeFilter}-${submittedSearch}`} className="grid grid-cols-1 gap-x-6 gap-y-8 sm:gap-x-10 sm:gap-y-14 sm:grid-cols-2 lg:grid-cols-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {visibleTemplates.map((template) => (
              <motion.article key={template.title} className="group" variants={scaleIn} whileHover={{ y: -5, transition: { duration: 0.22 } }}>
                <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-50 shadow-md">
                  <img src={assetPath(template.image)} alt={template.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase ${template.badge === "Free" ? "bg-green-500 text-white" : "bg-yellow-400 text-[#06224C]"}`}>
                    {template.badge}
                  </span>
                </div>
                <div className="px-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-black leading-tight text-[#06224C]">{template.title}</h3>
                      {template.price && (
                        <span className="mt-1.5 block text-sm font-bold text-blue-600 sm:hidden">
                          ₹ {template.price}
                        </span>
                      )}
                    </div>
                    {template.price ? (
                      <span className="hidden text-sm font-bold text-blue-600 shrink-0 sm:block">₹ {template.price}</span>
                    ) : (
                      <FaArrowRight className="mt-1 text-[#06224C] shrink-0" />
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{template.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={
                        template.title === "Digital Marketing"
                          ? "/digital-marketing"
                          : template.title === "Restaurant"
                            ? "/restaurant"
                            : template.title === "Construction"
                              ? "/construction"
                              : ["Tech Insights", "Fashion", "Jewelry", "Business"].includes(template.title)
                                ? "/coming-soon"
                                : template.category === "portfolio"
                                  ? "/portfolio"
                                  : template.category === "ecommerce"
                                    ? "/e-commerce"
                                    : template.category === "blog"
                                      ? "/blog"
                                      : "#features"
                      }
                      onClick={(e) => {
                        if (["Tech Insights", "Fashion", "Jewelry", "Business"].includes(template.title)) {
                          // Intercept normal left click (no ctrl, shift, meta, alt or right click)
                          const isNormalClick = e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey;
                          if (isNormalClick) {
                            e.preventDefault();
                            setComingSoonTemplate(template.title);
                            setShowComingSoon(true);
                          }
                        }
                      }}
                      className="min-w-[80px] flex-1 rounded-xl border-2 border-dashed border-blue-400 py-2.5 text-center text-sm font-bold text-blue-500 transition hover:scale-[1.03] hover:bg-blue-50 hover:brightness-105 px-2 whitespace-nowrap"
                    >
                      Preview
                    </Link>
                    <Link
                      href={template.price || !hasActiveSubscription ? "/planning" : `/blockpages?template=${template.category}`}
                      onClick={(e) => {
                        // Only intercept if it's the "Edit" button (no price)
                        if (!template.price) {
                          checkSubscriptionAndRoute(e, `/blockpages?template=${template.category}`);
                        }
                      }}
                      className="min-w-[80px] flex-1 rounded-xl bg-[#06224C] py-2.5 text-center text-sm font-bold text-white transition hover:scale-[1.03] hover:bg-blue-900 hover:brightness-110 px-2 whitespace-nowrap"
                    >
                      {template.price ? "Buy" : "Edit"}
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
          {visibleTemplates.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-[#06224C]">No matching websites found</p>
              <p className="mt-2 text-sm text-gray-500">Try searching for portfolio, blog, ecommerce, business, restaurant, or dashboard.</p>
            </div>
          )}
        </motion.div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <motion.div className="flex flex-col items-center rounded-[1.5rem] bg-gradient-to-b bg-[#082A5A] to-[#002B5C] p-8 text-center text-white shadow-2xl md:rounded-[2.5rem] md:p-16" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}>
          <motion.div className="mb-10 max-w-4xl" variants={fadeUp}>
            <motion.h2 className="mb-4 text-3xl font-black leading-tight text-white md:text-6xl" variants={fadeUp}>
              Step into the digital world with confidence
            </motion.h2>
            <motion.p className="text-sm italic leading-relaxed opacity-90 md:text-xl" variants={fadeUp}>
              Join millions turning ideas into reality and start building your own success story today
            </motion.p>
          </motion.div>
          <motion.div className="mb-10 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3" variants={staggerContainer}>
            {[
              { endValue: 500, suffix: "K +", label: "users" },
              { endValue: 12, suffix: " +", label: "countries" },
              { endValue: 10, suffix: " +", label: "sites created daily" },
            ].map(({ endValue, suffix, label }) => (
              <motion.div key={label} className="rounded-2xl bg-white p-6 shadow-lg transition hover:scale-105 md:p-8" variants={scaleIn} whileHover={{ y: -5, scale: 1.04, transition: { duration: 0.22 } }}>
                <p className="text-2xl font-black text-gray-800 md:text-4xl">
                  <StatCounter endValue={endValue} suffix={suffix} />
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500 md:text-xs">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <motion.div className="relative flex flex-col gap-10 overflow-hidden rounded-[2rem] border-l-4 border-blue-600 bg-[#E6EFF1] p-8 md:flex-row md:gap-16 md:rounded-[3rem] md:p-16" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.22 }}>
          <motion.div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-300/30 blur-3xl" animate={{ opacity: [0.35, 0.65, 0.35], scale: [1, 1.08, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div
            className="flex w-full flex-col items-center gap-6 text-center md:w-1/2"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: [0, -6, 0] }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              opacity: { duration: 0.45, ease: "easeOut" },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <h2 className="text-4xl font-black leading-tight text-gray-900 md:text-5xl">
              How to use a drag & drop website builder
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Create your site in 3 simple steps
            </p>
            <Link href="/builder" className="mt-2 rounded-full bg-[#2B2B2B] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition hover:scale-[1.04] hover:bg-gray-800 hover:brightness-110">
              Get Started
            </Link>
          </motion.div>
          <motion.div className="flex w-full flex-col gap-8 text-left md:w-1/2" variants={staggerContainer}>
            {steps.map(([title, body], index) => (
              <motion.div key={title} className="flex flex-col gap-2" variants={scaleIn}>
                <p className="text-lg font-black leading-snug text-gray-900 md:text-xl">
                  <span className="text-blue-600">{index + 1}.</span> {title}
                </p>
                <p className="pl-6 text-xs font-semibold text-gray-600">{body}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      <section id="features" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <motion.div className="relative flex flex-col gap-8 overflow-hidden rounded-[2rem] border-l-4 border-blue-500 bg-[#E6EFF1] p-4 shadow-sm sm:p-6 lg:flex-row lg:gap-16 lg:rounded-[3rem] lg:p-14" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.18 }}>
          <motion.div className="pointer-events-none absolute -bottom-20 left-1/4 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.1, 1] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div
            className="w-full lg:w-1/2"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: [0, -8, 0] }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{
              opacity: { duration: 0.45, ease: "easeOut" },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut" },
            }}
          >
            <motion.div className="group relative flex min-h-[300px] overflow-hidden rounded-2xl bg-white shadow-lg sm:min-h-[380px] lg:min-h-[450px]" whileHover={softHover}>
              <img src={assetPath(selectedFeature.image)} alt={`${selectedFeature.title} feature preview`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06224C]/90 via-[#06224C]/40 to-transparent" />
              <p className="absolute inset-x-0 bottom-0 p-5 text-base font-black leading-tight text-white sm:p-8 md:text-xl">
                &quot;{selectedFeature.quote}&quot;
              </p>
            </motion.div>
          </motion.div>

          <motion.div className="flex w-full flex-col justify-center gap-4 lg:w-1/2" variants={staggerContainer}>
            {features.map((item, index) => {
              const isActive = activeFeature === index;
              return (
                <motion.div key={item.title} className="rounded-xl border border-transparent transition hover:bg-white/40 hover:border-blue-300/40 hover:shadow-lg" variants={scaleIn} whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                  <button type="button" onClick={() => setActiveFeature(index)} className="flex w-full items-center justify-between gap-3 rounded-xl p-2 text-left">
                    <h3 className="text-lg font-black text-[#06224C] md:text-2xl min-w-0 flex-1 pr-6">
                      <span className="text-blue-600 mr-2">{index + 1}.</span>
                      {item.title}
                    </h3>
                    <FaChevronDown className={`flex-shrink-0 text-gray-400 transition ${isActive ? "rotate-180 text-blue-600" : ""}`} />
                  </button>
                  {isActive && (
                    <p className="px-4 pb-4 pt-1 text-sm leading-relaxed text-gray-600 md:text-base">
                      {item.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      <section className="mx-auto my-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <SectionHeading>Drag & drop website builder FAQ</SectionHeading>
        <motion.div className="flex flex-col items-center gap-10 rounded-[2rem] border-l-4 border-blue-500 bg-[#E6EFF1] p-6 shadow-sm lg:flex-row lg:items-start lg:gap-16 lg:rounded-[3rem] lg:p-14" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.16 }}>
          <motion.div className="flex w-full justify-center lg:w-2/5" variants={fadeUp}>
            <img src={assetPath("/landing-optimized/faqq.webp")} alt="FAQ illustration" className="w-full max-w-[280px] object-contain lg:max-w-md" loading="lazy" />
          </motion.div>
          <motion.div className="flex w-full flex-col gap-4 lg:w-3/5" variants={staggerContainer}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <motion.div key={faq.question} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm" variants={scaleIn} whileHover={{ y: -3, boxShadow: "0 18px 40px rgba(6,34,76,0.10)", transition: { duration: 0.2 } }}>
                  <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : index)} className="w-full p-5 text-left transition hover:bg-gray-50 md:p-6">
                    <div className="flex w-full items-start justify-between gap-4">
                      <h3 className="text-sm font-bold leading-snug text-[#06224C] md:text-base flex-1 min-w-0">{faq.question}</h3>
                      {isOpen ? <FaMinus className="mt-1 flex-shrink-0 text-[#06224C]" /> : <FaPlus className="mt-1 flex-shrink-0 text-[#06224C]" />}
                    </div>
                  </button>
                  {isOpen && <p className="px-5 pb-5 pt-0 text-sm leading-relaxed text-gray-700 md:px-6 md:pb-6">{faq.answer}</p>}
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      <section className="mx-auto mt-12 mb-6 max-w-7xl bg-[#FFF1F1] px-4 py-12 md:mt-16 md:mb-8 md:px-8 md:py-20">
        <motion.div className="overflow-hidden rounded-[2.5rem] bg-[#082A5A] p-4 sm:p-8 md:p-16 text-center shadow-[0_24px_70px_rgba(8,42,90,0.20)] md:rounded-[3rem]" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }}>
          <h2 className="mb-3 font-serif text-2xl font-black leading-tight text-white md:text-5xl">
            Drag & drop your vision to life
          </h2>
          <p className="mb-8 font-serif text-2xl font-black text-white md:text-4xl">
            Your vision. Your goals. Your website.
          </p>
          <div className="flex justify-center w-full min-w-0">
            <Link href="/builder" className="inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#06224C] shadow-xl transition hover:scale-[1.04] hover:bg-blue-50 hover:brightness-105 sm:px-10 sm:py-3.5">
              Get Started
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm text-white">
            <Link href="/">TheStackly.com</Link>
            <span>/</span>
            <span>Drag and Drop Website Builder</span>
          </div>
        </motion.div>
      </section>

      <LandingContactSection />

      <Footer />

      {wishlistToast && (
        <div className="fixed bottom-5 right-5 z-[20001] rounded-xl bg-[#06224C] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {wishlistToast}
        </div>
      )}

      <AnimatePresence>
        {showComingSoon && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowComingSoon(false)}
              className="absolute inset-0 bg-[#06224C]/40 backdrop-blur-sm"
            />
            
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-8 text-center shadow-[0_24px_70px_rgba(6,34,76,0.30)] ring-1 ring-slate-100"
            >
              {/* Decorative Header Icon */}
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FaWandMagicSparkles className="text-2xl animate-pulse" />
              </div>
              
              <h3 className="mb-2 text-2xl font-black text-[#06224C]">Coming Soon</h3>
              <p className="mb-6 text-sm font-semibold text-gray-500 leading-relaxed">
                The <span className="font-bold text-[#06224C]">{comingSoonTemplate}</span> template is currently under design and will be available very soon. Stay tuned!
              </p>
              
              <button
                type="button"
                onClick={() => setShowComingSoon(false)}
                className="w-full rounded-2xl bg-[#06224C] py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-md transition hover:bg-blue-900 hover:scale-[1.02] active:scale-[0.98]"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MockCheckoutModal
        isOpen={checkoutProduct !== null}
        onClose={() => setCheckoutProduct(null)}
        onSuccess={() => checkoutProduct && executePayment(checkoutProduct)}
        productName={checkoutProduct?.title || ""}
        productPrice={checkoutProduct?.price || 0}
        productImage={checkoutProduct?.image}
        productAlt={checkoutProduct?.alt}
        quantity={1}
      />
    </main>
  );
}


