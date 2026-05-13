"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  FaArrowRight,
  FaCartShopping,
  FaChevronDown,
  FaHeart,
  FaMagnifyingGlass,
  FaMinus,
  FaPlay,
  FaPlus,
  FaStar,
  FaXmark,
} from "react-icons/fa6";
import { assetPath } from "@/lib/paths";

type TemplateCategory = "portfolio" | "blog" | "ecommerce" | "business";

const Footer = dynamic(() => import("@/components/Footer"), {
  ssr: false,
  loading: () => <div className="h-64 bg-[#0A1E3D]" />,
});

const popularSearches = [
  "Food",
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
  { title: "Portfolio", image: "/landing-optimized/port.webp", alt: "Portfolio website preview", previewHref: "/portfolio" },
  { title: "E-Commerce Templates", image: "/landing-optimized/ecommerce.webp", alt: "E-commerce website preview", previewHref: "/e-commerce" },
  { title: "Digital Marketing Templates", image: "/landing-optimized/digital01.webp", alt: "Digital marketing website preview" },
  { title: "Blogging", image: "/landing-optimized/bloggg.webp", alt: "Blogging website preview" },
  { title: "Construction Themes", image: "/landing-optimized/construction02.webp", alt: "Construction website preview" },
  { title: "Food Restaurant", image: "/landing-optimized/foodd03.webp", alt: "Food restaurant website preview" },
];

const topProducts = [
  { title: "ShopNest", type: "E-commerce Website", price: 29, sales: "10.5K", image: "/landing-optimized/shopnest.webp", alt: "ShopNest template preview" },
  { title: "BuySphere", type: "Template Website", price: 10, sales: "3.4K", image: "/landing-optimized/buysphere.webp", alt: "BuySphere template preview" },
  { title: "TurboCart", type: "Template Website", price: 35, sales: "2.9K", image: "/landing-optimized/turbocart.webp", alt: "TurboCart template preview" },
  { title: "MegaBasket", type: "Template Website", price: 29, sales: "4.2K", image: "/landing-optimized/megabasket.webp", alt: "MegaBasket template preview" },
  { title: "NexaStore", type: "Template Website", price: 10, sales: "4.7K", image: "/landing-optimized/nexastore1.webp", alt: "NexaStore template preview" },
  { title: "SampleStore", type: "Template Website", price: 35, sales: "5.0K", image: "/landing-optimized/samplestore.webp", alt: "SampleStore template preview" },
];

type WishlistItem = {
  title: string;
  type: string;
  price: number;
  image: string;
  alt: string;
};

type CartItem = WishlistItem & {
  quantity: number;
};

const STORAGE_SYNC_EVENT = "stackly-storage-change";

const templates = [
  { title: "Classic Portfolio", category: "portfolio", image: "/landing-optimized/port.webp", alt: "Classic Portfolio template", description: "Perfect for individual creators.", badge: "Free" },
  { title: "Agency Pro", category: "portfolio", image: "/landing-optimized/portfolio03.webp", alt: "Agency Pro template", description: "A polished showcase for design teams.", price: 19, badge: "Premium" },
  { title: "Minimal Studio", category: "portfolio", image: "/landing-optimized/portfolio04.webp", alt: "Minimal Studio template", description: "Clean white-space focused layout.", badge: "Free" },
  { title: "Personal Blog", category: "blog", image: "/landing-optimized/blog1.webp", alt: "Personal Blog template", description: "Clean layout for storytellers.", badge: "Free" },
  { title: "Tech Insights", category: "blog", image: "/landing-optimized/blog2.webp", alt: "Tech Insights template", description: "Professional layout for tech news.", price: 15, badge: "Premium" },
  { title: "Store", category: "ecommerce", image: "/landing-optimized/store11.webp", alt: "Store template", description: "A product-first storefront layout.", price: 29, badge: "Premium" },
  { title: "Fashion", category: "ecommerce", image: "/landing-optimized/fashion06.webp", alt: "Fashion store template", description: "Editorial product grid for apparel.", price: 19, badge: "Premium" },
  { title: "Jewelry", category: "ecommerce", image: "/landing-optimized/jewellery07.webp", alt: "Jewelry store template", description: "Elegant catalog for premium items.", price: 19, badge: "Premium" },
  { title: "Business", category: "business", image: "/landing-optimized/business09.webp", alt: "Business template", description: "Executive layout for company sites.", price: 29, badge: "Premium" },
  { title: "Construction", category: "business", image: "/landing-optimized/constrctio10.webp", alt: "Construction template", description: "Strong service-site starter.", price: 25, badge: "Premium" },
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
    image: "/landing-optimized/shapers.webp",
    quote: "Shape-based layouts make your site feel creative, polished, and professional.",
  },
  {
    title: "Dynamic Views",
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
    question: "What are the advantages of a drag & drop builder?",
    answer: "The main advantages are ease of use, faster development, flexible editing, and built-in tools that help you launch quickly.",
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-8 border-l-4 border-blue-600 pl-3 text-xs font-black uppercase tracking-[0.3em] text-[#0A2357] md:mb-10">
      {children}
    </h2>
  );
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<(typeof templateFilters)[number]["value"]>("all");
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [hasLoadedWishlist, setHasLoadedWishlist] = useState(false);
  const [wishlistToast, setWishlistToast] = useState<string | null>(null);

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

    const closeSearch = (event: MouseEvent) => {
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
    const nextCart = existingItem
      ? currentCart.map((item) => (
        item.title === product.title ? { ...item, quantity: (item.quantity || 1) + 1 } : item
      ))
      : [...currentCart, { ...product, quantity: 1 }];
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
      return;
    }

    setSearchQuery("");
    setSubmittedSearch(nextQuery);
    setIsSearchOpen(false);
    setActiveFilter("all");
    window.setTimeout(() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };

  return (
    <main className="min-h-screen bg-[#fff1f2] text-gray-900">
      <div
        className={`fixed left-0 top-[65px] z-40 w-full transition duration-200 ${isSearchOpen ? "visible translate-y-0 opacity-100" : "invisible pointer-events-none -translate-y-2 opacity-0"}`}
      >
        <div data-landing-search className="mx-auto max-w-7xl px-4 py-2 md:px-8">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch(searchQuery);
            }}
            className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-gray-50 shadow-xl ring-1 ring-black/5"
          >
            <input
              id="landing-search-input"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="What are you looking for?"
              className="min-w-0 flex-grow bg-transparent py-3 pl-3 pr-1 text-[10px] text-gray-700 outline-none placeholder:text-gray-400 md:pl-5 md:text-sm"
            />
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="px-3 py-3 text-gray-400 transition hover:text-gray-700"
              aria-label="Close search"
            >
              <FaXmark />
            </button>
            <button type="submit" className="border-l border-gray-300 bg-gray-100 px-6 py-3 text-gray-600 transition hover:bg-gray-200" aria-label="Search websites">
              <FaMagnifyingGlass />
            </button>
          </form>
        </div>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 pt-8 md:px-8">
        <div className="relative min-h-[480px] overflow-hidden rounded-[2rem] bg-[#fde2e4] md:min-h-[540px] md:rounded-[3rem]">
          <picture>
            <source media="(max-width: 768px)" srcSet={assetPath("/landing-optimized/landinmble3.webp")} />
            <img
              src={assetPath("/landing-optimized/landing22.webp")}
              alt="Stackly drag and drop website builder preview"
              className="absolute inset-0 h-full w-full object-cover object-center md:object-right"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <div className="relative z-10 flex min-h-[480px] items-end justify-center p-8 md:min-h-[540px] md:justify-start md:p-16">
            <Link
              href="#templates"
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#0A2357] px-7 py-3 font-bold text-white shadow-lg transition hover:bg-blue-900"
            >
              Get Started
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-[#0A2357]">
                <FaPlay />
              </span>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center md:mt-12">
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-800">Popular Searches</p>
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {popularSearches.map((search) => (
              <button
                key={search}
                type="button"
                onClick={() => submitSearch(search)}
                className="truncate rounded-full border border-gray-100 bg-white px-4 py-2 text-[11px] font-bold text-gray-600 shadow-sm transition hover:border-blue-400 hover:text-blue-600"
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
                }}
                className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[10px] uppercase tracking-widest text-gray-500 transition hover:border-blue-400 hover:text-blue-600"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="categories" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <SectionHeading>Categories</SectionHeading>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCategories.map((category) => (
            <article key={category.title} className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="h-44 overflow-hidden md:h-52">
                <img src={assetPath(category.image)} alt={category.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="p-6 text-center">
                <h3 className="text-base font-bold uppercase tracking-tight text-gray-800 md:text-lg">{category.title}</h3>
                <div className="mt-4 flex justify-center gap-6 text-[10px] font-black uppercase text-blue-600 underline">
                  <a href="#templates">Edit</a>
                  <Link href={category.previewHref ?? "#templates"}>Preview</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <SectionHeading>Top Selling This Week</SectionHeading>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleTopProducts.map((product) => {
            const isWishlisted = wishlistItems.some((item) => item.title === product.title);

            return (
            <article key={product.title} className="group flex flex-col rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-2xl">
              <div className="mb-5 h-52 overflow-hidden rounded-[1.5rem] bg-gray-50">
                <img src={assetPath(product.image)} alt={product.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="flex flex-1 flex-col px-2">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="text-xl font-bold text-[#06224C]">{product.title}</h3>
                  <button
                    type="button"
                    onClick={() => toggleWishlistItem(product)}
                    aria-label={`${isWishlisted ? "Remove" : "Add"} ${product.title} ${isWishlisted ? "from" : "to"} wishlist`}
                    aria-pressed={isWishlisted}
                    className={`p-1 transition hover:text-red-500 ${isWishlisted ? "text-red-500" : "text-gray-300"}`}
                  >
                    <FaHeart className="text-xl" />
                  </button>
                </div>
                <p className="mb-4 text-xs italic text-gray-500">{product.type}</p>
                <div className="mb-6 mt-auto flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#06224C]">$ {product.price}</span>
                    <span className="text-[10px] font-bold text-gray-400">({product.sales} Sales)</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400" aria-label="Rating 5 out of 5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <FaStar key={index} className="text-xs" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => addToCart(product)}
                    aria-label={`Add ${product.title} to cart`}
                    className="flex h-10 w-12 items-center justify-center rounded-xl border-2 border-dashed border-blue-400 text-blue-500 transition hover:bg-blue-50"
                  >
                    <FaCartShopping />
                  </button>
                  <a href="#templates" className="flex h-10 flex-1 items-center justify-center rounded-xl border-2 border-dashed border-blue-400 text-sm font-bold text-blue-500 transition hover:bg-blue-50">
                    View Template
                  </a>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section id="templates" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <SectionHeading>All Templates</SectionHeading>
        <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm md:rounded-[2.5rem] md:p-10">
          <div className="mb-12 flex flex-wrap justify-center gap-3" aria-label="Template categories">
            {templateFilters.map((filter) => {
              const active = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold shadow-sm transition ${
                    active
                      ? "border-[#06224C] bg-[#06224C] text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600"
                  }`}
                >
                  {filter.label}
                  <FaChevronDown className="text-[10px]" />
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTemplates.map((template) => (
              <article key={template.title} className="group">
                <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-2xl bg-gray-50 shadow-md">
                  <img src={assetPath(template.image)} alt={template.alt} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                  <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase ${template.badge === "Free" ? "bg-green-500 text-white" : "bg-yellow-400 text-[#06224C]"}`}>
                    {template.badge}
                  </span>
                </div>
                <div className="px-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black leading-tight text-[#06224C]">{template.title}</h3>
                    {template.price ? <span className="text-sm font-bold text-blue-600">$ {template.price}</span> : <FaArrowRight className="mt-1 text-[#06224C]" />}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500">{template.description}</p>
                  <div className="mt-4 flex gap-3">
                    <Link
                      href={template.category === "portfolio" ? "/portfolio" : template.category === "ecommerce" ? "/e-commerce" : "#features"}
                      className="flex-1 rounded-xl border-2 border-dashed border-blue-400 py-2.5 text-center text-sm font-bold text-blue-500 transition hover:bg-blue-50"
                    >
                      Preview
                    </Link>
                    <Link href="/planning" className="flex-1 rounded-xl bg-[#06224C] py-2.5 text-center text-sm font-bold text-white transition hover:bg-blue-900">
                      {template.price ? "Buy" : "Edit"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {visibleTemplates.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-[#06224C]">No matching websites found</p>
              <p className="mt-2 text-sm text-gray-500">Try searching for portfolio, blog, ecommerce, business, food, or dashboard.</p>
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <div className="flex flex-col items-center rounded-[1.5rem] bg-gradient-to-b from-[#005BC5] to-[#002B5C] p-8 text-center text-white shadow-2xl md:rounded-[2.5rem] md:p-16">
          <div className="mb-10 max-w-4xl">
            <h2 className="mb-4 text-3xl font-black leading-tight text-white md:text-6xl">
              Step into the digital world with confidence
            </h2>
            <p className="text-sm italic leading-relaxed opacity-90 md:text-xl">
              Join millions turning ideas into reality and start building your own success story today
            </p>
          </div>
          <div className="mb-10 grid w-full max-w-5xl grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              ["500K +", "users"],
              ["12 +", "countries"],
              ["10 +", "sites created daily"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl bg-white p-6 shadow-lg transition hover:scale-105 md:p-8">
                <p className="text-2xl font-black text-gray-800 md:text-4xl">{value}</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-gray-500 md:text-xs">{label}</p>
              </div>
            ))}
          </div>
          <Link href="/signup" className="w-full rounded-full bg-white px-10 py-4 text-xs font-black uppercase tracking-[0.2em] text-[#005BC5] shadow-xl transition hover:bg-blue-50 sm:w-auto md:px-14">
            Get Started
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <div className="flex flex-col gap-10 rounded-[2rem] border-l-4 border-blue-600 bg-[#E6EFF1] p-8 md:flex-row md:gap-16 md:rounded-[3rem] md:p-16">
          <div className="flex w-full flex-col items-center gap-6 text-center md:w-1/2">
            <h2 className="text-4xl font-black leading-tight text-gray-900 md:text-5xl">
              How to use a drag & drop website builder
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              Create your site in 3 simple steps
            </p>
            <Link href="/signup" className="mt-2 rounded-full bg-[#2B2B2B] px-8 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-gray-800">
              Get Started
            </Link>
          </div>
          <div className="flex w-full flex-col gap-8 text-left md:w-1/2">
            {steps.map(([title, body], index) => (
              <div key={title} className="flex flex-col gap-2">
                <p className="text-lg font-black leading-snug text-gray-900 md:text-xl">
                  <span className="text-blue-600">{index + 1}.</span> {title}
                </p>
                <p className="pl-6 text-xs font-semibold text-gray-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto mt-16 max-w-7xl px-4 md:mt-24 md:px-8">
        <div className="flex flex-col gap-8 rounded-[2rem] border-l-4 border-blue-500 bg-[#E6EFF1] p-4 shadow-sm sm:p-6 lg:flex-row lg:gap-16 lg:rounded-[3rem] lg:p-14">
          <div className="w-full lg:w-1/2">
            <div className="group relative flex min-h-[300px] overflow-hidden rounded-2xl bg-white shadow-lg sm:min-h-[380px] lg:min-h-[450px]">
              <img src={assetPath(selectedFeature.image)} alt={`${selectedFeature.title} feature preview`} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#06224C]/90 via-[#06224C]/40 to-transparent" />
              <p className="absolute inset-x-0 bottom-0 p-5 text-base font-black leading-tight text-white sm:p-8 md:text-xl">
                &quot;{selectedFeature.quote}&quot;
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col justify-center gap-4 lg:w-1/2">
            {features.map((item, index) => {
              const isActive = activeFeature === index;
              return (
                <div key={item.title} className="rounded-xl transition hover:bg-white/40">
                  <button type="button" onClick={() => setActiveFeature(index)} className="flex w-full items-start justify-between gap-3 rounded-xl p-4 text-left">
                    <h3 className="flex items-start gap-3 text-lg font-black text-[#06224C] md:text-2xl">
                      <span className="text-blue-600">{index + 1}.</span>
                      {item.title}
                    </h3>
                    <FaChevronDown className={`mt-1 flex-shrink-0 text-gray-400 transition ${isActive ? "rotate-180 text-blue-600" : ""}`} />
                  </button>
                  {isActive && (
                    <p className="px-4 pb-4 pt-1 text-sm leading-relaxed text-gray-600 md:text-base">
                      {item.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto my-16 max-w-7xl px-4 md:my-24 md:px-8">
        <SectionHeading>Drag & drop website builder FAQ</SectionHeading>
        <div className="flex flex-col items-center gap-10 rounded-[2rem] border-l-4 border-blue-500 bg-[#E6EFF1] p-6 shadow-sm lg:flex-row lg:items-start lg:gap-16 lg:rounded-[3rem] lg:p-14">
          <div className="flex w-full justify-center lg:w-2/5">
            <img src={assetPath("/landing-optimized/faqq.webp")} alt="FAQ illustration" className="w-full max-w-[280px] object-contain lg:max-w-md" loading="lazy" />
          </div>
          <div className="flex w-full flex-col gap-4 lg:w-3/5">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={faq.question} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <button type="button" onClick={() => setOpenFaq(isOpen ? -1 : index)} className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-gray-50 md:p-6">
                    <h3 className="text-sm font-bold leading-snug text-[#06224C] md:text-base">{faq.question}</h3>
                    {isOpen ? <FaMinus className="mt-1 flex-shrink-0 text-[#06224C]" /> : <FaPlus className="mt-1 flex-shrink-0 text-[#06224C]" />}
                  </button>
                  {isOpen && <p className="px-5 pb-5 pt-0 text-sm leading-relaxed text-gray-700 md:px-6 md:pb-6">{faq.answer}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto my-12 max-w-7xl bg-[#FFF1F1] px-4 py-12 md:px-8 md:py-20">
        <div className="overflow-hidden rounded-[2.5rem] bg-[#082A5A] p-8 text-center shadow-[0_24px_70px_rgba(8,42,90,0.20)] md:rounded-[3rem] md:p-16">
          <h2 className="mb-3 font-serif text-2xl font-black leading-tight text-white md:text-5xl">
            Drag & drop your vision to life
          </h2>
          <p className="mb-8 font-serif text-2xl font-black text-white md:text-4xl">
            Your vision. Your goals. Your website.
          </p>
          <Link href="/signup" className="inline-flex rounded-full bg-white px-10 py-3.5 text-sm font-bold uppercase tracking-wider text-[#06224C] shadow-xl transition hover:bg-blue-50">
            Get Started
          </Link>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm text-white">
            <Link href="/">TheStackly.com</Link>
            <span>/</span>
            <span>Drag and Drop Website Builder</span>
          </div>
        </div>
      </section>

      <Footer />

      {wishlistToast && (
        <div className="fixed bottom-5 right-5 z-[20001] rounded-xl bg-[#06224C] px-5 py-3 text-sm font-bold text-white shadow-2xl">
          {wishlistToast}
        </div>
      )}
    </main>
  );
}

