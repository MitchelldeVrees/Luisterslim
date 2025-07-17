/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],       // ← Add this line

  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        accent: "#E0E7FF",
        bg: "#F9FAFB",
        text: "#111827",
      },
      fontFamily: {
        sans: ["Inter", "system-ui"],
      },
      borderRadius: {
        lg: "1rem",
      },
    },
  },
  plugins: [],
};
