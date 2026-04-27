/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: 'var(--void)',
          deep: 'var(--void-deep)',
          mid: 'var(--void-mid)',
          shallow: 'var(--void-shallow)',
          hover: 'var(--void-hover)',
        },
        copper: {
          DEFAULT: 'var(--copper)',
          dim: 'var(--copper-dim)',
          bright: 'var(--copper-bright)',
          muted: 'var(--copper-muted)',
        },
        moss: {
          DEFAULT: 'var(--moss)',
          dim: 'var(--moss-dim)',
          bright: 'var(--moss-bright)',
        },
        steel: {
          DEFAULT: 'var(--steel)',
          dim: 'var(--steel-dim)',
          bright: 'var(--steel-bright)',
        },
        ochre: {
          DEFAULT: 'var(--ochre)',
          dim: 'var(--ochre-dim)',
        },
        ink: {
          primary: 'var(--ink-primary)',
          secondary: 'var(--ink-secondary)',
          muted: 'var(--ink-muted)',
        },
      },
      fontFamily: {
        sans: [
          '"Source Han Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Noto Sans CJK SC"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          '"SFMono-Regular"',
          '"Cascadia Code"',
          '"Menlo"',
          '"Monaco"',
          '"Fira Code"',
          '"Courier New"',
          'monospace',
        ],
        display: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Source Han Sans SC"',
          '"SF Mono"',
          '"SFMono-Regular"',
          '"Menlo"',
          '"Arial Black"',
          'monospace',
        ],
      },
      letterSpacing: {
        'deck-wide': '0.15em',
        'deck-normal': '0.1em',
        'deck-tight': '0.04em',
      },
      boxShadow: {
        'glow-copper': '0 0 12px rgba(255, 122, 46, 0.35), 0 0 24px rgba(255, 122, 46, 0.12)',
        'glow-moss': '0 0 12px rgba(57, 211, 83, 0.35), 0 0 24px rgba(57, 211, 83, 0.12)',
        'glow-steel': '0 0 12px rgba(56, 189, 248, 0.35), 0 0 24px rgba(56, 189, 248, 0.12)',
        'glow-ochre': '0 0 12px rgba(255, 68, 102, 0.35), 0 0 24px rgba(255, 68, 102, 0.12)',
        'led-copper': '0 0 6px rgba(255, 122, 46, 0.6)',
        'led-moss': '0 0 6px rgba(57, 211, 83, 0.6)',
        'led-steel': '0 0 6px rgba(56, 189, 248, 0.6)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse-slow 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        'signal-ping': 'signal-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar-sweep': 'radar-sweep 2s linear infinite',
        'node-float': 'node-float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'signal-ping': {
          '75%, 100%': {
            transform: 'scale(2)',
            opacity: '0',
          },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'node-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      borderRadius: {
        bubble: '12px',
        panel: '12px',
        chip: '6px',
      },
    },
  },
  plugins: [],
};
