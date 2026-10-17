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
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        cinema: {
          bg: '#03111F',
          surface: '#061A2B',
          card: '#092137',
          border: '#12364B',
          text: '#F1F7FC',
          secondary: '#9BB4C9',
          muted: '#6F8BA3',
          emerald: '#00E0B0',
          cyan: '#00C9F2',
          violet: '#A855F7',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#092137',
          900: '#061A2B',
          950: '#03111F'
        },
        // Editorial commerce design tokens
        ivory: {
          50: '#FBF9F5',
          100: '#F5F1EA',
          200: '#EBE5DB',
        },
        ink: {
          950: '#0A0A0A',
          800: '#1C1917',
          600: '#57534E',
        },
        lime: {
          accent: '#D4FF00',
          hover: '#C5EE00',
          dark: '#A8D100',
        },
        border: {
          ivory: '#E5E0D8',
          dark: '#171717',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        serif: ['"DM Serif Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
