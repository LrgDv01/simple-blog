/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'Avenir', 'Helvetica', 'Arial', 'Inter', 'sans-serif'], 
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