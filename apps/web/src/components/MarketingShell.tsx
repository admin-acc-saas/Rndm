import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

/**
 * Shared marketing page shell: noise overlay, fixed navbar, main content and
 * footer. Used by every public marketing route so layout is consistent and
 * only page content differs.
 */
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink selection:bg-accent selection:text-white">
      <div className="noise-overlay" aria-hidden="true" />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
