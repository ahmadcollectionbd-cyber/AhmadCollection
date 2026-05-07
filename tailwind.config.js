/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#0e5132',
          600: '#0a3f27',
          700: '#082e1d',
          800: '#062018',
          900: '#031210',
        },
        accent: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#c81e1e',
          600: '#a01717',
          700: '#7f1313',
          800: '#5e0e0e',
          900: '#3d0808',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        bn: ['"Hind Siliguri"', '"Noto Sans Bengali"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #0e5132 0%, #c81e1e 100%)',
        'gradient-soft': 'linear-gradient(135deg, rgba(14,81,50,0.08) 0%, rgba(200,30,30,0.06) 100%)',
        'gradient-glow': 'radial-gradient(60% 60% at 50% 0%, rgba(14,81,50,0.18) 0%, transparent 60%), radial-gradient(40% 40% at 100% 100%, rgba(200,30,30,0.18) 0%, transparent 60%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glow-brand': '0 8px 30px -8px rgba(14,81,50,0.45)',
        'glow-accent': '0 8px 30px -8px rgba(200,30,30,0.45)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'marquee-x': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        shimmer: 'shimmer 2s infinite linear',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'marquee-x': 'marquee-x 40s linear infinite',
        'marquee-x-slow': 'marquee-x 60s linear infinite',
      },
    },
  },
  plugins: [],
};
