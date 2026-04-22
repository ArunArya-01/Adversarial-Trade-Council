/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        void:    '#040810',
        surface: '#0B1120',
        border:  '#1A2744',
        neon: {
          green: '#00F5A0',
          red: '#FF2D55',
          cyan: '#00D4FF',
          gold: '#FFD700',
        },
        text: {
          primary: '#E2E8F0',
          muted: '#7A94B0',
          dim: '#3D526A',
        }
      },
      animation: {
        marquee: 'marquee 25s linear infinite',
        scanline: 'scanline 8s linear infinite',
        pulseSlow: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        }
      }
    },
  },
  plugins: [],
}
