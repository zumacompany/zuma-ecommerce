/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        zuma: {
          50: "#EAF1FF",
          100: "#D6E5FF",
          200: "#AFCBFF",
          300: "#88B1FF",
          400: "#6297FF",
          500: "#3A7AFE",
          600: "#2E5EDB",
          700: "#244AB1",
          800: "#1B3787",
          900: "#12245D",
        },
        success: { 50: "#ECFDF5", 500: "#22C55E", 700: "#15803D" },
        warning: { 50: "#FFFBEB", 500: "#F59E0B", 700: "#B45309" },
        danger: { 50: "#FEF2F2", 500: "#EF4444", 700: "#B91C1C" },

        // Token colors via CSS vars:
        bg: "hsl(var(--bg))",
        card: "hsl(var(--card))",
        text: "hsl(var(--text))",
        muted: "hsl(var(--muted))",
        borderc: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
      },
      borderRadius: { xl: "12px", lg: "10px" },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.05)",
        pop: "0 10px 25px rgba(0,0,0,0.10)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      container: { center: true, padding: "1rem", screens: { lg: "1200px" } },
    },
  },
  plugins: [],
};