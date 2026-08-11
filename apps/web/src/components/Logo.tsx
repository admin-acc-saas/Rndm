import Link from "next/link";
import { Mic } from "lucide-react";

/** RNDM wordmark with the orange mic badge. */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`text-2xl font-bold tracking-tighter font-serif flex items-center gap-2 ${className}`}
      aria-label="RNDM home"
    >
      <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
        <Mic className="text-black" size={16} strokeWidth={2.5} />
      </span>
      RNDM.
    </Link>
  );
}
