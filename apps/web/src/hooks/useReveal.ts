"use client";

import { useEffect, useRef } from "react";

/**
 * Reveal-on-scroll via a single shared IntersectionObserver.
 *
 * Attach the returned ref to any element carrying the `.reveal` class. When
 * the element enters the viewport, `.is-visible` is added and the CSS
 * transition runs once. Elements are unobserved after first reveal so there
 * is no per-scroll cost for content already shown.
 *
 * Honors prefers-reduced-motion: the global stylesheet neutralizes the
 * transition, and this hook additionally reveals immediately when the user
 * has requested reduced motion.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
