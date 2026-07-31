/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1faf3",
          100: "#dcf3e2",
          200: "#b9e6c8",
          300: "#8ad3a3",
          400: "#57ba7c",
          500: "#339e5d",
          600: "#1F6E44",
          700: "#1c653b",
          800: "#195031",
          900: "#15422a",
          950: "#092416",
        },
        ink: "#103621",
        "ink-dim": "#5b7568",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(21, 66, 42, 0.06), 0 8px 24px -8px rgba(21, 66, 42, 0.12)",
        card: "0 1px 3px rgba(21, 66, 42, 0.08), 0 12px 32px -12px rgba(21, 66, 42, 0.18)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};