import { ReactNode } from "react";
import { Reveal } from "./Reveal";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
};

/**
 * Consistent header block for secondary marketing pages. Provides vertical
 * rhythm matching the hero density (top padding clears the fixed navbar).
 */
export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="pt-48 pb-24 relative">
      <div className="container mx-auto px-8 lg:px-12 max-w-4xl">
        <Reveal>
          {eyebrow ? (
            <span className="text-accent font-mono tracking-[0.4em] uppercase text-xs mb-8 block">
              {eyebrow}
            </span>
          ) : null}
          <h1 className="text-4xl md:text-6xl leading-tight text-white mb-8 font-serif">
            {title}
          </h1>
          {description ? (
            <p className="text-xl md:text-2xl text-gray-500 leading-relaxed font-light">
              {description}
            </p>
          ) : null}
        </Reveal>
      </div>
    </section>
  );
}
