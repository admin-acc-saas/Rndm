import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { footerLinks } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="pt-32 pb-16 border-t border-white/5 bg-ink relative overflow-hidden">
      <div className="container mx-auto px-8 lg:px-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-16 mb-24">
          <div>
            <Logo className="text-3xl mb-8" />
            <h2 className="text-[12vw] leading-[0.75] tracking-tighter text-white/5 font-bold select-none">
              RNDM.
            </h2>
          </div>

          <div className="flex flex-col gap-10 text-left md:text-right">
            <div className="grid grid-cols-2 md:flex gap-12 text-sm uppercase tracking-widest font-semibold text-gray-500">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {footerLinks.social.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="hover:text-white transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="text-xs text-gray-600 font-mono">
              GLOBAL VOICE PLATFORM
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
          <p className="text-xs text-gray-700 tracking-widest uppercase">
            © {new Date().getFullYear()} RNDM. ALL RIGHTS RESERVED.
          </p>
          <ShieldCheck className="text-xl text-gray-800" />
        </div>
      </div>
    </footer>
  );
}
