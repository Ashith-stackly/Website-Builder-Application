"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { assetPath } from "@/lib/paths";

const buyCategories = [
  { label: "All Categories" },
  { label: "Products" },
  { label: "Blog" },
  { label: "Video Block" },
  { label: "Contact" },
  { label: "Limited Sale" },
  { label: "Best Seller" },
  { label: "New Arrivals" },
];

const buyAllSubCategories: Array<{ key: string; label: string; productIds: string[] }> = [
  { key: "mobiles", label: "Mobiles", productIds: ["phone"] },
  { key: "audio", label: "Audio", productIds: ["audio", "speaker"] },
  { key: "laptops", label: "Laptops", productIds: ["laptop"] },
  { key: "cameras", label: "Cameras", productIds: ["camera"] },
  { key: "televisions", label: "Televisions", productIds: ["television"] },
  { key: "tablets", label: "Tablets", productIds: ["tablet"] },
  { key: "wearables", label: "Wearables", productIds: ["watch"] },
  { key: "accessories", label: "Accessories", productIds: ["keyboard", "mouse"] },
];

const buyAllSubCategorySets = new Map(
  buyAllSubCategories.map((entry) => [entry.key, new Set(entry.productIds)])
);

type BuyFeatureIconType = "responsive" | "secure" | "shipping" | "transparent";

const buyFeatures: Array<{ icon: BuyFeatureIconType; title: string; subtitle: string }> = [
  { icon: "responsive", title: "Responsive", subtitle: "Customer service available 24/7" },
  { icon: "secure", title: "Secure", subtitle: "Certified marketplace since 2017" },
  { icon: "shipping", title: "Shipping", subtitle: "Fast, safe, and reliable worldwide" },
  { icon: "transparent", title: "Transparent", subtitle: "Hassle-free return policy" },
];

type BuyProduct = {
  id: string;
  name: string;
  image: string;
  badge: string;
  price: string;
  originalPrice?: string;
  unitPriceCents: number;
};

type CartItem = {
  product: BuyProduct;
  qty: number;
};

const buyProducts: BuyProduct[] = [
  { id: "phone", name: "Phone", image: assetPath("/phone.webp"), badge: "", price: "$899.00", unitPriceCents: 899_00 },
  { id: "audio", name: "Audio", image: assetPath("/audio.webp"), badge: "50%", price: "$149.00", originalPrice: "$298.00", unitPriceCents: 149_00 },
  { id: "laptop", name: "Laptop", image: assetPath("/laptop.webp"), badge: "", price: "$1,299.00", unitPriceCents: 129_900 },
  { id: "camera", name: "Camera", image: assetPath("/camera.webp"), badge: "", price: "$79.00", unitPriceCents: 79_00 },
  { id: "television", name: "Television", image: assetPath("/television.webp"), badge: "", price: "$599.00", unitPriceCents: 599_00 },
  { id: "tablet", name: "Tablet", image: assetPath("/tablet.webp"), badge: "", price: "$399.00", unitPriceCents: 399_00 },
  { id: "watch", name: "Watch", image: assetPath("/watch.webp"), badge: "", price: "$199.00", unitPriceCents: 199_00 },
  { id: "speaker", name: "Speaker", image: assetPath("/speaker.webp"), badge: "", price: "$89.00", unitPriceCents: 89_00 },
  { id: "keyboard", name: "Keyboard", image: assetPath("/keyboard.webp"), badge: "", price: "$49.00", unitPriceCents: 49_00 },
  { id: "mouse", name: "Mouse", image: assetPath("/mouse.webp"), badge: "", price: "$29.00", unitPriceCents: 29_00 },
];
const buyProductById = new Map(buyProducts.map((product) => [product.id, product]));

const buyCategorySpotlights = [
  {
    title: "Smartphones",
    subtitle: "Flagship cameras, all-day power, and smooth displays.",
    image: assetPath("/phone.webp"),
    subCategoryKey: "mobiles",
    accent: "from-[#e0f2fe] to-[#f8fafc]",
  },
  {
    title: "Workstations",
    subtitle: "Fast laptops and tablets for hybrid work and study.",
    image: assetPath("/laptop.webp"),
    subCategoryKey: "laptops",
    accent: "from-[#eef2ff] to-[#f8fafc]",
  },
  {
    title: "Home Audio",
    subtitle: "Portable speakers and headphones tuned for daily use.",
    image: assetPath("/speaker.webp"),
    subCategoryKey: "audio",
    accent: "from-[#fff7ed] to-[#f8fafc]",
  },
];

const buyDealHighlights = [
  { label: "Delivery", value: "48h" },
  { label: "Warranty", value: "1 year" },
  { label: "Support", value: "24/7" },
];

type BuyShoppingStepIcon = "browse" | "cart" | "checkout";

const buyShoppingSteps: Array<{ icon: BuyShoppingStepIcon; title: string; description: string }> = [
  { icon: "browse", title: "Choose gear", description: "Filter by category, compare essentials, and save favorites for later." },
  { icon: "cart", title: "Add license", description: "Pick quantity, review the cart, and keep every selected item synced locally." },
  { icon: "checkout", title: "Checkout fast", description: "Move from product discovery to a focused purchase flow without page clutter." },
];

const buyTestimonials = [
  {
    quote: "The catalog feels premium and quick. I can compare accessories and checkout without losing my place.",
    name: "Maya R.",
    role: "Product lead",
  },
  {
    quote: "Clean cards, clear pricing, and the wishlist flow make this storefront feel ready for real customers.",
    name: "Arjun K.",
    role: "Retail founder",
  },
  {
    quote: "The mobile view is polished. Filters, cart, and product actions stay easy to reach.",
    name: "Elena P.",
    role: "UX consultant",
  },
];

const buyBrandPartners = ["NovaTech", "PulseAudio", "SkyLens", "VoltWare", "PixelBay"];
const buyUpdateProducts = [
  { name: "Tablet", image: assetPath("/tablet.webp") },
  { name: "Watch", image: assetPath("/watch.webp") },
  { name: "Keyboard", image: assetPath("/keyboard.webp") },
];
const BUYSCREEN_CART_STORAGE_KEY = "buyscreenCartItemsV1";
const BUYSCREEN_FAVORITES_STORAGE_KEY = "buyscreenFavoriteIdsV1";
const STORAGE_SYNC_EVENT = "stackly-storage-change";

const bestSellerIds = new Set(["phone", "laptop", "television", "camera", "audio"]);
const newArrivalIds = new Set(["watch", "speaker", "keyboard", "mouse", "tablet"]);

const licenseBullets = [
  "Quality checked by Stackly before delivery.",
  "Stackly provides licenses ranging from 1 month to 1 year.",
  "Secure checkout and instant confirmation by email.",
];

const NAVY = "#06224C";

/** Fits ~1–5 cards in one row from track width (zoom / resize safe). */
function getCarouselColumnCount(widthPx: number): number {
  if (!widthPx || widthPx <= 0) return 1;
  const gapPx = 16;
  const minCardPx = 148;
  const n = Math.floor((widthPx + gapPx) / (minCardPx + gapPx));
  return Math.max(1, Math.min(5, n));
}

function formatUsd(cents: number): string {
  const n = cents / 100;
  const parts = n.toFixed(2).split(".");
  const intPart = parts[0] ?? "0";
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `$ ${withCommas}.${parts[1] ?? "00"}`;
}

function BuyProductActionButtons({
  isFavorite,
  onCartClick,
  onFavoriteClick,
  onShareClick,
  compact,
}: {
  isFavorite: boolean;
  onCartClick: () => void;
  onFavoriteClick: () => void;
  onShareClick: () => void;
  compact?: boolean;
}) {
  const size = compact ? "h-6 w-6 sm:h-6 sm:w-6" : "h-7 w-7 sm:h-8 sm:w-8";
  const shadow = compact ? "shadow-sm" : "shadow-md";
  const base =
    `flex shrink-0 items-center justify-center rounded-full border-2 border-[#ff664f] transition-colors duration-150 ${size} ${shadow}`;
  const inactive = `${base} bg-white text-[#ff664f] hover:bg-[#ff664f] hover:text-white`;
  const favoriteActive = `${base} bg-[#ff664f] text-white hover:bg-[#ff664f] hover:text-white`;
  const favoriteBtn = isFavorite ? favoriteActive : inactive;
  const icon = compact ? 11 : 14;
  return (
    <>
      <button type="button" className={inactive} aria-label="Add to cart" onClick={(e) => {
        e.stopPropagation();
        onCartClick();
      }}>
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L20.6 7H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="10" cy="19" r="1.5" fill="currentColor" />
          <circle cx="17" cy="19" r="1.5" fill="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        className={favoriteBtn}
        aria-label={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isFavorite}
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteClick();
        }}
      >
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 5.876 9.623 4.75 7.688 4.75 5.099 4.75 3 6.765 3 9.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={isFavorite ? "currentColor" : "none"}
          />
        </svg>
      </button>
      <button
        type="button"
        className={inactive}
        aria-label="Share product"
        onClick={(e) => {
          e.stopPropagation();
          onShareClick();
        }}
      >
        <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.6" />
          <path d="m15.5 6.5-7 3.5M8.5 13.5l7 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
    </>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="mt-0.5 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke={NAVY} strokeWidth="1.5" />
      <path d="m8 12 2.5 2.5L16 9" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuyStepIcon({ type }: { type: BuyShoppingStepIcon }) {
  if (type === "browse") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 9h8M8 13h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "cart") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M4 5h2l1.4 8.4a1.2 1.2 0 0 0 1.2 1H18a1.2 1.2 0 0 0 1.2-1L20.5 8H7.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="19" r="1.5" fill="currentColor" />
        <circle cx="17" cy="19" r="1.5" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 10h16M8 15h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="m15 15 1.3 1.3L19 13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuyQuoteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9.2 6.5c-2.4 1.5-3.6 3.6-3.6 6.3 0 2.2 1.2 3.7 3.2 3.7 1.5 0 2.6-1 2.6-2.5 0-1.4-1-2.4-2.5-2.4h-.4c.2-1.3 1-2.4 2.5-3.3L9.2 6.5Zm8 0c-2.4 1.5-3.6 3.6-3.6 6.3 0 2.2 1.2 3.7 3.2 3.7 1.5 0 2.6-1 2.6-2.5 0-1.4-1-2.4-2.5-2.4h-.4c.2-1.3 1-2.4 2.5-3.3L17.2 6.5Z" fill="currentColor" />
    </svg>
  );
}

function BuyMailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="m6.5 9 5.5 4 5.5-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


export default function StorefrontPreview() {
  const router = useRouter();
  const [activeProductStart, setActiveProductStart] = useState(0);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryLabel, setActiveCategoryLabel] = useState("All Categories");
  const [activeSubCategoryKey, setActiveSubCategoryKey] = useState<string | null>(null);
  const [isAllCategoriesDropdownOpen, setIsAllCategoriesDropdownOpen] = useState(false);
  const [isTopHeaderMenuOpen, setIsTopHeaderMenuOpen] = useState(false);
  const [topHeaderSearchQuery, setTopHeaderSearchQuery] = useState("");
  const [isTopHeaderSearchOpen, setIsTopHeaderSearchOpen] = useState(false);
  const [isTopHeaderProfileMenuOpen, setIsTopHeaderProfileMenuOpen] = useState(false);
  const [activeTopHeaderItem, setActiveTopHeaderItem] = useState("Home");
  const [showHeroScrollNote, setShowHeroScrollNote] = useState(false);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);
  const [hasLoadedFavorites, setHasLoadedFavorites] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favoriteProductIds, setFavoriteProductIds] = useState<string[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [licenseProduct, setLicenseProduct] = useState<BuyProduct | null>(null);
  const [licenseQty, setLicenseQty] = useState(1);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const contentStartRef = useRef<HTMLDivElement | null>(null);
  const allCategoriesWrapRef = useRef<HTMLDivElement | null>(null);
  const allCategoriesCloseTimerRef = useRef<number | null>(null);
  const userMenuWrapRef = useRef<HTMLDivElement | null>(null);

  const clearAllCategoriesCloseTimer = () => {
    if (allCategoriesCloseTimerRef.current !== null) {
      window.clearTimeout(allCategoriesCloseTimerRef.current);
      allCategoriesCloseTimerRef.current = null;
    }
  };

  const handleAllCategoriesMouseEnter = () => {
    clearAllCategoriesCloseTimer();
    setIsAllCategoriesDropdownOpen(true);
  };

  const handleAllCategoriesMouseLeave = () => {
    clearAllCategoriesCloseTimer();
    allCategoriesCloseTimerRef.current = window.setTimeout(() => {
      setIsAllCategoriesDropdownOpen(false);
    }, 200);
  };
  const featuredProductsRef = useRef<HTMLElement | null>(null);
  const heroContentRef = useRef<HTMLDivElement | null>(null);
  const topHeaderBarRef = useRef<HTMLDivElement | null>(null);
  const topHeaderSearchInputRef = useRef<HTMLInputElement | null>(null);
  const productsViewportRef = useRef<HTMLDivElement | null>(null);
  const productsTouchStartXRef = useRef<number | null>(null);
  const productsTouchStartYRef = useRef<number | null>(null);
  const [carouselCols, setCarouselCols] = useState(3);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BUYSCREEN_CART_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const restored: CartItem[] = parsed
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const productId = typeof entry.productId === "string" ? entry.productId : "";
          const qty = typeof entry.qty === "number" ? Math.floor(entry.qty) : 0;
          if (!productId || qty <= 0) return null;
          const product = buyProductById.get(productId);
          if (!product) return null;
          return { product, qty };
        })
        .filter((entry): entry is CartItem => entry !== null);
      if (restored.length) setCartItems(restored);
    } catch {
      // Ignore malformed storage and keep default empty cart.
    } finally {
      setHasLoadedCart(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCart) return;
    try {
      const serializable = cartItems.map((item) => ({
        productId: item.product.id,
        qty: item.qty,
      }));
      window.localStorage.setItem(BUYSCREEN_CART_STORAGE_KEY, JSON.stringify(serializable));
      window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
    } catch {
      // Ignore storage write failures.
    }
  }, [cartItems, hasLoadedCart]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(BUYSCREEN_FAVORITES_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const restored = parsed.filter((id): id is string => typeof id === "string" && buyProductById.has(id));
      if (restored.length) setFavoriteProductIds(restored);
    } catch {
      // Ignore malformed storage and keep default empty favorites.
    } finally {
      setHasLoadedFavorites(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedFavorites) return;
    try {
      window.localStorage.setItem(BUYSCREEN_FAVORITES_STORAGE_KEY, JSON.stringify(favoriteProductIds));
      window.dispatchEvent(new Event(STORAGE_SYNC_EVENT));
    } catch {
      // Ignore storage write failures.
    }
  }, [favoriteProductIds, hasLoadedFavorites]);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const categoryFilteredProducts = buyProducts.filter((product) => {
    if (activeSubCategoryKey) {
      const subSet = buyAllSubCategorySets.get(activeSubCategoryKey);
      if (subSet) return subSet.has(product.id);
    }
    if (activeCategoryLabel === "All Categories" || activeCategoryLabel === "Products") return true;
    if (activeCategoryLabel === "Limited Sale") return Boolean(product.badge);
    if (activeCategoryLabel === "Best Seller") return bestSellerIds.has(product.id);
    if (activeCategoryLabel === "New Arrivals") return newArrivalIds.has(product.id);
    return true;
  });
  const searchFilteredProducts = normalizedSearchQuery
    ? categoryFilteredProducts.filter((product) => product.name.toLowerCase().includes(normalizedSearchQuery))
    : categoryFilteredProducts;
  const totalProducts = searchFilteredProducts.length;
  const isSearching = normalizedSearchQuery.length > 0;
  const isCarouselMode = !showAllProducts && !isSearching;
  const visibleProductCount = isCarouselMode ? carouselCols : Number.POSITIVE_INFINITY;
  const visibleBuyProducts = totalProducts
    ? Array.from({ length: Math.min(visibleProductCount, totalProducts) }, (_, offset) => {
      const index = (activeProductStart + offset) % totalProducts;
      return searchFilteredProducts[index];
    })
    : [];
  const displayedProducts = isSearching || showAllProducts ? searchFilteredProducts : visibleBuyProducts;
  const favoriteProducts = favoriteProductIds
    .map((id) => buyProductById.get(id))
    .filter((product): product is BuyProduct => Boolean(product));

  const closeLicenseModal = useCallback(() => {
    setLicenseProduct(null);
    setLicenseQty(1);
  }, []);

  const openLicenseModal = useCallback((product: BuyProduct) => {
    setLicenseProduct(product);
    setLicenseQty(1);
  }, []);

  const showActionToast = useCallback((message: string) => {
    setActionToast(message);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setActionToast(null);
      toastTimerRef.current = null;
    }, 2200);
  }, []);

  const confirmLicensePurchase = useCallback(() => {
    if (!licenseProduct) return;
    const addedQty = licenseQty;
    const productName = licenseProduct.name;
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === licenseProduct.id);
      if (existing) {
        return prev.map((item) => (item.product.id === licenseProduct.id ? { ...item, qty: item.qty + licenseQty } : item));
      }
      return [...prev, { product: licenseProduct, qty: licenseQty }];
    });
    showActionToast(`${productName} added to cart (${addedQty})`);
    closeLicenseModal();
  }, [licenseProduct, licenseQty, closeLicenseModal, showActionToast]);

  const removeCartItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const toggleFavorite = useCallback(
    (product: BuyProduct) => {
      setFavoriteProductIds((prev) => {
        const isFavorite = prev.includes(product.id);
        showActionToast(isFavorite ? `${product.name} removed from favorites` : `${product.name} added to favorites`);
        return isFavorite ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      });
    },
    [showActionToast]
  );

  const removeFavoriteProduct = useCallback(
    (productId: string) => {
      const product = buyProductById.get(productId);
      setFavoriteProductIds((prev) => prev.filter((id) => id !== productId));
      if (product) showActionToast(`${product.name} removed from favorites`);
    },
    [showActionToast]
  );

  const shareProduct = useCallback(
    async (product: BuyProduct) => {
      const shareUrl = `${window.location.origin}${assetPath(`/e-commerce/?product=${encodeURIComponent(product.id)}`)}`;
      try {
        if (navigator.share) {
          await navigator.share({
            title: product.name,
            text: `Check out this product: ${product.name}`,
            url: shareUrl,
          });
          showActionToast(`${product.name} shared`);
          return;
        }
        await navigator.clipboard.writeText(shareUrl);
        showActionToast(`Share link copied for ${product.name}`);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        showActionToast("Unable to share right now");
      }
    },
    [showActionToast]
  );

  useEffect(() => {
    if (!licenseProduct && !isCartOpen && !isFavoritesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (licenseProduct) closeLicenseModal();
      if (isCartOpen) setIsCartOpen(false);
      if (isFavoritesOpen) setIsFavoritesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [licenseProduct, isCartOpen, isFavoritesOpen, closeLicenseModal]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
      clearAllCategoriesCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (!isAllCategoriesDropdownOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!allCategoriesWrapRef.current?.contains(target)) {
        setIsAllCategoriesDropdownOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [isAllCategoriesDropdownOpen]);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!userMenuWrapRef.current?.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsUserMenuOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    const el = heroContentRef.current;
    if (!el) return;
    const check = () => {
      setShowHeroScrollNote(el.scrollHeight - el.clientHeight > 3);
    };
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    window.addEventListener("resize", check);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", check);
    };
  }, []);

  useLayoutEffect(() => {
    if (!isCarouselMode) return;
    const el = productsViewportRef.current;
    if (!el) return;
    const measure = () => {
      setCarouselCols(getCarouselColumnCount(el.getBoundingClientRect().width));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isCarouselMode]);

  function moveProducts(direction: number) {
    if (!totalProducts) return;
    setActiveProductStart((prev) => (prev + direction + totalProducts) % totalProducts);
  }

  const handleCategoryClick = useCallback(
    (label: string) => {
      if (label === "Blog" || label === "Contact") {
        router.push("/page-not-found");
        return;
      }
      setActiveSubCategoryKey(null);
      setIsAllCategoriesDropdownOpen(false);
      setIsUserMenuOpen(false);
      setActiveCategoryLabel(label);
      setShowAllProducts(false);
      setSearchQuery("");
      setActiveProductStart(0);
      featuredProductsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsCategoryMenuOpen(false);
    },
    [router]
  );

  const handleSubCategoryClick = useCallback((key: string) => {
    setActiveCategoryLabel("All Categories");
    setActiveSubCategoryKey(key);
    setIsAllCategoriesDropdownOpen(false);
    setIsUserMenuOpen(false);
    setShowAllProducts(false);
    setSearchQuery("");
    setActiveProductStart(0);
    featuredProductsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setIsCategoryMenuOpen(false);
  }, []);

  const handleTopHeaderItemClick = useCallback(
    (item: string) => {
      setActiveTopHeaderItem(item);
      setIsTopHeaderMenuOpen(false);
      setIsTopHeaderSearchOpen(false);
      setIsTopHeaderProfileMenuOpen(false);

      if (item === "Home") {
        window.requestAnimationFrame(() => {
          contentStartRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }

      router.push("/page-not-found");
    },
    [router],
  );

  const handleProductsTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isCarouselMode || typeof window === "undefined" || window.innerWidth > 1023 || e.touches.length !== 1) return;
      productsTouchStartXRef.current = e.touches[0]?.clientX ?? null;
      productsTouchStartYRef.current = e.touches[0]?.clientY ?? null;
    },
    [isCarouselMode]
  );

  const handleProductsTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const startX = productsTouchStartXRef.current;
    const startY = productsTouchStartYRef.current;
    if (startX == null || startY == null || e.touches.length !== 1) return;
    const dx = (e.touches[0]?.clientX ?? startX) - startX;
    const dy = (e.touches[0]?.clientY ?? startY) - startY;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
  }, []);

  const handleProductsTouchCancel = useCallback(() => {
    productsTouchStartXRef.current = null;
    productsTouchStartYRef.current = null;
  }, []);

  const handleProductsTouchFinal = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const startX = productsTouchStartXRef.current;
      const startY = productsTouchStartYRef.current;
      const endTouch = e.changedTouches[0];
      productsTouchStartXRef.current = null;
      productsTouchStartYRef.current = null;
      if (!isCarouselMode || startX == null || startY == null || !endTouch) return;
      const dx = endTouch.clientX - startX;
      const dy = endTouch.clientY - startY;
      if (Math.abs(dx) < 28 || Math.abs(dx) <= Math.abs(dy)) return;
      moveProducts(dx < 0 ? 1 : -1);
    },
    [isCarouselMode, moveProducts]
  );

  function BuyFeatureIcon({ type }: { type: BuyFeatureIconType }) {
    if (type === "responsive") {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M4 13a8 8 0 0 1 16 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M5 13v3a2 2 0 0 0 2 2h1v-5H7a2 2 0 0 0-2 2Zm14 0h-1v5h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 17v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (type === "secure") {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 3 5 6v6c0 4.2 2.6 7.2 7 9 4.4-1.8 7-4.8 7-9V6l-7-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (type === "shipping") {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M3 7h11v8H3V7Zm11 2h4l3 3v3h-7V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="8" cy="17" r="1.5" fill="currentColor" />
          <circle cx="18" cy="17" r="1.5" fill="currentColor" />
        </svg>
      );
    }
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <path d="M3 12a9 9 0 0 1 15.4-6.4M21 12a9 9 0 0 1-15.4 6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16.5 3.5v3h3M7.5 20.5v-3h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const productGridClass = showAllProducts || isSearching
    ? "buyscreen-products--grid grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-5"
    : "buyscreen-products--carousel";
  const carouselSlots = isCarouselMode ? Math.max(1, carouselCols) : 1;

  const lineTotalCents = licenseProduct ? licenseProduct.unitPriceCents * licenseQty : 0;
  const cartTotalCents = cartItems.reduce((sum, item) => sum + item.product.unitPriceCents * item.qty, 0);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <main className="@container buyscreen-page flex min-h-[100dvh] w-full max-w-full min-w-0 flex-col overflow-x-hidden bg-[#f5f7fb] text-[#111827] box-border">
      <style dangerouslySetInnerHTML={{
        __html: `
          .buyscreen-page {
            max-width: 100%;
            min-width: 0;
            overflow-x: hidden;
            box-sizing: border-box;
          }

          .buyscreen-page h1,
          .buyscreen-page h2,
          .buyscreen-page h3,
          .buyscreen-page h4,
          .buyscreen-page p,
          .buyscreen-page span,
          .buyscreen-page a,
          .buyscreen-page button {
            overflow-wrap: break-word;
            word-wrap: break-word;
            min-width: 0;
            max-width: 100%;
          }

          @container (max-width: 1024px) {
            /* 1. Fluid Layouts & Remove Fixed Constraints */
            .buyscreen-page .w-96, .buyscreen-page .w-80, .buyscreen-page .w-72, .buyscreen-page .w-64, .buyscreen-page .w-56, .buyscreen-page .w-48, .buyscreen-page .max-w-md, .buyscreen-page .max-w-sm, .buyscreen-page .max-w-lg, .buyscreen-page .w-[350px] {
              max-width: 100% !important;
              width: 100% !important;
            }
            .buyscreen-page .h-96, .buyscreen-page .h-80, .buyscreen-page .h-72, .buyscreen-page .h-64, .buyscreen-page .h-48 {
              height: auto !important;
            }

            /* 2. Prevent Text Overflow */
            .buyscreen-page h1, .buyscreen-page h2, .buyscreen-page h3, .buyscreen-page h4, .buyscreen-page p, .buyscreen-page span, .buyscreen-page a, .buyscreen-page button {
              overflow-wrap: break-word !important;
              word-wrap: break-word !important;
              hyphens: auto !important;
              white-space: normal !important;
            }

            /* 3. Responsive Clamp Fonts */
            .buyscreen-page h1 { font-size: clamp(1.5rem, 5cqi, 3rem) !important; line-height: 1.2 !important; }
            .buyscreen-page h2 { font-size: clamp(1.25rem, 4cqi, 2.5rem) !important; line-height: 1.2 !important; }
            .buyscreen-page h3 { font-size: clamp(1rem, 3cqi, 2rem) !important; line-height: 1.3 !important; }
            .buyscreen-page p { font-size: clamp(0.875rem, 2.5cqi, 1.125rem) !important; line-height: 1.5 !important; }
            .buyscreen-page button { font-size: clamp(0.75rem, 2cqi, 1rem) !important; }

            /* 4. Images */
            .buyscreen-page img, .buyscreen-page svg:not(.buyscreen-header-action-icon) {
              max-width: 100% !important;
              height: auto !important;
              object-fit: contain !important;
              flex-shrink: 0 !important;
            }

            /* 5. Flexbox Wrapping for general sections, protect header icons */
            .buyscreen-page header, .buyscreen-page section {
              min-width: 0 !important;
              max-width: 100% !important;
              overflow: hidden !important;
            }
            .buyscreen-page .flex {
              min-width: 0 !important;
            }
            .buyscreen-page .flex-row {
              flex-wrap: wrap !important;
            }
            
            /* Protect icons/buttons from shrinking or wrapping unreadably */
            .buyscreen-page button, .buyscreen-page .shrink-0 {
              flex-shrink: 0 !important;
            }

            /* 6. Hero Banner Overlay Fix (Responsive) */
            .buyscreen-page .buyscreen-hero {
              position: relative !important;
              overflow: hidden !important;
              border-radius: 1.75rem !important;
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              padding: 3rem 1.5rem !important;
              min-height: min-content !important;
              height: auto !important;
              width: 100% !important;
            }
            .buyscreen-page .buyscreen-hero > picture {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              flex-shrink: unset !important;
            }
            .buyscreen-page .buyscreen-hero > picture img {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              object-fit: cover !important;
              object-position: center !important;
              max-height: none !important;
            }
            .buyscreen-page .buyscreen-hero-overlay {
              display: block !important;
              position: absolute !important;
              inset: 0 !important;
              z-index: 1 !important;
            }
            .buyscreen-page .buyscreen-hero-content {
              position: relative !important;
              z-index: 10 !important;
              text-align: center !important;
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              padding: 0 !important;
            }
          }

          @container (max-width: 480px) {
             .buyscreen-page .gap-8 { gap: 1rem !important; }
             .buyscreen-page .gap-6 { gap: 0.75rem !important; }
             .buyscreen-page .p-8 { padding: 1rem !important; }
             .buyscreen-page .p-6 { padding: 0.75rem !important; }
          }
        `
      }} />
      {licenseProduct ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6">
          <button
            type="button"
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={closeLicenseModal}
          />
          <div
            role="dialog"
            aria-modal
            aria-labelledby="buyscreen-license-title"
            className="relative z-10 my-auto flex max-h-[min(90dvh,720px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl sm:max-h-[85dvh]"
          >
            <div className="shrink-0 border-b border-[#eef2f7] p-6 pb-4 sm:p-8 sm:pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="buyscreen-license-title" className="text-base font-semibold sm:text-lg" style={{ color: NAVY }}>
                    Regular license
                  </h2>
                  <p className="mt-1 text-xs text-[#6b7280]">
                    {licenseProduct.name} · {licenseProduct.price} each
                  </p>
                </div>
                <p className="whitespace-nowrap text-lg font-bold tabular-nums sm:text-xl" style={{ color: NAVY }}>
                  {formatUsd(lineTotalCents)}
                </p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-5 sm:px-8 sm:pb-8">
              <ul className="space-y-3 text-sm text-[#374151]">
                {licenseBullets.map((line) => (
                  <li key={line} className="flex gap-2">
                    <CheckIcon />
                    <span className="leading-snug">{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 grid grid-cols-3 items-center gap-2 rounded-full border-2 p-2 sm:px-3" style={{ borderColor: NAVY }}>
                <button
                  type="button"
                  className="justify-self-start flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:h-9 sm:w-9"
                  style={{ backgroundColor: NAVY }}
                  aria-label="Decrease quantity"
                  disabled={licenseQty <= 1}
                  onClick={() => setLicenseQty((q) => Math.max(1, q - 1))}
                >
                  <span className="text-lg font-light leading-none">−</span>
                </button>
                <div className="min-w-0 w-full rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-2 py-1.5 text-center text-lg font-semibold tabular-nums text-[#0f172a]">
                  {licenseQty}
                </div>
                <button
                  type="button"
                  className="justify-self-end flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-opacity hover:opacity-90 sm:h-9 sm:w-9"
                  style={{ backgroundColor: NAVY }}
                  aria-label="Increase quantity"
                  onClick={() => setLicenseQty((q) => q + 1)}
                >
                  <span className="text-lg font-light leading-none">+</span>
                </button>
              </div>

              <button
                type="button"
                className="mt-6 w-full rounded-xl py-3.5 text-center text-sm font-bold text-white transition-opacity hover:opacity-95 sm:text-base"
                style={{ backgroundColor: NAVY }}
                onClick={confirmLicensePurchase}
              >
                Confirm To Buy
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isCartOpen ? (
        <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6">
          <button type="button" className="fixed inset-0 bg-black/45 backdrop-blur-[1px]" aria-label="Close cart" onClick={() => setIsCartOpen(false)} />
          <div
            role="dialog"
            aria-modal
            aria-labelledby="buyscreen-cart-title"
            className="relative z-10 my-auto flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl sm:max-h-[85dvh]"
          >
            <div className="shrink-0 border-b border-[#eef2f7] p-6 pb-4 sm:p-8 sm:pb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id="buyscreen-cart-title" className="text-lg font-semibold text-[#06224C]">
                  Your cart
                </h2>
                <p className="text-sm font-bold tabular-nums text-[#06224C]">{formatUsd(cartTotalCents)}</p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
              {cartItems.length ? (
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-[#111827]">{item.product.name}</p>
                        <p className="text-xs text-[#6b7280]">
                          {item.product.price} x {item.qty}
                        </p>
                      </div>
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
                        <span className="text-sm font-bold tabular-nums text-[#111827]">{formatUsd(item.product.unitPriceCents * item.qty)}</span>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.product.id)}
                          className="w-full rounded-md border border-[#fecaca] px-2 py-1 text-xs font-semibold text-[#dc2626] hover:bg-[#fef2f2] sm:w-auto"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-4 text-sm text-[#6b7280]">
                  Your cart is empty. Add products from Featured Products.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {isFavoritesOpen ? (
        <div className="fixed inset-0 z-[109] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6">
          <button type="button" className="fixed inset-0 bg-black/45 backdrop-blur-[1px]" aria-label="Close favorites" onClick={() => setIsFavoritesOpen(false)} />
          <div
            role="dialog"
            aria-modal
            aria-labelledby="buyscreen-favorites-title"
            className="relative z-10 my-auto flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl sm:max-h-[85dvh]"
          >
            <div className="shrink-0 border-b border-[#eef2f7] p-6 pb-4 sm:p-8 sm:pb-4">
              <div className="flex items-center justify-between gap-3">
                <h2 id="buyscreen-favorites-title" className="text-lg font-semibold text-[#06224C]">
                  Your favorites
                </h2>
                <p className="text-sm font-bold tabular-nums text-[#06224C]">{favoriteProducts.length} item{favoriteProducts.length === 1 ? "" : "s"}</p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
              {favoriteProducts.length ? (
                <div className="space-y-3">
                  {favoriteProducts.map((product) => (
                    <div key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-[#111827]">{product.name}</p>
                        <p className="text-xs text-[#6b7280]">{product.price}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFavoriteProduct(product.id)}
                        className="w-full rounded-md border border-[#fecaca] px-2 py-1 text-xs font-semibold text-[#dc2626] hover:bg-[#fef2f2] sm:w-auto"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-4 text-sm text-[#6b7280]">
                  Your favorites list is empty. Tap the heart icon on a product to save it.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <section className="hidden">
        <div ref={topHeaderBarRef}>
          <div className="buyscreen-top-header-inner mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Mobile / tablet / desktop-zoom: hamburger + logo + actions (cart/search/profile stay right) */}
            <div className="buyscreen-top-header-row buyscreen-top-header-mobile-row flex min-w-0 flex-wrap items-center justify-between gap-2 py-2.5 lg:hidden">
              <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTopHeaderMenuOpen((v) => !v)}
                  className="inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md border border-white/25 text-white transition-colors hover:bg-white/15 planning-zoom-show-hamburger"
                  aria-label="Toggle top navigation menu"
                  aria-expanded={isTopHeaderMenuOpen}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M3 5.5H17M3 10H17M3 14.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
                <div className="flex h-7 min-w-[70px] sm:h-9 sm:min-w-[92px] shrink-0 items-center justify-center overflow-hidden rounded-[50%] bg-white px-2 sm:px-3">
                  <Image src={assetPath("/stackly-logo.webp")} alt="Stackly logo" width={160} height={40} className="h-[14px] w-auto sm:h-[20px]" unoptimized />
                </div>
              </div>

              <div className="buyscreen-top-header-actions flex shrink-0 items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/80 text-white transition-colors hover:bg-white/15 hover:text-[#fef3c7] sm:h-8 sm:w-8"
                  aria-label="Cart"
                  onClick={() => router.push("/page-not-found")}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L20.6 7H7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="19" r="1.4" fill="currentColor" />
                    <circle cx="17" cy="19" r="1.4" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#06224C] transition-colors hover:bg-[#fef3c7] hover:text-[#06224C] sm:h-8 sm:w-8"
                  aria-label="Search"
                  aria-expanded={isTopHeaderSearchOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTopHeaderSearchOpen((v) => !v);
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </button>
                <div data-top-header-profile-wrap className="buyscreen-user-menu-wrap relative shrink-0">
                  <button
                    type="button"
                    className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 transition-colors hover:border-[#fef3c7] hover:bg-white/10 sm:h-8 sm:w-8"
                    aria-label="Profile"
                    aria-expanded={isTopHeaderProfileMenuOpen}
                    aria-haspopup="menu"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTopHeaderProfileMenuOpen((prev) => !prev);
                    }}
                  >
                    <Image src={assetPath("/photo.webp")} alt="Profile" width={36} height={36} className="block h-full w-full object-cover" unoptimized />
                  </button>
                  <div
                    className={`buyscreen-user-menu-dropdown ${isTopHeaderProfileMenuOpen ? "buyscreen-user-menu-dropdown--open" : ""}`}
                    role="menu"
                    aria-hidden={!isTopHeaderProfileMenuOpen}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="buyscreen-user-menu-item"
                      onClick={() => {
                        setIsTopHeaderProfileMenuOpen(false);
                        router.push("/login");
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop: equal space between each segment — logo … nav links … actions (cart stays right with inner icon gaps) */}
            <div className="buyscreen-top-header-row buyscreen-top-header-desktop-row hidden w-full min-w-0 items-center py-3 lg:flex">
              <nav
                className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-0 text-[13px] font-semibold text-white"
                aria-label="Main"
              >
                <div className="flex h-9 min-w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[50%] bg-white px-3">
                  <Image src={assetPath("/stackly-logo.webp")} alt="Stackly logo" width={160} height={40} className="h-[20px] w-auto" unoptimized />
                </div>
                <button
                  type="button"
                  className={`buyscreen-top-header-nav-item shrink-0 whitespace-nowrap text-[13px] font-semibold${activeTopHeaderItem === "Home" ? " buyscreen-top-header-nav-item--active" : ""}`}
                  onClick={() => handleTopHeaderItemClick("Home")}
                >
                  Home
                </button>
                <button
                  type="button"
                  className={`buyscreen-top-header-nav-item shrink-0 whitespace-nowrap text-[13px] font-semibold${activeTopHeaderItem === "About Us" ? " buyscreen-top-header-nav-item--active" : ""}`}
                  onClick={() => handleTopHeaderItemClick("About Us")}
                >
                  About Us
                </button>
                <button
                  type="button"
                  className={`buyscreen-top-header-nav-item inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px] font-semibold${activeTopHeaderItem === "Our Products" ? " buyscreen-top-header-nav-item--active" : ""}`}
                  onClick={() => handleTopHeaderItemClick("Our Products")}
                >
                  Our Products
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
                    <path d="m5.5 7.5 4.5 5 4.5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`buyscreen-top-header-nav-item inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px] font-semibold${activeTopHeaderItem === "Categories" ? " buyscreen-top-header-nav-item--active" : ""}`}
                  onClick={() => handleTopHeaderItemClick("Categories")}
                >
                  Categories
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
                    <path d="m5.5 7.5 4.5 5 4.5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`buyscreen-top-header-nav-item shrink-0 whitespace-nowrap text-[13px] font-semibold${activeTopHeaderItem === "Contact" ? " buyscreen-top-header-nav-item--active" : ""}`}
                  onClick={() => handleTopHeaderItemClick("Contact")}
                >
                  Contact
                </button>
                <div className="buyscreen-top-header-actions flex shrink-0 items-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/90 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/15 hover:text-[#fef3c7]"
                    aria-label="Cart"
                    onClick={() => router.push("/page-not-found")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L20.6 7H7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10" cy="19" r="1.4" fill="currentColor" />
                      <circle cx="17" cy="19" r="1.4" fill="currentColor" />
                    </svg>
                    Cart
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#06224C] transition-colors hover:bg-[#fef3c7] hover:text-[#06224C]"
                    aria-label="Search"
                    aria-expanded={isTopHeaderSearchOpen}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsTopHeaderSearchOpen((v) => !v);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    </svg>
                  </button>
                  <div data-top-header-profile-wrap className="buyscreen-user-menu-wrap relative shrink-0">
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 transition-colors hover:border-[#fef3c7] hover:bg-white/10"
                      aria-label="Profile"
                      aria-expanded={isTopHeaderProfileMenuOpen}
                      aria-haspopup="menu"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTopHeaderProfileMenuOpen((prev) => !prev);
                      }}
                    >
                      <Image src={assetPath("/photo.webp")} alt="Profile" width={36} height={36} className="block h-full w-full object-cover" unoptimized />
                    </button>
                    <div
                      className={`buyscreen-user-menu-dropdown ${isTopHeaderProfileMenuOpen ? "buyscreen-user-menu-dropdown--open" : ""}`}
                      role="menu"
                      aria-hidden={!isTopHeaderProfileMenuOpen}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="buyscreen-user-menu-item"
                        onClick={() => {
                          setIsTopHeaderProfileMenuOpen(false);
                          router.push("/login");
                        }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </nav>
            </div>
          </div>
          {isTopHeaderSearchOpen ? (
            <div className="border-t border-white/20">
              <div className="mx-auto w-full max-w-7xl px-4 pb-3 pt-2 sm:px-6 lg:px-8">
                <label className="flex h-10 w-full items-center gap-2 rounded-md border-2 border-[#cbd5e1] bg-white px-3 text-sm text-[#4b5563]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#374151]" aria-hidden>
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  <input
                    ref={topHeaderSearchInputRef}
                    type="search"
                    value={topHeaderSearchQuery}
                    onChange={(e) => {
                      setTopHeaderSearchQuery(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      e.preventDefault();
                      setIsTopHeaderSearchOpen(false);
                      router.push("/page-not-found");
                    }}
                    placeholder="Search..."
                    className="min-w-0 flex-1 bg-transparent text-[#4b5563] outline-none placeholder:text-[#4b5563] placeholder:opacity-100"
                    aria-label="Search products"
                  />
                </label>
              </div>
            </div>
          ) : null}
        </div>
        {isTopHeaderMenuOpen ? (
          <div className="border-t border-white/20 lg:hidden planning-zoom-show-mobile-menu">
            <div className="mx-auto w-full max-w-7xl px-4 pb-3 pt-2 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 gap-2">
                {["Home", "About Us", "Our Products", "Categories", "Video Block", "Contact"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`buyscreen-top-header-nav-item buyscreen-top-header-nav-item--grid px-2 py-2 text-left text-xs${activeTopHeaderItem === item ? " buyscreen-top-header-nav-item--active" : ""}`}
                    onClick={() => handleTopHeaderItemClick(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <div ref={contentStartRef} className="mx-auto w-full max-w-7xl px-4 pb-8 pt-5 sm:px-6 sm:pb-10 sm:pt-7 lg:px-8 lg:pb-12">

        <div className="buyscreen-promo-strip mb-5 flex flex-col gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-[0_18px_45px_rgba(15,35,75,0.08)] backdrop-blur sm:mb-7 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2563eb]">Stackly marketplace preview</p>
            <p className="mt-1 text-sm font-semibold text-[#334155]">Explore electronics with cart, favorites, search, and category filtering.</p>
          </div>
          <button
            type="button"
            className="inline-flex w-full shrink-0 items-center justify-center rounded-full bg-[#06224C] px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_14px_30px_rgba(6,34,76,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#0f3b89] sm:w-auto"
            onClick={() => router.push("/page-not-found")}
          >
            Buy Now
          </button>
        </div>

        <section className="buyscreen-shell rounded-[2rem] border border-white/80 bg-white shadow-[0_28px_90px_rgba(15,35,75,0.13)]">
          <header className="buyscreen-header flex flex-col gap-4 border-b border-[#e7edf5] bg-white/95 px-4 py-4 sm:px-8 sm:py-5 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:py-4">
            <div className="flex shrink-0 items-center justify-between lg:justify-start">
              <span className="inline-flex items-center gap-2 text-base font-black tracking-tight text-[#06224C] sm:text-lg">
                <span className="h-2.5 w-2.5 rounded-full bg-[#22c55e] shadow-[0_0_0_5px_rgba(34,197,94,0.14)]" aria-hidden />
                e-shop.
              </span>
            </div>

            <div className="buyscreen-header-actions flex w-full min-w-0 items-center justify-end gap-2 text-[#4b5563] sm:gap-3 lg:w-auto">
              <label className="buyscreen-search flex h-9 w-[150px] items-center rounded-full border border-[#dbe3ef] bg-[#f8fafc] px-3 text-[11px] text-[#4b5563] shadow-inner sm:h-10 sm:w-[210px] sm:text-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setSearchQuery(nextValue);
                    setActiveProductStart(0);
                    setShowAllProducts(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    setActiveProductStart(0);
                    setShowAllProducts(false);
                    featuredProductsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  placeholder="Search..."
                  className="min-w-0 flex-1 bg-transparent text-[#4b5563] outline-none placeholder:text-[#4b5563] placeholder:opacity-100"
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#374151]" aria-hidden>
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                  <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </label>
              <div className="buyscreen-header-trailing flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
                <button type="button" className="buyscreen-cart-trigger flex items-center gap-2 rounded-md px-2 py-1" onClick={() => setIsCartOpen(true)}>
                  <span className="relative shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="buyscreen-header-action-icon" aria-hidden>
                      <path d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L20.6 7H7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="10" cy="19" r="1.5" fill="currentColor" />
                      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
                    </svg>
                    {cartItemCount > 0 ? (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff664f] px-1 text-[10px] font-bold leading-none text-white">
                        {cartItemCount}
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-[11px] font-semibold sm:text-xs">Cart</span>
                    <span className="buyscreen-cart-secondary block text-[11px] tabular-nums sm:text-xs">{cartItems.length ? formatUsd(cartTotalCents) : "Empty"}</span>
                  </span>
                </button>
                <button type="button" className="buyscreen-cart-trigger flex items-center gap-2 rounded-md px-2 py-1" onClick={() => setIsFavoritesOpen(true)}>
                  <span className="relative shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="buyscreen-header-action-icon" aria-hidden>
                      <path d="M19.5 12.572l-7.5 7.428-7.5-7.428a5 5 0 1 1 7.5-6.566 5 5 0 1 1 7.5 6.572" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {favoriteProducts.length > 0 ? (
                      <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff664f] px-1 text-[10px] font-bold leading-none text-white">
                        {favoriteProducts.length}
                      </span>
                    ) : null}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-[11px] font-semibold sm:text-xs">Favorites</span>
                    <span className="buyscreen-cart-secondary block text-[11px] tabular-nums sm:text-xs">{favoriteProducts.length ? `${favoriteProducts.length} items` : "Empty"}</span>
                  </span>
                </button>
                <span className="h-6 w-px shrink-0 bg-[#d1d5db]" aria-hidden />
                <div ref={userMenuWrapRef} className="buyscreen-user-menu-wrap relative shrink-0">
                  <button
                    type="button"
                    aria-expanded={isUserMenuOpen}
                    aria-haspopup="menu"
                    className="buyscreen-user-summary buyscreen-user-trigger flex min-w-0 items-center gap-2 rounded-md border-0 bg-transparent px-2 py-1 text-left text-inherit"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="buyscreen-header-action-icon shrink-0" aria-hidden>
                      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M5.8 19.2c1.1-2.5 3.3-3.8 6.2-3.8s5.1 1.3 6.2 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    <span className="min-w-0 leading-tight">
                      <span className="block text-[11px] font-semibold sm:text-xs">User</span>
                      <span className="buyscreen-user-secondary block text-[11px] sm:text-xs">Account</span>
                    </span>
                  </button>
                  <div
                    className={`buyscreen-user-menu-dropdown ${isUserMenuOpen ? "buyscreen-user-menu-dropdown--open" : ""}`}
                    role="menu"
                    aria-hidden={!isUserMenuOpen}
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="buyscreen-user-menu-item"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        router.push("/login");
                      }}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          <nav className="buyscreen-categories border-b border-[#e7edf5] bg-[#06224C] px-4 py-3 text-[10px] font-semibold text-white sm:px-8 sm:text-xs">
            <div className="flex items-center justify-end lg:hidden">
              <button
                type="button"
                aria-expanded={isCategoryMenuOpen}
                aria-controls="buyscreen-category-menu"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 px-2.5 py-1.5 text-[11px] font-semibold text-white transition-colors duration-150 hover:bg-white hover:text-[#06224C]"
                onClick={() => setIsCategoryMenuOpen((prev) => !prev)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
                Menu
              </button>
            </div>
            <div
              id="buyscreen-category-menu"
              className={`buyscreen-categories-list ${isCategoryMenuOpen ? "buyscreen-categories-list--open" : ""}`}
            >
              {buyCategories.map((item) => (
                item.label === "All Categories" ? (
                  <div
                    key={item.label}
                    ref={allCategoriesWrapRef}
                    className="buyscreen-all-categories-wrap relative shrink-0"
                    onMouseEnter={handleAllCategoriesMouseEnter}
                    onMouseLeave={handleAllCategoriesMouseLeave}
                    onFocus={() => setIsAllCategoriesDropdownOpen(true)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setIsAllCategoriesDropdownOpen(false);
                      }
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={isAllCategoriesDropdownOpen}
                      aria-controls="buyscreen-all-categories-menu"
                      aria-haspopup="menu"
                      className="buyscreen-all-categories-toggle inline-flex items-center gap-1 rounded-md px-2 py-1 text-left text-[10px] font-semibold transition-colors duration-150 bg-transparent text-white hover:bg-transparent hover:!text-white focus:bg-transparent focus:!text-white active:bg-transparent active:!text-white focus-visible:outline-none focus-visible:bg-transparent focus-visible:!text-white focus-visible:ring-2 focus-visible:ring-white/50 sm:text-xs"
                      onClick={() => setIsAllCategoriesDropdownOpen((prev) => !prev)}
                    >
                      All Categories
                      <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
                        <path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <div
                      id="buyscreen-all-categories-menu"
                      role="menu"
                      className={`buyscreen-all-categories-dropdown ${isAllCategoriesDropdownOpen ? "buyscreen-all-categories-dropdown--open" : ""}`}
                    >
                      {buyAllSubCategories.map((subCategory) => (
                        <button
                          key={subCategory.key}
                          type="button"
                          role="menuitem"
                          tabIndex={isAllCategoriesDropdownOpen ? 0 : -1}
                          className="buyscreen-all-categories-item focus-visible:outline-none focus-visible:bg-[#f1f5f9] focus-visible:text-[#06224C]"
                          onClick={() => handleSubCategoryClick(subCategory.key)}
                        >
                          {subCategory.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    className={`buyscreen-category-item shrink-0 rounded-md px-2 py-1 text-left transition-colors duration-150 bg-transparent text-white hover:bg-transparent hover:!text-white focus:bg-transparent focus:!text-white active:bg-transparent active:!text-white focus-visible:outline-none focus-visible:bg-transparent focus-visible:!text-white focus-visible:ring-2 focus-visible:ring-white/50 ${item.label === "Limited Sale" ? "lg:ml-auto" : ""} ${item.label === "Best Seller" ? "!bg-transparent !border-0 !shadow-none !ring-0" : ""}`}
                    onClick={() => handleCategoryClick(item.label)}
                  >
                    {item.label}
                  </button>
                )
              ))}
            </div>
          </nav>

          <div className="space-y-10 px-4 py-8 sm:space-y-12 sm:px-8 sm:py-10 lg:py-12">
            <section className="buyscreen-hero relative flex min-h-[400px] sm:min-h-[500px] lg:min-h-0 lg:aspect-[16/8] items-center overflow-hidden rounded-[1.75rem] border border-[#dbe3ef] py-12 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] sm:p-8 lg:p-12">
              <picture className="absolute inset-0 block h-full w-full">
                <source media="(max-width: 767px)" srcSet={assetPath("/mobilebackground.png")} />
                <img src={assetPath("/background.webp")} alt="Electronics hero background" className="h-full w-full object-cover object-center" loading="eager" fetchPriority="high" decoding="async" />
              </picture>
              <div className="buyscreen-hero-overlay absolute inset-0 z-[1]" aria-hidden />
              <div ref={heroContentRef} className="buyscreen-hero-content relative z-10 w-full min-w-0 max-w-full px-1 text-center sm:max-w-2xl sm:px-0 lg:text-left">

                <h1 className="mt-3 break-words [overflow-wrap:anywhere] text-[clamp(1.5rem,5.4vw,2.4rem)] font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  Your One-Stop Electronic Market
                </h1>
                <p className="mx-auto mt-3 max-w-xl break-words [overflow-wrap:anywhere] text-[clamp(0.8rem,2.9vw,1rem)] leading-relaxed text-white/90 sm:mt-4 sm:text-base lg:mx-0">
                  Curated phones, laptops, audio, cameras, and smart accessories with fast browsing, quick favorites, and clean checkout previews.
                </p>
                <div className="mt-5 flex flex-col items-center gap-3 sm:mt-7 sm:flex-row lg:justify-start">
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#06224C] shadow-[0_18px_40px_rgba(0,0,0,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#fef3c7] sm:w-auto sm:px-6"
                    onClick={() => featuredProductsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  >
                    Shop Now
                  </button>

                </div>

              </div>
            </section>
            {showHeroScrollNote ? (
              <p className="buyscreen-hero-scroll-note" aria-hidden>
                Scroll inside the banner to read full text.
              </p>
            ) : null}

            <section className="buyscreen-features grid gap-4 border-b border-[#e7edf5] pb-10 text-sm text-[#4b5563] sm:grid-cols-2 lg:grid-cols-4">
              {buyFeatures.map((feature) => (
                <div key={feature.title} className="buyscreen-feature-card flex items-start gap-4 rounded-2xl border border-[#e7edf5] bg-[#f8fafc] p-4 transition duration-300">
                  <span aria-hidden className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#0f3b89] shadow-sm">
                    <BuyFeatureIcon type={feature.icon} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-black break-words [overflow-wrap:anywhere] text-[#111827]">{feature.title}</p>
                    <p className="mt-0.5 break-words [overflow-wrap:anywhere] text-xs leading-relaxed text-[#6b7280] sm:text-sm">{feature.subtitle}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="buyscreen-section-reveal">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2563eb]">Popular departments</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">Shop By Category</h2>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-[#64748b]">
                  Jump into curated electronics collections with balanced product cards, practical copy, and smooth hover motion.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {buyCategorySpotlights.map((category) => (
                  <article
                    key={category.title}
                    className="buyscreen-category-card group overflow-hidden rounded-2xl border border-[#e7edf5] bg-[#f8fafc] hover:bg-white hover:border-[#bfdbfe] hover:shadow-md p-5 shadow-sm transition duration-300"
                  >
                    <div className="flex min-h-[210px] flex-col justify-between gap-5">
                      <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-lg break-words [overflow-wrap:anywhere] font-black text-[#111827]">{category.title}</p>
                          <p className="mt-2 text-sm break-words [overflow-wrap:anywhere] leading-relaxed text-[#64748b]">{category.subtitle}</p>
                        </div>
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#06224C] shadow-sm transition duration-300 group-hover:rotate-12 group-hover:bg-[#06224C] group-hover:text-white">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      </div>
                      <div className="flex flex-wrap-reverse sm:flex-nowrap items-end justify-between gap-4">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#06224C] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:bg-[#06224C] hover:text-white"
                          onClick={() => handleSubCategoryClick(category.subCategoryKey)}
                        >
                          Explore
                        </button>
                        <Image
                          src={category.image}
                          alt={`${category.title} category`}
                          width={128}
                          height={112}
                          className="h-20 w-24 sm:h-28 sm:w-32 shrink-0 max-w-full object-contain transition duration-500 group-hover:scale-110"
                          loading="lazy"
                          unoptimized
                        />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="buyscreen-deal-banner buyscreen-section-reveal overflow-hidden rounded-[1.75rem] border border-[#dbe3ef] bg-[#06224C] p-5 text-white shadow-[0_24px_70px_rgba(6,34,76,0.22)] sm:p-7 lg:p-8">
              <div className="grid gap-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] lg:items-center">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#93c5fd]">Weekend tech event</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Save up to 50% on audio, accessories, and daily carry tech.</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
                    Promote seasonal offers with a confident retail banner, clear value props, and product actions that move shoppers back to the catalog.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#06224C] transition duration-300 hover:-translate-y-0.5 hover:bg-[#fef3c7]"
                      onClick={() => {
                        setActiveCategoryLabel("Limited Sale");
                        setActiveSubCategoryKey(null);
                        setShowAllProducts(true);
                        featuredProductsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      View Sale
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                      onClick={() => openLicenseModal(buyProductById.get("audio") ?? buyProducts[0])}
                    >
                      Add Deal Item
                    </button>
                  </div>
                </div>
                <div className="buyscreen-deal-highlights grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                  {buyDealHighlights.map((item) => (
                    <div key={item.label} className="buyscreen-deal-highlight-card rounded-2xl border border-white/15 bg-white/10 p-3 text-center backdrop-blur sm:p-4">
                      <p className="text-xl font-black sm:text-2xl">{item.value}</p>
                      <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-white/65 sm:text-[10px]">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section ref={featuredProductsRef}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2563eb]">Curated collection</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">Featured Products</h2>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[#fecaca] bg-[#fff7ed] px-4 py-2 text-sm font-black text-[#ff664f] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff664f] hover:text-white"
                  onClick={() => setShowAllProducts(true)}
                >
                  {showAllProducts ? "All Products" : "View All"}
                  {!showAllProducts ? (
                    <span className="text-base" aria-hidden>
                      →
                    </span>
                  ) : null}
                </button>
              </div>

              <div className="buyscreen-products-row flex items-stretch gap-2 sm:gap-4">
                {!showAllProducts && !isSearching ? (
                  <button
                    type="button"
                    className="buyscreen-products-arrow shrink-0 self-center"
                    aria-label="Previous products"
                    onClick={() => moveProducts(-1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M11.2 7.3 8.4 10l2.8 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : null}
                <div
                  ref={productsViewportRef}
                  className="min-w-0 flex-1 overflow-hidden"
                  onTouchStart={handleProductsTouchStart}
                  onTouchMove={handleProductsTouchMove}
                  onTouchEnd={handleProductsTouchFinal}
                  onTouchCancel={handleProductsTouchCancel}
                >
                  <div
                    className={`buyscreen-products min-w-0 ${productGridClass}`}
                    style={
                      isCarouselMode
                        ? ({
                          ["--buyscreen-carousel-slots" as string]: String(carouselSlots),
                        } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {displayedProducts.map((product, index) => (
                      <article
                        key={`${product.id}-${index}`}
                        tabIndex={0}
                        className="buyscreen-product-card group relative flex min-w-0 flex-col rounded-2xl border border-[#e7edf5] bg-white p-2 shadow-sm transition duration-300 hover:border-[#bfdbfe] hover:shadow-[0_24px_55px_rgba(15,35,75,0.16)] sm:p-3"
                      >
                        <div
                          className="buyscreen-product-image-wrap relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#f8fafc]"
                          role="img"
                          aria-label={`${product.name} product image`}
                        >
                          <div
                            className="absolute inset-3 rounded-lg bg-[#f8fafc] bg-contain bg-center bg-no-repeat transition duration-500 group-hover:scale-105"
                            style={{
                              backgroundImage: `url('${product.image}')`,
                            }}
                          />
                          <div className="buyscreen-product-hover-actions pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden justify-center px-1 pb-2 pt-6 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 lg:flex">
                            <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
                              <BuyProductActionButtons
                                compact={false}
                                isFavorite={favoriteProductIds.includes(product.id)}
                                onCartClick={() => openLicenseModal(product)}
                                onFavoriteClick={() => toggleFavorite(product)}
                                onShareClick={() => {
                                  void shareProduct(product);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="buyscreen-product-actions-mobile grid grid-cols-3 place-items-center gap-1 border-t border-[#f3f4f6] px-1 py-1 lg:hidden">
                          <BuyProductActionButtons
                            compact
                            isFavorite={favoriteProductIds.includes(product.id)}
                            onCartClick={() => openLicenseModal(product)}
                            onFavoriteClick={() => toggleFavorite(product)}
                            onShareClick={() => {
                              void shareProduct(product);
                            }}
                          />
                        </div>
                        <div className="buyscreen-product-meta flex flex-1 flex-col mt-3 min-w-0 px-1 pb-1 sm:mt-4">
                          <p className="text-center text-[10px] font-semibold uppercase leading-snug tracking-tight text-[#6b7280] [overflow-wrap:anywhere] sm:text-xs sm:leading-normal sm:tracking-[0.06em] md:tracking-[0.08em]">
                            {product.name}
                          </p>
                          <p className="mt-1 text-center text-xs font-bold leading-snug tracking-tight text-[#171717] [overflow-wrap:anywhere] tabular-nums sm:text-sm">
                            {product.originalPrice ? (
                              <span className="mr-1.5 text-[10px] font-semibold text-[#9ca3af] line-through sm:text-xs">{product.originalPrice}</span>
                            ) : null}
                            {product.price}
                          </p>
                          <div className="mt-auto pt-2 flex justify-center">
                            {product.badge ? (
                              <span className="inline-block rounded bg-[#ff664f] px-2 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">{product.badge}</span>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
                {!showAllProducts && !isSearching ? (
                  <button
                    type="button"
                    className="buyscreen-products-arrow shrink-0 self-center"
                    aria-label="Next products"
                    onClick={() => moveProducts(1)}
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M8.8 7.3 11.6 10l-2.8 2.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                ) : null}
              </div>
              {isCarouselMode && totalProducts > 1 ? (
                <p className="mt-3 text-center text-[11px] font-medium text-[#6b7280] lg:hidden">Swipe for more products</p>
              ) : null}
              {!displayedProducts.length ? (
                <p className="mt-4 rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-4 py-4 text-sm text-[#6b7280]">
                  No products found for &quot;{searchQuery}&quot;.
                </p>
              ) : null}
            </section>

            <section className="buyscreen-section-reveal grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-[#e7edf5] bg-[#f8fafc] p-5 sm:p-7">
                <div className="relative z-10">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm">
                    <BuyStepIcon type="checkout" />
                  </span>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#2563eb]">Easy purchase flow</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">From Browse To Checkout</h2>
                  <p className="mt-3 text-sm leading-relaxed text-[#64748b]">
                    A standard e-commerce layout should guide shoppers without noise. This flow highlights discovery, cart confidence, and checkout readiness.
                  </p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {buyShoppingSteps.map((step, index) => (
                  <article key={step.title} className="buyscreen-step-card rounded-2xl border border-[#e7edf5] bg-white p-5 shadow-sm transition duration-300">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                      <BuyStepIcon type={step.icon} />
                    </span>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#06224C] text-[11px] font-black text-white">{index + 1}</span>
                      <h3 className="text-base font-black text-[#111827]">{step.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748b]">{step.description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="buyscreen-section-reveal">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2563eb]">Customer proof</p>
                  <h2 className="mt-1 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">Trusted By Modern Buyers</h2>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#fde68a] bg-[#fffbeb] px-4 py-2 text-sm font-black text-[#92400e]">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f59e0b] text-white" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 3Z" />
                    </svg>
                  </span>
                  <span>4.9 average rating</span>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {buyTestimonials.map((testimonial, index) => (
                  <article key={testimonial.name} className="buyscreen-testimonial-card rounded-2xl border border-[#e7edf5] bg-white p-5 shadow-sm transition duration-300">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                        <BuyQuoteIcon />
                      </span>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#06224C] text-sm font-black text-white">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#475569]">&quot;{testimonial.quote}&quot;</p>
                    <div className="mt-5 border-t border-[#e7edf5] pt-4">
                      <p className="font-black text-[#111827]">{testimonial.name}</p>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">{testimonial.role}</p>
                      <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#f59e0b]">Verified buyer {index + 1}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="buyscreen-section-reveal rounded-[1.75rem] border border-[#e7edf5] bg-[#f8fafc] p-5 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#2563eb]">Partner ecosystem</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">Featured Tech Brands</h2>
                </div>
                <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-3 sm:grid-cols-5">
                  {buyBrandPartners.map((brand, index) => (
                    <div key={brand} className="buyscreen-brand-tile flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-[#e7edf5] bg-white px-3 text-center text-xs font-black uppercase tracking-[0.14em] text-[#64748b] shadow-sm transition duration-300">
                      <span className="buyscreen-brand-mark shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eff6ff] text-sm font-black text-[#2563eb]">
                        {brand.slice(0, 1)}
                      </span>
                      <span className="break-words [overflow-wrap:anywhere]">{brand}</span>
                      <span className="sr-only">Brand partner {index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="buyscreen-section-reveal overflow-hidden rounded-[1.75rem] border border-[#bfdbfe] bg-white p-5 shadow-[0_20px_60px_rgba(37,99,235,0.12)] sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.85fr)] lg:items-center">
                <div className="min-w-0">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                    <BuyMailIcon />
                  </span>
                  <p className="mt-5 text-xs font-black uppercase tracking-[0.22em] text-[#2563eb]">Stay updated</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-[#111827] sm:text-3xl">Get launch deals and restock alerts.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748b]">
                    A clean CTA section completes the storefront and gives customers one more high-intent action before the footer.
                  </p>
                  <form
                    className="mt-5 flex w-full flex-col gap-3 sm:flex-row lg:max-w-md"
                    onSubmit={(e) => {
                      e.preventDefault();
                      showActionToast("Thanks for subscribing");
                    }}
                  >
                    <input
                      type="email"
                      required
                      placeholder="Email address"
                      className="min-h-11 min-w-0 flex-1 rounded-full border border-[#dbe3ef] bg-[#f8fafc] px-4 text-sm font-semibold text-[#111827] outline-none transition focus:border-[#2563eb] focus:bg-white"
                      aria-label="Email address"
                    />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#06224C] px-5 text-xs font-black uppercase tracking-[0.14em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#0f3b89]"
                    >
                      Subscribe
                    </button>
                  </form>
                </div>
                <div className="buyscreen-update-art grid grid-cols-3 gap-2 sm:gap-3 items-stretch rounded-[1.5rem] bg-[#f8fafc] p-3 sm:p-4">
                  {buyUpdateProducts.map((product) => (
                    <div key={product.name} className="buyscreen-update-product flex flex-col items-center justify-between rounded-2xl border border-[#e7edf5] bg-white p-2 sm:p-3 shadow-sm h-full w-full">
                      <Image src={product.image} alt={product.name} width={100} height={100} className="h-16 sm:h-20 w-full object-contain shrink-0" unoptimized />
                      <p className="mt-2 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] text-[#64748b]">{product.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
      {actionToast ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[130] max-w-[260px] rounded-md bg-[#111827] px-3 py-2 text-xs font-medium text-white shadow-lg sm:text-sm">
          {actionToast}
        </div>
      ) : null}
    </main>
  );
}

