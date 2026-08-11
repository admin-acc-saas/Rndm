"use client";

import { useEffect, useState } from "react";

/**
 * Renders the visitor's local time, updated every minute. This is genuinely
 * live (the client clock), not a fabricated operational metric, so it is safe
 * to show. Kept client-side only to avoid SSR/CSR hydration mismatch.
 */
export function CurrentTime() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      const a = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h}:${m} ${a}`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // Render a stable placeholder until mounted to avoid hydration mismatch.
  return <span aria-label="Current local time">{time ?? "--:-- --"}</span>;
}
