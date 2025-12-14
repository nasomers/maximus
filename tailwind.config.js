/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0b",
        foreground: "#fafafa",
        card: {
          DEFAULT: "#141416",
          foreground: "#fafafa",
        },
        popover: {
          DEFAULT: "#141416",
          foreground: "#fafafa",
        },
        primary: {
          DEFAULT: "#3b82f6",
          foreground: "#fafafa",
        },
        secondary: {
          DEFAULT: "#27272a",
          foreground: "#fafafa",
        },
        muted: {
          DEFAULT: "#27272a",
          foreground: "#a1a1aa",
        },
        accent: {
          DEFAULT: "#27272a",
          foreground: "#fafafa",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#fafafa",
        },
        success: {
          DEFAULT: "#22c55e",
          foreground: "#fafafa",
        },
        warning: {
          DEFAULT: "#eab308",
          foreground: "#0a0a0b",
        },
        border: "#27272a",
        input: "#27272a",
        ring: "#3b82f6",
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
}
