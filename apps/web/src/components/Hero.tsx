"use client";

import Image from "next/image";
import { PhoneCall } from "lucide-react";
import Link from "next/link";
import { Reveal } from "./Reveal";
import { routes } from "@/lib/routes";
import { useParallaxScroll } from "@/hooks/useParallaxScroll";
import { CurrentTime } from "./CurrentTime";

/**
 * Hero section. Reproduces the reference composition:
 * - blurred atmosphere backdrop
 * - two floating decorative images ("The Call" / "The Connection")
 * - centered serif headline with orange italic accent
 * - primary CTA + honest, non-fake status strip (live clock only)
 *
 * The fake "2,481 Hosts Online" operational metric from the reference has
 * been intentionally removed — it is not backed by a real service and would
 * misrepresent the product (per spec placeholder-data rule).
 */
export function Hero() {
  useParallaxScroll();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20 bg-ink">
      {/* Atmosphere backdrop */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <div className="absolute inset-0 opacity-50 mix-blend-screen">
          <Image
            src="/atmosphere/atmosphere.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-70 blur-3xl"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ink/50 to-ink z-10" />
      </div>

      {/* Floating decorative images */}
      <div className="absolute -left-[5%] top-[-10%] md:left-[-2%] md:top-[-5%] w-[70vw] md:w-[45vw] max-w-[900px] z-10 pointer-events-none mix-blend-hard-light opacity-75 animate-float-left">
        <Image
          src="/atmosphere/the-call.png"
          alt="Decorative call visualization"
          width={1540}
          height={1320}
          className="w-full h-auto object-contain"
        />
      </div>
      <div className="absolute -right-[8%] bottom-[-10%] md:right-[-2%] md:bottom-0 w-[75vw] md:w-[40vw] max-w-[800px] z-10 pointer-events-none mix-blend-hard-light opacity-75 animate-float-right">
        <Image
          src="/atmosphere/the-connection.png"
          alt="Decorative connection visualization"
          width={1542}
          height={1002}
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Centered content */}
      <div className="container mx-auto px-6 relative z-20 text-center flex flex-col items-center justify-center h-full">
        <div id="hero-content-wrapper" className="max-w-4xl mx-auto">
          <Reveal>
            <h1
              className="text-6xl md:text-8xl font-medium leading-[1.05] tracking-tight mb-8 text-[#ffe0e0] font-serif"
              style={{ textShadow: "0 0 15px rgba(255,255,255,.4)" }}
            >
              Meaningful.
              <br />
              <span className="italic font-light text-accent">
                Connections.
              </span>
            </h1>
          </Reveal>

          <Reveal delay={200}>
            <p className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto mb-16 font-light tracking-wide leading-relaxed">
              RNDM matches you with verified hosts for anonymous 1-on-1 voice
              calls. Real-time audio connections made simple directly in your
              browser.
            </p>
          </Reveal>

          <Reveal delay={400}>
            <div className="flex flex-col items-center gap-10">
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-accent/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <Link
                  href={routes.app}
                  className="relative border-2 border-white/20 bg-white/5 backdrop-blur-md px-10 py-4 rounded-full flex items-center gap-4 text-sm font-semibold text-white uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/40 transition-all duration-500"
                >
                  <PhoneCall className="text-xl text-accent" />
                  <span>Start Instant Match</span>
                </Link>
              </div>

              <div className="flex items-center gap-8 text-[10px] md:text-xs text-white/30 uppercase tracking-widest font-mono">
                <CurrentTime />
                <span className="w-px h-4 bg-white/10" />
                <span>Global Voice Platform</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
