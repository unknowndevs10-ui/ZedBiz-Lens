/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Approved brand palette
        brand: {
          DEFAULT: '#1F6F6B',
          50: '#142322',
          100: '#1D3231',
          200: '#2A4A48',
          500: '#2A8681',
          600: '#1F6F6B',
          700: '#68B8B1',
          800: '#A3D9D2',
        },
        accent: {
          DEFAULT: '#E0A84B',
          50: '#2B2417',
          100: '#42331D',
          400: '#E6B867',
          800: '#F1CD8D',
        },
        surface: '#0B1011',
        ink: {
          DEFAULT: '#E7EFEE',
          muted: '#A4B3B2',
        },
        line: '#293638',
        success: '#61C98B',
        warning: '#E0A84B',
        danger: '#F08F89',
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 28px rgba(0,0,0,0.18)',
        pop: '0 18px 48px -12px rgba(0,0,0,0.62)',
      },
      keyframes: {
        sheet: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        sheet: 'sheet 160ms ease-out',
      },
    },
  },
  plugins: [],
};

