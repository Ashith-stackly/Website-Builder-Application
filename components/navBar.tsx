/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { MouseEvent, useEffect, useRef, useState } from "react";
import {
  FaBars,
  FaBookOpen,
  FaBoxOpen,
  FaBriefcase,
  FaCartShopping,
  FaCamera,
  FaChartLine,
  FaChevronDown,
  FaChevronRight,
  FaCircleUser,
  FaGear,
  FaGraduationCap,
  FaHouseChimney,
  FaHotel,
  FaLayerGroup,
  FaMagnifyingGlass,
  FaMinus,
  FaNewspaper,
  FaPenNib,
  FaPlane,
  FaPlus,
  FaRightFromBracket,
  FaTrashCan,
  FaUtensils,
  FaXmark,
} from "react-icons/fa6";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { assetPath } from "@/lib/paths";

const products = ["PREMIUM TEMPLATES", "UI KITS", "WORDPRESS THEMES", "FREE ASSETS"];

const navCategories = [
  {
    title: "LANDING PAGE",
    label: "TYPES",
    icon: FaBookOpen,
    items: ["Lead Generating Page", "Click-through Page", "Sales Page", "Product Page", "App Page", "Pre-launch Page", "Event Page", "Splash Page", "Others..."],
  },
  {
    title: "DASHBOARD",
    label: "STYLES",
    icon: FaChartLine,
    items: ["Admin Analytics", "Overview", "User Profile", "Sales", "Marketing", "Finance"],
  },
  {
    title: "PORTFOLIO",
    label: "CREATIVES",
    icon: FaBriefcase,
    items: ["Designer", "Developer", "Agency", "Minimal", "Personal", "Freelancer", "Others"],
  },
  {
    title: "FOOD",
    label: "RESTAURANTS",
    icon: FaUtensils,
    items: ["Burger House", "Pizza Corner", "Fresh & Natural", "Food Stories", "Others"],
  },
  {
    title: "TRAVEL",
    label: "DESTINATIONS",
    icon: FaPlane,
    items: ["Adventure", "Luxury", "Leisure", "Solo Trip", "Family", "Group", "Others"],
  },
  {
    title: "REAL ESTATE",
    label: "PROPERTIES",
    icon: FaHouseChimney,
    items: ["Luxury & Premium", "General", "Commercial", "Residential", "Vacation/Rental", "Modern & Startup", "Portal", "Others"],
  },
  {
    title: "HOTEL",
    label: "STAY",
    icon: FaHotel,
    items: ["Resort & Vacation", "Luxury & Premium Style", "Nature & Eco", "Modern & Business", "Boutique & Unique", "Budget & Simple", "Others"],
  },
  {
    title: "BLOG",
    label: "TOPICS",
    icon: FaPenNib,
    items: ["Corporate", "Travel & Life", "Food & Health", "Modern News", "Finance", "Education", "Portfolio", "Minimal", "Others"],
  },
  {
    title: "EDUCATION",
    label: "LEARNING",
    icon: FaGraduationCap,
    items: ["EduSpark", "LearnSphere", "Bright Future", "Skillbridge", "NextGen", "Others"],
  },
  {
    title: "NEWSPAPER",
    label: "NEWS DESK",
    icon: FaNewspaper,
    items: ["Daily Pulse", "Global Times", "NextWave", "The Update Hub", "Prime Report", "Headline Express", "Insight News", "Others"],
  },
  {
    title: "PHOTOGRAPHY",
    label: "GALLERY",
    icon: FaCamera,
    items: ["Wedding", "Baby & Kids", "Fashion", "Studio Personal", "General/Portfolio", "Travel", "Event", "Food", "Studio/Personal", "Others"],
  },
];

type NavBarProps = {
  wishlistCount?: number;
  onWishlistClick?: () => void;
};

type StoredCommerceItem = {
  title?: string;
  name?: string;
  type?: string;
  price?: number;
  image?: string;
  alt?: string;
  quantity?: number;
  qty?: number;
};

const STORAGE_SYNC_EVENT = "stackly-storage-change";

function readRawJsonArray(key: string): unknown[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readJsonArray(key: string): StoredCommerceItem[] {
  return readRawJsonArray(key).filter(
    (item): item is StoredCommerceItem => Boolean(item) && typeof item === "object",
  );
}

function normalizeStoredItem(item: StoredCommerceItem) {
  const quantity = item.quantity || item.qty || 1;

  return {
    title: item.title || item.name || "Saved item",
    type: item.type || "Template",
    price: typeof item.price === "number" ? item.price : 0,
    image: item.image || "/stackly-logo.webp",
    alt: item.alt || item.title || item.name || "Saved item",
    quantity,
    total: (typeof item.price === "number" ? item.price : 0) * quantity,
  };
}

export default function NavBar({ wishlistCount: wishlistCountProp, onWishlistClick }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<StoredCommerceItem[]>([]);
  const [cartItems, setCartItems] = useState<StoredCommerceItem[]>([]);
  const [activePanel, setActivePanel] = useState<"wishlist" | "cart" | null>(null);
  const [activeMenu, setActiveMenu] = useState<"products" | "categories" | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<"products" | "categories" | null>(null);
  const [mobileCategory, setMobileCategory] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  const scrollLandingSection = (event: MouseEvent<HTMLAnchorElement>, sectionId: string, closeMobile = false) => {
    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";

    if (currentPath !== "/landing") {
      if (closeMobile) {
        setMobileOpen(false);
      }
      return;
    }

    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.pushState(null, "", `/landing#${sectionId}`);

    if (closeMobile) {
      setMobileOpen(false);
    }
  };

  const refreshStoredCommerce = () => {
    const wishlist = readJsonArray("wishlistItems");
    const cart = readJsonArray("cartItems");
    const cartCount = Number.parseInt(window.localStorage.getItem("cartCount") || "", 10);

    setWishlistItems(wishlist);
    setCartItems(
      [
        ...cart,
        ...(Number.isFinite(cartCount) && cartCount > 0 && cart.length === 0
          ? [{ title: "Cart item", quantity: cartCount }]
          : []),
      ],
    );
  };

  useEffect(() => {
    const refreshTimer = window.setTimeout(refreshStoredCommerce, 0);

    const handleStorageUpdate = () => refreshStoredCommerce();

    window.addEventListener("storage", handleStorageUpdate);
    window.addEventListener(STORAGE_SYNC_EVENT, handleStorageUpdate);

    return () => {
      window.clearTimeout(refreshTimer);
      window.removeEventListener("storage", handleStorageUpdate);
      window.removeEventListener(STORAGE_SYNC_EVENT, handleStorageUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const wishlistCount = wishlistCountProp ?? wishlistItems.reduce((total, item) => total + (item.quantity || item.qty || 1), 0);
  const cartCount = cartItems.reduce((total, item) => total + (item.quantity || item.qty || 1), 0);
  const cartSubtotal = cartItems.reduce((total, storedItem) => {
    const item = normalizeStoredItem(storedItem);
    return total + item.total;
  }, 0);

  const removeWishlistItem = (title: string) => {
    const next = wishlistItems.filter((item) => (item.title || item.name) !== title);
    window.localStorage.setItem("wishlistItems", JSON.stringify(next));
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
  };

  const removeCartItem = (title: string) => {
    const next = cartItems.filter((item) => (item.title || item.name) !== title);
    const nextCount = next.reduce((total, item) => total + (item.quantity || item.qty || 1), 0);
    window.localStorage.setItem("cartItems", JSON.stringify(next));
    window.localStorage.setItem("cartCount", String(nextCount));
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
  };

  const updateCartQuantity = (title: string, change: -1 | 1) => {
    const next = cartItems.map((item) => {
      if ((item.title || item.name) !== title) {
        return item;
      }

      const currentQuantity = item.quantity || item.qty || 1;
      return { ...item, quantity: Math.max(1, currentQuantity + change), qty: undefined };
    });
    const nextCount = next.reduce((total, item) => total + (item.quantity || item.qty || 1), 0);

    window.localStorage.setItem("cartItems", JSON.stringify(next));
    window.localStorage.setItem("cartCount", String(nextCount));
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
  };

  const toggleMenu = (menuName: "products" | "categories") => {
    setActiveMenu((currentMenu) => (currentMenu === menuName ? null : menuName));
    setIsProfileMenuOpen(false);
  };

  const closeMenus = () => {
    setActiveMenu(null);
    setIsProfileMenuOpen(false);
  };

  return (
    <>
    <header className="stackly-navbar sticky top-0 z-[5000] overflow-visible border-b border-white/10 bg-[#06224C] px-2 py-3 shadow-sm md:px-12">
      <nav ref={navRef} className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 overflow-visible md:gap-4">
        <div className="flex min-w-0 items-center gap-1 md:gap-8">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md p-1 text-white transition hover:bg-white/10 active:scale-95 lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? <FaXmark /> : <FaBars />}
          </button>

          <Link
            href="/landing"
            className="inline-flex aspect-[2/1] min-w-[75px] items-center justify-center rounded-[60%] bg-white px-2 py-2 shadow-md transition hover:scale-95 md:min-w-[90px] md:px-4 md:py-3"
            aria-label="Stackly home"
          >
            <img src={assetPath("/stackly-logo.webp")} alt="Stackly" className="h-3 w-auto object-contain md:h-5" />
          </Link>

          <div className="hidden items-center justify-center gap-12 text-[13px] font-bold uppercase tracking-wide text-white lg:flex">
            <Link href="/landing" className="whitespace-nowrap transition hover:text-blue-300">HOME</Link>
            <Link href="/landing#about" onClick={(event) => scrollLandingSection(event, "about")} className="whitespace-nowrap transition hover:text-blue-300">ABOUT US</Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("products")}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1 transition hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-haspopup="true"
                aria-expanded={activeMenu === "products"}
              >
                OUR PRODUCTS <FaChevronDown className={`text-[10px] transition-transform ${activeMenu === "products" ? "rotate-180" : ""}`} />
              </button>
              <div className={`${activeMenu === "products" ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"} absolute left-0 top-full z-[100] mt-2 w-48 rounded-xl border border-gray-100 bg-white py-3 shadow-2xl transition-all duration-300`}>
                {products.map((product) => (
                  <Link key={product} href="/landing#templates" onClick={(event) => { closeMenus(); scrollLandingSection(event, "templates"); }} className="block border-b border-gray-50 px-5 py-2.5 text-[11px] font-black text-gray-800 transition last:border-0 hover:bg-blue-50 hover:text-blue-600">
                    {product}
                  </Link>
                ))}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => toggleMenu("categories")}
                className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1 transition hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-haspopup="true"
                aria-expanded={activeMenu === "categories"}
              >
                CATEGORIES <FaChevronDown className={`text-[10px] transition-transform ${activeMenu === "categories" ? "rotate-180" : ""}`} />
              </button>
              <div className={`${activeMenu === "categories" ? "visible translate-y-0 opacity-100" : "invisible translate-y-2 opacity-0"} absolute left-0 top-full z-[100] mt-2 w-[200px] rounded-xl border border-gray-100 bg-white py-2 shadow-2xl transition-all duration-300`}>
                {navCategories.map(({ title, label, icon: Icon, items }) => (
                  <div key={title} className="group/category relative">
                    <Link href="/landing#categories" onClick={(event) => { closeMenus(); scrollLandingSection(event, "categories"); }} className="flex items-center justify-between border-b border-gray-50 px-5 py-2.5 text-[11px] font-black text-gray-900 transition hover:bg-blue-50">
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 opacity-50" />
                        {title}
                      </span>
                      <FaChevronRight className="text-[8px] opacity-30 transition group-hover/category:opacity-100" />
                    </Link>
                    <div className="invisible absolute left-full top-0 z-[110] min-h-full w-[220px] rounded-r-xl border border-gray-100 bg-gray-50 opacity-0 shadow-[10px_0_30px_rgba(0,0,0,0.10)] transition group-hover/category:visible group-hover/category:opacity-100 group-focus-within/category:visible group-focus-within/category:opacity-100">
                      <div className="border-b border-gray-200 bg-white px-5 py-3 text-[11px] font-black text-blue-600">{label}</div>
                      {items.map((categoryItem) => (
                        <Link key={`${title}-${categoryItem}`} href="/landing#categories" onClick={(event) => { closeMenus(); scrollLandingSection(event, "categories"); }} className="block border-b border-black/[0.03] px-5 py-2.5 text-[10px] font-extrabold uppercase text-slate-700 transition hover:bg-blue-50 hover:pl-6 hover:text-blue-600">
                          {categoryItem}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/landing#contact" onClick={(event) => scrollLandingSection(event, "contact")} className="whitespace-nowrap transition hover:text-blue-300">CONTACT</Link>
          </div>
        </div>

        <div className="ml-auto flex flex-shrink-0 items-center gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setActivePanel("cart")}
            aria-label="Open cart"
            className="stackly-icon-button relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#06224C] shadow-sm"
          >
            <FaCartShopping className="text-sm" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-black text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onWishlistClick ?? (() => setActivePanel("wishlist"))}
            aria-label="Open wishlist"
            className="stackly-icon-button relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 shadow-sm"
          >
            {wishlistCount > 0 ? <FaHeart className="text-sm" /> : <FaRegHeart className="text-sm" />}
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {wishlistCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              closeMenus();
              setMobileOpen(false);

              const currentPath = window.location.pathname.replace(/\/+$/, "");
              const landingPath = assetPath("/landing").replace(/\/+$/, "");

              if (currentPath === landingPath || currentPath === "/landing") {
                window.dispatchEvent(new Event("stackly-open-search"));
                return;
              }

              window.sessionStorage.setItem("stackly-open-search-on-landing", "true");
              window.location.href = assetPath("/landing/");
            }}
            aria-label="Search"
            className="stackly-icon-button inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#06224C] shadow-sm"
          >
            <FaMagnifyingGlass className="text-sm" />
          </button>
          <div className="relative flex items-center">
            <button
              type="button"
              aria-label="User Profile"
              aria-expanded={isProfileMenuOpen}
              onClick={() => {
                setIsProfileMenuOpen((value) => !value);
                setActiveMenu(null);
              }}
              className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white/40 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(255,255,255,0.18)] focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 md:h-9 md:w-9"
            >
              <img src={assetPath("/profile.webp")} alt="User Profile Picture" className="h-full w-full object-cover" />
            </button>

            <div className={`${isProfileMenuOpen ? "block" : "hidden"} absolute right-0 top-full z-[100] mt-3 w-48 rounded-xl border border-gray-100 bg-white py-2 text-left shadow-2xl`}>
              <div className="mb-1 border-b border-gray-50 px-4 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">User Menu</p>
              </div>
              <Link href="/login" onClick={closeMenus} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                <FaCircleUser className="w-4 opacity-50" />
                ACCOUNT
              </Link>
              <Link href="/login" onClick={closeMenus} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600">
                <FaGear className="w-4 opacity-50" />
                SETTINGS
              </Link>
              <div className="mt-1 border-t border-gray-50">
                <Link href="/login" onClick={closeMenus} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-red-500 transition-colors hover:bg-red-50">
                  <FaRightFromBracket className="w-4" />
                  LOGOUT
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="stackly-mobile-menu border-t border-white/10 bg-[#06224C] py-4 text-[11px] font-bold uppercase tracking-widest text-white shadow-inner lg:hidden">
          <div className="flex flex-col">
            <Link href="/landing" onClick={() => setMobileOpen(false)} className="border-b border-white/5 px-6 py-4">Home</Link>
            <Link href="/landing#about" onClick={(event) => scrollLandingSection(event, "about", true)} className="border-b border-white/5 px-6 py-4">About Us</Link>

            <div>
              <button
                type="button"
                onClick={() => setMobileSection((section) => (section === "products" ? null : "products"))}
                className="flex w-full items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4 text-left"
              >
                <span className="flex items-center gap-3"><FaBoxOpen className="opacity-70" /> Our Products</span>
                <FaPlus className={`text-[8px] transition-transform ${mobileSection === "products" ? "rotate-45" : ""}`} />
              </button>
              {mobileSection === "products" && (
                <div className="border-b border-white/5 bg-[#051a3d] py-2">
                  {products.map((product) => (
                    <Link key={`mobile-${product}`} href="/landing#templates" onClick={(event) => scrollLandingSection(event, "templates", true)} className="block px-14 py-3 text-[10px] text-gray-300">
                      {product}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <button
                type="button"
                onClick={() => setMobileSection((section) => (section === "categories" ? null : "categories"))}
                className="flex w-full items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4 text-left"
              >
                <span className="flex items-center gap-3"><FaLayerGroup className="opacity-70" /> Categories</span>
                <FaPlus className={`text-[8px] transition-transform ${mobileSection === "categories" ? "rotate-45" : ""}`} />
              </button>
              {mobileSection === "categories" && (
                <div className="border-b border-white/5 bg-[#06224C]">
                  {navCategories.map(({ title, icon: Icon, items }) => (
                    <div key={`mobile-${title}`}>
                      <button
                        type="button"
                        onClick={() => setMobileCategory((category) => (category === title ? null : title))}
                        className="flex w-full items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4 text-left"
                      >
                        <span className="flex items-center gap-3"><Icon className="opacity-70" /> {title}</span>
                        <FaPlus className={`text-[8px] transition-transform ${mobileCategory === title ? "rotate-45" : ""}`} />
                      </button>
                      {mobileCategory === title && (
                        <div className="border-b border-white/5 bg-[#051a3d] py-2">
                          {items.map((item) => (
                            <Link key={`mobile-${title}-${item}`} href="/landing#categories" onClick={(event) => scrollLandingSection(event, "categories", true)} className="block px-14 py-3 text-[10px] text-gray-300">
                              {item}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link href="/landing#contact" onClick={(event) => scrollLandingSection(event, "contact", true)} className="px-6 py-4">Contact</Link>
          </div>
        </div>
      )}
    </header>

    {activePanel && (
      <>
        <button
          type="button"
          aria-label={`Close ${activePanel}`}
          onClick={() => setActivePanel(null)}
          className="fixed inset-0 z-[9998] bg-black/50"
        />
        <aside className="fixed right-0 top-0 z-[9999] flex h-full w-full flex-col bg-white shadow-2xl sm:w-[400px]">
          <div className="flex items-center justify-between border-b bg-white p-6 text-[#06224C]">
            <h2 className="flex items-center gap-3 text-lg font-black uppercase tracking-widest">
              {activePanel === "wishlist" ? <FaHeart className="text-red-500" /> : <FaCartShopping className="text-blue-600" />}
              {activePanel === "wishlist" ? "My Wishlist" : "My Cart"}
            </h2>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="text-gray-400 transition hover:rotate-90 hover:text-red-500"
              aria-label={`Close ${activePanel}`}
            >
              <FaXmark className="text-2xl" />
            </button>
          </div>

          <div className={`flex-grow overflow-y-auto ${activePanel === "cart" ? "p-0" : "space-y-6 p-6"}`}>
            {(activePanel === "wishlist" ? wishlistItems : cartItems).length === 0 ? (
              <div className="py-20 text-center">
                {activePanel === "wishlist" ? (
                  <FaRegHeart className="mx-auto mb-4 text-5xl text-gray-200" />
                ) : (
                  <FaCartShopping className="mx-auto mb-4 text-5xl text-gray-200" />
                )}
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Your {activePanel} is empty
                </p>
              </div>
            ) : activePanel === "cart" ? (
              <div className="divide-y divide-gray-100 px-6 py-8">
                {cartItems.map((storedItem) => {
                  const item = normalizeStoredItem(storedItem);
                  const title = storedItem.title || storedItem.name || item.title;

                  return (
                    <div key={`cart-${title}`} className="flex items-start gap-4 py-5 first:pt-0">
                      <img src={assetPath(item.image)} alt={item.alt} className="h-[72px] w-24 flex-shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-base font-black uppercase tracking-wide text-[#06224C]">{item.title}</h3>
                        <p className="mt-1 text-base font-black text-blue-600">
                          ${item.price} x {item.quantity}
                        </p>
                        <div className="mt-4 flex items-center gap-5">
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(title, -1)}
                            disabled={item.quantity <= 1}
                            className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-[#111827] transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300"
                            aria-label={`Decrease ${item.title} quantity`}
                          >
                            <FaMinus />
                          </button>
                          <span className="w-6 text-center text-lg font-black tabular-nums text-[#111827]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(title, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-[#111827] transition hover:bg-gray-200"
                            aria-label={`Increase ${item.title} quantity`}
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCartItem(title)}
                        className="mt-5 text-gray-300 transition hover:text-red-500"
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <FaTrashCan className="text-xl" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              wishlistItems.map((storedItem) => {
                const item = normalizeStoredItem(storedItem);
                const title = storedItem.title || storedItem.name || item.title;

                return (
                  <div key={`wishlist-${title}`} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                    <img src={assetPath(item.image)} alt={item.alt} className="h-16 w-20 flex-shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-black text-[#06224C]">{item.title}</h3>
                      <p className="text-xs italic text-gray-500">{item.type}</p>
                      <p className="mt-1 text-sm font-black text-blue-600">
                        {item.price ? `$ ${item.price}` : "Saved"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWishlistItem(title)}
                      className="text-gray-300 transition hover:text-red-500"
                      aria-label={`Remove ${item.title} from wishlist`}
                    >
                      <FaXmark />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {activePanel === "cart" ? (
            <div className="border-t bg-gray-50 px-6 py-8">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-[0.28em] text-gray-500">Subtotal</span>
                <span className="text-3xl font-black tabular-nums text-[#06224C]">${cartSubtotal.toFixed(2)}</span>
              </div>
              <button
                type="button"
                onClick={() => alert("Checkout is coming soon.")}
                className="flex w-full items-center justify-center rounded-2xl bg-[#06224C] px-6 py-5 text-sm font-black uppercase tracking-[0.35em] text-white shadow-xl transition hover:bg-blue-900 active:scale-[0.98]"
              >
                Checkout Now
              </button>
            </div>
          ) : (
            <div className="border-t bg-gray-50 p-6">
              <p className="text-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Items saved in wishlist are not reserved.
              </p>
            </div>
          )}
        </aside>
      </>
    )}
    </>
  );
}
