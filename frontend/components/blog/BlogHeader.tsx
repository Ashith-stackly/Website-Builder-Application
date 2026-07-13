"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaBars, FaChevronDown, FaRightFromBracket, FaUser, FaXmark } from "react-icons/fa6";
import { blogCategories } from "@/lib/blogCategories";

const navLinks = [
  { label: "Home", hash: "#blog-home" },
  { label: "Categories", hash: "#blog-categories", hasDropdown: true },
  { label: "Trending Post", hash: "#blog-trending" },
  { label: "About", hash: "#blog-about" },
  { label: "Contact", hash: "#blog-contact" },
] as const;

export default function BlogHeader() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const categoriesTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileCategoriesTriggerRef = useRef<HTMLButtonElement>(null);

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
    if (!categoriesOpen && !profileOpen) return;

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
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [categoriesOpen, profileOpen]);

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

  /* Keep anchor scroll offsets aligned with Stackly navbar height */
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
    <header className="blog-header">
      <div className="blog-header-inner">
        <button
          type="button"
          className="blog-logo blog-logo-btn"
          onClick={() => scrollToSection("#blog-home")}
        >
          Blogify.
        </button>

        <nav className="blog-nav-desktop" aria-label="Blog main navigation">
          {navLinks.map((link) =>
            isCategoriesLink(link) ? (
              <div
                key={link.label}
                ref={dropdownRef}
                className="blog-nav-dropdown-wrap"
                onBlurCapture={handleCategoriesBlurCapture}
              >
                <button
                  ref={categoriesTriggerRef}
                  type="button"
                  className="blog-nav-link blog-nav-link-btn"
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
                    className={`blog-nav-chevron${categoriesOpen ? " blog-nav-chevron--open" : ""}`}
                    aria-hidden
                  />
                </button>
                {categoriesOpen && (
                  <div
                    id="blog-categories-menu"
                    className="blog-nav-dropdown"
                    role="menu"
                  >
                    <p className="blog-nav-dropdown-heading">Blog categories</p>
                    {blogCategories.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className="blog-nav-dropdown-item"
                        onClick={() => scrollToSection(`#${item.id}`)}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      className="blog-nav-dropdown-item blog-nav-dropdown-item--all"
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
                className="blog-nav-link blog-nav-link-btn"
                onClick={() => scrollToSection(link.hash)}
              >
                {link.label}
              </button>
            )
          )}
        </nav>

        <div className="blog-header-actions">
          <div ref={profileRef} className="blog-profile-menu-wrap blog-profile-menu-wrap--desktop">
            <button
              type="button"
              className="blog-user-icon blog-user-icon-btn"
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
              <div className="blog-profile-dropdown" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="blog-profile-dropdown-item blog-profile-dropdown-item--logout"
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
            className={`blog-mobile-toggle${mobileOpen ? " blog-mobile-toggle--open" : ""}`}
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
              <FaXmark className="blog-mobile-toggle-icon" aria-hidden />
            ) : (
              <FaBars className="blog-mobile-toggle-icon" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="blog-mobile-nav"
          className="blog-nav-mobile"
          aria-label="Blog mobile navigation"
        >
          {navLinks.map((link) =>
            isCategoriesLink(link) ? (
              <div
                key={link.label}
                className="blog-nav-mobile-dropdown"
                onBlurCapture={handleMobileCategoriesBlurCapture}
              >
                <button
                  ref={mobileCategoriesTriggerRef}
                  type="button"
                  className="blog-nav-mobile-link blog-nav-mobile-link--dropdown"
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
                    className={`blog-nav-chevron${mobileCategoriesOpen ? " blog-nav-chevron--open" : ""}`}
                    aria-hidden
                  />
                </button>
                {mobileCategoriesOpen && (
                  <div
                    id="blog-mobile-categories-menu"
                    className="blog-nav-mobile-categories"
                    role="menu"
                  >
                    {blogCategories.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        className="blog-nav-mobile-category"
                        onClick={() => scrollToSection(`#${item.id}`)}
                      >
                        {item.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      role="menuitem"
                      className="blog-nav-mobile-category blog-nav-mobile-category--all"
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
                className="blog-nav-mobile-link"
                onClick={() => scrollToSection(link.hash)}
              >
                {link.label}
              </button>
            )
          )}
          <div className="blog-nav-mobile-account">
            <p className="blog-nav-mobile-account-label">Account</p>
            <button
              type="button"
              className="blog-nav-mobile-link blog-nav-mobile-link--account"
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
              className="blog-nav-mobile-logout"
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
