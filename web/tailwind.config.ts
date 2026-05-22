import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        'fg-soft': 'var(--fg-soft)',
        'fg-faint': 'var(--fg-faint)',
        rule: 'var(--rule)',
        'rule-strong': 'var(--rule-strong)',
        cream: 'var(--cream)',
        tile: 'var(--tile)',
        gold: '#b08e54',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        thai: ['var(--font-noto-thai)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'Menlo', 'monospace'],
      },
      maxWidth: { wrap: '1360px', 'wrap-narrow': '880px' },
    },
  },
  plugins: [],
};
export default config;
