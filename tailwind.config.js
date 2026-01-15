/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',    // Enable dark mode via class strategy, Allows manual class on <html>
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'Inter', 'sans-serif'], 
      },
      fontSize: {
        base: '1.125rem', // Bigger body text
        lg: '1.25rem',
        xl: '1.5rem',
        '2xl': '2rem',
        '3xl': '2.5rem',
        '4xl': '3rem',
      },
      colors: {
        primary: '#4F46E5', // Indigo-600
        secondary: '#6B7280', // Gray-500
        accent: '#10B981', // Emerald-500
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}