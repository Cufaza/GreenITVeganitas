import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: { center: true, padding: '2rem', screens: { '2xl': '1400px' } },
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        primary: { DEFAULT: '#1a1a1a', foreground: '#fafafa' },
        brand: { DEFAULT: 'hsl(var(--brand) / <alpha-value>)', foreground: 'hsl(var(--brand-foreground) / <alpha-value>)' },
        secondary: { DEFAULT: '#f4f4f5', foreground: '#18181b' },
        destructive: { DEFAULT: '#ef4444', foreground: '#fafafa' },
        muted: { DEFAULT: '#f4f4f5', foreground: '#71717a' },
        accent: { DEFAULT: '#f4f4f5', foreground: '#18181b' },
        popover: { DEFAULT: '#ffffff', foreground: '#09090b' },
        card: { DEFAULT: '#ffffff', foreground: '#09090b' },
      },
      borderRadius: { lg: '0.5rem', md: 'calc(0.5rem - 2px)', sm: 'calc(0.5rem - 4px)' },
    },
  },
  plugins: [animate],
};
