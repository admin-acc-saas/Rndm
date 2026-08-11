"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useScrolledNav } from "@/hooks/useScrolledNav";
import { navItems } from "@/lib/site";
import { routes } from "@/lib/routes";
import { Logo } from "./Logo";

/**
 * Fixed top navigation. Starts tall/transparent at the top of the page and
 * compacts into a blurred, bordered bar once the user scrolls past the fold.
 */
export function Navbar() {
  const scrolled = useScrolledNav();
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "py-5 bg-ink/90 backdrop-blur-xl border-b border-white/5"
          : "py-8"
      }`}
    >
      <div className="container mx-auto px-8 lg:px-12 flex items-center justify-between">
        <Logo />

        <div className="hidden md:flex items-center space-x-10">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  active ? "text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <Link
          href={routes.app}
          className="inline-flex items-center justify-center px-8 py-3 rounded-full text-sm font-semibold bg-white text-black hover:scale-105 hover:bg-accent hover:text-white transition-all"
        >
          Call Now
        </Link>
      </div>
    </nav>
  );
}
