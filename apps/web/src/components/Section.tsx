import { ReactNode } from "react";
import { Reveal } from "./Reveal";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

/** Standard content section wrapper with consistent vertical rhythm. */
export function Section({ children, className = "", id }: SectionProps) {
  return (
    <section id={id} className={`py-20 md:py-24 relative ${className}`}>
      <div className="container mx-auto px-6 md:px-8 lg:px-12">{children}</div>
    </section>
  );
}

/** Two-column prose/feature layout used on informational pages. */
export function FeatureRow({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 border-b border-white/5">
      <h3 className="text-xl font-serif text-white md:col-span-1">{title}</h3>
      <div className="md:col-span-2 text-gray-400 leading-relaxed">
        {children}
      </div>
    </Reveal>
  );
}
