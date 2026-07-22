"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER_PX = 500;

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY >= SHOW_AFTER_PX);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

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
      className={`fixed bottom-6 right-6 z-[2500] flex h-12 w-12 items-center justify-center rounded-full bg-[#06224C] text-white shadow-[0_18px_36px_rgba(6,34,76,0.28)] ring-1 ring-white/10 transition-[opacity,transform,background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-[#0A2C59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:bottom-8 sm:right-8 sm:h-14 sm:w-14 ${
        isVisible ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-3 scale-90 opacity-0"
      }`}
    >
      <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}
