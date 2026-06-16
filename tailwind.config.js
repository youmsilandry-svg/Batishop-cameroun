/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brique:  { DEFAULT: '#C0392B', dark: '#96281B', light: '#E74C3C' },
        acier:   { DEFAULT: '#1A2332', light: '#2c3e50' },
        or:      { DEFAULT: '#D4A853', light: '#F0C060' },
        beton:   { DEFAULT: '#F2EDE8', dark: '#E5DDD5' },
      },
      fontFamily: {
        condensed: ['Roboto Condensed', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
