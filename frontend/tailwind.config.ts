import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        canvas: "var(--aura-canvas)",
        ff: {
          purple: "var(--aura-purple)",
          "purple-hover": "var(--aura-purple-hover)",
          soft: "var(--aura-purple-soft)",
          muted: "var(--aura-purple-muted)",
          border: "var(--aura-border)",
          text: "var(--aura-text)",
          gray: "var(--aura-muted)",
          "gray-2": "var(--aura-muted-2)",
          sidebar: "var(--aura-sidebar)",
          bg: "var(--aura-bg)",
        },
        brand: {
          DEFAULT: "var(--aura-purple)",
          soft: "var(--aura-purple-soft)",
          dark: "var(--aura-purple-hover)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(31, 31, 46, 0.04)",
        "card-hover": "0 4px 14px rgba(108, 92, 231, 0.08)",
        soft: "0 2px 8px rgba(31, 31, 46, 0.06)",
      },
      borderRadius: {
        ff: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
