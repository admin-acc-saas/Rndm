"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the page has been scrolled past the fold, so the nav can
 * transition to its compact, blurred, bordered state. Single listener.
 */
export function useScrolledNav(threshold = 50) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}
