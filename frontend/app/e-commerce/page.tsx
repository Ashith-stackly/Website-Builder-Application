"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Footer from "@/components/Footer";
import { assetPath, routePath } from "@/lib/paths";
import { FaEye, FaLaptop, FaTabletAlt, FaMobileAlt } from "react-icons/fa";
import { Heart, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  loadRazorpayCheckoutScript,
  createRazorpayOrder,
  verifyRazorpayPayment,
  openRazorpayCheckout,
  isRazorpayDemoMode,
  getRazorpaySetupHint
} from "@/lib/razorpayClient";

const buyCategoryNavClass =
  "buyscreen-category-item shrink-0 rounded-md px-2 py-1 text-left transition-colors duration-150 bg-transparent text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

const buyCategories = [
  { label: "All Categories" },
  { label: "Products" },
  { label: "Blog" },
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
  { title: "Smartphones", subtitle: "Flagship cameras, all-day power, and smooth displays.", image: assetPath("/phone.webp"), subCategoryKey: "mobiles", accent: "from-[#e0f2fe] to-[#f8fafc]" },
  { title: "Workstations", subtitle: "Fast laptops and tablets for hybrid work and study.", image: assetPath("/laptop.webp"), subCategoryKey: "laptops", accent: "from-[#eef2ff] to-[#f8fafc]" },
  { title: "Home Audio", subtitle: "Portable speakers and headphones tuned for daily use.", image: assetPath("/speaker.webp"), subCategoryKey: "audio", accent: "from-[#fff7ed] to-[#f8fafc]" },
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
  { quote: "The catalog feels premium and quick. I can compare accessories and checkout without losing my place.", name: "Maya R.", role: "Product lead" },
  { quote: "Clean cards, clear pricing, and the wishlist flow make this storefront feel ready for real customers.", name: "Arjun K.", role: "Retail founder" },
  { quote: "The mobile view is polished. Filters, cart, and product actions stay easy to reach.", name: "Elena P.", role: "UX consultant" },
];

const buyBrandPartners = ["NovaTech", "PulseAudio", "SkyLens", "VoltWare", "PixelBay"];
const buyUpdateProducts = [
  { name: "Tablet", image: assetPath("/tablet.webp") },
  { name: "Watch", image: assetPath("/watch.webp") },
  { name: "Keyboard", image: assetPath("/keyboard.webp") },
];

type BuyBlogPost = {
  title: string;
  category: string;
  excerpt: string;
  image: string;
  readTime: string;
  body: string[];
};

const buyBlogPosts: BuyBlogPost[] = [
  {
    title: "How to choose the right laptop for work and travel",
    category: "Buying guides",
    excerpt: "Compare battery life, display quality, and portability before you commit to your next daily driver.",
    image: assetPath("/laptop.webp"),
    readTime: "6 min read",
    body: [
      "Choosing a laptop today means balancing performance, battery life, and portability. Start by listing how you actually use your machine: video calls, spreadsheets, creative work, or travel-heavy days away from a charger.",
      "For hybrid work, look for a 14-inch display with at least 8 GB of RAM and a comfortable keyboard. If you edit photos or run heavier apps, prioritize 16 GB RAM and a brighter screen rated above 300 nits.",
      "Battery claims on spec sheets are optimistic. Instead, check real-world reviews and fast-charge support. A laptop that recovers 50% charge in 30 minutes is far more practical on the road.",
      "Finally, compare warranty and repair options before checkout. A slightly higher upfront price can save money if the brand offers reliable service centers and accidental damage coverage.",
    ],
  },
  {
    title: "5 audio upgrades that transform your home setup",
    category: "Reviews",
    excerpt: "From compact speakers to noise-cancelling headphones, see which picks deliver the best value this season.",
    image: assetPath("/audio.webp"),
    readTime: "4 min read",
    body: [
      "Great audio does not always mean the most expensive gear. Start with the room you use most: desk, living room, or commute.",
      "Compact bookshelf speakers paired with a small amplifier can outperform all-in-one soundbars for music listening. If space is tight, a quality Bluetooth speaker with stereo pairing is a strong alternative.",
      "For focused work, noise-cancelling headphones reduce fatigue during long calls. Look for multipoint pairing if you switch between phone and laptop throughout the day.",
      "Match your purchase to your source quality. Streaming at higher bitrates and placing speakers away from walls will improve clarity more than chasing the next model upgrade.",
    ],
  },
  {
    title: "Smartphone camera tips for sharper everyday photos",
    category: "How-to",
    excerpt: "Simple framing, lighting, and settings adjustments that help you get cleaner shots without extra gear.",
    image: assetPath("/phone.webp"),
    readTime: "5 min read",
    body: [
      "Most blurry smartphone photos come from low light and movement, not a missing pro mode. Clean the lens, steady your elbows, and tap to focus on your subject before shooting.",
      "Use natural side light when possible. Shooting directly into windows or overhead lamps creates harsh contrast and noise in shadows.",
      "Portrait mode works best with clear separation between subject and background. Step back slightly and keep faces well lit for cleaner edge detection.",
      "After capture, adjust exposure and crop instead of relying on heavy filters. Small edits preserve detail and make everyday photos look more consistent.",
    ],
  },
  {
    title: "Wearables worth buying in 2026",
    category: "Trending",
    excerpt: "Track fitness, notifications, and battery goals with wearables that pair well with phones and tablets.",
    image: assetPath("/watch.webp"),
    readTime: "3 min read",
    body: [
      "The best wearable is the one you will wear daily. Prioritize comfort, water resistance, and notification reliability over niche sport metrics you may never use.",
      "Battery life varies widely. If you travel often, choose a watch that lasts multiple days and supports quick top-ups overnight.",
      "Health tracking accuracy improves when you wear the device consistently and update your profile details. Sleep and heart-rate trends become useful after one to two weeks of data.",
      "Before buying, confirm app compatibility with your phone ecosystem. Cross-platform support can limit call replies, wallet features, and firmware updates.",
    ],
  },
  {
    title: "Desk accessories that boost productivity",
    category: "Workspace",
    excerpt: "Keyboards, mice, and compact add-ons that keep your hybrid setup comfortable and efficient.",
    image: assetPath("/keyboard.webp"),
    readTime: "4 min read",
    body: [
      "A better desk setup starts with ergonomics. Position your screen at eye level and keep wrists neutral while typing to reduce strain during long sessions.",
      "Mechanical or low-profile keyboards can improve typing feel, but key travel is personal. Test switch type and layout before committing to a premium model.",
      "A responsive mouse with programmable buttons saves time in design and spreadsheet workflows. Pair it with a large mouse pad for smoother movement.",
      "Cable management and a compact USB hub reduce clutter and make hot-desking easier. Small upgrades often improve daily focus more than replacing your entire workstation.",
    ],
  },
  {
    title: "Weekend deals: what to look for before checkout",
    category: "Savings",
    excerpt: "Spot real discounts, compare warranty terms, and avoid impulse buys during limited-time tech events.",
    image: assetPath("/television.webp"),
    readTime: "5 min read",
    body: [
      "Event pricing can look dramatic, but not every discount is a bargain. Compare the current offer with prices from the last 30 days to see if savings are genuine.",
      "Bundle deals are useful only when you need every item included. Skip add-ons like extended cables or cases unless they replace something you planned to buy anyway.",
      "Check return windows and restocking fees before placing large orders. A lower price loses value if returns are difficult or warranty coverage is shortened.",
      "Make a shortlist before the sale starts. A predefined budget and model comparison help you buy confidently instead of reacting to countdown timers.",
    ],
  },
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

type BuyPreviewDevice = "desktop" | "tablet" | "mobile";
type BuyPreviewControl = "preview" | BuyPreviewDevice;

const BUY_PREVIEW_QUERY_KEY = "preview";

const buyPreviewFrames: Record<
  BuyPreviewDevice,
  { label: string; width: string; maxWidth: number; height: number }
> = {
  desktop: { label: "Desktop", width: "100%", maxWidth: 1440, height: 1200 },
  tablet: { label: "Tablet", width: "820px", maxWidth: 820, height: 1180 },
  mobile: { label: "Mobile", width: "390px", maxWidth: 390, height: 844 },
};

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
  const size = "w-[28px] h-[28px] min-[400px]:w-[30px] min-[400px]:h-[30px] sm:w-[32px] sm:h-[32px] md:w-[32px] md:h-[32px] lg:w-[36px] lg:h-[36px]";
  const shadow = compact ? "shadow-sm" : "shadow-md";
  const base = `flex shrink-0 items-center justify-center rounded-full border-2 border-[#ff664f] transition-colors duration-150 ${size} ${shadow} flex-shrink-0 overflow-hidden flex-nowrap items-center justify-center`;
  const inactive = `${base} bg-white text-[#ff664f] hover:bg-[#ff664f] hover:text-white`;
  const favoriteActive = `${base} bg-[#ff664f] text-white hover:bg-[#ff664f] hover:text-white`;
  const favoriteBtn = `${isFavorite ? favoriteActive : inactive} buyscreen-favorite-btn`;
  const iconClass = "w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] shrink-0";
  return (
    <>
      <button type="button" className={inactive} aria-label="Add to cart" onClick={(e) => {
        e.stopPropagation();
        onCartClick();
      }}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={iconClass} aria-hidden>
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
        <Heart
          size={18}
          strokeWidth={2}
          fill={isFavorite ? "currentColor" : "none"}
          className="buyscreen-heart-icon shrink-0"
        />
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
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={iconClass} aria-hidden>
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

function BuyContactPhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="7" y="3" width="10" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 17h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BuySendIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="buyscreen-send-icon shrink-0"
    >
      <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

function BuyLocationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="10" r="2.3" fill="currentColor" />
    </svg>
  );
}

export default function ECommercePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbeddedPreview = searchParams.get(BUY_PREVIEW_QUERY_KEY) === "embed";

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<BuyPreviewDevice>("desktop");

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
  const [activeBlogPost, setActiveBlogPost] = useState<BuyBlogPost | null>(null);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentSuccessDetails, setPaymentSuccessDetails] = useState<{ paymentId: string; orderId: string; amount: number } | null>(null);
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
  const blogSectionRef = useRef<HTMLElement | null>(null);
  const contactSectionRef = useRef<HTMLElement | null>(null);
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
    if (!licenseProduct && !isCartOpen && !isFavoritesOpen && !activeBlogPost) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (licenseProduct) closeLicenseModal();
      if (isCartOpen) setIsCartOpen(false);
      if (isFavoritesOpen) setIsFavoritesOpen(false);
      if (activeBlogPost) setActiveBlogPost(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [licenseProduct, isCartOpen, isFavoritesOpen, activeBlogPost, closeLicenseModal]);

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

  const handleUserMenuBlurCapture = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget as Node | null;
    if (event.currentTarget.contains(next)) return;
    setIsUserMenuOpen(false);
  }, []);

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
  }, [isPreviewOpen]);

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
  }, [isCarouselMode, isPreviewOpen]);

  function moveProducts(direction: number) {
    if (!totalProducts) return;
    setActiveProductStart((prev) => (prev + direction + totalProducts) % totalProducts);
  }

  const scrollToBlogSection = useCallback(() => {
    setIsAllCategoriesDropdownOpen(false);
    setIsUserMenuOpen(false);
    setIsCategoryMenuOpen(false);
    setActiveTopHeaderItem("Blog");
    window.requestAnimationFrame(() => {
      blogSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const scrollToContactSection = useCallback(() => {
    setIsAllCategoriesDropdownOpen(false);
    setIsUserMenuOpen(false);
    setIsCategoryMenuOpen(false);
    setActiveTopHeaderItem("Contact");
    window.requestAnimationFrame(() => {
      contactSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const handleCategoryClick = useCallback(
    (label: string) => {
      if (label === "Blog") {
        scrollToBlogSection();
        return;
      }
      if (label === "Contact") {
        scrollToContactSection();
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
    [scrollToBlogSection, scrollToContactSection]
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

      if (item === "Contact") {
        scrollToContactSection();
        return;
      }

      if (item === "Blog") {
        scrollToBlogSection();
        return;
      }

      router.push("/page-not-found");
    },
    [router, scrollToBlogSection, scrollToContactSection],
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

  const handleCheckout = async () => {
    setPaymentLoading(true);
    setPaymentError(null);

    if (isRazorpayDemoMode()) {
      try {
        await new Promise((r) => window.setTimeout(r, 900));
        setPaymentSuccessDetails({
          paymentId: `pay_demo_${Math.random().toString(36).substring(2, 9)}`,
          orderId: `order_demo_${Math.random().toString(36).substring(2, 9)}`,
          amount: cartTotalCents,
        });
        setPaymentSuccess("Payment Successful!");
        setCartItems([]);
        setIsCartOpen(false);
      } catch (e) {
        setPaymentError("Demo checkout failed");
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    try {
      await loadRazorpayCheckoutScript();
      
      const order = await createRazorpayOrder({
        amountPaise: cartTotalCents,
        planName: "E-Commerce Purchase",
        billingPeriod: "One-Time",
      });

      setPaymentLoading(false);

      openRazorpayCheckout({
        order,
        planLabel: `Purchase of ${cartItems.length} items from Curated Tech Store`,
        customerName: "Demo Customer",
        customerEmail: "customer@example.com",
        customerPhone: "9876543210",
        onDismiss: () => setPaymentLoading(false),
        onSuccess: async (response) => {
          setPaymentLoading(true);
          try {
            const verified = await verifyRazorpayPayment(response);
            if (!verified) throw new Error("Payment verification failed");
            
            // Payment success handling
            setPaymentSuccessDetails({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              amount: cartTotalCents,
            });
            setPaymentSuccess("Payment Successful!");
            setCartItems([]);
            setIsCartOpen(false);
          } catch (e) {
            setPaymentError(e instanceof Error ? e.message : "Payment failed");
          } finally {
            setPaymentLoading(false);
          }
        },
      });
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "Could not start payment");
      setPaymentLoading(false);
    }
  };

  const previewParams = new URLSearchParams(searchParams.toString());
  previewParams.set(BUY_PREVIEW_QUERY_KEY, "embed");
  const previewQuery = previewParams.toString();
  const previewSrc = routePath(
    previewQuery ? `${pathname}?${previewQuery}` : pathname,
  );
  const activePreviewFrame = buyPreviewFrames[previewDevice];

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [iframeHeight, setIframeHeight] = useState<string | number>(activePreviewFrame.height);

  useEffect(() => {
    setIframeHeight(activePreviewFrame.height);
  }, [previewDevice, activePreviewFrame.height]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let observer: MutationObserver | null = null;
    let win: Window | null = null;

    const updateHeight = () => {
      if (previewDevice === "tablet" || previewDevice === "mobile") {
        setIframeHeight(activePreviewFrame.height);
        return;
      }
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body && doc.documentElement) {
          const height = Math.max(
            doc.body.scrollHeight,
            doc.body.offsetHeight,
            doc.documentElement.clientHeight,
            doc.documentElement.scrollHeight,
            doc.documentElement.offsetHeight
          );
          if (height > 0) {
            setIframeHeight(height);
          }
        }
      } catch (e) {
        // ignore cross-origin or ready state errors
      }
    };

    const setupObserver = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        win = iframe.contentWindow;
        if (doc && doc.body) {
          updateHeight();

          if (observer) {
            observer.disconnect();
          }
          observer = new MutationObserver(updateHeight);
          observer.observe(doc.body, {
            attributes: true,
            childList: true,
            subtree: true,
          });

          if (win) {
            win.addEventListener("resize", updateHeight);
          }
        }
      } catch (e) {
        // ignore
      }
    };

    iframe.addEventListener("load", setupObserver);
    setupObserver();

    return () => {
      iframe.removeEventListener("load", setupObserver);
      if (observer) {
        observer.disconnect();
      }
      if (win) {
        win.removeEventListener("resize", updateHeight);
      }
    };
  }, [previewSrc, previewDevice, activePreviewFrame.height]);

  return (
    <main className="buyscreen-page flex w-full max-w-full min-w-0 flex-col overflow-visible bg-[#f5f7fb] text-[#111827]">

      {isEmbeddedPreview && (
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Hide the Global Layout Navbar inside the preview iframe */
            header:not(.buyscreen-header),
            nav:not(.buyscreen-categories) {
              display: none !important;
            }

            /* Internal scrollbar in preview window is kept visible to match other templates */
          `
        }} />
      )}
      <style dangerouslySetInnerHTML={{
        __html: `
          .buyscreen-page .buyscreen-header-action-icon {
            width: 18px !important;
            height: 18px !important;
            min-width: 18px !important;
            max-width: 18px !important;
            flex-shrink: 0 !important;
            display: block !important;
            overflow: visible !important;
          }

          .buyscreen-page img:not(.stackly-footer-logo) {
            max-width: 100% !important;
            height: auto !important;
          }

          /* Ensure parent containers do not clip absolutely positioned user dropdown and stack correctly */
          .buyscreen-page .buyscreen-shell {
            overflow: visible !important;
          }
          .buyscreen-page .buyscreen-header {
            position: relative !important;
            z-index: 55 !important;
            overflow: visible !important;
          }

          /* Tablet View overrides for Favorites and License popups to render in bottom-right corner */
          @media (min-width: 768px) and (max-width: 1024px) {
            .buyscreen-page .buyscreen-favorites-popup-wrapper,
            .buyscreen-page .buyscreen-license-popup-wrapper {
              position: fixed !important;
              inset: 0 !important;
              display: flex !important;
              align-items: flex-end !important;
              justify-content: flex-end !important;
              padding: 24px !important;
              z-index: 99999 !important;
              pointer-events: none !important;
            }
            .buyscreen-page .buyscreen-favorites-popup-wrapper > button,
            .buyscreen-page .buyscreen-license-popup-wrapper > button {
              pointer-events: auto !important;
              background: rgba(0, 0, 0, 0.2) !important;
              backdrop-filter: none !important;
            }
            .buyscreen-page .buyscreen-favorites-popup-wrapper > div,
            .buyscreen-page .buyscreen-license-popup-wrapper > div {
              pointer-events: auto !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 400px !important;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
            }
          }

          @media (max-width: 1024px) {
            /* 1. Fluid Layouts & Remove Fixed Constraints */
            .buyscreen-page .w-96, .buyscreen-page .w-80, .buyscreen-page .w-72, .buyscreen-page .w-64, .buyscreen-page .w-56, .buyscreen-page .w-48, .buyscreen-page .max-w-md, .buyscreen-page .max-w-sm, .buyscreen-page .max-w-lg, .buyscreen-page .w-[350px] {
              max-width: 100% !important;
              width: 100% !important;
            }
            .buyscreen-page .h-96, .buyscreen-page .h-80, .buyscreen-page .h-72, .buyscreen-page .h-64, .buyscreen-page .h-48 {
              height: auto !important;
            }

            /* 2. Prevent Text Overflow */
            .buyscreen-page h1:not(.buyscreen-blog-article-title),
            .buyscreen-page h2:not(.buyscreen-blog-article-title),
            .buyscreen-page h3:not(.buyscreen-blog-article-title),
            .buyscreen-page h4:not(.buyscreen-blog-article-title),
            .buyscreen-page p:not(.buyscreen-blog-article-paragraph):not(.buyscreen-blog-article-excerpt),
            .buyscreen-page span:not(.buyscreen-blog-article-category):not(.buyscreen-blog-article-meta),
            .buyscreen-page a:not(.buyscreen-blog-article-title),
            .buyscreen-page button:not(.buyscreen-blog-article-close-btn):not(.buyscreen-blog-article-dismiss) {
              overflow-wrap: break-word !important;
              word-wrap: break-word !important;
              hyphens: auto !important;
              white-space: normal !important;
            }

            /* 3. Responsive Clamp Fonts */
            .buyscreen-page h1 { font-size: clamp(1.5rem, 5vw + 0.5rem, 3rem) !important; line-height: 1.2 !important; }
            .buyscreen-page h2:not(.buyscreen-blog-article-title) { font-size: clamp(1.25rem, 4vw + 0.5rem, 2.5rem) !important; line-height: 1.2 !important; }
            .buyscreen-page h3 { font-size: clamp(1rem, 3vw + 0.5rem, 2rem) !important; line-height: 1.3 !important; }
            .buyscreen-page p:not(.buyscreen-blog-article-paragraph):not(.buyscreen-blog-article-excerpt) { font-size: clamp(0.875rem, 2.5vw + 0.25rem, 1.125rem) !important; line-height: 1.5 !important; }
            .buyscreen-page button:not(.buyscreen-blog-article-close-btn):not(.buyscreen-blog-article-dismiss) { font-size: clamp(0.75rem, 2vw + 0.25rem, 1rem) !important; }

            /* 4. Images */
            .buyscreen-page img:not(.stackly-footer-logo), .buyscreen-page svg:not(.buyscreen-header-action-icon):not(.buyscreen-send-icon) {
              max-width: 100% !important;
              height: auto !important;
              object-fit: contain !important;
              flex-shrink: 0 !important;
            }
            .buyscreen-page svg.buyscreen-send-icon {
              width: 16px !important;
              height: 16px !important;
              max-width: 16px !important;
              min-width: 16px !important;
              flex-shrink: 0 !important;
            }

            /* 5. Flexbox Wrapping for general sections, protect header icons */
            .buyscreen-page header {
              min-width: 0 !important;
              max-width: 100% !important;
              overflow: visible !important;
            }
            .buyscreen-page section:not(.buyscreen-shell) {
              min-width: 0 !important;
              max-width: 100% !important;
              overflow: hidden !important;
            }
            .buyscreen-page section.buyscreen-shell {
              min-width: 0 !important;
              max-width: 100% !important;
              overflow: visible !important;
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

          @media (max-width: 480px) {
             .buyscreen-page .gap-8 { gap: 1rem !important; }
             .buyscreen-page .gap-6 { gap: 0.75rem !important; }
             .buyscreen-page .p-8 { padding: 1rem !important; }
             .buyscreen-page .p-6 { padding: 0.75rem !important; }
          }

          /* Contact section: readable at mobile 150–200% zoom */
          .buyscreen-page .buyscreen-contact {
            overflow: visible !important;
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .buyscreen-page .buyscreen-contact,
          .buyscreen-page .buyscreen-contact * {
            box-sizing: border-box;
          }
          .buyscreen-page .buyscreen-contact-grid {
            min-width: 0;
            max-width: 100%;
          }
          .buyscreen-page .buyscreen-contact-info-row {
            display: flex;
            flex-wrap: wrap;
            align-items: flex-start;
            gap: 0.75rem;
            min-width: 0;
            max-width: 100%;
          }
          .buyscreen-page .buyscreen-contact-info-body {
            flex: 1 1 8rem;
            min-width: 0;
            max-width: 100%;
          }
          .buyscreen-page .buyscreen-contact-form-card {
            min-width: 0;
            max-width: 100%;
          }
          .buyscreen-page .buyscreen-contact h2 {
            font-size: clamp(1.15rem, 5.2vw, 1.75rem);
            line-height: 1.25;
            letter-spacing: -0.02em;
          }
          .buyscreen-page .buyscreen-contact-eyebrow {
            font-size: clamp(0.62rem, 2.8vw, 0.75rem);
            letter-spacing: 0.12em;
            line-height: 1.35;
          }
          .buyscreen-page .buyscreen-contact label {
            font-size: clamp(0.68rem, 2.6vw, 0.75rem);
            letter-spacing: 0.06em;
            line-height: 1.35;
            overflow-wrap: anywhere;
          }
          .buyscreen-page .buyscreen-contact input,
          .buyscreen-page .buyscreen-contact textarea {
            font-size: 16px;
            line-height: 1.4;
            max-width: 100%;
          }
          .buyscreen-page .buyscreen-contact-submit {
            width: 100%;
            max-width: 100%;
            white-space: normal;
            text-align: center;
            line-height: 1.3;
            padding-top: 0.7rem;
            padding-bottom: 0.7rem;
          }
          @media (max-width: 640px) {
            .buyscreen-page .buyscreen-contact {
              padding: 0.85rem !important;
              border-radius: 1.15rem !important;
            }
            .buyscreen-page .buyscreen-contact-form-card {
              padding: 0.85rem !important;
            }
            .buyscreen-page .buyscreen-contact-grid {
              gap: 1rem !important;
            }
            .buyscreen-page .buyscreen-contact-info-row {
              flex-direction: column;
              align-items: stretch;
              gap: 0.65rem;
              padding: 0.75rem !important;
            }
            .buyscreen-page .buyscreen-contact-info-icon {
              width: 2.5rem !important;
              height: 2.5rem !important;
            }
            .buyscreen-page .buyscreen-contact-desc,
            .buyscreen-page .buyscreen-contact-form-note {
              font-size: clamp(0.8rem, 3.6vw, 0.9rem);
              line-height: 1.45;
            }
          }
          @media (max-width: 480px) {
            .buyscreen-page .buyscreen-contact h3 {
              font-size: clamp(1rem, 4.8vw, 1.15rem);
              line-height: 1.3;
            }
          }
          @media (max-width: 768px) and (min-resolution: 1.5dppx) {
            .buyscreen-page .buyscreen-contact-fields {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }

          /* Blog section: readable at mobile 150–200% zoom */
          .buyscreen-page .buyscreen-blog {
            overflow: visible !important;
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .buyscreen-page .buyscreen-blog,
          .buyscreen-page .buyscreen-blog * {
            box-sizing: border-box;
          }
          .buyscreen-page .buyscreen-blog-grid {
            min-width: 0;
            max-width: 100%;
          }
          .buyscreen-page .buyscreen-blog-card {
            min-width: 0;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .buyscreen-page .buyscreen-blog-card-image {
            width: 100%;
            max-width: 100%;
            height: auto;
            max-height: 11rem;
            object-fit: contain !important;
          }
          .buyscreen-page .buyscreen-blog h2 {
            font-size: clamp(1.15rem, 5.2vw, 1.75rem);
            line-height: 1.25;
            letter-spacing: -0.02em;
          }
          .buyscreen-page .buyscreen-blog-eyebrow {
            font-size: clamp(0.62rem, 2.8vw, 0.75rem);
            letter-spacing: 0.12em;
            line-height: 1.35;
          }
          .buyscreen-page .buyscreen-blog-desc {
            font-size: clamp(0.8rem, 3.2vw, 0.95rem);
            line-height: 1.45;
          }
          .buyscreen-page .buyscreen-blog-card-title {
            font-size: clamp(0.95rem, 3.8vw, 1.05rem);
            line-height: 1.35;
          }
          .buyscreen-page .buyscreen-blog-card-excerpt {
            font-size: clamp(0.8rem, 3.2vw, 0.9rem);
            line-height: 1.5;
          }
          .buyscreen-page .buyscreen-blog-read-btn {
            width: 100%;
            max-width: 100%;
            white-space: normal;
            text-align: center;
            line-height: 1.3;
          }
          @media (max-width: 640px) {
            .buyscreen-page .buyscreen-blog {
              padding: 0.85rem !important;
              border-radius: 1.15rem !important;
            }
            .buyscreen-page .buyscreen-blog-grid {
              gap: 0.85rem !important;
            }
            .buyscreen-page .buyscreen-blog-card {
              padding: 0.85rem !important;
            }
            .buyscreen-page .buyscreen-blog-card-image-wrap {
              padding: 0.5rem !important;
            }
          }
          @media (max-width: 768px) and (min-resolution: 1.5dppx) {
            .buyscreen-page .buyscreen-blog-grid {
              grid-template-columns: minmax(0, 1fr) !important;
            }
          }

          /* Blog article modal: readable on mobile at all zoom levels */
          .buyscreen-blog-article-overlay {
            box-sizing: border-box;
            padding: 0.75rem;
            overflow: hidden;
            background: transparent;
          }
          .buyscreen-blog-article-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.62) !important;
            backdrop-filter: blur(2px);
          }
          .buyscreen-blog-article-dialog {
            box-sizing: border-box;
            width: 100%;
            min-width: 0;
            max-width: 42rem;
            height: min(92dvh, 820px);
            max-height: min(92dvh, 820px);
            display: grid;
            grid-template-rows: auto minmax(0, 1fr) auto;
            overflow: hidden;
            background: #ffffff !important;
            isolation: isolate;
          }
          .buyscreen-blog-article-dialog,
          .buyscreen-blog-article-dialog * {
            box-sizing: border-box;
            hyphens: manual !important;
          }
          .buyscreen-blog-article-header,
          .buyscreen-blog-article-content,
          .buyscreen-blog-article-footer {
            min-width: 0;
            max-width: 100%;
            background: #ffffff !important;
          }
          .buyscreen-blog-article-content {
            grid-row: 2;
            width: 100%;
            max-width: 100%;
            flex: 1 1 0%;
            min-height: 0;
            overflow-x: hidden;
            overflow-y: auto;
            overscroll-behavior: contain;
            -webkit-overflow-scrolling: touch;
            touch-action: pan-y;
          }
          .buyscreen-blog-article-body {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }
          .buyscreen-blog-article-dialog .buyscreen-blog-article-title {
            font-size: 1.35rem !important;
            line-height: 1.35 !important;
            letter-spacing: -0.02em !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            word-break: normal !important;
            white-space: normal !important;
          }
          .buyscreen-blog-article-dialog .buyscreen-blog-article-category {
            font-size: 0.8rem !important;
            letter-spacing: 0.08em !important;
            line-height: 1.35 !important;
            white-space: normal !important;
          }
          .buyscreen-blog-article-dialog .buyscreen-blog-article-meta {
            font-size: 0.9rem !important;
            line-height: 1.45 !important;
          }
          .buyscreen-blog-article-dialog .buyscreen-blog-article-excerpt {
            font-size: 1.0625rem !important;
            line-height: 1.7 !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            word-break: normal !important;
            white-space: normal !important;
          }
          .buyscreen-blog-article-dialog .buyscreen-blog-article-paragraph {
            font-size: 1rem !important;
            line-height: 1.75 !important;
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            word-break: normal !important;
            white-space: normal !important;
          }
          .buyscreen-blog-article-dialog .buyscreen-blog-article-close-btn {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 2.75rem !important;
            font-size: 0.875rem !important;
            letter-spacing: 0.08em !important;
            line-height: 1.35 !important;
            white-space: normal !important;
            text-align: center !important;
            flex-shrink: 1 !important;
          }
          .buyscreen-blog-article-dialog .buyscreen-blog-article-dismiss {
            flex-shrink: 0 !important;
          }
          .buyscreen-blog-article-image-wrap {
            min-width: 0;
            max-width: 100%;
          }
          .buyscreen-blog-article-image {
            width: auto !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: 9rem !important;
            object-fit: contain !important;
          }
          @media (max-width: 640px) {
            .buyscreen-blog-article-overlay {
              padding: 0 !important;
              align-items: stretch !important;
            }
            .buyscreen-blog-article-dialog {
              width: 100vw !important;
              max-width: 100vw !important;
              height: 100dvh !important;
              max-height: 100dvh !important;
              min-height: 100dvh !important;
              grid-template-rows: auto minmax(0, 1fr) auto !important;
              overflow: hidden !important;
              border-radius: 0 !important;
              border-left: 0 !important;
              border-right: 0 !important;
              margin: 0 !important;
            }
            .buyscreen-blog-article-header {
              padding: 0.6rem 0.7rem !important;
              background: #ffffff !important;
            }
            .buyscreen-blog-article-content {
              width: 100% !important;
              max-width: 100% !important;
              overflow-x: hidden !important;
              overflow-y: auto !important;
              min-height: 0 !important;
              padding: 0.7rem !important;
              background: #ffffff !important;
            }
            .buyscreen-blog-article-footer {
              padding: 0.55rem 0.7rem !important;
              padding-bottom: max(0.55rem, env(safe-area-inset-bottom, 0.55rem)) !important;
              background: #f8fafc !important;
            }
            .buyscreen-blog-article-dialog .buyscreen-blog-article-close-btn {
              min-height: 2.5rem !important;
              font-size: 0.8rem !important;
            }
            .buyscreen-blog-article-image-wrap {
              min-height: 5.5rem !important;
              padding: 0.5rem !important;
            }
            .buyscreen-blog-article-image {
              max-height: 5rem !important;
            }
            .buyscreen-blog-article-dialog .buyscreen-blog-article-title {
              font-size: 1.1rem !important;
              line-height: 1.4 !important;
              margin-top: 0 !important;
              margin-bottom: 0.75rem !important;
            }
            .buyscreen-blog-article-dialog .buyscreen-blog-article-excerpt {
              font-size: 1rem !important;
            }
            .buyscreen-blog-article-dialog .buyscreen-blog-article-paragraph {
              font-size: 1rem !important;
            }
          }
          @media (max-width: 768px) and (min-resolution: 1.5dppx) {
            .buyscreen-blog-article-dialog {
              width: 100vw !important;
              max-width: 100vw !important;
              grid-template-rows: auto minmax(0, 1fr) auto !important;
            }
            .buyscreen-blog-article-header {
              padding: 0.5rem 0.65rem !important;
            }
            .buyscreen-blog-article-content {
              padding: 0.65rem !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            .buyscreen-blog-article-footer {
              padding: 0.55rem 0.7rem !important;
              padding-bottom: max(0.55rem, env(safe-area-inset-bottom, 0.55rem)) !important;
              background: #f8fafc !important;
            }
            .buyscreen-blog-article-dialog .buyscreen-blog-article-close-btn {
              min-height: 2.5rem !important;
              font-size: 0.8rem !important;
            }
            .buyscreen-blog-article-image-wrap {
              display: none !important;
            }
            .buyscreen-blog-article-dialog .buyscreen-blog-article-title {
              font-size: 1.05rem !important;
              line-height: 1.4 !important;
            }
            .buyscreen-blog-article-dialog .buyscreen-blog-article-excerpt {
              font-size: 1rem !important;
              line-height: 1.75 !important;
            }
            .buyscreen-blog-article-dialog .buyscreen-blog-article-paragraph {
              font-size: 1rem !important;
              line-height: 1.8 !important;
            }
          }

          .buyscreen-page button.buyscreen-all-categories-toggle:hover,
          .buyscreen-page button.buyscreen-all-categories-toggle:focus-visible {
            background: #2563eb !important;
            color: #ffffff !important;
            outline: none;
          }

          /* Override buttons and container inside product cards to meet specific alignment, sizing, and wrap requirements */
          .buyscreen-page .buyscreen-product-actions-mobile {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            place-items: center !important;
            gap: 12px !important;
            width: 100% !important;
            pointer-events: auto !important;
            opacity: 1 !important;
            visibility: visible !important;
          }
          .buyscreen-page .buyscreen-product-hover-actions > div {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 12px !important;
            white-space: nowrap !important;
            flex-wrap: nowrap !important;
            overflow: hidden !important;
          }
          @media (min-width: 1024px) {
            .buyscreen-page .buyscreen-product-actions-mobile {
              display: none !important;
            }
          }

          .buyscreen-page .buyscreen-product-actions-mobile > button,
          .buyscreen-page .buyscreen-product-hover-actions button {
            width: 28px !important;
            height: 28px !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
          }

          @media (min-width: 400px) {
            .buyscreen-page .buyscreen-product-actions-mobile > button,
            .buyscreen-page .buyscreen-product-hover-actions button {
              width: 30px !important;
              height: 30px !important;
            }
          }

          @media (min-width: 640px) {
            .buyscreen-page .buyscreen-product-actions-mobile > button,
            .buyscreen-page .buyscreen-product-hover-actions button {
              width: 32px !important;
              height: 32px !important;
            }
          }

          @media (min-width: 1024px) {
            .buyscreen-page .buyscreen-product-actions-mobile > button,
            .buyscreen-page .buyscreen-product-hover-actions button {
              width: 36px !important;
              height: 36px !important;
            }
          }

          .buyscreen-page .buyscreen-product-actions-mobile > button svg,
          .buyscreen-page .buyscreen-product-hover-actions button svg {
            width: 12px !important;
            height: 12px !important;
          }

          @media (min-width: 640px) {
            .buyscreen-page .buyscreen-product-actions-mobile > button svg,
            .buyscreen-page .buyscreen-product-hover-actions button svg {
              width: 14px !important;
              height: 14px !important;
            }
          }

          /* Override favorite button specifically (Mobile: w-7 h-7 = 28px, Tablet/Desktop: w-9 h-9 = 36px) */
          .buyscreen-page .buyscreen-favorite-btn {
            width: 28px !important;
            height: 28px !important;
          }

          @media (min-width: 640px) {
            .buyscreen-page .buyscreen-favorite-btn {
              width: 36px !important;
              height: 36px !important;
            }
          }

          /* Heart icon sizing overrides (Mobile: 15px, Tablet/Desktop: 18px) */
          .buyscreen-page .buyscreen-heart-icon {
            width: 15px !important;
            height: 15px !important;
          }

          @media (min-width: 640px) {
            .buyscreen-page .buyscreen-heart-icon {
              width: 18px !important;
              height: 18px !important;
            }
          }

          /* Tablet View Styles (768px - 1024px) */
          @media (min-width: 768px) and (max-width: 1024px) {
            /* Change all card grids from 3 columns (or 5) to 2 columns on tablet */
            .buyscreen-page .buyscreen-products--grid,
            .buyscreen-page .grid.md\:grid-cols-3,
            .buyscreen-page .grid.sm\:grid-cols-3,
            .buyscreen-page .grid.sm\:grid-cols-5,
            .buyscreen-page .buyscreen-update-art.grid-cols-3 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }

            /* Tablet layout containers — clip width without nested vertical scroll */
            .buyscreen-page,
            .buyscreen-shell,
            .buyscreen-header,
            .buyscreen-categories,
            .buyscreen-hero,
            .buyscreen-features,
            .buyscreen-page section,
            .buyscreen-page footer,
            .buyscreen-page .section-container,
            .buyscreen-page .preview-container {
              width: 100% !important;
              max-width: 100% !important;
              min-width: 0 !important;
              box-sizing: border-box !important;
            }

            /* Flex wrapping behavior */
            .buyscreen-page .flex-row,
            .buyscreen-page .flex {
              flex-wrap: wrap;
            }
            .buyscreen-page .buyscreen-products--carousel,
            .buyscreen-page .buyscreen-product-actions-mobile,
            .buyscreen-page .buyscreen-product-hover-actions > div {
              flex-wrap: nowrap !important;
            }

            /* Image styling */
            .buyscreen-page img:not(.stackly-footer-logo) {
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              object-fit: cover !important;
            }
            .buyscreen-page .buyscreen-category-card img,
            .buyscreen-page .buyscreen-update-product img,
            .buyscreen-page .buyscreen-blog-card-image,
            .buyscreen-page .buyscreen-blog-article-image {
              object-fit: contain !important;
            }
          }
        `
      }} />
      {licenseProduct ? (
        <div className="buyscreen-license-popup-wrapper fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6">
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
                <div className="flex items-center gap-3">
                <p className="whitespace-nowrap text-lg font-bold tabular-nums sm:text-xl" style={{ color: NAVY }}>
                  {formatUsd(lineTotalCents)}
                </p>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#111827]"
                    aria-label="Close license modal"
                    onClick={closeLicenseModal}
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>
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
        <div className="buyscreen-cart-popup-wrapper fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6">
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
                <div className="flex items-center gap-3">
                <p className="text-sm font-bold tabular-nums text-[#06224C]">{formatUsd(cartTotalCents)}</p>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#111827]"
                    aria-label="Close cart"
                    onClick={() => setIsCartOpen(false)}
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>
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
            {cartItems.length > 0 && (
              <div className="shrink-0 border-t border-[#eef2f7] bg-gray-50 p-6 sm:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-sm font-black uppercase tracking-[0.28em] text-gray-500">Subtotal</span>
                  <span className="text-2xl font-black tabular-nums text-[#06224C]">{formatUsd(cartTotalCents)}</span>
                </div>
                {paymentError && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-[12px] font-semibold text-red-600 border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                    <span>{paymentError}</span>
                  </div>
                )}
                {isRazorpayDemoMode() && (
                  <div className="mb-4 rounded-xl bg-amber-50/60 p-3 text-[11px] font-bold text-amber-700 border border-amber-100">
                    {getRazorpaySetupHint() || "Demo Mode: Payment completes locally without keys."}
                  </div>
                )}
                <button
                  type="button"
                  disabled={paymentLoading}
                  onClick={handleCheckout}
                  className="flex w-full items-center justify-center rounded-2xl bg-[#06224C] px-6 py-4 text-sm font-black uppercase tracking-[0.35em] text-white shadow-xl transition hover:bg-blue-900 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
                >
                  {paymentLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Checkout Now"
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
      {isFavoritesOpen ? (
        <div className="buyscreen-favorites-popup-wrapper fixed inset-0 z-[109] flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center sm:p-6">
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
                <div className="flex items-center gap-3">
                <p className="text-sm font-bold tabular-nums text-[#06224C]">{favoriteProducts.length} item{favoriteProducts.length === 1 ? "" : "s"}</p>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#111827]"
                    aria-label="Close favorites"
                    onClick={() => setIsFavoritesOpen(false)}
                  >
                    <span className="text-lg leading-none">×</span>
                  </button>
                </div>
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
                      <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCartItems((prev) => {
                              const existing = prev.find((item) => item.product.id === product.id);
                              if (existing) {
                                return prev.map((item) => (item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item));
                              }
                              return [...prev, { product, qty: 1 }];
                            });
                            removeFavoriteProduct(product.id);
                            showActionToast(`${product.name} added to cart`);
                          }}
                          className="w-full rounded-md bg-[#06224C] px-3 py-1 text-xs font-semibold text-white hover:bg-blue-900 sm:w-auto"
                        >
                          Add to Cart
                        </button>
                      <button
                        type="button"
                        onClick={() => removeFavoriteProduct(product.id)}
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
                  Your favorites list is empty. Tap the heart icon on a product to save it.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}


      <div ref={contentStartRef} className={`w-full ${!isEmbeddedPreview && isPreviewOpen ? "bg-[#F3F4F6]" : "bg-white"}`}>

        <section className={`buyscreen-shell ${!isEmbeddedPreview && isPreviewOpen ? "bg-transparent" : "bg-white"}`}>
          {!isEmbeddedPreview && isPreviewOpen ? (
            <div className="flex w-full flex-1 justify-center py-4 px-2 md:py-8 md:px-4 transition-all duration-500">
              <div
                className={`bg-white relative flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${
                  previewDevice === "mobile"
                    ? "w-full max-w-[375px] h-[85vh] rounded-[2.5rem] border-[8px] border-gray-800 shadow-2xl"
                    : previewDevice === "tablet"
                    ? "w-full max-w-[768px] h-[90vh] rounded-[2rem] border-[8px] border-gray-800 shadow-2xl"
                    : "w-full max-w-[1200px] h-[85vh] rounded-[1.75rem] border-2 border-gray-300 shadow-2xl"
                }`}
              >
                <iframe
                  ref={iframeRef}
                  title={`${activePreviewFrame.label} storefront preview`}
                  src={previewSrc}
                  className="block w-full h-full border-0 bg-white overflow-y-auto"
                />
              </div>
            </div>
          ) : (
            <>
              {/* RESTORED E-SHOP NAVIGATION SECTION */}
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
                          className={`${buyCategoryNavClass} buyscreen-all-categories-toggle inline-flex items-center gap-1 text-[10px] font-semibold sm:text-xs`}
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
                        className={`${buyCategoryNavClass} ${item.label === "Limited Sale" ? "lg:ml-auto" : ""}`}
                        onClick={() => handleCategoryClick(item.label)}
                      >
                        {item.label}
                      </button>
                    )
                  ))}
                </div>
              </nav>
              {/* -------------------------------------- */}

              <div className="space-y-10 px-4 py-8 sm:space-y-12 sm:px-8 sm:py-10 lg:py-12">
                <section className="buyscreen-hero relative flex min-h-[400px] items-center overflow-hidden rounded-[1.75rem] border border-[#dbe3ef] px-5 py-12 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] sm:min-h-[500px] sm:p-8 lg:min-h-0 lg:aspect-[16/8] lg:p-12">
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
                        <p className="break-words font-black text-[#111827] [overflow-wrap:anywhere]">{feature.title}</p>
                        <p className="mt-0.5 break-words text-xs leading-relaxed text-[#6b7280] [overflow-wrap:anywhere] sm:text-sm">{feature.subtitle}</p>
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
                        className="buyscreen-category-card group overflow-hidden rounded-2xl border border-[#e7edf5] bg-[#f8fafc] p-5 shadow-sm transition duration-300 hover:border-[#bfdbfe] hover:bg-white hover:shadow-md"
                      >
                        <div className="flex min-h-[210px] flex-col justify-between gap-5">
                          <div className="flex flex-wrap items-start justify-between gap-4 sm:flex-nowrap">
                            <div className="min-w-0">
                              <p className="break-words text-lg font-black text-[#111827] [overflow-wrap:anywhere]">{category.title}</p>
                              <p className="mt-2 break-words text-sm leading-relaxed text-[#64748b] [overflow-wrap:anywhere]">{category.subtitle}</p>
                            </div>
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#06224C] shadow-sm transition duration-300 group-hover:rotate-12 group-hover:bg-[#06224C] group-hover:text-white">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </span>
                          </div>
                          <div className="flex flex-wrap-reverse items-end justify-between gap-4 sm:flex-nowrap">
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
                              className="h-20 w-24 shrink-0 max-w-full object-contain transition duration-500 group-hover:scale-110 sm:h-28 sm:w-32"
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
                      onClick={() => setShowAllProducts((prev) => !prev)}
                    >
                      {showAllProducts ? "Carousel View" : "View All"}
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
                                <div className="pointer-events-auto flex flex-nowrap items-center justify-center gap-[12px] overflow-hidden whitespace-nowrap">
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
                            <div className="buyscreen-product-actions-mobile grid grid-cols-3 place-items-center gap-1 border-t border-[#f3f4f6] px-1 py-1.5 lg:hidden">
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
                            <div className="buyscreen-product-meta mt-3 flex min-w-0 flex-1 flex-col px-1 pb-1 sm:mt-4">
                              <p className="text-center text-[10px] font-semibold uppercase leading-snug tracking-tight text-[#6b7280] [overflow-wrap:anywhere] sm:text-xs sm:leading-normal sm:tracking-[0.06em] md:tracking-[0.08em]">
                                {product.name}
                              </p>
                              <p className="mt-1 text-center text-xs font-bold leading-snug tracking-tight text-[#171717] tabular-nums [overflow-wrap:anywhere] sm:text-sm">
                                {product.originalPrice ? (
                                  <span className="mr-1.5 text-[10px] font-semibold text-[#9ca3af] line-through sm:text-xs">{product.originalPrice}</span>
                                ) : null}
                                {product.price}
                              </p>
                              <div className="mt-auto flex justify-center pt-2">
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
                    <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-5">
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
                    <div className="buyscreen-update-art grid grid-cols-3 items-stretch gap-2 rounded-[1.5rem] bg-[#f8fafc] p-3 sm:gap-3 sm:p-4">
                      {buyUpdateProducts.map((product) => (
                        <div key={product.name} className="buyscreen-update-product flex h-full w-full flex-col items-center justify-between rounded-2xl border border-[#e7edf5] bg-white p-2 shadow-sm sm:p-3">
                          <Image src={product.image} alt={product.name} width={100} height={100} className="h-16 w-full shrink-0 object-contain sm:h-20" unoptimized />
                          <p className="mt-2 text-center text-[9px] font-black uppercase tracking-[0.12em] text-[#64748b] sm:text-[10px]">{product.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section
                  ref={blogSectionRef}
                  id="blog"
                  className="buyscreen-section-reveal buyscreen-blog scroll-mt-24 rounded-[1.75rem] border border-[#e7edf5] bg-white p-4 shadow-sm sm:p-7 lg:p-8"
                >
                  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0 max-w-full">
                      <p className="buyscreen-blog-eyebrow font-black uppercase text-[#2563eb]">From our blog</p>
                      <h2 className="mt-2 break-words font-black text-[#111827] [overflow-wrap:anywhere]">
                        Latest <span className="text-[#2563eb]">Insights</span>
                      </h2>
                      <p className="buyscreen-blog-desc mt-3 max-w-2xl break-words text-[#64748b] [overflow-wrap:anywhere]">
                        Guides, reviews, and shopping tips to help you choose the right tech with confidence.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="buyscreen-blog-read-btn inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-4 text-xs font-black uppercase tracking-[0.1em] text-[#2563eb] transition duration-300 hover:-translate-y-0.5 hover:bg-[#2563eb] hover:text-white sm:w-auto sm:tracking-[0.14em]"
                      onClick={() => showActionToast("More articles coming soon")}
                    >
                      View all posts
                    </button>
                  </div>

                  <div className="buyscreen-blog-grid grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {buyBlogPosts.map((post) => (
                      <article
                        key={post.title}
                        className="buyscreen-blog-card group overflow-visible rounded-2xl border border-[#e7edf5] bg-[#f8fafc] p-4 shadow-sm transition duration-300 hover:border-[#bfdbfe] hover:bg-white hover:shadow-md sm:p-5"
                      >
                        <div className="buyscreen-blog-card-image-wrap flex min-h-[8.5rem] items-center justify-center overflow-hidden rounded-xl border border-[#e7edf5] bg-white p-3 sm:min-h-[9.5rem]">
                          <Image
                            src={post.image}
                            alt=""
                            width={220}
                            height={160}
                            className="buyscreen-blog-card-image transition duration-500 group-hover:scale-105"
                            loading="lazy"
                            unoptimized
                          />
                        </div>
                        <div className="mt-4 flex min-w-0 flex-1 flex-col">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-[#eff6ff] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#2563eb] sm:text-[11px]">
                              {post.category}
                            </span>
                            <span className="text-[11px] font-semibold text-[#94a3b8]">{post.readTime}</span>
                          </div>
                          <h3 className="buyscreen-blog-card-title mt-3 break-words font-black text-[#111827] [overflow-wrap:anywhere]">
                            {post.title}
                          </h3>
                          <p className="buyscreen-blog-card-excerpt mt-2 flex-1 break-words text-[#64748b] [overflow-wrap:anywhere]">
                            {post.excerpt}
                          </p>
                          <button
                            type="button"
                            className="buyscreen-blog-read-btn mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#06224C] px-4 text-[11px] font-black uppercase tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#0f3b89] sm:text-xs sm:tracking-[0.12em]"
                            onClick={() => setActiveBlogPost(post)}
                          >
                            Read article
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section
                  ref={contactSectionRef}
                  id="contact"
                  className="buyscreen-section-reveal buyscreen-contact scroll-mt-24 rounded-[1.75rem] border border-[#e7edf5] bg-[#f8fafc] p-4 sm:p-7 lg:p-8"
                >
                  <div className="buyscreen-contact-grid grid min-w-0 max-w-full gap-8 lg:grid-cols-2 lg:items-start lg:gap-10">
                    <div className="min-w-0 max-w-full">
                      <p className="buyscreen-contact-eyebrow font-black uppercase text-[#2563eb]">Customer support</p>
                      <h2 className="mt-2 break-words font-black text-[#111827] [overflow-wrap:anywhere]">
                        Get in <span className="text-[#2563eb]">Touch</span>
                      </h2>
                      <p className="buyscreen-contact-desc mt-3 max-w-md break-words text-sm leading-relaxed text-[#64748b] [overflow-wrap:anywhere]">
                        Questions about orders, returns, or product availability? Reach our support team or send a message and we will respond within one business day.
                      </p>
                      <div className="mt-6 space-y-3 sm:mt-8 sm:space-y-4">
                        <div className="buyscreen-contact-info-row rounded-2xl border border-[#e7edf5] bg-white p-3 shadow-sm sm:p-4">
                          <span className="buyscreen-contact-info-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb] sm:h-11 sm:w-11">
                            <BuyMailIcon />
                          </span>
                          <div className="buyscreen-contact-info-body">
                            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#94a3b8] sm:tracking-[0.14em]">Email</p>
                            <a href="mailto:support@eshop.example.com" className="mt-1 block break-all text-sm font-bold leading-snug text-[#111827] hover:text-[#2563eb]">
                              support@eshop.example.com
                            </a>
                          </div>
                        </div>
                        <div className="buyscreen-contact-info-row rounded-2xl border border-[#e7edf5] bg-white p-3 shadow-sm sm:p-4">
                          <span className="buyscreen-contact-info-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb] sm:h-11 sm:w-11">
                            <BuyContactPhoneIcon />
                          </span>
                          <div className="buyscreen-contact-info-body">
                            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#94a3b8] sm:tracking-[0.14em]">Phone</p>
                            <a href="tel:+15550000000" className="mt-1 block break-words text-sm font-bold leading-snug text-[#111827] hover:text-[#2563eb] [overflow-wrap:anywhere]">
                              +1 (555) 000-0000
                            </a>
                            <p className="mt-1 break-words text-xs leading-relaxed text-[#64748b] [overflow-wrap:anywhere]">Mon–Fri, 9:00 AM – 6:00 PM</p>
                          </div>
                        </div>
                        <div className="buyscreen-contact-info-row rounded-2xl border border-[#e7edf5] bg-white p-3 shadow-sm sm:p-4">
                          <span className="buyscreen-contact-info-icon inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb] sm:h-11 sm:w-11">
                            <BuyLocationIcon />
                          </span>
                          <div className="buyscreen-contact-info-body">
                            <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#94a3b8] sm:tracking-[0.14em]">Address</p>
                            <p className="mt-1 break-words text-sm font-bold leading-snug text-[#111827] [overflow-wrap:anywhere]">
                              245 Market Street, Suite 300
                            </p>
                            <p className="mt-1 break-words text-xs leading-relaxed text-[#64748b] [overflow-wrap:anywhere]">
                              San Francisco, CA 94105
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="buyscreen-contact-form-card min-w-0 max-w-full rounded-2xl border border-[#e7edf5] bg-white p-4 shadow-sm sm:p-6 lg:p-7">
                      <h3 className="break-words text-lg font-black text-[#111827] [overflow-wrap:anywhere] sm:text-xl">
                        Send us a <span className="text-[#2563eb]">message</span>
                      </h3>
                      <p className="buyscreen-contact-form-note mt-1 break-words text-sm text-[#64748b] [overflow-wrap:anywhere]">We typically reply within 24 hours.</p>
                      <form
                        className="mt-4 space-y-4 sm:mt-5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          showActionToast("Message sent");
                          e.currentTarget.reset();
                        }}
                      >
                        <div className="buyscreen-contact-fields grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="min-w-0 max-w-full">
                            <label htmlFor="buyscreen-contact-name" className="mb-1.5 block font-black uppercase text-[#64748b]">
                              Your name
                            </label>
                            <input
                              id="buyscreen-contact-name"
                              type="text"
                              required
                              placeholder="John Doe"
                              className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-[#dbe3ef] bg-[#f8fafc] px-3 py-2.5 font-semibold text-[#111827] outline-none transition focus:border-[#2563eb] focus:bg-white sm:px-4 sm:text-sm"
                            />
                          </div>
                          <div className="min-w-0 max-w-full">
                            <label htmlFor="buyscreen-contact-email" className="mb-1.5 block font-black uppercase text-[#64748b]">
                              Your email
                            </label>
                            <input
                              id="buyscreen-contact-email"
                              type="email"
                              required
                              placeholder="john@example.com"
                              className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-[#dbe3ef] bg-[#f8fafc] px-3 py-2.5 font-semibold text-[#111827] outline-none transition focus:border-[#2563eb] focus:bg-white sm:px-4 sm:text-sm"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 max-w-full">
                          <label htmlFor="buyscreen-contact-subject" className="mb-1.5 block font-black uppercase text-[#64748b]">
                            Subject
                          </label>
                          <input
                            id="buyscreen-contact-subject"
                            type="text"
                            required
                            placeholder="Order inquiry"
                            className="min-h-11 w-full min-w-0 max-w-full rounded-xl border border-[#dbe3ef] bg-[#f8fafc] px-3 py-2.5 font-semibold text-[#111827] outline-none transition focus:border-[#2563eb] focus:bg-white sm:px-4 sm:text-sm"
                          />
                        </div>
                        <div className="min-w-0 max-w-full">
                          <label htmlFor="buyscreen-contact-message" className="mb-1.5 block font-black uppercase text-[#64748b]">
                            Message
                          </label>
                          <textarea
                            id="buyscreen-contact-message"
                            required
                            rows={4}
                            placeholder="Tell us how we can help..."
                            className="w-full min-w-0 max-w-full resize-y rounded-xl border border-[#dbe3ef] bg-[#f8fafc] px-3 py-2.5 font-semibold text-[#111827] outline-none transition focus:border-[#2563eb] focus:bg-white sm:px-4 sm:py-3 sm:text-sm"
                          />
                        </div>
                        <button
                          type="submit"
                          className="buyscreen-contact-submit inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#06224C] px-4 text-xs font-black uppercase tracking-[0.1em] text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#0f3b89] sm:px-5 sm:tracking-[0.14em]"
                        >
                          Send message
                          <BuySendIcon />
                        </button>
                      </form>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </section>
      </div>
      {!isEmbeddedPreview && <Footer />}
      {!isEmbeddedPreview && (
        <div className="fixed z-[100] transition-all duration-500 ease-in-out shrink-0 bottom-5 left-1/2 -translate-x-1/2 max-w-[calc(100vw-2rem)] overflow-x-hidden flex-nowrap whitespace-nowrap hidden md:block">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-full border border-[#E5E7EB] shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-2.5 py-1 sm:px-3 sm:py-1.5 flex-nowrap whitespace-nowrap shrink-0 overflow-x-hidden">
             <Link href="/landing#templates" className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm hover:shadow-md text-[#06224C] transition shrink-0" title="Preview">
                <FaEye size={14} className="shrink-0" />
             </Link>
             <div className="w-px h-6 bg-gray-200 mx-0.5 shrink-0"></div>
             <button onClick={() => { setPreviewDevice("desktop"); setIsPreviewOpen(true); }} className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition shrink-0 ${isPreviewOpen && previewDevice === "desktop" ? "border-gray-200 ring-2 ring-[#06224C] text-[#06224C]" : "border-gray-100 text-[#06224C]/70"}`} title="Desktop View">
                <FaLaptop size={14} className="shrink-0" />
             </button>
             <button onClick={() => { setPreviewDevice("tablet"); setIsPreviewOpen(true); }} className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition shrink-0 ${isPreviewOpen && previewDevice === "tablet" ? "border-gray-200 ring-2 ring-[#06224C] text-[#06224C]" : "border-gray-100 text-[#06224C]/70"}`} title="Tablet View">
                <FaTabletAlt size={14} className="shrink-0" />
             </button>
             <button onClick={() => { setPreviewDevice("mobile"); setIsPreviewOpen(true); }} className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition shrink-0 ${isPreviewOpen && previewDevice === "mobile" ? "border-gray-200 ring-2 ring-[#06224C] text-[#06224C]" : "border-gray-100 text-[#06224C]/70"}`} title="Mobile View">
                <FaMobileAlt size={14} className="shrink-0" />
             </button>
          </div>
        </div>
      )}
      {activeBlogPost ? (
        <div className="buyscreen-blog-article-overlay fixed inset-0 z-[120] flex items-center justify-center overflow-hidden sm:p-6">
          <button
            type="button"
            className="buyscreen-blog-article-backdrop"
            aria-label="Close article"
            onClick={() => setActiveBlogPost(null)}
          />
          <div
            role="dialog"
            aria-modal
            aria-labelledby="buyscreen-blog-article-title"
            className="buyscreen-blog-article-dialog relative z-10 flex w-full min-w-0 max-w-2xl flex-col rounded-2xl border border-[#e5e7eb] bg-white shadow-2xl"
          >
            <div className="buyscreen-blog-article-header shrink-0 border-b border-[#eef2f7] p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="buyscreen-blog-article-category inline-flex rounded-full bg-[#eff6ff] px-2.5 py-1 font-black uppercase text-[#2563eb]">
                    {activeBlogPost.category}
                  </span>
                  <span className="buyscreen-blog-article-meta font-semibold text-[#94a3b8]">{activeBlogPost.readTime}</span>
                </div>
                <button
                  type="button"
                  className="buyscreen-blog-article-dismiss inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e5e7eb] text-[#64748b] transition hover:bg-[#f8fafc] hover:text-[#111827]"
                  aria-label="Close article"
                  onClick={() => setActiveBlogPost(null)}
                >
                  <span className="text-lg leading-none">×</span>
                </button>
              </div>
            </div>
            <div className="buyscreen-blog-article-content px-3 pb-4 pt-3 sm:px-6 sm:pb-6 sm:pt-4">
              <div className="buyscreen-blog-article-body min-w-0 max-w-full">
                <h2
                  id="buyscreen-blog-article-title"
                  className="buyscreen-blog-article-title font-black text-[#111827]"
                >
                  {activeBlogPost.title}
                </h2>
                <div className="buyscreen-blog-article-image-wrap mt-3 flex min-h-[7rem] items-center justify-center rounded-xl border border-[#e7edf5] bg-[#f8fafc] p-3 sm:min-h-[11rem] sm:mt-4 sm:p-4">
                  <Image
                    src={activeBlogPost.image}
                    alt=""
                    width={320}
                    height={220}
                    className="buyscreen-blog-article-image"
                    unoptimized
                  />
                </div>
                <p className="buyscreen-blog-article-excerpt mt-3 font-semibold text-[#475569] sm:mt-4">
                  {activeBlogPost.excerpt}
                </p>
                <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
                  {activeBlogPost.body.map((paragraph) => (
                    <p key={paragraph} className="buyscreen-blog-article-paragraph text-[#374151]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="buyscreen-blog-article-footer shrink-0 border-t border-[#eef2f7] bg-[#f8fafc] p-3 sm:p-5">
              <button
                type="button"
                className="buyscreen-blog-article-close-btn inline-flex items-center justify-center rounded-full bg-[#06224C] px-5 font-black uppercase text-white transition hover:bg-[#0f3b89]"
                onClick={() => setActiveBlogPost(null)}
              >
                Close article
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {actionToast ? (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[130] max-w-[260px] rounded-md bg-[#111827] px-3 py-2 text-xs font-medium text-white shadow-lg sm:text-sm">
          {actionToast}
        </div>
      ) : null}
      {paymentSuccess && paymentSuccessDetails && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 flex flex-col items-center text-center font-sans"
          >
            <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            
            <h2 className="text-xl font-bold text-[#06224C] mb-2">Order Placed Successfully!</h2>
            <p className="text-sm text-slate-500 mb-6">
              Thank you for your purchase. Your payment has been processed and verified securely.
            </p>

            <div className="w-full bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 text-left text-xs font-semibold text-slate-600 space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Payment ID</span>
                <span className="text-[#06224C] font-bold">{paymentSuccessDetails.paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span>Order ID</span>
                <span className="text-[#06224C] font-bold">{paymentSuccessDetails.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid</span>
                <span className="text-[#06224C] font-bold">{formatUsd(paymentSuccessDetails.amount)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setPaymentSuccess(null);
                setPaymentSuccessDetails(null);
              }}
              className="w-full py-3.5 bg-[#06224C] text-white font-bold rounded-2xl transition hover:bg-blue-900 active:scale-[0.98] text-sm uppercase tracking-[0.2em]"
            >
              Continue Shopping
            </button>
          </motion.div>
        </div>
      )}
    </main>
  );
}
