import { pantai, primary, secondary } from './src/theme/colors.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pantai Hospital theme - White/Blue. Single source of truth: src/theme/colors.js
        pantai,
        primary,
        secondary,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
