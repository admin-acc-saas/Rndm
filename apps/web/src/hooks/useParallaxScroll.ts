"use client";

import { useEffect } from "react";

/**
 * Apply subtle parallax to the hero content and the experience cards using a
 * single requestAnimationFrame-throttled scroll listener that writes only CSS
 * custom properties. This avoids layout thrash and per-element handlers.
 *
 * - Hero content drifts down and fades as the user scrolls past the fold.
 * - `.parallax-up` / `.parallax-down` elements receive opposing offsets.
 *
 * Disabled entirely when the user prefers reduced motion.
 */
export function useParallaxScroll() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let frame = 0;
    const hero = document.getElementById("hero-content-wrapper");

    const update = () => {
      frame = 0;
      const y = window.scrollY;

      if (hero && y < 1200) {
        hero.style.transform = `translateY(${y * 0.3}px)`;
        hero.style.opacity = String(Math.max(0, 1 - y / 800));
      }

      const up = y * -0.06;
      const down = y * 0.06;
      const root = document.documentElement;
      root.style.setProperty("--scroll-up", `${up}px`);
      root.style.setProperty("--scroll-down", `${down}px`);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
}
