// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Replace the default neutral colors with your custom light/dark palette
      colors: {
        neutral: {
          // Light mode colors
          50: '#fafafa',   // lightest
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',  // darkest
          
          // Dark mode colors (reversed)
          'dark-50': '#171717',   // darkest
          'dark-100': '#262626',
          'dark-200': '#404040',
          'dark-300': '#525252',
          'dark-400': '#737373',
          'dark-500': '#a3a3a3',
          'dark-600': '#d4d4d4',
          'dark-700': '#e5e5e5',
          'dark-800': '#f5f5f5',
          'dark-900': '#fafafa',  // lightest
          'dark-950': '#ffffff'
        },
        // You can do the same for other color groups like primary, secondary, etc.
        primary: {
          light: '#3b82f6',   // blue in light mode
          dark: '#60a5fa'     // lighter blue in dark mode
        }
      },
      backgroundColor: {
        // Define background colors that automatically switch
        'background': 'rgb(var(--background-color) / <alpha-value>)',
        'background-secondary': 'rgb(var(--background-secondary-color) / <alpha-value>)',
        'background-tertiary': 'rgb(var(--background-tertiary-color) / <alpha-value>)',
        'background-opposite': 'rgb(var(--background-opposite) / <alpha-value>)',
        'background-opposite-secondary': 'rgb(var(--background-secondary-opposite) / <alpha-value>)',
        'super': 'rgb(var(--super) / <alpha-value>)',

      },
      textColor: {
        // Define text colors that automatically switch
        'primary': 'rgb(var(--text-color) / <alpha-value>)',
        'secondary': 'rgb(var(--text-secondary-color) / <alpha-value>)',
        'opposite': 'rgb(var(--text-opposite) / <alpha-value>)',
        'opposite-secondary': 'rgb(var(--text-secondary-opposite) / <alpha-value>)'
      }
    },
  },
  plugins: [],
}