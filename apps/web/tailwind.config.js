/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ═══ 背景 · 虚空系 ═══
        'void': {
          DEFAULT: 'var(--void)',
          warm:    'var(--void-warm)',
          panel:   'var(--void-panel)',
          raised:  'var(--void-raised)',
          hover:   'var(--void-hover)',
        },
        // ═══ NERV 橙 · 主品牌 ═══
        'nerv': {
          DEFAULT: 'var(--nerv)',
          dim:     'var(--nerv-dim)',
          hot:     'var(--nerv-hot)',
          muted:   'var(--nerv-muted)',
        },
        // ═══ 数据绿 · 正常状态/数值 ═══
        'data': {
          DEFAULT: 'var(--data)',
          dim:     'var(--data-dim)',
          bright:  'var(--data-bright)',
        },
        // ═══ 线框青 · 结构/链接 ═══
        'wire': {
          DEFAULT: 'var(--wire)',
          dim:     'var(--wire-dim)',
        },
        // ═══ 警报红 · 仅紧急状态 ═══
        'alert': {
          DEFAULT: 'var(--alert)',
          dim:     'var(--alert-dim)',
        },
        // ═══ 正文色 ═══
        'text': {
          primary:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          dim:       'var(--text-dim)',
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans SC"',
          '"Source Han Sans SC"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          '"SF Mono"',
          '"Courier New"',
          'monospace',
        ],
        display: [
          'Orbitron',
          '"JetBrains Mono"',
          'monospace',
        ],
      },
      letterSpacing: {
        'eva-wide': '0.2em',
        'eva-normal': '0.12em',
        'eva-tight': '0.05em',
      },
      backgroundImage: {
        'eva-grid': `
          linear-gradient(var(--grid-color) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-color) 1px, transparent 1px),
          linear-gradient(var(--grid-color-faint) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-color-faint) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'eva-grid': '200px 200px, 200px 200px, 40px 40px, 40px 40px',
      },
      boxShadow: {
        'glow-green':  'var(--shadow-glow-green)',
        'glow-orange': 'var(--shadow-glow-orange)',
        'glow-cyan':   'var(--shadow-glow-cyan)',
        'glow-red':    'var(--shadow-glow-red)',
        'led-green':   'var(--shadow-led-green)',
        'led-orange':  'var(--shadow-led-orange)',
        'led-cyan':    'var(--shadow-led-cyan)',
        'led-red':     'var(--shadow-led-red)',
      },
      animation: {
        'led-blink':   'led-blink 1s ease-in-out infinite',
        'fade-in':     'fade-in 0.3s ease-out',
        'slide-in':    'slide-in 0.2s ease-out',
        'alert-pulse': 'alert-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'led-blink': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-in': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'alert-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%':      { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
