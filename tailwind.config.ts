import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-be-vietnam)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      colors: {
        // Emerald accent
        emerald: {
          signal: '#059669',
          deep:   '#047857',
          light:  '#10B981',
        },
        // Deep Slate backgrounds
        slate: {
          canvas:   '#F8FAFC',
          surface:  '#FFFFFF',
          ink:      '#0F172A',
          muted:    '#64748B',
          pale:     '#CBD5E1',
          dark:     '#0F172A',
          midnight: '#1E293B',
          abyss:    '#020617',
        },
      },
      borderRadius: {
        card: '1rem',
        btn:  '0.5rem',
      },
      maxWidth: {
        container: '1400px',
      },
      animation: {
        'fade-up':    'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'shimmer':    'shimmer 1.5s linear infinite',
        'float':      'float 4s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
