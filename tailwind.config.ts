import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: { DEFAULT: "#10b981", foreground: "#0f172a" },
        brand: {
          50: "#f5f7ff",
          100: "#ebf0ff",
          200: "#d6e0ff",
          300: "#b3c7ff",
          400: "#80a3ff",
          500: "#4d7cff",
          600: "#1a55ff",
          700: "#003bd6",
          800: "#002fa8",
          900: "#00227a",
          950: "#001247"
        },
        obsidian: {
          50: "#f4f6fa",
          100: "#e9edf5",
          200: "#cbd5e1",
          300: "#94a3b8",
          400: "#64748b",
          500: "#475569",
          600: "#334155",
          700: "#1e293b",
          800: "#0f172a",
          900: "#0b0f19",
          950: "#070a10"
        }
      },
      fontFamily: {
        sans: ["Outfit", "ui-sans-serif", "system-ui", "sans-serif"],
        heading: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
} satisfies Config;
