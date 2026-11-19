/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Approved brand palette
        brand: {
          DEFAULT: '#1F6F6B', // Calm Teal (white text = 5.9:1)
          50: '#EEF5F5',
          100: '#DCEBEA',
          200: '#B9D7D5',
          500: '#2A8681',
          600: '#1F6F6B',
          700: '#195A57',
          800: '#144643',
        },
        accent: {
          DEFAULT: '#E0A84B', // Amber - always pair with dark text
          50: '#FBF3E3',
          100: '#F6E4BF',
          400: '#E6B867',
          800: '#6E4A0C',
        },
        surface: '#F2F6F6', // Background (text on it = 13.5:1)
        ink: {
          DEFAULT: '#1E2A2F',
          muted: '#4F5E64',
        },
        line: '#D9E3E4',
        success: '#2E7D4F',
        warning: '#E0A84B',
        danger: '#B83A3A',
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'Manrope', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(30,42,47,0.05), 0 1px 1px rgba(30,42,47,0.03)',
        pop: '0 16px 40px -12px rgba(30,42,47,0.28)',
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
