const defaultTheme = require('tailwindcss/defaultTheme'),
  colors = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      colors: {
        // primary: {
        //   50: '#f2f2f2',
        //   100: '#e6e6e6',
        //   200: '#cccccc',
        //   300: '#b3b3b3',
        //   400: '#999999',
        //   500: '#808080',
        //   600: '#666666',
        //   700: '#4d4d4d',
        //   800: '#333333',
        //   900: '#1a1a1a',
        // },
        primary: colors.violet,
        // 'val-red': '#935353',
        // 'val-blue': '#469587',
        'val-red': '#f05c57',
        'val-blue': '#66c2a9',
      },
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
        mono: ['Cascadia Code', ...defaultTheme.fontFamily.mono],
        din: ['DIN Next W1G', ...defaultTheme.fontFamily.sans],
        em: ['Tungsten', ...defaultTheme.fontFamily.sans],
      },
      keyframes: {
        'track-progress': {
          '0%': {
            transform: 'scaleX(1)',
          },
          '100%': {
            transform: 'scaleX(0)',
          },
        },
        'pulse-border': {
          '0%, 100%': {
            '--tw-border-opacity': '1',
          },
          '50%': {
            '--tw-border-opacity': '0.25',
          },
        },
      },
      fontSize: {
        xs: '12.37px',
        sm: '13.75px',
        base: '16.5px',
        lg: '17.87px',
        xl: '20.63px',
        '2xl': '24.73px',
        '3xl': '30.25px',
        '4xl': '35.74px',
        '5xl': '48.12px',
        '6xl': '64.62px',
        '7xl': '79.74px',
      },
      animation: {
        progress: 'track-progress linear 1 forwards',
        'pulse-border': 'pulse-border 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      spacing: {
        ...defaultTheme.spacing,
        112: 448,
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@catppuccin/tailwindcss')({
      prefix: 'ctp',
      defaultFlavour: 'mocha',
    }),
  ],
}

// animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;

// @keyframes pulse {
//   0%, 100% {
//     opacity: 1;
//   }
//   50% {
//     opacity: .5;
//   }
// }
