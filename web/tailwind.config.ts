import type { Config } from "tailwindcss";

// Celengin design tokens (mirror of src/lib/ui.ts for utility-class use).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#3F3530",
        sub: "#A99E94",
        bg: "#FBF5EF",
        card: "#FFFFFF",
        line: "#F1E9E1",
        faint: "#EFE7DE",
        accent: "#FF8A5B",
        accentDk: "#F0703F",
        accentSoft: "#FFE7DB",
        good: "#5FC6B0",
        warn: "#F4A93C",
        bad: "#EF6F6F",
      },
      fontFamily: {
        display: ["var(--font-fredoka)", "Fredoka", "sans-serif"],
        body: ["var(--font-jakarta)", "Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
