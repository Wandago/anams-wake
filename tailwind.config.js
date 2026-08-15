/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          950: "#08070a",
          900: "#0d0b0e",
          800: "#151217",
          700: "#211c22",
        },
        bone: {
          100: "#f4ede2",
          300: "#d8cdbb",
          500: "#a89e91",
        },
        ember: {
          400: "#e0b466",
          500: "#c9a04a",
          600: "#a3812f",
        },
        wake: {
          500: "#8a2331",
          600: "#6e1c27",
          700: "#4c141b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.35em",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "48%": { opacity: "0.85" },
          "50%": { opacity: "0.55" },
          "52%": { opacity: "0.9" },
          "76%": { opacity: "0.7" },
        },
        drift: {
          "0%": { transform: "translateY(0px)" },
          "100%": { transform: "translateY(-14px)" },
        },
      },
      animation: {
        flicker: "flicker 6s ease-in-out infinite",
        drift: "drift 5s ease-in-out infinite alternate",
      },
    },
  },
  plugins: [],
};
