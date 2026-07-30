/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12161C',
        slateup: '#1E2530',
        accent: '#4F6DF5',
        accentSoft: '#EEF1FE',
        good: '#1E9E6A',
        bad: '#E1483F',
        warn: '#D98A2B',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
