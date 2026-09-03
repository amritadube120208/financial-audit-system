import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        surface: "#FFFFFF",
        subtle: "#F1F5F9",
        border: "#E2E8F0",
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#4F46E5",
          600: "#4338CA",
          700: "#3730A3",
          900: "#1E1B4B"
        },
        severity: {
          low: "#10B981",
          medium: "#F59E0B",
          high: "#EA580C",
          critical: "#DC2626"
        }
      },
    },
  },
  plugins: [],
};
export default config;
