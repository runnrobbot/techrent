/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0050cb",
          50: "#eff4ff",
          100: "#dbe8ff",
          200: "#bfd4ff",
          300: "#93b6ff",
          400: "#608dff",
          500: "#3b63ff",
          600: "#1f3df5",
          700: "#1730e1",
          800: "#1928b5",
          900: "#0050cb",
          950: "#0a1566",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
