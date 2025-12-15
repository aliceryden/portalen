/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Varm, naturlig färgpalett inspirerad av stall och natur
        brand: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d9c0',
          300: '#e9bf96',
          400: '#dea06a',
          500: '#d4844a',
          600: '#c56d3f',
          700: '#a45536',
          800: '#854632',
          900: '#6c3b2b',
          950: '#3a1c14',
        },
        earth: {
          50: '#f7f6f4',
          100: '#edebe6',
          200: '#dbd6cc',
          300: '#c4bcab',
          400: '#ab9e88',
          500: '#998a70',
          600: '#8c7a64',
          700: '#756454',
          800: '#615348',
          900: '#50453d',
          950: '#2a2320',
        },
        forest: {
          50: '#f3f6f3',
          100: '#e3e9e3',
          200: '#c8d4c8',
          300: '#a2b5a2',
          400: '#779177',
          500: '#567556',
          600: '#435d43',
          700: '#374b37',
          800: '#2e3d2e',
          900: '#263326',
          950: '#121b12',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}

