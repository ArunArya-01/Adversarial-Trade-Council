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
        // ── Professional Dark Blue & Green Palette ──
        void:    '#0A0E1A',
        surface: '#0F1629',
        panel:   '#151D35',
        border:  '#1E2D4A',
        'border-light': '#243356',

        // Primary accent: Electric Blue
        blue: {
          DEFAULT: '#3B82F6',
          bright:  '#60A5FA',
          dim:     '#1D4ED8',
          wash:    'rgba(59, 130, 246, 0.08)',
          glow:    'rgba(59, 130, 246, 0.20)',
        },

        // Neon aliases
        neon: {
          green: '#10B981',
          red:   '#EF4444',
          cyan:  '#3B82F6',
          blue:  '#3B82F6',
        },

        // Gold alias → Blue (so all existing text-gold / border-gold classes work)
        gold: {
          DEFAULT: '#3B82F6',
          dim:     '#1D4ED8',
          ember:   '#60A5FA',
          wash:    'rgba(59, 130, 246, 0.08)',
          glow:    'rgba(59, 130, 246, 0.20)',
        },

        text: {
          primary: '#F0F4FF',
          muted:   '#94A3B8',
          dim:     '#4B6282',
        }
      },
      animation: {
        marquee:   'marquee 25s linear infinite',
        scanline:  'scanline 8s linear infinite',
        pulseSlow: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer:   'shimmer 2s ease-in-out infinite',
        'gold-pulse': 'bluePulse 3s ease-in-out infinite',
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
        bluePulse: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(59, 130, 246, 0.2)' },
          '50%':      { boxShadow: '0 0 24px rgba(59, 130, 246, 0.5)' },
        },
      },
      boxShadow: {
        'gold-sm':  '0 0 10px rgba(59, 130, 246, 0.25)',
        'gold-md':  '0 0 20px rgba(59, 130, 246, 0.35)',
        'gold-lg':  '0 0 40px rgba(59, 130, 246, 0.45)',
        'green-sm': '0 0 10px rgba(16, 185, 129, 0.30)',
      },
      backgroundImage: {
        'gold-gradient':        'linear-gradient(135deg, #3B82F6, #1D4ED8)',
        'gold-gradient-subtle': 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(29,78,216,0.05))',
        'blue-gradient':        'linear-gradient(135deg, #3B82F6, #1D4ED8)',
        'green-gradient':       'linear-gradient(135deg, #10B981, #059669)',
      },
    },
  },
  plugins: [],
}
