/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        breadboard: {
          base: '#f1f1ee',
          trough: '#d8d8d3',
          border: '#cfcfc8',
          hole: '#2b2d35',
          railRed: '#ef4444',
          railBlue: '#2563eb',
        },
        logic: {
          high: '#ef4444',
          highGlow: '#f87171',
          low: '#3b82f6',
          lowGlow: '#60a5fa',
          floating: '#94a3b8',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
