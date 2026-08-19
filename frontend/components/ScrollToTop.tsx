"use client";
 
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
 
const SHOW_AFTER_PX = 500;
 
/** Builder / preview surfaces use their own scroll chrome; avoid fixed overlap. */
function shouldHideScrollToTop(pathname: string | null) {
  if (!pathname) return false;
  return pathname.startsWith("/blockpages") || pathname.startsWith("/portfolio");
}
 
export default function ScrollToTop() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);
 
  useEffect(() => {
    if (typeof window === "undefined") return;
 
    const handlePopState = () => {
      sessionStorage.setItem("landing-page-is-back", "true");
    };
 
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);
 
  useEffect(() => {
    if (shouldHideScrollToTop(pathname)) {
      setIsVisible(false);
      return;
    }
 
    const handleScroll = () => {
      setIsVisible(window.scrollY >= SHOW_AFTER_PX);
 
      const threshold = 120;
      const isAtBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - threshold;
      setIsNearBottom(isAtBottom);
    };
 
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
 
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [pathname]);
 
  if (shouldHideScrollToTop(pathname)) {
    return null;
  }
 
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  };
 
  return (
    <button
      type="button"
      aria-label="Back to top"
      aria-hidden={!isVisible}
      onClick={scrollToTop}
      tabIndex={isVisible ? 0 : -1}
      className={`fixed right-4 z-[2500] flex h-8 w-8 items-center justify-center rounded-full bg-[#06224C] text-white shadow-md ring-1 ring-white/10 transition-[opacity,transform,background-color,bottom] duration-300 ease-out motion-reduce:transition-none hover:bg-[#0A2C59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:right-8 sm:h-11 sm:w-11 sm:shadow-[0_18px_36px_rgba(6,34,76,0.28)] ${
        isNearBottom ? "bottom-20 sm:bottom-24" : "bottom-4 sm:bottom-8"
      } ${
        isVisible ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-90 opacity-0"
      }`}
    >
      <ArrowUp className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}