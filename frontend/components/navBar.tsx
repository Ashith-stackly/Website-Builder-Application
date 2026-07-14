"use client";
 
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
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
import { useAssetStore } from "@/store/assetStore";
import { useBuilderStore } from "@/store/builderStore";
import { useDesignStore } from "@/store/designStore";
import { useProjectStore } from "@/store/projectStore";
import { defaultUserSettings, readUserSettings, USER_SETTINGS_EVENT } from "@/lib/userSettings";
 
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
    title: "RESTAURANT",
    label: "RESTAURANTS",
    icon: FaUtensils,
    items: ["Burger House", "Pizza Corner", "Fresh & Natural", "Restaurant Stories", "Others"],
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
    items: ["Corporate", "Travel & Life", "Restaurant & Health", "Modern News", "Finance", "Education", "Portfolio", "Minimal", "Others"],
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
    items: ["Wedding", "Baby & Kids", "Fashion", "Studio Personal", "General/Portfolio", "Travel", "Event", "Restaurant", "Studio/Personal", "Others"],
  },
];
 
const HEADER_SPRING = { type: "spring" as const, stiffness: 320, damping: 30, mass: 0.9 };

const dropdownVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.97, transition: { duration: 0.15, ease: "easeOut" as const } },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 360, damping: 26 } },
};

const mobileMenuVariants = {
  closed: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.18, when: "afterChildren" as const, staggerChildren: 0.025, staggerDirection: -1 },
  },
  open: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 280, damping: 28, when: "beforeChildren" as const, staggerChildren: 0.045, delayChildren: 0.04 },
  },
};

const mobileItemVariants = {
  closed: { opacity: 0, x: -18 },
  open: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 340, damping: 26 } },
};

const iconButtonMotion = {
  whileHover: { y: -2, scale: 1.06 },
  whileFocus: { y: -2, scale: 1.06 },
  whileTap: { scale: 0.92 },
  transition: { type: "spring" as const, stiffness: 420, damping: 22 },
};

function ActiveIconHighlight() {
  return (
    <>
      <motion.span
        layoutId="stackly-active-nav-icon"
        className="pointer-events-none absolute -inset-0.5 rounded-full border-2 border-sky-300/80 bg-sky-50/70 shadow-[0_0_18px_rgba(56,189,248,0.42)]"
        transition={{ type: "spring", stiffness: 430, damping: 28 }}
      />
      <motion.span
        className="pointer-events-none absolute -bottom-2 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-blue-700"
        initial={{ opacity: 0, scaleX: 0.45, y: -2 }}
        animate={{ opacity: 1, scaleX: 1, y: 0 }}
        exit={{ opacity: 0, scaleX: 0.45, y: -2 }}
        transition={{ type: "spring", stiffness: 520, damping: 30 }}
      />
    </>
  );
}

function MotionNavItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span initial="rest" whileHover="hover" animate="rest" className={`relative inline-flex ${className}`}>
      <motion.span
        variants={{ rest: { y: 0 }, hover: { y: -1 } }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="inline-flex"
      >
        {children}
      </motion.span>
      <motion.span
        variants={{ rest: { scaleX: 0, opacity: 0 }, hover: { scaleX: 1, opacity: 1 } }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="pointer-events-none absolute -bottom-1.5 left-0 right-0 h-[2px] origin-left rounded-full bg-blue-300"
      />
    </motion.span>
  );
}

function AnimatedHamburger({ open }: { open: boolean }) {
  return (
    <span className="relative inline-flex h-4 w-5 items-center justify-center" aria-hidden>
      <motion.span
        className="absolute left-0 h-[2px] w-full rounded-full bg-current"
        animate={open ? { top: "50%", y: "-50%", rotate: 45 } : { top: "15%", y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      />
      <motion.span
        className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-current"
        animate={open ? { opacity: 0, scaleX: 0.5 } : { opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.15 }}
      />
      <motion.span
        className="absolute left-0 h-[2px] w-full rounded-full bg-current"
        animate={open ? { bottom: "50%", y: "50%", rotate: -45 } : { bottom: "15%", y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      />
    </span>
  );
}

type NavBarProps = {
  wishlistCount?: number;
  onWishlistClick?: () => void;
  keepVisible?: boolean;
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
const LOGOUT_STORAGE_KEYS = new Set([
  "cartItems",
  "cartCount",
  "wishlistItems",
  "buyscreenCartItemsV1",
  "buyscreenFavoriteIdsV1",
  "portfolioVideoData",
]);

function shouldClearOnLogout(key: string) {
  return key.toLowerCase().startsWith("stackly") || LOGOUT_STORAGE_KEYS.has(key);
}

function clearLogoutStorage(storage: Storage) {
  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key && shouldClearOnLogout(key)) {
      storage.removeItem(key);
    }
  }
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => (
    !element.hasAttribute("disabled") &&
    element.getAttribute("aria-hidden") !== "true" &&
    element.offsetParent !== null
  ));
}

function trapTabFocus(event: React.KeyboardEvent, container: HTMLElement | null) {
  if (event.key !== "Tab") {
    return;
  }

  const focusableElements = getFocusableElements(container);
  if (!focusableElements.length) {
    event.preventDefault();
    container?.focus();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey && (activeElement === firstElement || !container?.contains(activeElement))) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}
 
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
 
export default function NavBar({ wishlistCount: wishlistCountProp, onWishlistClick, keepVisible = false }: NavBarProps) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<StoredCommerceItem[]>([]);
  const [cartItems, setCartItems] = useState<StoredCommerceItem[]>([]);
  const [activePanel, setActivePanel] = useState<"wishlist" | "cart" | null>(null);
  const [cartToast, setCartToast] = useState<string | null>(null);

  const showCartToast = (message: string) => {
    setCartToast(message);
    window.setTimeout(() => setCartToast(null), 2200);
  };
  const [searchSelected, setSearchSelected] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  const [navbarSearchQuery, setNavbarSearchQuery] = useState("");
  const [focusedAction, setFocusedAction] = useState<"cart" | "wishlist" | "search" | "profile" | null>(null);
  const [activeMenu, setActiveMenu] = useState<"products" | "categories" | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<"products" | "categories" | null>(null);
  const [mobileCategory, setMobileCategory] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [displayUser, setDisplayUser] = useState(defaultUserSettings);
  const [scrollProgress, setScrollProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const activePanelRef = useRef<HTMLElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevScrollY = useRef(0);
  const keepVisibleRef = useRef(keepVisible);

  useEffect(() => {
    keepVisibleRef.current = keepVisible;
  });

  useEffect(() => {
    const refresh = () => setDisplayUser(readUserSettings());
    refresh();
    window.addEventListener(USER_SETTINGS_EVENT, refresh);
    return () => window.removeEventListener(USER_SETTINGS_EVENT, refresh);
  }, []);
 
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
        setIsSearchPanelOpen(false);
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchSelected || isSearchPanelOpen) {
      return;
    }

    const timer = window.setTimeout(() => setSearchSelected(false), 1600);
    return () => window.clearTimeout(timer);
  }, [isSearchPanelOpen, searchSelected]);

  useEffect(() => {
    if (!activePanel) {
      return;
    }

    const timer = window.setTimeout(() => {
      const firstFocusable = getFocusableElements(activePanelRef.current)[0];
      firstFocusable?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activePanel]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      const firstFocusable = getFocusableElements(profileMenuRef.current)[0];
      firstFocusable?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isProfileMenuOpen]);

  useEffect(() => {
    if (!isSearchPanelOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isSearchPanelOpen]);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const target = e.target as Element | Document;
      const isDocScroll =
        target === document ||
        target === document.documentElement ||
        target === document.body;

      if (!isDocScroll && target instanceof HTMLElement) {
        if (target.clientHeight < window.innerHeight * 0.4) return;
      }

      const current = target === document.body
        ? document.body.scrollTop
        : isDocScroll
          ? window.scrollY
          : (target as HTMLElement).scrollTop;
      const scrollHeight = target === document.body
        ? document.body.scrollHeight - document.body.clientHeight
        : isDocScroll
          ? document.documentElement.scrollHeight - window.innerHeight
          : (target as HTMLElement).scrollHeight - (target as HTMLElement).clientHeight;

      const prev = prevScrollY.current;
      prevScrollY.current = current;

      setIsScrolled(current > 8);
      setScrollProgress(scrollHeight > 0 ? Math.min(current / scrollHeight, 1) : 0);

      const locked = mobileOpen || Boolean(activeMenu) || isProfileMenuOpen || isSearchPanelOpen || Boolean(activePanel);
      if (locked || keepVisibleRef.current) {
        setHidden(false);
        return;
      }

      if (current > prev && current > 80) {
        setHidden(true);
      } else if (current < prev) {
        setHidden(false);
      }
    };

    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    return () => document.removeEventListener("scroll", handleScroll, { capture: true });
  }, [mobileOpen, activeMenu, isProfileMenuOpen, isSearchPanelOpen, activePanel]);

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
 
  const moveToCartFromWishlist = (storedItem: StoredCommerceItem) => {
    const item = normalizeStoredItem(storedItem);
    const title = storedItem.title || storedItem.name || item.title;

    const nextCart = [...cartItems];
    const existing = nextCart.find((i) => (i.title || i.name) === title);
    if (existing) {
      existing.quantity = (existing.quantity || existing.qty || 1) + 1;
      existing.qty = undefined;
    } else {
      nextCart.push({ ...item, quantity: 1, qty: undefined });
    }
    const nextCount = nextCart.reduce((total, i) => total + (i.quantity || i.qty || 1), 0);

    window.localStorage.setItem("cartItems", JSON.stringify(nextCart));
    window.localStorage.setItem("cartCount", String(nextCount));

    const nextWishlist = wishlistItems.filter((i) => (i.title || i.name) !== title);
    window.localStorage.setItem("wishlistItems", JSON.stringify(nextWishlist));

    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
  };
 
  const removeCartItem = (title: string) => {
    const next = cartItems.filter((item) => (item.title || item.name) !== title);
    const nextCount = next.reduce((total, item) => total + (item.quantity || item.qty || 1), 0);
    window.localStorage.setItem("cartItems", JSON.stringify(next));
    window.localStorage.setItem("cartCount", String(nextCount));
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
    showCartToast("Removed from cart successfully");
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
    setIsSearchPanelOpen(false);
    setSearchSelected(false);
  };
 
  const closeMenus = () => {
    setActiveMenu(null);
    setIsProfileMenuOpen(false);
  };

  const closeSearchPanel = () => {
    setIsSearchPanelOpen(false);
    setSearchSelected(false);
    setNavbarSearchQuery("");
  };

  const submitNavbarSearch = () => {
    const query = navbarSearchQuery.trim();
    setIsSearchPanelOpen(false);
    setSearchSelected(false);
    setNavbarSearchQuery("");

    if (!query) {
      return;
    }

    const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
    if (currentPath === "/landing") {
      window.dispatchEvent(new CustomEvent("stackly-navbar-search", { detail: query }));
      const newUrl = `${window.location.pathname}?search=${encodeURIComponent(query)}`;
      window.history.pushState(null, "", newUrl);
    } else {
      router.push(`/landing?search=${encodeURIComponent(query)}`);
    }
  };

  const handleLogout = useCallback(async () => {
    setActiveMenu(null);
    setIsProfileMenuOpen(false);
    setMobileOpen(false);
    setActivePanel(null);
    setWishlistItems([]);
    setCartItems([]);

    useBuilderStore.getState().resetBuilder();
    useProjectStore.getState().resetProjects();
    useDesignStore.getState().resetDesignStore();
    await useAssetStore.getState().resetAssets();

    clearLogoutStorage(window.localStorage);
    clearLogoutStorage(window.sessionStorage);
    window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
    router.push("/login");
  }, [router]);

  const navLockedVisible = mobileOpen || Boolean(activeMenu) || isProfileMenuOpen || isSearchPanelOpen || Boolean(activePanel);
  const navHidden = hidden && !navLockedVisible && !keepVisible;
 
  return (
    <>
    <motion.header
      className={`stackly-navbar sticky top-0 z-[5000] overflow-visible border-b px-2 py-3 transition-colors duration-300 will-change-transform md:px-12 ${isScrolled ? "border-white/15 bg-[#06224C]/90 shadow-[0_16px_44px_rgba(2,15,38,0.24)] backdrop-blur-xl" : "border-white/10 bg-[#06224C] shadow-sm backdrop-blur-none"}`}
      initial={false}
      animate={{
        y: navHidden ? -120 : 0,
        opacity: navHidden ? 0 : 1,
      }}
      transition={prefersReducedMotion ? { duration: 0 } : HEADER_SPRING}
    >
      <nav ref={navRef} className="relative mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 overflow-visible md:gap-4">
        <div className="flex min-w-0 items-center gap-1 md:gap-8">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md p-1 text-white transition hover:bg-white/10 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] lg:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <AnimatedHamburger open={mobileOpen} />
          </button>
 
          <Link
            href="/landing"
            className="inline-flex aspect-[2/1] min-w-[75px] items-center justify-center rounded-[60%] bg-white px-2 py-2 shadow-md transition hover:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] md:min-w-[90px] md:px-4 md:py-3"
            aria-label="Stackly home"
          >
            <img src={assetPath("/stackly-logo.webp")} alt="Stackly" className="h-3 w-auto object-contain md:h-5" />
          </Link>
 
          <div className="hidden items-center justify-center gap-12 text-[13px] font-bold uppercase tracking-wide text-white lg:flex">
            <Link href="/landing" className="stackly-nav-link whitespace-nowrap transition hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:rounded-sm"><MotionNavItem>HOME</MotionNavItem></Link>
            <Link href="/aboutus" className="stackly-nav-link whitespace-nowrap transition hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:rounded-sm"><MotionNavItem>ABOUT US</MotionNavItem></Link>
            <Link href="/templates" className="stackly-nav-link whitespace-nowrap transition hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:rounded-sm"><MotionNavItem>TEMPLATES</MotionNavItem></Link>
 
            <div
              className="relative"
              onBlurCapture={(e) => {
                const next = e.relatedTarget as Node | null;
                if (e.currentTarget.contains(next)) return;
                setActiveMenu(null);
              }}
            >
              <button
                type="button"
                onClick={() => toggleMenu("products")}
                className="stackly-nav-link inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1 transition hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-haspopup="true"
                aria-expanded={activeMenu === "products"}
              >
                <MotionNavItem>OUR PRODUCTS</MotionNavItem> <FaChevronDown className={`text-[10px] transition-transform ${activeMenu === "products" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>{activeMenu === "products" && (<motion.div key="products-dd" variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden" style={{ transformOrigin: "top left" }} className="absolute left-0 top-full z-[100] mt-2 w-48 rounded-xl border border-gray-100 bg-white py-3 shadow-2xl">
                {products.map((product) => (
                  <Link key={product} href="/landing#templates" onClick={(event) => { closeMenus(); scrollLandingSection(event, "templates"); }} className="block border-b border-gray-50 px-5 py-2.5 text-[11px] font-black text-gray-800 transition last:border-0 hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:bg-blue-50 focus-visible:text-blue-600">
                    {product}
                  </Link>
                ))}
              </motion.div>)}</AnimatePresence>
            </div>
 
            <div
              className="relative"
              onBlurCapture={(e) => {
                const next = e.relatedTarget as Node | null;
                if (e.currentTarget.contains(next)) return;
                setActiveMenu(null);
              }}
            >
              <button
                type="button"
                onClick={() => toggleMenu("categories")}
                className="stackly-nav-link inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-1 transition hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-haspopup="true"
                aria-expanded={activeMenu === "categories"}
              >
                <MotionNavItem>CATEGORIES</MotionNavItem> <FaChevronDown className={`text-[10px] transition-transform ${activeMenu === "categories" ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>{activeMenu === "categories" && (<motion.div key="categories-dd" variants={dropdownVariants} initial="hidden" animate="visible" exit="hidden" style={{ transformOrigin: "top left" }} className="absolute left-0 top-full z-[100] mt-2 w-[200px] rounded-xl border border-gray-100 bg-white py-2 shadow-2xl">
                {navCategories.map(({ title, label, icon: Icon, items }) => (
                  <div key={title} className="group/category relative">
                    <Link href="/landing#categories" onClick={(event) => { closeMenus(); scrollLandingSection(event, "categories"); }} className="flex items-center justify-between border-b border-gray-50 px-5 py-2.5 text-[11px] font-black text-gray-900 transition group-hover/category:bg-blue-50 focus-visible:outline-none focus-visible:bg-blue-50 focus-visible:text-blue-600">
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 opacity-50" />
                        {title}
                      </span>
                      <FaChevronRight className="text-[8px] opacity-30 transition group-hover/category:opacity-100" />
                    </Link>
                    <div className={`invisible absolute left-full z-[110] w-[220px] rounded-r-xl border border-gray-100 bg-gray-50 opacity-0 shadow-[10px_0_30px_rgba(0,0,0,0.10)] transition group-hover/category:visible group-hover/category:opacity-100 group-focus-within/category:visible group-focus-within/category:opacity-100 max-h-[300px] overflow-y-auto ${
                      ["BLOG", "EDUCATION", "NEWSPAPER", "PHOTOGRAPHY"].includes(title) ? "bottom-0" : "top-0"
                    }`}>
                      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-5 py-3 text-[11px] font-black text-blue-600">{label}</div>
                      {items.map((categoryItem) => (
                        <Link key={`${title}-${categoryItem}`} href="/landing#categories" onClick={(event) => { closeMenus(); scrollLandingSection(event, "categories"); }} className="block border-b border-black/[0.03] px-5 py-2.5 text-[10px] font-extrabold uppercase text-slate-700 transition hover:bg-blue-50 hover:pl-6 hover:text-blue-600 focus-visible:outline-none focus-visible:bg-blue-50 focus-visible:text-blue-600">
                          {categoryItem}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>)}</AnimatePresence>
            </div>
 
            <Link href="/landing#contact" onClick={(event) => scrollLandingSection(event, "contact")} className="stackly-nav-link whitespace-nowrap transition hover:text-blue-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:rounded-sm"><MotionNavItem>CONTACT</MotionNavItem></Link>
          </div>
        </div>
 
        <div className="ml-auto flex flex-shrink-0 items-center gap-2 md:gap-3">

          {/* ── CART BUTTON — CHANGE: added focus-visible ring ── */}
          <motion.button
            {...iconButtonMotion}
            type="button"
            onClick={() => {
              setSearchSelected(false);
              setIsSearchPanelOpen(false);
              setActivePanel("cart");
            }}
            aria-label="Open cart"
            aria-pressed={activePanel === "cart"}
            onFocus={() => setFocusedAction("cart")}
            onBlur={() => setFocusedAction(null)}
            className={`stackly-icon-button relative isolate inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] ${
              activePanel === "cart" || focusedAction === "cart"
                ? "scale-105 text-blue-700 ring-2 ring-sky-300 ring-offset-2 ring-offset-[#06224C] shadow-[0_8px_22px_rgba(56,189,248,0.32)]"
                : "text-[#06224C]"
            }`}
          >
            <AnimatePresence>{(activePanel === "cart" || focusedAction === "cart") && <ActiveIconHighlight />}</AnimatePresence>
            <FaCartShopping className="relative z-10 text-sm" />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 z-20 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[9px] font-black text-white">
                {cartCount}
              </span>
            )}
          </motion.button>

          {/* ── WISHLIST BUTTON — CHANGE: added focus-visible ring ── */}
          <motion.button
            {...iconButtonMotion}
            type="button"
            onClick={() => {
              setSearchSelected(false);
              setIsSearchPanelOpen(false);
              if (onWishlistClick) {
                onWishlistClick();
                return;
              }
              setActivePanel("wishlist");
            }}
            aria-label="Open wishlist"
            aria-pressed={activePanel === "wishlist"}
            onFocus={() => setFocusedAction("wishlist")}
            onBlur={() => setFocusedAction(null)}
            className={`stackly-icon-button relative isolate inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] ${
              activePanel === "wishlist" || focusedAction === "wishlist"
                ? "scale-105 text-red-600 ring-2 ring-sky-300 ring-offset-2 ring-offset-[#06224C] shadow-[0_8px_22px_rgba(56,189,248,0.32)]"
                : "text-red-500"
            }`}
          >
            <AnimatePresence>{(activePanel === "wishlist" || focusedAction === "wishlist") && <ActiveIconHighlight />}</AnimatePresence>
            {wishlistCount > 0 ? <FaHeart className="relative z-10 text-sm" /> : <FaRegHeart className="relative z-10 text-sm" />}
            {wishlistCount > 0 && (
              <span className="absolute -right-1 -top-1 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white">
                {wishlistCount}
              </span>
            )}
          </motion.button>

          {/* ── SEARCH BUTTON — CHANGE: added focus-visible ring ── */}
          <motion.button
            {...iconButtonMotion}
            type="button"
            onClick={() => {
              setSearchSelected((prev) => !prev);
              setIsSearchPanelOpen((prev) => !prev);
              setActivePanel(null);
              setIsProfileMenuOpen(false);
              closeMenus();
              setMobileOpen(false);
            }}
            aria-label="Search"
            aria-expanded={isSearchPanelOpen}
            aria-pressed={isSearchPanelOpen || searchSelected}
            onFocus={() => setFocusedAction("search")}
            onBlur={() => setFocusedAction(null)}
            className={`stackly-icon-button relative isolate inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] ${
              isSearchPanelOpen || searchSelected || focusedAction === "search"
                ? "scale-105 text-blue-700 ring-2 ring-sky-300 ring-offset-2 ring-offset-[#06224C] shadow-[0_8px_22px_rgba(56,189,248,0.32)]"
                : "text-[#06224C]"
            }`}
          >
            <AnimatePresence>{(isSearchPanelOpen || searchSelected || focusedAction === "search") && <ActiveIconHighlight />}</AnimatePresence>
            <FaMagnifyingGlass className="relative z-10 text-sm" />
          </motion.button>

          <div
            className="relative flex items-center"
            onBlurCapture={(e) => {
              const next = e.relatedTarget as Node | null;
              if (e.currentTarget.contains(next)) return;
              setIsProfileMenuOpen(false);
            }}
          >
            <motion.button
              {...iconButtonMotion}
              type="button"
              aria-label="User Profile"
              aria-expanded={isProfileMenuOpen}
              onFocus={() => setFocusedAction("profile")}
              onBlur={() => setFocusedAction(null)}
              onClick={() => {
                setSearchSelected(false);
                setIsSearchPanelOpen(false);
                setIsProfileMenuOpen((value) => !value);
                setActiveMenu(null);
              }}
              className={`relative isolate inline-flex h-9 w-9 items-center justify-center rounded-full bg-white p-[3px] shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(255,255,255,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06224C] active:scale-95 ${
                isProfileMenuOpen || focusedAction === "profile"
                  ? "scale-105 ring-2 ring-sky-300 ring-offset-2 ring-offset-[#06224C] shadow-[0_8px_22px_rgba(56,189,248,0.32)]"
                  : ""
              }`}
            >
              <AnimatePresence>{(isProfileMenuOpen || focusedAction === "profile") && <ActiveIconHighlight />}</AnimatePresence>
              <span className="relative z-10 h-full w-full overflow-hidden rounded-full">
                <img src={displayUser.avatar.startsWith("data:") ? displayUser.avatar : assetPath(displayUser.avatar)} alt={`${displayUser.name} profile picture`} className="h-full w-full object-cover" />
              </span>
            </motion.button>
 
            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  ref={profileMenuRef}
                  key="profile-dd"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  style={{ transformOrigin: "top right" }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setIsProfileMenuOpen(false);
                      return;
                    }

                    trapTabFocus(event, profileMenuRef.current);
                  }}
                  className="absolute right-0 top-full z-[100] mt-3 w-48 rounded-xl border border-gray-100 bg-white py-2 text-left shadow-2xl"
                >
                  <div className="mb-1 border-b border-gray-50 px-4 py-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">User Menu</p>
                  </div>
                  <Link href="/dashboard/settings#profile-settings" onClick={closeMenus} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:bg-blue-50 focus-visible:text-blue-600">
                    <FaCircleUser className="w-4 opacity-50" />
                    ACCOUNT
                  </Link>
                  <Link href="/dashboard/settings" onClick={closeMenus} className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-black text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:bg-blue-50 focus-visible:text-blue-600">
                    <FaGear className="w-4 opacity-50" />
                    SETTINGS
                  </Link>
                  <div className="mt-1 border-t border-gray-50">
                    <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[11px] font-black text-red-500 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:bg-red-50">
                      <FaRightFromBracket className="w-4" />
                      LOGOUT
                    </button>
                  </div>
                  <div className="border-t border-gray-50 px-3 pb-2.5 pt-2">
                    <Link
                      href="/planning"
                      onClick={closeMenus}
                      className="flex items-center justify-center gap-3 rounded-lg border-0 bg-gradient-to-r from-slate-950 to-blue-700 px-4 py-2.5 text-[11px] font-black text-white shadow-lg shadow-blue-950/20 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/30 hover:ring-2 hover:ring-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white active:translate-y-0 active:scale-100"
                    >
                      <FaLayerGroup className="w-4 opacity-80" />
                      SUBSCRIPTIONS
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {isSearchPanelOpen && (
            <motion.div
              ref={searchPanelRef}
              key="navbar-search-panel"
              tabIndex={-1}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 360, damping: 28 }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  closeSearchPanel();
                  return;
                }

                trapTabFocus(event, searchPanelRef.current);
              }}
              className="absolute right-0 top-[calc(100%+0.85rem)] z-[120] w-[min(92vw,440px)] rounded-2xl border border-white/70 bg-white p-2 text-left shadow-[0_24px_70px_rgba(2,15,38,0.28)] ring-1 ring-sky-200/70"
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitNavbarSearch();
                }}
                className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner transition focus-within:border-sky-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-sky-500/10"
              >
                <FaMagnifyingGlass className="ml-4 flex-shrink-0 text-sm text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={navbarSearchQuery}
                  onChange={(event) => setNavbarSearchQuery(event.target.value)}
                  placeholder="Search websites..."
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                  aria-label="Search websites"
                />
                <button
                  type="button"
                  onClick={closeSearchPanel}
                  className="mx-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 active:scale-95"
                  aria-label="Close search"
                >
                  <FaXmark />
                </button>
                <button
                  type="submit"
                  className="m-1 flex h-10 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#06224C] text-white shadow-lg transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-1 active:scale-95"
                  aria-label="Submit search"
                >
                  <FaMagnifyingGlass />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
 
      <AnimatePresence>
      {mobileOpen && (
        <motion.div
          className="stackly-mobile-menu mt-3 bg-[#06224C] pb-5 pt-3 text-[11px] font-bold uppercase tracking-widest text-white shadow-[inset_0_10px_24px_-12px_rgba(0,0,0,0.55)] lg:hidden max-h-[calc(100vh-95px)] overflow-y-auto overscroll-contain"
          variants={mobileMenuVariants}
          initial="closed"
          animate="open"
          exit="closed"
        >
          <div className="flex flex-col">
            <motion.div variants={mobileItemVariants} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}><Link href="/landing" onClick={() => setMobileOpen(false)} className="block border-b border-white/5 px-6 py-4 focus-visible:outline-none focus-visible:bg-white/10">Home</Link></motion.div>
            <motion.div variants={mobileItemVariants} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}><Link href="/aboutus" onClick={() => setMobileOpen(false)} className="block border-b border-white/5 px-6 py-4 focus-visible:outline-none focus-visible:bg-white/10">About Us</Link></motion.div>
            <motion.div variants={mobileItemVariants} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}><Link href="/templates" onClick={() => setMobileOpen(false)} className="block border-b border-white/5 px-6 py-4 focus-visible:outline-none focus-visible:bg-white/10">Templates</Link></motion.div>
 
            <motion.div variants={mobileItemVariants} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}>
              <button
                type="button"
                onClick={() => setMobileSection((section) => (section === "products" ? null : "products"))}
                className="flex w-full items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4 text-left focus-visible:outline-none focus-visible:bg-white/15"
              >
                <span className="flex items-center gap-3"><FaBoxOpen className="opacity-70" /> Our Products</span>
                <FaPlus className={`text-[8px] transition-transform ${mobileSection === "products" ? "rotate-45" : ""}`} />
              </button>
              {mobileSection === "products" && (
                <div className="border-b border-white/5 bg-[#051a3d] py-2">
                  {products.map((product) => (
                    <Link key={`mobile-${product}`} href="/landing#templates" onClick={(event) => scrollLandingSection(event, "templates", true)} className="block px-14 py-3 text-[10px] text-gray-300 focus-visible:outline-none focus-visible:bg-white/10 focus-visible:text-white">
                      {product}
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
 
            <motion.div variants={mobileItemVariants} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}>
              <button
                type="button"
                onClick={() => setMobileSection((section) => (section === "categories" ? null : "categories"))}
                className="flex w-full items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4 text-left focus-visible:outline-none focus-visible:bg-white/15"
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
                        className="flex w-full items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4 text-left focus-visible:outline-none focus-visible:bg-white/15"
                      >
                        <span className="flex items-center gap-3"><Icon className="opacity-70" /> {title}</span>
                        <FaPlus className={`text-[8px] transition-transform ${mobileCategory === title ? "rotate-45" : ""}`} />
                      </button>
                      {mobileCategory === title && (
                        <div className="border-b border-white/5 bg-[#051a3d] py-2">
                          {items.map((item) => (
                            <Link key={`mobile-${title}-${item}`} href="/landing#categories" onClick={(event) => scrollLandingSection(event, "categories", true)} className="block px-14 py-3 text-[10px] text-gray-300 focus-visible:outline-none focus-visible:bg-white/10 focus-visible:text-white">
                              {item}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
 
            <motion.div variants={mobileItemVariants} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}><Link href="/landing#contact" onClick={(event) => scrollLandingSection(event, "contact", true)} className="block px-6 py-4 focus-visible:outline-none focus-visible:bg-white/10">Contact</Link></motion.div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
      {/* Scroll progress bar */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-[2.5px] w-full origin-left bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300"
        style={{ scaleX: scrollProgress }}
      />
    </motion.header>

    <AnimatePresence>
      {mobileOpen && (
        <motion.button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-[4990] bg-black/45 backdrop-blur-sm lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        />
      )}
    </AnimatePresence>
 
    <AnimatePresence>
    {activePanel && (
      <>
        <motion.button
          type="button"
          aria-label={`Close ${activePanel}`}
          onClick={() => setActivePanel(null)}
          className="fixed inset-0 z-[9998] bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        />
        <motion.aside
          ref={activePanelRef}
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setActivePanel(null);
              return;
            }

            trapTabFocus(event, activePanelRef.current);
          }}
          className="fixed right-0 top-0 z-[9999] flex h-full w-full flex-col bg-white shadow-2xl sm:w-[400px]"
        >
          <div className="flex items-center justify-between border-b bg-white p-6 text-[#06224C]">
            <h2 className="flex items-center gap-3 text-lg font-black uppercase tracking-widest">
              {activePanel === "wishlist" ? <FaHeart className="text-red-500" /> : <FaCartShopping className="text-blue-600" />}
              {activePanel === "wishlist" ? "My Wishlist" : "My Cart"}
            </h2>
            <button
              type="button"
              onClick={() => setActivePanel(null)}
              className="text-gray-400 transition hover:rotate-90 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:rounded-full"
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
                            className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-[#111827] transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            aria-label={`Decrease ${item.title} quantity`}
                          >
                            <FaMinus />
                          </button>
                          <span className="w-6 text-center text-lg font-black tabular-nums text-[#111827]">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(title, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-md bg-gray-100 text-[#111827] transition hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                            aria-label={`Increase ${item.title} quantity`}
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCartItem(title)}
                        className="mt-5 text-gray-500 transition hover:text-red-600 focus-visible:outline-none focus-visible:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:rounded-md"
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
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <button
                        type="button"
                        onClick={() => moveToCartFromWishlist(storedItem)}
                        className="rounded-md bg-[#06224C] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1"
                      >
                        Add to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => removeWishlistItem(title)}
                        className="text-gray-500 transition hover:text-red-600 focus-visible:outline-none focus-visible:text-red-600 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:rounded-md"
                        aria-label={`Remove ${item.title} from wishlist`}
                      >
                        <FaXmark />
                      </button>
                    </div>
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
                className="flex w-full items-center justify-center rounded-2xl bg-[#06224C] px-6 py-5 text-sm font-black uppercase tracking-[0.35em] text-white shadow-xl transition hover:bg-blue-900 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
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
        </motion.aside>
      </>
    )}
    </AnimatePresence>

    {cartToast && (
      <div className="fixed bottom-5 right-5 z-[20001] rounded-xl bg-[#06224C] px-5 py-3 text-sm font-bold text-white shadow-2xl">
        {cartToast}
      </div>
    )}
    </>
  );
}
