"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import { blogCategories } from "@/lib/blogCategories";
import { assetPath } from "@/lib/paths";
import { FaEye, FaLaptop, FaTabletAlt, FaMobileAlt } from "react-icons/fa";
import { FaBars, FaChevronDown, FaRightFromBracket, FaUser, FaXmark } from "react-icons/fa6";

const START_BLOGGING_HREF = "/page-not-found";

function scrollToBlogSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

const navLinks = [
  { label: "Home", hash: "#blog-home" },
  { label: "Categories", hash: "#blog-categories", hasDropdown: true },
  { label: "Trending Post", hash: "#blog-trending" },
  { label: "About", hash: "#blog-about" },
  { label: "Contact", hash: "#blog-contact" },
] as const;

function BlogHeroTrendArrow() {
  return (
    <img
      src={assetPath("/blog/hero-trend-arrow.png")}
      alt=""
      width={56}
      height={44}
      className="block w-full h-full max-w-full object-contain object-center"
      decoding="async"
    />
  );
}

function BlogHeader() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const categoriesTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileCategoriesTriggerRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const isCategoriesLink = (
    link: (typeof navLinks)[number]
  ): link is (typeof navLinks)[number] & { hasDropdown: true } =>
    "hasDropdown" in link && link.hasDropdown === true;

  const handleCategoriesBlurCapture = useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget as Node | null;
      if (event.currentTarget.contains(next)) return;
      setCategoriesOpen(false);
    },
    []
  );

  const handleMobileCategoriesBlurCapture = useCallback(
    (event: React.FocusEvent<HTMLElement>) => {
      const next = event.relatedTarget as Node | null;
      if (event.currentTarget.contains(next)) return;
      setMobileCategoriesOpen(false);
    },
    []
  );

  const focusFirstCategoryItem = useCallback((menuId: string) => {
    const menu = document.getElementById(menuId);
    const firstItem = menu?.querySelector<HTMLButtonElement>("button");
    firstItem?.focus();
  }, []);

  const scrollToSection = useCallback((hash: string) => {
    const target = document.querySelector(hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (hash === "#blog-home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMobileOpen(false);
    setCategoriesOpen(false);
    setMobileCategoriesOpen(false);
    setProfileOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    window.localStorage.removeItem("stackly-auth-token");
    setProfileOpen(false);
    setMobileOpen(false);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    if (!categoriesOpen && !profileOpen && !mobileOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        categoriesOpen &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setCategoriesOpen(false);
      }

      if (
        profileOpen &&
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }

      if (
        mobileOpen &&
        headerRef.current &&
        !headerRef.current.contains(target)
      ) {
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [categoriesOpen, profileOpen, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setMobileCategoriesOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  useEffect(() => {
    const stacklyNav = document.querySelector<HTMLElement>(".stackly-navbar");
    if (!stacklyNav) return;

    const syncStacklyNavHeight = () => {
      const height = stacklyNav.getBoundingClientRect().height;
      document.documentElement.style.setProperty(
        "--stackly-nav-height-measured",
        `${Math.round(height)}px`
      );
    };

    syncStacklyNavHeight();
    const observer = new ResizeObserver(syncStacklyNavHeight);
    observer.observe(stacklyNav);
    window.addEventListener("resize", syncStacklyNavHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncStacklyNavHeight);
      document.documentElement.style.removeProperty("--stackly-nav-height-measured");
    };
  }, []);

  return (
    <header ref={headerRef} className="bg-[var(--blog-navy)] text-[var(--blog-white)] w-full max-w-full box-border my-0 mx-0 px-0 relative z-40 min-w-0">
      <div className="bg-[var(--blog-navy)] rounded-0 w-full max-w-full mx-0 py-[0.85rem] px-[clamp(1rem,4cqw,2.5rem)] flex items-center justify-between gap-[0.75rem] min-w-0 @max-[340px]:py-[0.6rem] @max-[340px]:px-[0.5rem] @max-[340px]:gap-[0.4rem]">
        <button
          type="button"
          className="text-[clamp(1.2rem,2.5cqw,1.4rem)] font-extrabold text-[var(--blog-white)] no-underline shrink-0 bg-none border-none cursor-pointer p-0 font-inherit hover:opacity-90 @max-[340px]:text-[1.1rem]"
          onClick={() => scrollToSection("#blog-home")}
        >
          Blogify.
        </button>

        <nav className="hidden items-center gap-[clamp(1rem,2.5cqw,2rem)] min-w-0 @[760px]:flex @@max-[850px]:gap-[clamp(0.5rem,1.5cqw,1.1rem)]" aria-label="Blog main navigation">
          {navLinks.map((link) =>
            isCategoriesLink(link) ? (
              <div
                key={link.label}
                ref={dropdownRef}
                className="relative"
                onBlurCapture={handleCategoriesBlurCapture}
              >
                <button
                  ref={categoriesTriggerRef}
                  type="button"
                  className="bg-none border-none cursor-pointer py-[0.45rem] px-[0.75rem] rounded-[0.4rem] font-inherit transition-[background,color,box-shadow] duration-150 ease hover:bg-[rgba(255,255,255,0.18)] hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)] focus-visible:bg-[rgba(255,255,255,0.18)] focus-visible:text-white focus-visible:shadow-[0_0_0_1px_rgba(255,255,255,0.25)] focus-visible:outline-none aria-expanded:bg-[rgba(43,127,255,0.35)] aria-expanded:text-white aria-expanded:shadow-[0_0_0_1px_rgba(43,127,255,0.55)] @@max-[850px]:py-[0.4rem] @@max-[850px]:px-[0.6rem] inline-flex items-center gap-[0.25rem] text-[0.875rem] font-medium text-[var(--blog-white)] no-underline whitespace-nowrap"
                  onClick={() => {
                    setCategoriesOpen((open) => !open);
                    setProfileOpen(false);
                  }}
                  onFocus={() => {
                    setCategoriesOpen(true);
                    setProfileOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setCategoriesOpen(true);
                      requestAnimationFrame(() =>
                        focusFirstCategoryItem("blog-categories-menu")
                      );
                    }
                    if (event.key === "Escape") {
                      setCategoriesOpen(false);
                      categoriesTriggerRef.current?.focus();
                    }
                  }}
                  aria-expanded={categoriesOpen}
                  aria-haspopup="true"
                  aria-controls="blog-categories-menu"
                >
                  {link.label}
                  <FaChevronDown
                    className={`w-[0.55rem] h-[0.55rem] transition-transform duration-200 ease ${categoriesOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {categoriesOpen && (
                  <div
                    id="blog-categories-menu"
                    className="absolute top-[calc(100%+0.5rem)] left-0 min-w-[11rem] py-[0.5rem] px-0 bg-[var(--blog-white)] rounded-[0.5rem] shadow-[0_12px_32px_rgba(0,31,63,0.18)] z-60"
                    role="menu"
                  >
                    <p className="m-0 pt-[0.35rem] pb-[0.5rem] px-[1rem] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[#6b7280]">Blog categories</p>
                    {blogCategories.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className="block w-full py-[0.55rem] px-[1rem] text-left text-[0.85rem] font-semibold text-[var(--blog-navy)] bg-none border-none cursor-pointer font-inherit hover:bg-[var(--blog-blue-bg)]"
                        onClick={() => scrollToSection(`#${item.id}`)}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full py-[0.55rem] px-[1rem] text-left text-[0.85rem] font-semibold text-[var(--blog-navy)] bg-none border-none cursor-pointer font-inherit hover:bg-[var(--blog-blue-bg)] border-t border-[#e5e7eb] mt-[0.25rem] pt-[0.65rem] text-[var(--blog-accent)]"
                      onClick={() => scrollToSection("#blog-categories")}
                    >
                      View all categories
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                key={link.label}
                type="button"
                className="bg-none border-none cursor-pointer py-[0.45rem] px-[0.75rem] rounded-[0.4rem] font-inherit transition-[background,color,box-shadow] duration-150 ease hover:bg-[rgba(255,255,255,0.18)] hover:text-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)] focus-visible:bg-[rgba(255,255,255,0.18)] focus-visible:text-white focus-visible:shadow-[0_0_0_1px_rgba(255,255,255,0.25)] focus-visible:outline-none aria-expanded:bg-[rgba(43,127,255,0.35)] aria-expanded:text-white aria-expanded:shadow-[0_0_0_1px_rgba(43,127,255,0.55)] @@max-[850px]:py-[0.4rem] @@max-[850px]:px-[0.6rem] inline-flex items-center gap-[0.25rem] text-[0.875rem] font-medium text-[var(--blog-white)] no-underline whitespace-nowrap"
                onClick={() => scrollToSection(link.hash)}
              >
                {link.label}
              </button>
            )
          )}
        </nav>

        <div className="flex items-center gap-[0.75rem] shrink-0 @@max-[759px]:gap-[0.5rem] @max-[340px]:gap-[0.4rem]">
          <div ref={profileRef} className="relative">
            <button
              type="button"
              className="inline-flex items-center justify-center w-[2.25rem] h-[2.25rem] rounded-full border border-[rgba(255,255,255,0.85)] text-[var(--blog-white)] text-[0.95rem] bg-none p-0 cursor-pointer transition-[background,border-color,box-shadow] duration-150 ease hover:bg-[rgba(255,255,255,0.18)] hover:border-white hover:shadow-[0_0_0_1px_rgba(255,255,255,0.25)] focus-visible:bg-[rgba(255,255,255,0.18)] focus-visible:border-white focus-visible:shadow-[0_0_0_1px_rgba(255,255,255,0.25)] focus-visible:outline-none aria-expanded:bg-[rgba(255,255,255,0.18)] aria-expanded:border-white aria-expanded:shadow-[0_0_0_1px_rgba(255,255,255,0.25)] @max-[340px]:w-[2rem] @max-[340px]:h-[2rem]"
              aria-label="Account menu"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              onClick={() => {
                setProfileOpen((open) => !open);
                setCategoriesOpen(false);
                setMobileOpen(false);
              }}
            >
              <FaUser aria-hidden />
            </button>
            {profileOpen && (
              <div className="absolute top-[calc(100%+0.5rem)] right-0 min-w-[10rem] max-w-[min(12rem,calc(100cqw-2*var(--blog-nav-gap)-1rem))] py-[0.35rem] px-0 bg-[var(--blog-white)] rounded-[0.5rem] shadow-[0_12px_32px_rgba(0,31,63,0.18)] z-60" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="flex items-center gap-[0.5rem] w-full py-[0.6rem] px-[1rem] text-left text-[0.875rem] font-semibold text-[var(--blog-navy)] bg-none border-none cursor-pointer font-inherit hover:bg-[var(--blog-blue-bg)] focus-visible:bg-[var(--blog-blue-bg)] focus-visible:outline-none text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#b91c1c] focus-visible:bg-[#fef2f2] focus-visible:text-[#b91c1c]"
                  onClick={handleLogout}
                >
                  <FaRightFromBracket aria-hidden />
                  Logout
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className={`inline-flex items-center justify-center shrink-0 w-[2.5rem] h-[2.5rem] p-0 border rounded-[0.4rem] text-[var(--blog-white)] cursor-pointer transition-[background,border-color,color] duration-150 ease hover:bg-[rgba(255,255,255,0.22)] hover:border-white focus-visible:bg-[rgba(255,255,255,0.22)] focus-visible:border-white focus-visible:outline-none @[760px]:hidden @max-[340px]:w-[2.2rem] @max-[340px]:h-[2.2rem] ${mobileOpen ? "bg-[rgba(43,127,255,0.35)] border-[rgba(255,255,255,0.9)]" : "bg-[rgba(255,255,255,0.12)] border-[rgba(255,255,255,0.65)]"}`}
            aria-expanded={mobileOpen}
            aria-controls="blog-mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => {
              setMobileOpen((open) => !open);
              setCategoriesOpen(false);
              setProfileOpen(false);
            }}
          >
            {mobileOpen ? (
              <FaXmark className="w-[1.15rem] h-[1.15rem]" aria-hidden />
            ) : (
              <FaBars className="w-[1.15rem] h-[1.15rem]" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="blog-mobile-nav"
          className="flex flex-col gap-[0.15rem] pt-[0.75rem] pb-[1rem] px-[clamp(0.85rem,4cqw,2.5rem)] border-t border-[rgba(255,255,255,0.15)] max-h-[min(70vh,28rem)] overflow-y-auto [web-kit-overflow-scrolling:touch] [animation:slideDown_0.2s_ease-out_forwards] @[760px]:!hidden"
          aria-label="Blog mobile navigation"
        >
          {navLinks.map((link) =>
            isCategoriesLink(link) ? (
              <div
                key={link.label}
                className="w-full"
                onBlurCapture={handleMobileCategoriesBlurCapture}
              >
                <button
                  ref={mobileCategoriesTriggerRef}
                  type="button"
                  className="py-[0.65rem] px-0 rounded-[0.4rem] text-[var(--blog-white)] text-[0.9rem] font-medium bg-none border-none cursor-pointer text-left w-full max-w-full font-inherit transition-[background,color] duration-150 ease hover:bg-[rgba(255,255,255,0.15)] hover:text-white focus-visible:bg-[rgba(255,255,255,0.15)] focus-visible:text-white focus-visible:outline-none flex items-center justify-between"
                  onClick={() => setMobileCategoriesOpen((open) => !open)}
                  onFocus={() => setMobileCategoriesOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setMobileCategoriesOpen(true);
                      requestAnimationFrame(() =>
                        focusFirstCategoryItem("blog-mobile-categories-menu")
                      );
                    }
                    if (event.key === "Escape") {
                      setMobileCategoriesOpen(false);
                      mobileCategoriesTriggerRef.current?.focus();
                    }
                  }}
                  aria-expanded={mobileCategoriesOpen}
                  aria-controls="blog-mobile-categories-menu"
                >
                  {link.label}
                  <FaChevronDown
                    className={`w-[0.55rem] h-[0.55rem] transition-transform duration-200 ease ${mobileCategoriesOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {mobileCategoriesOpen && (
                  <div
                    id="blog-mobile-categories-menu"
                    className="mt-[0.5rem] pt-[0.75rem] border-t border-[rgba(255,255,255,0.15)]"
                    role="menu"
                  >
                    {blogCategories.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className="block w-full max-w-full py-[0.45rem] px-0 rounded-[0.35rem] text-left text-[0.85rem] font-medium text-[var(--blog-white)] bg-none border-none cursor-pointer font-inherit transition-colors duration-150 ease hover:bg-[rgba(255,255,255,0.12)] focus-visible:bg-[rgba(255,255,255,0.12)] focus-visible:outline-none"
                        onClick={() => scrollToSection(`#${item.id}`)}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      className="block w-full max-w-full py-[0.45rem] px-0 rounded-[0.35rem] text-left text-[0.85rem] font-medium text-[var(--blog-white)] bg-none border-none cursor-pointer font-inherit transition-colors duration-150 ease hover:bg-[rgba(255,255,255,0.12)] focus-visible:bg-[rgba(255,255,255,0.12)] focus-visible:outline-none font-bold text-[var(--blog-accent)]"
                      onClick={() => scrollToSection("#blog-categories")}
                    >
                      View all categories
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                key={link.label}
                type="button"
                className="py-[0.65rem] px-0 rounded-[0.4rem] text-[var(--blog-white)] text-[0.9rem] font-medium bg-none border-none cursor-pointer text-left w-full max-w-full font-inherit transition-[background,color] duration-150 ease hover:bg-[rgba(255,255,255,0.15)] hover:text-white focus-visible:bg-[rgba(255,255,255,0.15)] focus-visible:text-white focus-visible:outline-none"
                onClick={() => scrollToSection(link.hash)}
              >
                {link.label}
              </button>
            )
          )}
          <div className="mt-[0.5rem] pt-[0.85rem] border-t border-[rgba(255,255,255,0.15)]">
            <p className="m-0 mb-[0.5rem] text-[0.7rem] font-bold uppercase tracking-[0.06em] text-[rgba(255,255,255,0.6)]">Account</p>
            <button
              type="button"
              className="py-[0.65rem] px-0 rounded-[0.4rem] text-[var(--blog-white)] text-[0.9rem] font-medium bg-none border-none cursor-pointer text-left w-full max-w-full font-inherit transition-[background,color] duration-150 ease hover:bg-[rgba(255,255,255,0.15)] hover:text-white focus-visible:bg-[rgba(255,255,255,0.15)] focus-visible:text-white focus-visible:outline-none flex items-center gap-[0.5rem]"
              onClick={() => {
                setMobileOpen(false);
                router.push("/login");
              }}
            >
              <FaUser aria-hidden />
              My account
            </button>
            <button
              type="button"
              className="flex items-center gap-[0.5rem] mt-[0.35rem] py-[0.65rem] px-0 w-full max-w-full rounded-[0.4rem] border-none bg-none text-[#fca5a5] text-[0.9rem] font-semibold cursor-pointer font-inherit text-left hover:bg-[rgba(255,255,255,0.1)] hover:text-[#fecaca] focus-visible:bg-[rgba(255,255,255,0.1)] focus-visible:text-[#fecaca] focus-visible:outline-none"
              onClick={handleLogout}
            >
              <FaRightFromBracket aria-hidden />
              Logout
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}

const blogImages = {
  hero: "/blog/hero-meeting.webp",
  templateNew: "/blog/template-travel.webp",
  templateFood: "/blog/template-food.webp",
  templatePersonal: "/blog/template-personal.webp",
  buildDesk: "/blog/build-desk.webp",
  teamWork: "/blog/team-work.webp",
  analytics: "/blog/analytics-dashboard.webp",
  faq: "/blog/faq-help.svg",
};

const templates = [
  {
    title: "New Blog",
    image: blogImages.templateNew,
    alt: "New blog template on laptop",
  },
  {
    title: "Food Blog",
    image: blogImages.templateFood,
    alt: "Food blog template preview",
  },
  {
    title: "Personal Blog",
    image: blogImages.templatePersonal,
    alt: "Personal blog template",
  },
];

const buildFeatures = [
  {
    title: "Design a unique blog",
    text: "Capture your brand's personality with a complete suite of Advanced Design feature in our blog maker.",
  },
  {
    title: "Establish your site's domain name",
    text: "Get a custom domain to build your credibility. For inspiration, check out the Blog Name Generator.",
  },
  {
    title: "Create with content in mind",
    text: "Get a custom domain to build your credibility. For inspiration, check out the Blog Name Generator.",
  },
];

const infraItems = [
  {
    title: "Secure platform",
    text: "Our world class experts and enterprise-grade security system work 24/7 so your audiences' information will always be kept safe and secure.",
  },
  {
    title: "Reliable hosting",
    text: "With free Website hosite on a worldwide CDN, your site is automatically backed up and will be able to handle any situation - from traffic spikes to outages - so you'll always be up and running.",
  },
  {
    title: "Faster loading",
    text: "We have a performance-first culture, meaning our priority is providing the best user experience for you and your visitors, with faster loading sites that perform great on any device.",
  },
];

const runFeatures = [
  {
    title: "Schedule",
    text: "Write when you feel inspired and schedule posts to go live at the best time for you.",
  },
  {
    title: "Collaborate",
    text: "Give multiple writers and editors access to your blog platform so they can help manage your content.",
  },
  {
    title: "Blog anywhere",
    text: "Download the Stackly app to write content and manage your blog anytime, anywhere.",
  },
];

const trendingPosts = [
  {
    title: "How to pick the right blog template in 2026",
    meta: "Trending · Guides",
    excerpt:
      "Compare layout styles, typography, and mobile previews before you publish your first post.",
  },
  {
    title: "10 SEO habits every new blogger should start today",
    meta: "Trending · SEO",
    excerpt:
      "Simple on-page checks, internal links, and publishing cadence that help posts get discovered.",
  },
  {
    title: "Turn one article into a week of social content",
    meta: "Trending · Marketing",
    excerpt:
      "Repurpose headlines, quotes, and visuals from a single blog post across your channels.",
  },
  {
    title: "What to write when you do not know where to start",
    meta: "Trending · Inspiration",
    excerpt:
      "Starter prompts and outline structures that remove blank-page anxiety for first-time bloggers.",
  },
];

const faqItems = [
  {
    q: "Is it free to start a blog?",
    a: "It's completely free to start a blog with Stackly. Plus, you'll get access to a complete suite of blogging features including; blog title generator ,SEO tools, design capabilities, managing and collaboration tools, and analytics.",
  },
  {
    q: "How do blogs make money?",
    a: "Blogs can earn through ads, affiliate links, sponsored posts, digital products, and paid memberships once you grow your audience.",
  },
  {
    q: "Can you import blog posts from WordPress?",
    a: "Yes. You can bring existing posts into Stackly so you can keep publishing without starting from scratch.",
  },
  {
    q: "Is Stackly only for beginner bloggers?",
    a: "Stackly works for beginners and experienced creators with tools for design, SEO, analytics, and team collaboration.",
  },
  {
    q: "What should you blog about?",
    a: "Write about topics you know well and your audience cares about—tutorials, stories, reviews, or updates in your niche.",
  },
];

const hireProfessionalDetails = {
  intro:
    "Work with designers, developers, and content specialists who know Blogify and Stackly inside out.",
  steps: [
    "Share your blog goals, niche, and timeline in a short brief.",
    "Get matched with vetted agencies or freelancers reviewed by our team.",
    "Collaborate on design, setup, and launch—we stay with you until you publish.",
  ],
  services: [
    "Custom blog design and branding",
    "Template customization and layout polish",
    "SEO setup, analytics, and performance tuning",
    "Content strategy and migration from other platforms",
  ],
};

export default function BlogPage() {
  const [openFaq, setOpenFaq] = useState(0);
  const [hireMoreOpen, setHireMoreOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);

  return (
    <main className="site-page blog-page flex flex-col min-h-screen bg-white overflow-visible w-full max-w-full min-w-0 font-inherit text-[var(--blog-navy)] bg-[var(--blog-white)] [overflow-wrap:break-word] [word-wrap:break-word] [text-size-adjust:100%]">
      {/* ====== MAIN BUILDER LAYOUT ====== */}
      <div className="flex flex-1">
        {/* MAIN CONTENT */}
        <div className="flex-1 bg-white p-[clamp(0.35rem,2cqw,1.75rem)] flex justify-center min-w-0">
          <div className="w-full max-w-[1200px] relative flex flex-col min-w-0">
            {/* FLOATING DEVICE TOOLBAR */}
            <div className="fixed z-[100] transition-all duration-500 ease-in-out shrink-0 bottom-6 left-1/2 -translate-x-1/2">
              <div className="blog-device-toolbar-inner flex items-center gap-2 bg-white rounded-full border border-[#E5E7EB] shadow-[0_8px_30px_rgba(0,0,0,0.12)] px-3 py-1.5 @max-[340px]:p-1 @max-[340px]:px-2 @max-[340px]:gap-1">
                 <Link href="/landing#templates" className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-100 shadow-sm hover:shadow-md text-[#06224C] transition" title="Preview">
                    <FaEye size={14} />
                 </Link>
                 <div className="w-px h-6 bg-gray-200 mx-0.5"></div>
                 <button onClick={() => setDeviceMode("desktop")} className={`w-9 h-9 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition ${deviceMode === "desktop" ? "border-gray-200 ring-2 ring-[#06224C] text-[#06224C]" : "border-gray-100 text-[#06224C]/70"}`} title="Desktop View">
                    <FaLaptop size={14} />
                 </button>
                 <button onClick={() => setDeviceMode("tablet")} className={`w-9 h-9 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition ${deviceMode === "tablet" ? "border-gray-200 ring-2 ring-[#06224C] text-[#06224C]" : "border-gray-100 text-[#06224C]/70"}`} title="Tablet View">
                    <FaTabletAlt size={14} />
                 </button>
                 <button onClick={() => setDeviceMode("mobile")} className={`w-9 h-9 flex items-center justify-center rounded-full bg-white border shadow-sm hover:shadow-md transition ${deviceMode === "mobile" ? "border-gray-200 ring-2 ring-[#06224C] text-[#06224C]" : "border-gray-100 text-[#06224C]/70"}`} title="Mobile View">
                    <FaMobileAlt size={14} />
                 </button>
              </div>
            </div>

            {/* Canvas Box */}
            <div ref={canvasScrollRef} className={`flex-1 overflow-visible min-w-0 relative z-0 transition-colors duration-300 ${deviceMode !== "desktop" ? "bg-gray-200/50 p-2 @@min-[640px]:p-4 rounded-xl" : ""}`}>
              <div className={`@container mx-auto w-full min-h-[530px] bg-[#F2F2F2] rounded-xl border-2 border-gray-300 flex flex-col relative overflow-hidden transition-all duration-500 ease-in-out ${
                deviceMode === "mobile"
                  ? "max-w-[375px] shadow-2xl"
                  : deviceMode === "tablet"
                    ? "max-w-[768px] shadow-2xl"
                    : "max-w-full"
              }`}>
                <div className="blog-page w-full max-w-full overflow-x-hidden overflow-visible min-w-0 font-inherit text-[var(--blog-navy)] bg-[var(--blog-white)] [overflow-wrap:break-word] [word-wrap:break-word] [text-size-adjust:100%]">
                  <BlogHeader />

      {/* Top — continuous hero + image + templates (matches screenshot flow) */}
      <div
        id="blog-home"
        className="blog-top-zone blog-anchor-section w-full min-w-0 pt-0"
        style={{
          background: 'linear-gradient(180deg, var(--blog-blue-bg) 0%, var(--blog-blue-bg) var(--blog-top-split, 38%), var(--blog-pink-bg) var(--blog-top-split, 38%), var(--blog-pink-bg) 100%)'
        }}
      >
        <section className="bg-transparent pt-[clamp(2rem,5cqw,3.5rem)] pb-0 w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border">
          <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
            <div className="text-center pb-[clamp(1.5rem,4cqw,2.25rem)] max-w-[46rem] mx-auto @max-[639px]:px-0">
              <h1 className="text-[clamp(1.5rem,4.8cqw,3.25rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] flex flex-wrap items-center justify-center gap-[0.35rem_0.5rem] m-0 text-center max-w-full w-full @min-[1280px]:text-[3.25rem] break-words [overflow-wrap:anywhere]">
                Create a Blog Worth{" "}
                <span className="inline-flex flex-wrap items-center justify-center gap-[0.35rem] whitespace-normal max-w-full">
                  Sharing
                  <span className="inline-flex shrink-0 items-center justify-center text-[#2b7fff] w-[clamp(2.75rem,6.5cqw,3.5rem)] h-[clamp(2rem,5cqw,2.5rem)] m-0 leading-none align-middle" aria-hidden>
                    <BlogHeroTrendArrow />
                  </span>
                </span>
              </h1>
              <p className="mt-[clamp(0.85rem,2cqw,1.25rem)] max-w-[36rem] mx-auto text-[clamp(0.9rem,1.9cqw,1.0625rem)] leading-[1.65] text-[var(--blog-navy)] break-words [overflow-wrap:anywhere]">
                Get a full suite of intuitive design features and powerful marketing
                tools to create a unique blog that leaves a lasting impression.
              </p>
              <Link href={START_BLOGGING_HREF} className="inline-flex items-center justify-center mt-[clamp(1rem,2.5cqw,1.5rem)] min-h-[2.75rem] py-[0.55rem] px-[1.75rem] rounded-full border border-[var(--blog-navy)] bg-[var(--blog-white)] text-[var(--blog-navy)] text-[clamp(0.85rem,1.8cqw,0.95rem)] font-semibold no-underline cursor-pointer transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease max-w-full text-center hover:bg-[var(--blog-navy)] hover:text-[var(--blog-white)] hover:border-[var(--blog-navy)] hover:shadow-[0_6px_18px_rgba(0,31,63,0.2)] hover:-translate-y-[2px] active:translate-y-0">
                Start Blogging
              </Link>
            </div>
          </div>
        </section>

        <div className="bg-transparent p-0 relative z-10 w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border">
          <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
            <div className="w-full max-w-[62rem] mx-auto rounded-[0.85rem] overflow-hidden min-w-0 leading-none shadow-[0_6px_24px_rgba(0,31,63,0.1)] @min-[1024px]:w-[min(88%,58rem)]">
              <img
                className="block w-full aspect-[16/9] object-cover object-center @min-[640px]:aspect-[2.15/1] @min-[1024px]:aspect-[2.2/1] @min-[1024px]:max-h-[20rem]"
                src={assetPath(blogImages.hero)}
                alt="Professionals collaborating in a modern office"
                loading="eager"
                decoding="async"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 58rem"
              />
            </div>
          </div>
        </div>

        <section className="bg-transparent pt-[clamp(2rem,5cqw,3rem)] pb-[clamp(2.5rem,6cqw,4rem)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border">
          <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0 text-center">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] text-[clamp(1.5rem,4cqw,2.35rem)] mt-0 break-words [overflow-wrap:anywhere]">
              Blog templates that set you up for success
            </h2>
            <p className="mt-[1rem] text-[clamp(0.95rem,2cqw,1.125rem)] leading-[1.65] text-[var(--blog-navy)] max-w-[40rem] mx-auto break-words [overflow-wrap:anywhere]">
              Choose from 900+ free customizable templates built
              <br className="hidden @min-[640px]:block" />
              with everything you need.
            </p>
            <Link href="/landing#templates" className="inline-flex items-center justify-center gap-[0.35rem] mt-[clamp(1rem,2.5cqw,1.5rem)] min-h-[2.75rem] py-[0.6rem] px-[1.5rem] rounded-full border border-[#d1d5db] bg-[var(--blog-white)] text-[var(--blog-navy)] text-[clamp(0.875rem,1.8cqw,1rem)] font-semibold no-underline max-w-full text-center">
              Explore Template <span aria-hidden>→</span>
            </Link>
            <div className="grid grid-cols-1 gap-[clamp(1.5rem,3cqw,2rem)] @max-[639px]:gap-[1.25rem] @min-[640px]:@max-[1023px]:gap-[1.5rem] @min-[1024px]:gap-[2rem] @min-[640px]:grid-cols-2 @min-[1024px]:grid-cols-3 mt-[clamp(2rem,5cqw,3rem)] w-full min-w-0">
              {templates.map((item) => (
                <article key={item.title} className="min-w-0 text-center">
                  <div className="rounded-[var(--blog-radius-sm)] overflow-hidden w-full aspect-[4/3]">
                    <img
                      className="block w-full h-full object-cover"
                      src={assetPath(item.image)}
                      alt={item.alt}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                    />
                  </div>
                  <span className="inline-block mt-[1rem] text-[clamp(0.95rem,2cqw,1.0625rem)] font-semibold text-[var(--blog-navy)] underline [text-underline-offset:4px]">{item.title}</span>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Build your way */}
      <section className="bg-[var(--blog-blue-bg)] border-t-2 border-b-2 border-[var(--blog-accent)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border bg-[#e6f0ff] py-[clamp(2rem,4cqw,3rem)] @min-[1280px]:py-[3rem]">
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0 grid grid-cols-1 gap-[clamp(2rem,5cqw,4rem)] items-center @min-[900px]:grid-cols-2 @min-[900px]:gap-[clamp(2.5rem,5cqw,4.5rem)] gap-[clamp(1.5rem,3cqw,2.5rem)] @min-[900px]:gap-[2.5rem]">
          <div className="min-w-0">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] text-[clamp(1.5rem,3.2cqw,2.125rem)] font-extrabold leading-[1.2] max-w-full @min-[1280px]:text-[2.125rem] break-words [overflow-wrap:anywhere]">Build your blog your way.</h2>
            <ul className="list-none m-0 p-0 flex flex-col mt-[1.25rem] gap-[1.1rem]">
              {buildFeatures.map((item) => (
                <li key={item.title}>
                  <h3 className="text-[clamp(0.9rem,1.8cqw,1rem)] font-bold text-[var(--blog-navy)] break-words [overflow-wrap:anywhere]">{item.title}</h3>
                  <p className="mt-[0.35rem] text-[clamp(0.82rem,1.6cqw,0.9rem)] leading-[1.6] text-[var(--blog-navy-muted)] break-words [overflow-wrap:anywhere]">{item.text}</p>
                </li>
              ))}
            </ul>
            <Link href={START_BLOGGING_HREF} className="inline-flex items-center justify-center mt-[1.35rem] min-h-[2.65rem] py-[0.55rem] px-[1.5rem] rounded-full bg-[var(--blog-navy)] border-2 border-[var(--blog-navy)] text-[var(--blog-white)] text-[clamp(0.875rem,1.8cqw,1rem)] font-bold no-underline shadow-[0_6px_16px_rgba(0,31,63,0.22)] cursor-pointer transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease max-w-full text-center hover:bg-[var(--blog-accent)] hover:border-[var(--blog-accent)] hover:text-[var(--blog-white)] hover:shadow-[0_10px_24px_rgba(45,140,240,0.35)] hover:-translate-y-[2px] active:translate-y-0">
              Start Blogging
            </Link>
          </div>
          <div className="w-full min-w-0 rounded-[1rem] overflow-hidden">
            <img
              className="block w-full h-full object-cover aspect-[4/3] @min-[640px]:aspect-[5/6] @min-[640px]:max-h-[18rem] @min-[900px]:max-h-[21rem] @min-[900px]:w-full"
              src={assetPath(blogImages.buildDesk)}
              alt="Workspace with laptop and monitor"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>

      {/* Infrastructure */}
      <section className="bg-[var(--blog-pink-bg)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y)] @min-[1280px]:py-[5.5rem]">
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
          <article className="bg-[var(--blog-white)] rounded-[var(--blog-radius-sm)] p-[clamp(2.25rem,5cqw,3.5rem)] px-[clamp(1.75rem,4cqw,3rem)] @max-[899px]:p-[clamp(1.75rem,4cqw,2.5rem)] @max-[899px]:px-[clamp(1.25rem,4cqw,2rem)] min-w-0">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] text-left max-w-[28rem] @min-[1024px]:max-w-[36rem] @min-[900px]:text-left @max-[899px]:max-w-full @max-[899px]:text-center break-words [overflow-wrap:anywhere]">
              The powerful infrastructure behind your blog
            </h2>
            <div className="grid grid-cols-1 gap-[clamp(2rem,4cqw,2.5rem)] mt-[clamp(2.5rem,6cqw,4rem)] min-w-0 @min-[900px]:grid-cols-3 @min-[900px]:gap-8 @min-[600px]:@max-[899px]:grid-cols-2">
              {infraItems.map((item, index) => (
                <div key={item.title} className={`min-w-0 pt-[1.25rem] border-t border-[#d1d5db] ${index === 2 ? "@min-[600px]:@max-[899px]:col-span-2" : ""}`}>
                  <h3 className="text-[clamp(1rem,2.2cqw,1.125rem)] font-bold text-[var(--blog-navy)] break-words [overflow-wrap:anywhere]">{item.title}</h3>
                  <p className="mt-[0.75rem] text-[clamp(0.875rem,1.8cqw,0.9375rem)] leading-[1.7] text-[#4b5563] break-words [overflow-wrap:anywhere]">{item.text}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      {/* Run efficiently */}
      <section className="bg-[var(--blog-blue-bg)] border-t-2 border-b-2 border-[var(--blog-accent)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y)] @min-[1280px]:py-[5rem]">
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0 grid grid-cols-1 gap-[clamp(2rem,5cqw,4rem)] items-center @min-[900px]:grid-cols-2 @min-[900px]:gap-[clamp(2.5rem,5cqw,4.5rem)]">
          <div className="w-full min-w-0 rounded-[var(--blog-radius-md)] overflow-hidden">
            <img
              className="block w-full h-full object-cover aspect-[4/3] @min-[640px]:aspect-square @min-[900px]:aspect-[5/6] @min-[900px]:min-h-0 @min-[900px]:max-h-[32rem]"
              src={assetPath(blogImages.teamWork)}
              alt="Team working on laptops"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 900px) 100vw, 50vw"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] text-center @min-[900px]:text-left break-words [overflow-wrap:anywhere]">
              Run your blog more efficiently
            </h2>
            <ul className="list-none m-0 p-0 flex flex-col mt-[clamp(2rem,4cqw,2.75rem)] gap-[clamp(1.5rem,3cqw,2rem)]">
              {runFeatures.map((item) => (
                <li key={item.title}>
                  <h3 className="text-[clamp(1rem,2.2cqw,1.125rem)] font-bold text-[var(--blog-navy)] break-words [overflow-wrap:anywhere]">{item.title}</h3>
                  <p className="mt-[0.5rem] text-[clamp(1rem,2.2cqw,1.125rem)] font-bold text-[var(--blog-navy)] break-words [overflow-wrap:anywhere]">{item.text}</p>
                </li>
              ))}
            </ul>
            <Link href={START_BLOGGING_HREF} className="inline-flex items-center justify-center mt-[clamp(2rem,4cqw,2.5rem)] min-h-[3rem] py-[0.65rem] px-[1.75rem] rounded-full bg-[var(--blog-navy)] border-2 border-[var(--blog-navy)] text-[var(--blog-white)] text-[clamp(0.875rem,1.8cqw,1rem)] font-bold no-underline shadow-[0_6px_16px_rgba(0,31,63,0.22)] cursor-pointer transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease max-w-full text-center hover:bg-[var(--blog-accent)] hover:border-[var(--blog-accent)] hover:text-[var(--blog-white)] hover:shadow-[0_10px_24px_rgba(45,140,240,0.35)] hover:-translate-y-[2px] active:translate-y-0">
              Start Blogging
            </Link>
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section className="bg-[var(--blog-pink-bg)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y)] @min-[1280px]:py-[5.5rem]">
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
          <article className="bg-[var(--blog-white)] rounded-[var(--blog-radius-lg)] overflow-hidden min-w-0 shadow-[0_4px_24px_rgba(0,31,63,0.06)]">
            <div className="grid grid-cols-1 gap-[clamp(2rem,4cqw,3rem)] p-[clamp(2rem,5cqw,3.5rem)] px-[clamp(1.75rem,4cqw,3rem)] items-center @min-[900px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] @min-[900px]:p-14 @max-[899px]:p-[clamp(1.5rem,4cqw,2.5rem)] @max-[899px]:px-[clamp(1.25rem,4cqw,2rem)] @max-[480px]:p-6 @max-[480px]:px-5 @max-[340px]:p-4 @max-[340px]:px-3">
              <div className="min-w-0">
                <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] break-words [overflow-wrap:anywhere]">
                  Plan ahead with built-in analytics
                </h2>
                <p className="mt-[1.25rem] text-[clamp(0.95rem,2cqw,1.125rem)] leading-[1.65] text-[var(--blog-navy)] break-words [overflow-wrap:anywhere]">
                  Get insights from analytics reports like which content best
                  engages your audience, so you can strategically plan for the
                  future.
                </p>
                <Link href={START_BLOGGING_HREF} className="inline-flex items-center gap-[0.35rem] mt-[clamp(1.5rem,3cqw,2rem)] text-[clamp(0.9rem,2cqw,1rem)] font-bold text-[var(--blog-navy)] underline [text-underline-offset:4px] cursor-pointer transition-[color,opacity] duration-200 ease max-w-full text-center hover:text-[var(--blog-accent)]">
                  Start Blogging
                  <span className="inline-flex items-center justify-center w-[1.15rem] h-[1.15rem] text-[var(--blog-accent)] text-[0.9rem]" aria-hidden>
                    ↗
                  </span>
                </Link>
              </div>
              <div className="w-full min-w-0 rounded-[var(--blog-radius-md)] overflow-hidden">
                <img
                  className="block w-full h-full object-cover aspect-[4/3] min-h-auto max-h-none @min-[900px]:aspect-[16/11] @min-[900px]:min-h-[18rem]"
                  src={assetPath(blogImages.analytics)}
                  alt="Analytics dashboard on laptop"
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 900px) 100vw, 50vw"
                />
              </div>
            </div>
          </article>
        </div>
      </section>

      {/* Support */}
      <section className="bg-[var(--blog-pink-bg)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y)] @min-[1280px]:py-[5.5rem]">
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0 grid grid-cols-1 gap-[clamp(1.25rem,3cqw,2rem)] @min-[900px]:grid-cols-2 @min-[900px]:gap-8">
          <article className="group/card bg-[var(--blog-white)] rounded-[var(--blog-radius-lg)] p-[clamp(2.5rem,5cqw,3.5rem)] px-[clamp(2rem,4cqw,2.75rem)] text-center min-w-0 min-h-[clamp(16rem,35cqw,18rem)] flex flex-col items-center justify-center border-2 border-transparent shadow-[0_4px_20px_rgba(0,31,63,0.06)] transition-[border-color,box-shadow,transform,background-color] duration-200 ease hover:border-[var(--blog-accent)] hover:bg-[#fafcff] hover:shadow-[0_14px_40px_rgba(45,140,240,0.2)] hover:-translate-y-[3px] focus-within:border-[var(--blog-accent)] focus-within:shadow-[0_14px_40px_rgba(45,140,240,0.2)] focus-within:outline-none @max-[899px]:p-[clamp(1.75rem,4cqw,2.5rem)] @max-[899px]:px-[clamp(1.25rem,4cqw,2rem)] @max-[899px]:min-h-auto @max-[899px]:hover:translate-y-0 @max-[480px]:p-6 @max-[480px]:px-5 @max-[340px]:p-5 @max-[340px]:px-3">
            <h3 className="text-[clamp(1.125rem,2.5cqw,1.375rem)] font-bold text-[var(--blog-navy)]">24/7 support</h3>
            <p className="mt-[1rem] max-w-[22rem] text-[clamp(0.9rem,1.8cqw,1rem)] leading-[1.7] text-[#4b5563]">
              Find answers to all your questions in our Help Center or request a
              callback to speak with an expert.
            </p>
            <Link
              href="#blog-contact"
              className="inline-block mt-[clamp(1.5rem,3cqw,2rem)] text-[clamp(0.9rem,2cqw,1rem)] font-bold text-[var(--blog-navy)] no-underline pb-[0.4rem] border-b-2 border-[#e5e7eb] group-hover/card:border-b-[var(--blog-accent)] group-hover/card:text-[var(--blog-accent)]"
              onClick={(event) => {
                event.preventDefault();
                scrollToBlogSection("blog-contact");
              }}
            >
              Get in touch
            </Link>
          </article>
          <article
            className={`group/card bg-[var(--blog-white)] rounded-[var(--blog-radius-lg)] p-[clamp(2.5rem,5cqw,3.5rem)] px-[clamp(2rem,4cqw,2.75rem)] text-center min-w-0 min-h-[clamp(16rem,35cqw,18rem)] flex flex-col items-center justify-center border-2 border-transparent shadow-[0_4px_20px_rgba(0,31,63,0.06)] transition-[border-color,box-shadow,transform,background-color] duration-200 ease hover:border-[var(--blog-accent)] hover:bg-[#fafcff] hover:shadow-[0_14px_40px_rgba(45,140,240,0.2)] hover:-translate-y-[3px] focus-within:border-[var(--blog-accent)] focus-within:shadow-[0_14px_40px_rgba(45,140,240,0.2)] focus-within:outline-none @max-[899px]:p-[clamp(1.75rem,4cqw,2.5rem)] @max-[899px]:px-[clamp(1.25rem,4cqw,2rem)] @max-[899px]:min-h-auto @max-[899px]:hover:translate-y-0 @max-[480px]:p-6 @max-[480px]:px-5 @max-[340px]:p-5 @max-[340px]:px-3 ${hireMoreOpen ? "justify-start min-h-auto items-stretch text-left" : ""}`}
          >
            <h3 className={`text-[clamp(1.125rem,2.5cqw,1.375rem)] font-bold text-[var(--blog-navy)] ${hireMoreOpen ? "text-center self-center" : ""}`}>Hire a professional</h3>
            <p className={`mt-[1rem] max-w-[22rem] text-[clamp(0.9rem,1.8cqw,1rem)] leading-[1.7] text-[#4b5563] ${hireMoreOpen ? "text-center self-center" : ""}`}>
              Get matched with vetted agencies and freelancers to help you
              create, design or enhance your website
            </p>
            <div
              id="blog-hire-details"
              className="mt-[1.25rem] w-full max-w-[26rem] self-center p-[1.25rem] px-[1.35rem] bg-[var(--blog-blue-bg)] rounded-[var(--blog-radius-md)] border border-[rgba(45,140,240,0.15)] @max-[340px]:p-4 @max-[340px]:px-3"
              hidden={!hireMoreOpen}
            >
              <p className="m-0 text-[0.9rem] leading-[1.65] text-[#4b5563]">
                {hireProfessionalDetails.intro}
              </p>
              <h4 className="mt-[1.1rem] mb-[0.5rem] mx-0 text-[0.8rem] font-bold uppercase tracking-[0.05em] text-[var(--blog-navy)]">How it works</h4>
              <ol className="m-0 pl-[1.2rem] text-[0.875rem] leading-[1.65] text-[#4b5563] [&>li+li]:mt-[0.45rem]">
                {hireProfessionalDetails.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <h4 className="mt-[1.1rem] mb-[0.5rem] mx-0 text-[0.8rem] font-bold uppercase tracking-[0.05em] text-[var(--blog-navy)]">What pros can help with</h4>
              <ul className="m-0 pl-[1.2rem] text-[0.875rem] leading-[1.65] text-[#4b5563] [&>li+li]:mt-[0.45rem]">
                {hireProfessionalDetails.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
              <Link
                href="#blog-contact"
                className="inline-block mt-[1.15rem] text-[0.875rem] font-bold text-[var(--blog-accent)] no-underline border-b-2 border-transparent transition-[color,border-color] duration-200 ease hover:border-[var(--blog-accent)]"
                onClick={(event) => {
                  event.preventDefault();
                  scrollToBlogSection("blog-contact");
                }}
              >
                Request a match
              </Link>
            </div>
            <button
              type="button"
              className="bg-none border-none border-b-2 border-[#e5e7eb] cursor-pointer font-inherit transition-[color,border-color] duration-200 ease hover:text-[var(--blog-accent)] hover:border-b-[var(--blog-accent)] focus-visible:text-[var(--blog-accent)] focus-visible:border-b-[var(--blog-accent)] focus-visible:outline-none inline-block mt-[clamp(1.5rem,3cqw,2rem)] text-[clamp(0.9rem,2cqw,1rem)] font-bold text-[var(--blog-navy)] pb-[0.4rem] group-hover/card:border-b-[var(--blog-accent)] group-hover/card:text-[var(--blog-accent)]"
              aria-expanded={hireMoreOpen}
              aria-controls="blog-hire-details"
              onClick={() => setHireMoreOpen((open) => !open)}
            >
              {hireMoreOpen ? "Show less" : "Learn more"}
            </button>
          </article>
        </div>
      </section>

      {/* Categories */}
      <section
        id="blog-categories"
        className="bg-[var(--blog-pink-bg)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y)] @min-[1280px]:py-[5.5rem] [scroll-margin-top:var(--blog-scroll-offset)]"
      >
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
          <div className="max-w-[40rem] mx-auto text-center">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] break-words [overflow-wrap:anywhere]">Blog categories</h2>
            <p className="mt-[0.75rem] text-[clamp(0.95rem,2cqw,1.125rem)] leading-[1.65] text-[var(--blog-navy)] max-w-[40rem] mx-auto break-words [overflow-wrap:anywhere]">
              Explore every blog style Blogify offers—from personal journals to
              business publishing—all in one place.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 mt-8 @min-[640px]:grid-cols-2 @min-[1024px]:grid-cols-3 @min-[640px]:@max-[1023px]:gap-6">
            {blogCategories.map((category) => (
              <article
                key={category.id}
                id={category.id}
                className="group/card bg-[var(--blog-white)] rounded-[var(--blog-radius-md)] overflow-hidden shadow-[0_4px_20px_rgba(0,31,63,0.08)] text-left [scroll-margin-top:var(--blog-scroll-offset)] border-2 border-transparent cursor-pointer transition-[border-color,box-shadow,transform,background-color] duration-200 ease hover:border-[var(--blog-accent)] hover:bg-[#fafcff] hover:shadow-[0_14px_40px_rgba(45,140,240,0.2)] hover:-translate-y-[4px] @max-[899px]:hover:translate-y-0 target:border-[var(--blog-accent)] target:outline-2 target:outline-[var(--blog-accent)] target:outline-offset-4 @max-[899px]:target:outline-offset-2 target:shadow-[0_14px_40px_rgba(45,140,240,0.2)]"
              >
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    className="block w-full h-full object-cover transition-transform duration-250 ease group-hover/card:scale-[1.04]"
                    src={assetPath(category.image)}
                    alt={category.label}
                    loading="lazy"
                    decoding="async"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 360px"
                  />
                </div>
                <div className="py-[1.15rem] px-[1.25rem] pb-[1.35rem] @max-[340px]:py-[0.85rem] @max-[340px]:px-[0.75rem] break-words [overflow-wrap:anywhere]">
                  <h3 className="text-[1.05rem] font-bold text-[var(--blog-navy)] transition-colors duration-200 group-hover/card:text-[var(--blog-accent)] break-words [overflow-wrap:anywhere]">{category.label}</h3>
                  <p className="mt-[0.45rem] text-[0.9rem] leading-[1.6] text-[var(--blog-navy-muted)] break-words [overflow-wrap:anywhere]">{category.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trending posts */}
      <section
        id="blog-trending"
        className="bg-[var(--blog-blue-bg)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y)] @min-[1280px]:py-[5.5rem] [scroll-margin-top:var(--blog-scroll-offset)]"
      >
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
          <div className="max-w-[40rem] mx-auto text-center">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] break-words [overflow-wrap:anywhere]">Trending posts</h2>
            <p className="mt-[0.75rem] text-[clamp(0.95rem,2cqw,1.125rem)] leading-[1.65] text-[var(--blog-navy)] max-w-[40rem] mx-auto break-words [overflow-wrap:anywhere]">
              Popular guides and ideas bloggers are reading right now on Blogify.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-4 max-w-[48rem] mx-auto @max-[639px]:w-full @max-[639px]:max-w-full">
            {trendingPosts.map((post) => (
              <article key={post.title} className="bg-[var(--blog-white)] rounded-[var(--blog-radius-sm)] p-[clamp(1rem,3cqw,1.25rem)] px-[clamp(1rem,3cqw,1.5rem)] border border-[rgba(0,31,63,0.08)] text-left min-w-0 [overflow-wrap:break-word] @max-[340px]:p-3 break-words [overflow-wrap:anywhere]">
                <h3 className="text-[1.05rem] font-bold text-[var(--blog-navy)] break-words [overflow-wrap:anywhere]">{post.title}</h3>
                <p className="mt-[0.35rem] text-[0.8rem] font-semibold text-[var(--blog-accent)] break-words [overflow-wrap:anywhere]">{post.meta}</p>
                <p className="mt-[0.5rem] text-[0.9rem] leading-[1.65] text-[var(--blog-navy-muted)] break-words [overflow-wrap:anywhere]">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section
        id="blog-about"
        className="bg-[var(--blog-pink-bg)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y)] @min-[1280px]:py-[5.5rem] [scroll-margin-top:var(--blog-scroll-offset)]"
      >
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
          <div className="max-w-[40rem] mx-auto text-center">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] break-words [overflow-wrap:anywhere]">About Blogify</h2>
          </div>
          <div className="max-w-[42rem] mt-8 mx-auto text-left @max-[639px]:px-0 break-words [overflow-wrap:anywhere]">
            <p className="text-[clamp(0.9rem,1.8cqw,1rem)] leading-[1.7] text-[var(--blog-navy-muted)] break-words [overflow-wrap:anywhere]">
              Blogify helps creators, teams, and businesses launch beautiful blogs
              without writing code. Choose a template, customize your brand, and
              publish posts with built-in SEO, analytics, and collaboration tools.
            </p>
            <p className="text-[clamp(0.9rem,1.8cqw,1rem)] leading-[1.7] text-[var(--blog-navy-muted)] [&+p]:mt-4 mt-4 break-words [overflow-wrap:anywhere]">
              Whether you are sharing recipes, travel stories, tech tutorials, or
              company updates, Blogify gives you the design flexibility and
              infrastructure to grow your audience with confidence.
            </p>
            <p className="text-[clamp(0.9rem,1.8cqw,1rem)] leading-[1.7] text-[var(--blog-navy-muted)] [&+p]:mt-4 mt-4 break-words [overflow-wrap:anywhere]">
              Stackly powers Blogify with reliable hosting, security, and performance
              so your site stays fast and available as your readership scales.
            </p>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section
        id="blog-contact"
        className="bg-[var(--blog-blue-bg)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y)] @min-[1280px]:py-[5.5rem] [scroll-margin-top:var(--blog-scroll-offset)]"
      >
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
          <div className="max-w-[40rem] mx-auto text-center">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.75rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-[var(--blog-navy)] [text-wrap:balance] @min-[1280px]:text-[2.75rem] break-words [overflow-wrap:anywhere]">Contact us</h2>
            <p className="mt-[0.75rem] text-[clamp(0.95rem,2cqw,1.125rem)] leading-[1.65] text-[var(--blog-navy)] max-w-[40rem] mx-auto break-words [overflow-wrap:anywhere]">
              Questions about templates, billing, or getting started? We are here to help.
            </p>
          </div>
          <div className="max-w-[42rem] mt-8 mx-auto text-left @max-[639px]:px-0 break-words [overflow-wrap:anywhere]">
            <p className="text-[clamp(0.9rem,1.8cqw,1rem)] leading-[1.7] text-[var(--blog-navy-muted)] break-words [overflow-wrap:anywhere]">
              Reach the Blogify team for product support, partnership inquiries, or
              help choosing the right blog template for your goals.
            </p>
            <ul className="list-none mt-[1.25rem] mb-0 mx-0 p-0 flex flex-col gap-[0.65rem] break-words [overflow-wrap:anywhere]">
              <li className="text-[clamp(0.85rem,1.8cqw,0.95rem)] text-[var(--blog-navy)] [overflow-wrap:anywhere] break-words [overflow-wrap:anywhere]">
                Email:{" "}
                <a href="mailto:support@stackly.com" className="text-[var(--blog-accent)] font-semibold no-underline hover:underline">support@stackly.com</a>
              </li>
              <li className="text-[clamp(0.85rem,1.8cqw,0.95rem)] text-[var(--blog-navy)] [overflow-wrap:anywhere] break-words [overflow-wrap:anywhere]">
                Help center:{" "}
                <Link href="/landing#contact" className="text-[var(--blog-accent)] font-semibold no-underline hover:underline">Visit support resources</Link>
              </li>
              <li className="text-[clamp(0.85rem,1.8cqw,0.95rem)] text-[var(--blog-navy)] [overflow-wrap:anywhere] break-words [overflow-wrap:anywhere]">Headquarters: MMR Complex, Salem, Tamil Nadu 636008</li>
              <li className="text-[clamp(0.85rem,1.8cqw,0.95rem)] text-[var(--blog-navy)] [overflow-wrap:anywhere] break-words [overflow-wrap:anywhere]">Hours: Monday–Friday, 9:00 AM – 6:00 PM IST</li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="w-full min-w-0" aria-labelledby="blog-faq-title">
        <div className="bg-[var(--blog-pink-bg)] py-[clamp(1.5rem,3.5cqw,2.25rem)] border-b-2 border-[#b8d4f5] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border">
          <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
            <h2 id="blog-faq-title" className="m-0 text-[clamp(1.5rem,3.5cqw,2.25rem)] font-extrabold leading-[1.2] text-[var(--blog-navy)] text-left break-words [overflow-wrap:anywhere]">
              Blog Website FAQ
            </h2>
          </div>
        </div>
        <div className="bg-[#e6f0ff] py-[clamp(2.5rem,5cqw,3.5rem)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border">
          <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0 grid grid-cols-1 gap-[clamp(1.75rem,4cqw,2.5rem)] items-center min-w-0 @min-[768px]:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] @min-[768px]:gap-[clamp(2rem,4cqw,3rem)] @min-[640px]:@max-[1023px]:gap-8">
            <div className="rounded-[0.65rem] overflow-hidden min-w-0 w-full max-w-[20rem] mx-auto @min-[768px]:max-w-none @min-[768px]:mx-0 h-full @max-[639px]:max-w-[min(100%,16rem)]">
              <img
                className="block w-full h-full aspect-square object-contain bg-[linear-gradient(145deg,var(--blog-blue-bg)_0%,var(--blog-pink-bg)_100%)] p-3"
                src={assetPath(blogImages.faq)}
                alt="FAQ illustration"
                loading="lazy"
                decoding="async"
                sizes="(max-width: 768px) 100vw, 320px"
              />
            </div>
            <div className="min-w-0 w-full">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={item.q} className="border-b border-[rgba(0,31,63,0.1)] min-w-0">
                    <button
                      type="button"
                      className="flex w-full min-w-0 items-center justify-between gap-6 py-[clamp(0.9rem,2cqw,1.1rem)] bg-none border-none cursor-pointer text-left @max-[639px]:gap-3 @max-[480px]:gap-3 @max-[340px]:gap-2"
                      onClick={() => setOpenFaq(isOpen ? -1 : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="flex-1 min-w-0 text-[clamp(0.9rem,1.9cqw,1.05rem)] font-semibold leading-[1.4] text-[var(--blog-navy)] [word-break:break-word] break-words [overflow-wrap:anywhere]">{item.q}</span>
                      <span className="shrink-0 w-5 text-center text-[1.25rem] leading-none font-normal text-[var(--blog-navy)]" aria-hidden>
                        {isOpen ? "×" : "+"}
                      </span>
                    </button>
                    {isOpen && <p className="m-0 pb-[1.1rem] text-[clamp(0.82rem,1.7cqw,0.9rem)] leading-[1.65] text-[#3d4f63] [overflow-wrap:break-word] break-words [overflow-wrap:anywhere]">{item.a}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--blog-pink-bg)] w-full max-w-full min-w-0 px-[var(--blog-safe-inline)] box-border py-[var(--blog-section-y-lg)]">
        <div className="w-full max-w-[var(--blog-container-wide)] mx-auto min-w-0">
          <div className="bg-[linear-gradient(180deg,#b0b8e8_0%,#e8eaf4_55%,#f5f6fa_100%)] border border-[#9ca3af] rounded-[var(--blog-radius-lg)] shadow-[0_8px_28px_rgba(0,31,63,0.14)] p-[clamp(4rem,10cqw,6.5rem)] px-[clamp(2rem,5cqw,3rem)] text-center min-w-0 min-h-[clamp(14rem,30cqw,18rem)] flex flex-col items-center justify-center @max-[899px]:p-[clamp(2.5rem,8cqw,4rem)] @max-[899px]:px-[clamp(1.25rem,4cqw,2rem)] @max-[899px]:min-h-auto @max-[480px]:p-10 @max-[480px]:px-5 @max-[340px]:p-8 @max-[340px]:px-3">
            <h2 className="text-[clamp(1.75rem,4.5cqw,2.5rem)] font-semibold leading-[1.2] text-[var(--blog-navy)] [text-wrap:balance]">Create a blog that inspires.</h2>
            <Link href={START_BLOGGING_HREF} className="inline-flex items-center justify-center mt-[clamp(1.5rem,3cqw,2rem)] min-h-[3rem] py-[0.65rem] px-[1.75rem] rounded-full bg-[var(--blog-navy)] border-2 border-[var(--blog-navy)] text-[var(--blog-white)] text-[clamp(0.875rem,1.8cqw,1rem)] font-bold no-underline shadow-[0_6px_16px_rgba(0,31,63,0.22)] cursor-pointer transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease max-w-full text-center hover:bg-[var(--blog-accent)] hover:border-[var(--blog-accent)] hover:text-[var(--blog-white)] hover:shadow-[0_10px_24px_rgba(45,140,240,0.35)] hover:-translate-y-[2px] active:translate-y-0">
              Start Blogging
            </Link>
          </div>
        </div>
      </section>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style jsx={false}>{`
        .blog-page {
          --blog-navy: #001f3f;
          --blog-navy-muted: #1a3a5c;
          --blog-blue-bg: #eaf2ff;
          --blog-pink-bg: #fff0f0;
          --blog-accent: #2d8cf0;
          --blog-white: #ffffff;
          --blog-container: 72rem;
          --blog-container-wide: 76rem;
          --blog-section-y: clamp(2.5rem, 7cqw, 5.5rem);
          --blog-section-y-lg: clamp(3rem, 8cqw, 6.5rem);
          --blog-radius-sm: 0.75rem;
          --blog-radius-md: 1rem;
          --blog-radius-lg: 1.25rem;
          --blog-safe-inline: clamp(0.75rem, 4cqw, 3rem);
          --stackly-nav-height: 3.5rem;
          --blog-header-height: 3.25rem;
          --blog-nav-gap: clamp(1rem, 2.5cqw, 1.5rem);
          --blog-header-content-gap: 0;
          --blog-scroll-offset: calc(
            var(--stackly-nav-height-measured, var(--stackly-nav-height)) +
              var(--blog-header-height) +
              0.5rem
          );
          --blog-top-split: 38%;
        }

        html:has(body > main.blog-page) {
          scroll-padding-top: var(--blog-scroll-offset);
        }

        @container (min-width: 768px) {
          .blog-page {
            --stackly-nav-height: 3.75rem;
            --blog-nav-gap: 1.5rem;
          }
        }

        @container (max-width: 639px) {
          .blog-page {
            --blog-safe-inline: clamp(0.65rem, 4cqw, 1.25rem);
            --blog-section-y: clamp(2rem, 6cqw, 3rem);
          }
        }

        @container (min-width: 1024px) {
          .blog-top-zone {
            --blog-top-split: 40%;
          }
        }

        @container (min-width: 1280px) {
          .blog-top-zone {
            --blog-top-split: 42%;
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .blog-page *,
          .blog-page *::before,
          .blog-page *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @container (max-width: 340px) {
          .blog-device-toolbar-inner button,
          .blog-device-toolbar-inner a {
            width: 1.75rem !important;
            height: 1.75rem !important;
          }
          .blog-device-toolbar-inner svg {
            font-size: 11px !important;
          }
        }
      `}</style>
    </main>
  );
}
