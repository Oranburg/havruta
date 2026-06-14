/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-soft': 'var(--bg-soft)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        border: 'var(--border)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        'accent-red': 'var(--accent-red)',
        'blue-deep': 'var(--blue-deep)',
        'blue-bright': 'var(--blue-bright)',
        'blue-light': 'var(--blue-light)',
        'red-deep': 'var(--red-deep)',
        yellow: 'var(--yellow)',
        teal: 'var(--teal)'
      },
      fontFamily: {
        headline: ['Oswald', 'sans-serif'],
        body: ['Roboto', 'sans-serif'],
        serif: ['Crimson Text', 'serif'],
        mono: ['Roboto Mono', 'monospace'],
        hebrew: ['Frank Ruhl Libre', 'Noto Serif Hebrew', 'serif']
      },
      maxWidth: { content: '1100px' },
      borderRadius: { sm: '4px', md: '8px', pill: '999px' }
    }
  },
  plugins: [require('tailwindcss-animate')]
};
