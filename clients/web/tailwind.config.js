/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#121212',
        darkSurface: '#1e1e1e',
        darkBorder: '#333333',
        primary: '#b02a2a', // a dark red reflecting the dark wuxia / rebellion theme
        textMuted: '#a0a0a0',
        textMain: '#e0e0e0',
      }
    },
  },
  plugins: [],
}
