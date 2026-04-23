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
        // ── Cosmic Gold & Black Palette ──
        void:    '#000000',
        surface: '#0A0A0A',
        panel:   '#111111',
        border:  '#1C1C1C',
        'border-light': '#2A2A2A',
        gold: {
          DEFAULT: '#FFD700',
          dim:     '#B8960F',
          ember:   '#F5A623',
          wash:    'rgba(255, 215, 0, 0.06)',
          glow:    'rgba(255, 215, 0, 0.15)',
        },
        neon: {
          green: '#22C55E',
          red:   '#EF4444',
          cyan:  '#FFD700', // remap to gold for active states
          gold:  '#FFD700',
        },
        text: {
          primary: '#F5F5F5',
          muted:   '#888888',
          dim:     '#444444',
        }
      },
      animation: {
        marquee:   'marquee 25s linear infinite',
        scanline:  'scanline 8s linear infinite',
        pulseSlow: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer:   'shimmer 2s ease-in-out infinite',
        'gold-pulse': 'goldPulse 3s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        scanline: {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        shimmer: {
          '0%, 100%': { opacity: 0.5 },
          '50%':      { opacity: 1 },
        },
        goldPulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255, 215, 0, 0.2)' },
          '50%':      { boxShadow: '0 0 24px rgba(255, 215, 0, 0.5)' },
        },
      },
      boxShadow: {
        'gold-sm': '0 0 8px rgba(255, 215, 0, 0.15)',
        'gold-md': '0 0 20px rgba(255, 215, 0, 0.25)',
        'gold-lg': '0 0 40px rgba(255, 215, 0, 0.35)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700, #F5A623)',
        'gold-gradient-subtle': 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(245,166,35,0.05))',
      },
    },
  },
  plugins: [],
}
