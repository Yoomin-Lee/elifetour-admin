/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F4C8A',
          light: '#1B6CA8',
          dark: '#0A3568',
          50: '#EFF6FF',
          100: '#DBEAFE',
        },
        accent: {
          DEFAULT: '#F97316',
          dark: '#EA6C0A',
        },
        sidebar: '#0F2849',
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
