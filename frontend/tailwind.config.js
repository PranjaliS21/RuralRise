/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // RuralRise brand: earthy greens + warm accents
        brand: {
          50: "#f2f7f3",
          100: "#e0ecdf",
          200: "#c3d9c2",
          300: "#9bbf9b",
          400: "#6ea271",
          500: "#4b8452",
          600: "#2B704E",
          700: "#235a40",
          800: "#1d4834",
          900: "#163a2a",
        },
        accent: {
          50: "#fef7ed",
          100: "#fdecd4",
          300: "#f6c680",
          500: "#ec9d30",
          600: "#d97f1a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(22,58,42,0.08), 0 1px 2px rgba(22,58,42,0.04)",
        lifted: "0 8px 24px rgba(22,58,42,0.12)",
      },
      borderRadius: {
        xl: "0.9rem",
      },
    },
  },
  plugins: [],
};
