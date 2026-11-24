/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Approved brand palette
        brand: {
          DEFAULT: '#1F6F6B',
          50: '#EAF4F2',
          100: '#D8EBE8',
          200: '#BADBD6',
          300: '#91C5BE',
          400: '#60A69F',
          500: '#32827C',
          600: '#1F6F6B',
          700: '#185C58',
          800: '#124744',
        },
        accent: {
          DEFAULT: '#E0A84B',
          50: '#FFF7E8',
          100: '#F6E6C6',
          400: '#E6B867',
          800: '#79541C',
        },
        surface: 'rgb(var(--color-surface-rgb) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink-rgb) / <alpha-value>)',
          muted: 'rgb(var(--color-ink-muted-rgb) / <alpha-value>)',
        },
        line: 'rgb(var(--color-line-rgb) / <alpha-value>)',
        success: '#2E8155',
        warning: '#E0A84B',
        danger: '#B8463E',
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 10px rgba(24,48,42,0.045)',
        pop: '0 16px 40px -16px rgba(24,48,42,0.18)',
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
