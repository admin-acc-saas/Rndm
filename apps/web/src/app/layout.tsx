import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { pageMetadata, siteConfig } from "@/lib/site";

// Plus Jakarta Sans is served via next/font (self-hosted at build time, no
// runtime Google Fonts dependency). Zodiak is self-hosted via @font-face
// declarations in globals.css, loading woff2 from /public/fonts.
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  ...pageMetadata(),
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "RNDM — Meaningful Voice Connections" }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable}`}
      style={{ "--font-serif": "'Zodiak', Georgia, serif" } as React.CSSProperties}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
