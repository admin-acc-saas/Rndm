import type { Config } from "tailwindcss";

/**
 * RNDM design tokens.
 * Colors and typography mirror the locked marketing visual system:
 * deep black background, orange (#FF4500) accent, Zodiak display serif,
 * Plus Jakarta Sans body sans.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#050505",
          700: "#070707",
          card: "#111111",
        },
        accent: {
          DEFAULT: "#FF4500",
          50: "rgba(255, 69, 0, 0.10)",
          30: "rgba(255, 69, 0, 0.30)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        container: "1280px",
      },
      keyframes: {
        "float-left": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-30px) rotate(3deg)" },
        },
        "float-right": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(30px) rotate(-3deg)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "float-left": "float-left 15s ease-in-out infinite",
        "float-right": "float-right 18s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
      borderRadius: {
        "4xl": "2.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
