"use client";

import { ElementType, ReactNode } from "react";
import { useReveal } from "@/hooks/useReveal";

type RevealProps = {
  children: ReactNode;
  /** Inline transition delay in ms, mirrors the reference staggered reveal. */
  delay?: number;
  className?: string;
  as?: ElementType;
};

/**
 * Wraps children in an element that reveals on scroll. Renders the given tag
 * (defaults to div) and forwards the reveal ref + class.
 */
export function Reveal({
  children,
  delay,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
