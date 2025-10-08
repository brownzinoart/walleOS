const withOpacityValue = (variable) => ({ opacityValue }) => {
  if (opacityValue === undefined) {
    return `rgb(var(${variable}) / 1)`;
  }

  return `rgb(var(${variable}) / ${opacityValue})`;
};

const neonPalette = {
  'neon-cyan': withOpacityValue('--color-neon-cyan-rgb'),
  'neon-magenta': withOpacityValue('--color-neon-magenta-rgb'),
  'neon-lime': withOpacityValue('--color-neon-lime-rgb'),
  'neon-orange': withOpacityValue('--color-neon-orange-rgb')
};

const grayscale = {
  50: '#f9f9f9',
  100: '#f3f3f3',
  200: '#e4e4e4',
  300: '#c6c6c6',
  400: '#a8a8a8',
  500: '#8a8a8a',
  600: '#6c6c6c',
  700: '#4e4e4e',
  800: '#2f2f2f',
  900: '#1a1a1a',
  950: '#0a0a0a'
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', "[data-theme='dark']"],
  theme: {
    extend: {
      colors: {
        gray: grayscale,
        black: '#000000',
        white: '#FFFFFF',
        ...neonPalette
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace']
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.3' }],
        sm: ['0.875rem', { lineHeight: '1.4' }],
        base: ['1rem', { lineHeight: '1.6' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        xl: ['1.25rem', { lineHeight: '1.4' }],
        '2xl': ['1.5rem', { lineHeight: '1.3' }],
        '3xl': ['2rem', { lineHeight: '1.2' }],
        '4xl': ['2.5rem', { lineHeight: '1.1' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['4rem', { lineHeight: '1' }],
        display: ['4rem', { lineHeight: '1', fontWeight: '900' }]
      },
      fontWeight: {
        normal: '400',
        semibold: '600',
        bold: '700',
        black: '900'
      },
      spacing: {
        0: '0px',
        1: '0.25rem',
        2: '0.5rem',
        3: '0.75rem',
        4: '1rem',
        5: '1.25rem',
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        16: '4rem',
        20: '5rem',
        24: '6rem',
        32: '8rem',
        40: '10rem',
        48: '12rem',
        64: '16rem',
        80: '20rem',
        96: '24rem'
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
        md: '4px',
        lg: '8px',
        xl: '16px'
      },
      boxShadow: {
        brutal: '4px 4px 0px var(--color-neon-cyan)',
        'brutal-lg': '8px 8px 0px var(--color-neon-magenta)'
      },
      transitionTimingFunction: {
        brutal: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)'
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms'
      }
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    }
  },
  plugins: []
};
