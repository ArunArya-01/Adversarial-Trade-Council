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
        // ── White, Red, and Black Palette ──
        void:    '#000000',       // True Pitch Black
        surface: '#0A0A0A',       // Deep Obsidian
        panel:   '#121212',       // Dark Charcoal
        border:  '#222222',       // Subtle Border
        'border-light': '#333333',
        'border-red': 'rgba(239, 68, 68, 0.35)',

        // Primary Accent: Crimson & Scarlet Red
        red: {
          DEFAULT: '#EF4444',
          bright:  '#FF3B30',
          crimson: '#DC2626',
          dark:    '#991B1B',
          wash:    'rgba(239, 68, 68, 0.10)',
          glow:    'rgba(239, 68, 68, 0.30)',
        },

        // Aliases for components
        blue: {
          DEFAULT: '#EF4444',     // mapped to red accent
          bright:  '#FF3B30',
          dim:     '#DC2626',
          wash:    'rgba(239, 68, 68, 0.10)',
          glow:    'rgba(239, 68, 68, 0.30)',
        },

        green: {
          DEFAULT: '#10B981',
          bright:  '#34D399',
          dim:     '#059669',
          wash:    'rgba(16, 185, 129, 0.10)',
        },

        text: {
          primary: '#FFFFFF',     // Crisp Pure White
          secondary: '#E5E5E5',   // Off-White
          muted:   '#A3A3A3',     // Silver Grey
          dim:     '#666666',     // Dark Grey
        }
      },
      animation: {
        'red-pulse': 'redPulse 2.5s ease-in-out infinite',
      },
      keyframes: {
        redPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(239, 68, 68, 0.25)' },
          '50%':      { boxShadow: '0 0 25px rgba(239, 68, 68, 0.60)' },
        },
      },
      boxShadow: {
        'red-sm':  '0 0 10px rgba(239, 68, 68, 0.30)',
        'red-md':  '0 0 20px rgba(239, 68, 68, 0.40)',
        'red-lg':  '0 0 40px rgba(239, 68, 68, 0.50)',
        'white-sm': '0 0 10px rgba(255, 255, 255, 0.15)',
      },
      backgroundImage: {
        'red-gradient':        'linear-gradient(135deg, #EF4444, #991B1B)',
        'red-gradient-subtle': 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(153,27,27,0.05))',
        'white-gradient':      'linear-gradient(135deg, #FFFFFF, #E5E5E5)',
        'blue-gradient':       'linear-gradient(135deg, #EF4444, #B91C1C)',
      },
    },
  },
  plugins: [],
}
