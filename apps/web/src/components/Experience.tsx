import { PhoneCall, User, Headphones, Radio } from "lucide-react";
import { Reveal } from "./Reveal";

const callerPerks = [
  "Target Gender Switcher",
  "Multi-Language Filters",
  "Topic-Based Categories",
];

const hostPerks = [
  "One-Tap Availability",
  "Real-Time Notifications",
  "Talk-Time Analytics",
];

/**
 * Experience section: two large contrasting cards presenting the Caller and
 * Host experiences. Mirrors the reference layout (orange caller card on the
 * left, dark host card offset down on the right) with subtle parallax offsets.
 *
 * The `#hosts` anchor is preserved on the host card so existing deep links
 * still land on the host information block.
 */
export function Experience() {
  return (
    <section
      id="experience"
      className="py-24 md:py-48 relative overflow-hidden bg-ink-700"
    >
      <div className="container mx-auto px-6 md:px-8 lg:px-12 relative z-10">
        <Reveal className="mb-16 md:mb-32 text-center">
          <h2 className="text-[clamp(2.25rem,8vw,3rem)] md:text-8xl font-serif leading-none">
            Tailored for
            <br />
            <span className="italic text-accent">your voice.</span>
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
          {/* Caller card */}
          <div className="parallax-down">
            <Reveal className="bg-accent rounded-4xl p-7 sm:p-10 md:p-14 aspect-[4/5] flex flex-col justify-between shadow-2xl transition-all duration-700 group overflow-hidden relative">
              <div className="absolute -bottom-10 -right-10 opacity-10">
                <PhoneCall className="text-[200px] text-black" />
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-black/10 flex items-center justify-center">
                  <User className="text-black text-3xl" />
                </div>
                <span className="text-black font-bold text-sm border border-black/30 px-4 py-1.5 rounded-full uppercase">
                  For Callers
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-4xl md:text-6xl text-black mb-8 leading-none font-serif font-bold">
                  One tap
                  <br />
                  to match.
                </h3>
                <ul className="space-y-4 text-black/80 text-lg font-medium">
                  {callerPerks.map((perk) => (
                    <li key={perk}>✓ {perk}</li>
                  ))}
                </ul>
              </div>

              <div className="w-full h-px bg-black/10 mt-12" />
            </Reveal>
          </div>

          {/* Host card */}
          <div id="hosts" className="parallax-up lg:mt-32">
            <Reveal
              delay={150}
              className="bg-ink-card border border-white/10 rounded-4xl p-7 sm:p-10 md:p-14 aspect-[4/5] flex flex-col justify-between shadow-2xl transition-all duration-700 relative overflow-hidden"
            >
              <div className="absolute -bottom-10 -right-10 opacity-5">
                <Radio className="text-[200px] text-white" />
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                  <Headphones className="text-white text-3xl" />
                </div>
                <span className="text-white/40 font-bold text-sm border border-white/10 px-4 py-1.5 rounded-full uppercase">
                  For Hosts
                </span>
              </div>

              <div className="relative z-10">
                <h3 className="text-4xl md:text-6xl text-white mb-8 leading-none font-serif font-bold">
                  Host the
                  <br />
                  moment.
                </h3>
                <ul className="space-y-4 text-gray-400 text-lg">
                  {hostPerks.map((perk) => (
                    <li key={perk}>✓ {perk}</li>
                  ))}
                </ul>
              </div>

              <div className="w-full h-px bg-white/10 mt-12" />
            </Reveal>
          </div>
        </div>
      </div>

      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </section>
  );
}
