/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind which files to scan for class names
  content: ['./index.html', './src/**/*.{js,jsx,scss}'],

  // Enable class-based dark mode (toggled via .dark on <html>)
  darkMode: 'class',

  theme: {
    extend: {
      // Extend Tailwind with our SCSS CSS variable tokens
      // This lets you use Tailwind utilities that reference our design system
      colors: {
        'bg-base':     'var(--color-bg-base)',
        'bg-surface':  'var(--color-bg-surface)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-border':   'var(--color-bg-border)',
        'accent':      'var(--color-accent)',
        'accent-dim':  'var(--color-accent-dim)',
        'danger':      'var(--color-danger)',
        'danger-dim':  'var(--color-danger-dim)',
        'warning':     'var(--color-warning)',
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)',    'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius-md)',
        sm:  'var(--radius-sm)',
        md:  'var(--radius-md)',
        lg:  'var(--radius-lg)',
        xl:  'var(--radius-xl)',
        full: '9999px',
      },
      boxShadow: {
        'glow-accent': 'var(--shadow-accent)',
        'glow-danger': 'var(--shadow-danger)',
        card: 'var(--shadow-card)',
      },
      transitionDuration: {
        fast:   '120ms',
        normal: '200ms',
        slow:   '350ms',
      },
      maxWidth: {
        app: 'var(--max-width)',
      },
    },
  },

  plugins: [],
};