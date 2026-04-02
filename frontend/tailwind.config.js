/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sarabun: ['Sarabun', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      colors: {
        radar: {
          cyan:   '#00e5ff',
          green:  '#00ff88',
          red:    '#ff4757',
          orange: '#ff9f43',
          yellow: '#ffd32a',
          dark:   '#0d1117',
          panel:  '#161b22',
          card:   '#1c2128',
        },
      },
    },
  },
  plugins: [],
};
