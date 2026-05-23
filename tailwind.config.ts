import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Gography design tokens
        bg: 'var(--bg)',
        fg: 'var(--fg)',
        'fg-soft': 'var(--fg-soft)',
        'fg-faint': 'var(--fg-faint)',
        rule: 'var(--rule)',
        'rule-strong': 'var(--rule-strong)',
        cream: 'var(--cream)',
        tile: 'var(--tile)',
        gold: '#b08e54',
        // shadcn/ui CSS variable tokens
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
        thai: ['var(--font-noto-thai)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'Menlo', 'monospace'],
        heading: ['var(--font-inter)', 'Helvetica Neue', 'Arial', 'system-ui', 'sans-serif'],
      },
      maxWidth: { wrap: '1360px', 'wrap-narrow': '880px' },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [
    // Custom data attribute variants for shadcn/ui components (base-ui data attrs)
    plugin(function ({ addVariant }) {
      // data-open: matches data-state="open" or data-open (truthy)
      addVariant('data-open', ['&[data-state="open"]', '&[data-open]:not([data-open="false"])']);
      // data-closed: matches data-state="closed" or data-closed (truthy)
      addVariant('data-closed', ['&[data-state="closed"]', '&[data-closed]:not([data-closed="false"])']);
      // data-checked: matches data-state="checked" or data-checked (truthy)
      addVariant('data-checked', ['&[data-state="checked"]', '&[data-checked]:not([data-checked="false"])']);
      // data-unchecked: matches data-state="unchecked"
      addVariant('data-unchecked', ['&[data-state="unchecked"]', '&[data-unchecked]:not([data-unchecked="false"])']);
      // data-active: matches data-state="active" or data-active (truthy)
      addVariant('data-active', ['&[data-state="active"]', '&[data-active]:not([data-active="false"])']);
      // data-selected
      addVariant('data-selected', '&[data-selected="true"]');
      // data-disabled
      addVariant('data-disabled', ['&[data-disabled="true"]', '&[data-disabled]:not([data-disabled="false"])']);
      // data-horizontal / data-vertical
      addVariant('data-horizontal', '&[data-orientation="horizontal"]');
      addVariant('data-vertical', '&[data-orientation="vertical"]');
      // data-popup-open
      addVariant('data-popup-open', '&[data-popup-open]');
      // group variants
      addVariant('group-data-horizontal', ':merge(.group)[data-orientation="horizontal"] &');
      addVariant('group-data-vertical', ':merge(.group)[data-orientation="vertical"] &');
    }),
  ],
};
export default config;
