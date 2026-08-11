import Link from "next/link";
import { Reveal } from "./Reveal";
import { routes } from "@/lib/routes";

/**
 * Closing call-to-action. Primary button routes into the future Web App
 * entry point (`/app`); secondary link scrolls to the features section.
 */
export function CallToAction() {
  return (
    <section className="py-32 bg-ink relative border-t border-white/5">
      <div className="container mx-auto px-8 text-center">
        <Reveal>
          <span className="text-accent font-mono tracking-[0.4em] uppercase text-xs mb-8 block">
            Ready to connect?
          </span>
          <h2 className="text-4xl md:text-7xl font-serif mb-12">
            Pure connection.
            <br />
            Just voice.
          </h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <Link
              href={routes.app}
              className="bg-white text-black px-12 py-5 rounded-full font-bold text-lg hover:bg-accent hover:text-white transition-all"
            >
              Open RNDM App
            </Link>
            <Link
              href={routes.features}
              className="text-white/60 hover:text-white border-b border-white/20 pb-1"
            >
              Learn how it works
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
