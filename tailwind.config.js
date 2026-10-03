/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#050508',
          900: '#0A0A0F',
          850: '#0F0F16',
          800: '#14141E',
          700: '#1F1F2C',
          600: '#2E2E3F',
          500: '#46465C',
          400: '#71718A',
          300: '#A1A1BA',
          200: '#D4D4E3',
          100: '#F0F0F6',
          50: '#FAFAFD',
        },
        red: {
          racing: '#DC2626',
          vibrant: '#EF4444',
          neon: '#FF1E1E',
          glow: '#F87171',
          dark: '#991B1B',
          deep: '#7F1D1D'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        'glow-red': '0 0 35px -5px rgba(239, 68, 68, 0.45), 0 0 15px -3px rgba(220, 38, 38, 0.3)',
        'glow-red-lg': '0 0 50px -5px rgba(255, 30, 30, 0.6), 0 0 25px -3px rgba(220, 38, 38, 0.4)',
        'premium-dark': '0 12px 35px -10px rgba(0, 0, 0, 0.7), 0 2px 8px -2px rgba(220, 38, 38, 0.1)',
        'floating-dark': '0 20px 45px -15px rgba(0, 0, 0, 0.85), 0 0 20px -5px rgba(239, 68, 68, 0.25)'
      }
    },
  },
  plugins: [],
}
