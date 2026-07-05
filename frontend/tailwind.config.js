/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neubrutalism palette
        'neu-bg':      '#F5EFDC',
        'neu-surface': '#FFFFFF',
        'neu-ink':     '#111111',
        'neu-accent':  '#F4C542',
        'neu-cta':     '#3B4CCA',
        'neu-success': '#4CAF6D',
        'neu-pending': '#F4C542',
        'neu-danger':  '#E85C4A',
        'neu-flag':    '#E85CA8',
        'neu-info':    '#6EC6E8',
        // Legacy aliases (prevent compile errors in existing code paths)
        'bg-base':     '#F5EFDC',
        'bg-elevated': '#FFFFFF',
        'accent':      '#F4C542',
      },
      fontFamily: {
        display: ['"Archivo Black"', '"Arial Black"', 'sans-serif'],
        sans:    ['Inter', '"Helvetica Neue"', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        'neu':    '6px 6px 0px #111111',
        'neu-sm': '4px 4px 0px #111111',
        'neu-xs': '3px 3px 0px #111111',
      },
      borderWidth: {
        'neu': '3px',
      },
    },
  },
  plugins: [],
}
