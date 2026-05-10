import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        void: "#050608",
        obsidian: "#0B0D10",
        graphite: "#12161B",
        slate: "#1B222B",
        white: "#F4F7FA",
        mist: "#B8C0CC",
        ash: "#737D8C",
        "cipher-blue": "#5EE7FF",
        "key-violet": "#8B5CF6",
        "seal-amber": "#F6C65B",
        "proof-green": "#72F0A0",
        "breach-red": "#FF5C72",
        "on-surface": "#dee3e5",
        "on-surface-variant": "#bbc9cc",
        outline: "#869396",
        "outline-variant": "#3c494c",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        sm: "0.25rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
      },
      spacing: {
        "container-max": "1120px",
        gutter: "24px",
        "margin-mobile": "20px",
        "margin-desktop": "40px",
      },
      maxWidth: { "container-max": "1120px" },
      fontFamily: {
        display: ["Geist", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        display: ["56px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "600" }],
        hero: ["44px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        "page-title": ["32px", { lineHeight: "1.3", fontWeight: "500" }],
        "page-title-mobile": ["28px", { lineHeight: "1.3", fontWeight: "500" }],
        "section-title": ["22px", { lineHeight: "1.4", fontWeight: "500" }],
        "card-title": ["17px", { lineHeight: "1.5", fontWeight: "600" }],
        body: ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        small: ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        "micro-mono": ["11px", { lineHeight: "1.4", letterSpacing: "0.05em", fontWeight: "400" }],
      },
      boxShadow: {
        "cipher-glow": "0 0 15px rgba(94,231,255,0.2)",
        "proof-glow": "0 0 8px rgba(114,240,160,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
