"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import StacklyLoader from "./StacklyLoader";

const SHOW_DELAY_MS = 140;
const MIN_VISIBLE_MS = 2000;
const MAX_VISIBLE_MS = 3000;

function isModifiedClick(event: globalThis.MouseEvent) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export default function RouteLoadingOverlay() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const startedAt = useRef(0);
  const showTimer = useRef<number | null>(null);
  const hideTimer = useRef<number | null>(null);
  const maxTimer = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (showTimer.current) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }

    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }

    if (maxTimer.current) {
      window.clearTimeout(maxTimer.current);
      maxTimer.current = null;
    }
  }, []);

  const show = useCallback(() => {
    clearTimers();
    showTimer.current = window.setTimeout(() => {
      startedAt.current = Date.now();
      setVisible(true);
      maxTimer.current = window.setTimeout(() => setVisible(false), MAX_VISIBLE_MS);
      showTimer.current = null;
    }, SHOW_DELAY_MS);
  }, [clearTimers]);

  useEffect(() => {
    const handleDocumentClick = (event: globalThis.MouseEvent) => {
      if (isModifiedClick(event)) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a") : null;

      if (!(target instanceof HTMLAnchorElement)) {
        return;
      }

      const href = target.getAttribute("href");

      if (!href || href.startsWith("#") || target.target === "_blank" || target.hasAttribute("download")) {
        return;
      }

      const nextUrl = new URL(target.href, window.location.href);
      const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
      const nextPath = nextUrl.pathname.replace(/\/+$/, "") || "/";

      if (nextUrl.origin !== window.location.origin || nextPath === currentPath) {
        return;
      }

      show();
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      clearTimers();
    };
  }, [clearTimers, show]);

  useEffect(() => {
    if (showTimer.current) {
      window.clearTimeout(showTimer.current);
      showTimer.current = null;
    }

    if (!visible) {
      return;
    }

    const elapsed = Date.now() - startedAt.current;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed);

    hideTimer.current = window.setTimeout(() => {
      setVisible(false);
      clearTimers();
    }, delay);
  }, [clearTimers, pathname, visible]);

  if (!visible) {
    return null;
  }

  return <StacklyLoader label="Preparing page" />;
}
