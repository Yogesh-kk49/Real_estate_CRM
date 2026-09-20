/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF7F4',
          100: '#F9ECE6',
          200: '#F3D7CC',
          300: '#EABCA9',
          400: '#DD977C',
          500: '#C25E34', // Primary architectural terracotta
          600: '#B04E26',
          700: '#923E1D',
          800: '#77341B',
          900: '#632D19',
          950: '#35150A',
        },
        estate: {
          dark: '#0B0F19',
          card: '#FFFFFF',
          canvas: '#F8F7F4',
          border: '#E6E1D8',
          muted: '#64748B',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
}
