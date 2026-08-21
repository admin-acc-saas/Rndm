import { ShieldCheck, Languages, Users } from "lucide-react";
import { Reveal } from "./Reveal";

const features = [
  {
    icon: ShieldCheck,
    label: "Anonymous by Design",
  },
  {
    icon: Languages,
    label: "Global Dialects",
  },
  {
    icon: Users,
    label: "Verified Hosts",
  },
];

/**
 * Features band: serif statement + three iconographic pillars.
 * Wording aligned to the spec (verified hosts, anonymity, global reach)
 * without making unsupported security/availability claims.
 */
export function Features() {
  return (
    <section id="features" className="py-20 md:py-40 relative">
      <div className="container mx-auto px-6 md:px-8 lg:px-12">
        <Reveal className="max-w-4xl mx-auto text-center">
          <h2 className="text-[clamp(1.875rem,5.5vw,2.5rem)] md:text-6xl leading-tight text-white mb-10 md:mb-14 font-serif">
            Conversations that{" "}
            <span className="italic text-white/60">disappear</span>, moments
            that <span className="italic">linger</span>.
          </h2>
          <p className="text-lg md:text-2xl text-gray-500 leading-relaxed font-light max-w-3xl mx-auto">
            Privacy is the foundation of honesty. RNDM is built as an anonymous
            space for late-night thoughts, language practice, and everything in
            between.
          </p>
        </Reveal>

        <div className="mt-16 md:mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 items-center justify-items-center">
          {features.map((feature, i) => (
            <Reveal
              key={feature.label}
              delay={i * 100}
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                <feature.icon className="text-3xl text-accent" />
              </div>
              <span className="text-xs uppercase tracking-widest text-gray-400">
                {feature.label}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
