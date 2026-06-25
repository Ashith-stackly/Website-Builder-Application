"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp } from "lucide-react";

const SHOW_AFTER_PX = 500;

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  return (
    <motion.button
      type="button"
      aria-label="Back to top"
      aria-hidden={!isVisible}
      onClick={scrollToTop}
      tabIndex={isVisible ? 0 : -1}
      initial={false}
      animate={isVisible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.9, y: 12 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="fixed bottom-6 right-6 z-[2500] flex h-12 w-12 items-center justify-center rounded-full bg-[#06224C] text-white shadow-[0_18px_36px_rgba(6,34,76,0.28)] ring-1 ring-white/10 transition-colors hover:bg-[#0A2C59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white sm:bottom-8 sm:right-8 sm:h-14 sm:w-14"
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
    >
      <ArrowUp className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.5} aria-hidden="true" />
    </motion.button>
  );
}
