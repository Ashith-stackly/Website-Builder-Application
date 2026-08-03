"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { assetPath } from "@/lib/paths";

export const buyscreenTopHeaderNavSections: Record<string, string> = {
  Home: "buyscreen-home",
  "About Us": "buyscreen-about",
  "Our Products": "buyscreen-products",
  Categories: "buyscreen-categories",
  Contact: "buyscreen-contact",
};

export const buyscreenTopHeaderMobileItems = [
  "Home",
  "About Us",
  "Our Products",
  "Categories",
  "Contact",
] as const;

type BuyscreenTopHeaderProps = {
  topHeaderBarRef: RefObject<HTMLDivElement | null>;
  topHeaderSearchInputRef: RefObject<HTMLInputElement | null>;
  activeTopHeaderItem: string;
  isTopHeaderMenuOpen: boolean;
  setIsTopHeaderMenuOpen: Dispatch<SetStateAction<boolean>>;
  isTopHeaderSearchOpen: boolean;
  setIsTopHeaderSearchOpen: Dispatch<SetStateAction<boolean>>;
  topHeaderSearchQuery: string;
  setTopHeaderSearchQuery: Dispatch<SetStateAction<string>>;
  isTopHeaderProfileMenuOpen: boolean;
  setIsTopHeaderProfileMenuOpen: Dispatch<SetStateAction<boolean>>;
  onTopHeaderItemClick: (item: string) => void;
  onCartClick: () => void;
  isBlockpages?: boolean;
  hideUserAccount?: boolean;
};

export default function BuyscreenTopHeader({
  topHeaderBarRef,
  topHeaderSearchInputRef,
  activeTopHeaderItem,
  isTopHeaderMenuOpen,
  setIsTopHeaderMenuOpen,
  isTopHeaderSearchOpen,
  setIsTopHeaderSearchOpen,
  topHeaderSearchQuery,
  setTopHeaderSearchQuery,
  isTopHeaderProfileMenuOpen,
  setIsTopHeaderProfileMenuOpen,
  onTopHeaderItemClick,
  onCartClick,
  isBlockpages = false,
  hideUserAccount = false,
}: BuyscreenTopHeaderProps) {
  const router = useRouter();

  return (
    <header
      data-blockpages-ecommerce-chrome="top-header"
      className="buyscreen-top-header w-full shrink-0 bg-[#06224C] text-white"
    >
      <div ref={topHeaderBarRef}>
        <div className="buyscreen-top-header-inner mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="buyscreen-top-header-row buyscreen-top-header-mobile-row flex min-w-0 flex-wrap items-center justify-between gap-2 py-2.5 lg:hidden">
            <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isBlockpages) return;
                  setIsTopHeaderMenuOpen((v) => !v);
                }}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/25 text-white transition-colors hover:bg-white/15 sm:h-8 sm:w-8 planning-zoom-show-hamburger"
                aria-label="Toggle top navigation menu"
                aria-expanded={isTopHeaderMenuOpen}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M3 5.5H17M3 10H17M3 14.5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <div className="flex h-7 min-w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[50%] bg-white px-2 sm:h-9 sm:min-w-[92px] sm:px-3">
                <Image
                  src={assetPath("/stackly-logo.webp")}
                  alt="Stackly logo"
                  width={160}
                  height={40}
                  className="h-[14px] w-auto sm:h-[20px]"
                  unoptimized
                />
              </div>
            </div>

            <div className="buyscreen-top-header-actions flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/80 text-white transition-colors hover:bg-white/15 hover:text-[#fef3c7] sm:h-8 sm:w-8"
                aria-label="Cart"
                onClick={() => {
                  if (isBlockpages) return;
                  onCartClick();
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L20.6 7H7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="10" cy="19" r="1.4" fill="currentColor" />
                  <circle cx="17" cy="19" r="1.4" fill="currentColor" />
                </svg>
              </button>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#06224C] transition-colors hover:bg-[#fef3c7] sm:h-8 sm:w-8"
                aria-label="Search"
                aria-expanded={isTopHeaderSearchOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isBlockpages) return;
                  setIsTopHeaderSearchOpen((v) => !v);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                  <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
              {!hideUserAccount ? (
                <div
                  data-top-header-profile-wrap
                  data-blockpages-element-id="buyscreen-user-account"
                  className="buyscreen-user-menu-wrap relative shrink-0"
                >
                  <button
                    type="button"
                    className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 transition-colors hover:border-[#fef3c7] hover:bg-white/10 sm:h-8 sm:w-8"
                    aria-label="Profile"
                    aria-expanded={isTopHeaderProfileMenuOpen}
                    aria-haspopup="menu"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isBlockpages) return;
                      setIsTopHeaderProfileMenuOpen((prev) => !prev);
                    }}
                  >
                    <Image
                      src={assetPath("/photo.webp")}
                      alt="Profile"
                      width={36}
                      height={36}
                      className="block h-full w-full object-cover"
                      unoptimized
                    />
                  </button>
                  <div
                    className={`buyscreen-user-menu-dropdown ${isTopHeaderProfileMenuOpen ? "buyscreen-user-menu-dropdown--open" : ""}`}
                    data-blockpages-dropdown-panel="true"
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
              ) : null}
            </div>
          </div>

          <div className="buyscreen-top-header-row buyscreen-top-header-desktop-row hidden w-full min-w-0 items-center py-3 lg:flex">
            <nav
              className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-0 text-[13px] font-semibold text-white"
              aria-label="Main"
            >
              <div className="flex h-9 min-w-[104px] shrink-0 items-center justify-center overflow-hidden rounded-[50%] bg-white px-3">
                <Image
                  src={assetPath("/stackly-logo.webp")}
                  alt="Stackly logo"
                  width={160}
                  height={40}
                  className="h-[20px] w-auto"
                  unoptimized
                />
              </div>
              {buyscreenTopHeaderMobileItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`buyscreen-top-header-nav-item shrink-0 whitespace-nowrap text-[13px] font-semibold${activeTopHeaderItem === item ? " buyscreen-top-header-nav-item--active" : ""}${item === "Our Products" || item === "Categories" ? " inline-flex items-center gap-1" : ""}`}
                  onClick={() => onTopHeaderItemClick(item)}
                >
                  {item}
                  {item === "Our Products" || item === "Categories" ? (
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden className="shrink-0">
                      <path
                        d="m5.5 7.5 4.5 5 4.5-5"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </button>
              ))}
              <div className="buyscreen-top-header-actions flex shrink-0 items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/90 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-white/15 hover:text-[#fef3c7]"
                  aria-label="Cart"
                  onClick={() => {
                    if (isBlockpages) return;
                    onCartClick();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M3 4h2l1.6 9.2a1 1 0 0 0 1 .8H18a1 1 0 0 0 1-.8L20.6 7H7"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="10" cy="19" r="1.4" fill="currentColor" />
                    <circle cx="17" cy="19" r="1.4" fill="currentColor" />
                  </svg>
                  Cart
                </button>
                <button
                  type="button"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#06224C] transition-colors hover:bg-[#fef3c7]"
                  aria-label="Search"
                  aria-expanded={isTopHeaderSearchOpen}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isBlockpages) return;
                    setIsTopHeaderSearchOpen((v) => !v);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </button>
                {!hideUserAccount ? (
                  <div
                    data-top-header-profile-wrap
                    data-blockpages-element-id="buyscreen-user-account"
                    className="buyscreen-user-menu-wrap relative shrink-0"
                  >
                    <button
                      type="button"
                      className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/40 transition-colors hover:border-[#fef3c7] hover:bg-white/10"
                      aria-label="Profile"
                      aria-expanded={isTopHeaderProfileMenuOpen}
                      aria-haspopup="menu"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isBlockpages) return;
                        setIsTopHeaderProfileMenuOpen((prev) => !prev);
                      }}
                    >
                      <Image
                        src={assetPath("/photo.webp")}
                        alt="Profile"
                        width={36}
                        height={36}
                        className="block h-full w-full object-cover"
                        unoptimized
                      />
                    </button>
                    <div
                      className={`buyscreen-user-menu-dropdown ${isTopHeaderProfileMenuOpen ? "buyscreen-user-menu-dropdown--open" : ""}`}
                      data-blockpages-dropdown-panel="true"
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
                ) : null}
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
                  onChange={(e) => setTopHeaderSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    setIsTopHeaderSearchOpen(false);
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
              {buyscreenTopHeaderMobileItems.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`buyscreen-top-header-nav-item buyscreen-top-header-nav-item--grid px-2 py-2 text-left text-xs${activeTopHeaderItem === item ? " buyscreen-top-header-nav-item--active" : ""}`}
                  onClick={() => onTopHeaderItemClick(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
