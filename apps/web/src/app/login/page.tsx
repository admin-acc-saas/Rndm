import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { Reveal } from "@/components/Reveal";
import { LoginForm } from "@/components/auth/LoginForm";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Sign in",
    description:
      "Sign in to RNDM with a passwordless email link to access the caller and host experiences.",
    path: "/login",
  }),
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <MarketingShell>
      <section className="min-h-[80vh] flex items-center justify-center pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-xl mx-auto">
            <Reveal className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
                Welcome to <span className="italic text-accent">RNDM</span>
              </h1>
              <p className="text-lg text-gray-400 font-light leading-relaxed mb-2">
                Sign in with your email to continue to the RNDM app.
              </p>
            </Reveal>
            <div className="flex justify-center">
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
