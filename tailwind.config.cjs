/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fefcf5',
          100: '#fef9e8',
          200: '#fef0c7',
          300: '#fde49b',
          400: '#fcc964',
          500: '#f9ac39',
          600: '#ed8a19',
          700: '#c26611',
          800: '#9a4e15',
          900: '#7c4116',
          950: '#441f07',
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
    },
  },
  plugins: [],
}
