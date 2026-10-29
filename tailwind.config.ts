import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#050706",
          900: "#070b0a",
          850: "#0a100f",
          800: "#0d1514",
          700: "#12201e",
          600: "#1a2f2c",
        },
        neon: {
          DEFAULT: "#00ff9c",
          dim: "#00c477",
          soft: "#7dffd0",
        },
        ice: {
          DEFAULT: "#00e5ff",
          dim: "#0aa9c2",
        },
        muted: "#6f8a83",
        body: "#cfe3dc",
        danger: "#ff4d6d",
        warn: "#ffcc66",
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      boxShadow: {
        neon: "0 0 22px -4px rgba(0, 255, 156, 0.45)",
        ice: "0 0 22px -4px rgba(0, 229, 255, 0.4)",
        panel: "0 18px 50px -24px rgba(0, 0, 0, 0.95)",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        pulseDot: {
          "0%, 100%": { opacity: "0.25", transform: "translateY(0)" },
          "50%": { opacity: "1", transform: "translateY(-2px)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        sweep: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(200%)" },
        },
      },
      animation: {
        blink: "blink 1s step-end infinite",
        dot1: "pulseDot 1.1s ease-in-out infinite",
        dot2: "pulseDot 1.1s ease-in-out 0.15s infinite",
        dot3: "pulseDot 1.1s ease-in-out 0.3s infinite",
        slideUp: "slideUp 0.35s ease-out both",
        sweep: "sweep 2.4s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
