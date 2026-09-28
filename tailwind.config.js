/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0a0a0a',
          charcoal: '#141414',
          ink: '#1a1a1a',
          gold: '#D4AF37',
          'gold-dark': '#C9A052',
          bronze: '#9C6B12',
          cream: '#F5F0E6',
          'cream-light': '#FAF6EE',
          'cream-deep': '#EBE2CC',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'page-title': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'section-title': ['17px', { lineHeight: '1.5', fontWeight: '600' }],
        'body': ['14px', { lineHeight: '1.6', fontWeight: '400' }],
        'menu': ['14px', { lineHeight: '1.5', fontWeight: '500' }],
      },
    },
  },
  plugins: [],
};
