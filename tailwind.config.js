/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {    extend: {
      colors: {
        primary: {
          DEFAULT: '#0095ff',
          dark: '#0077cc',
          light: '#33aaff',
        },
        secondary: {
          DEFAULT: '#6c757d',
          dark: '#5a6268',
          light: '#7f878d',
        },
        dark: {
          DEFAULT: '#111827',
          lighter: '#1f2937',
          light: '#374151',
          input: '#2a3549',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
