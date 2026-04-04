/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tr-orange': '#FA6400',
        'tr-gray': '#404040',
      },
    },
  },
  plugins: [],
}

