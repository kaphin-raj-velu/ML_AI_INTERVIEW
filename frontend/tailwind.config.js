/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#030711",
        primary: {
          DEFAULT: "#6366f1",
          dark: "#4f46e5",
        },
        accent: {
          DEFAULT: "#8b5cf6",
          dark: "#7c3aed",
        }
      },
      backgroundImage: {
        'neon-gradient': 'linear-gradient(to right, #6366f1, #8b5cf6)',
      }
    },
  },
  plugins: [],
}
