import type { CSSProperties } from 'react';

const LOGO_GLYPH_SPRITE = '/logo-starfield-glyphs.svg';

type LogoGlyph =
  | 'claude'
  | 'cohere'
  | 'deep-seek'
  | 'gemini'
  | 'grok'
  | 'hermes-agent'
  | 'kimi'
  | 'meta'
  | 'mistral'
  | 'moonshot'
  | 'open-ai'
  | 'open-claw'
  | 'open-router'
  | 'perplexity'
  | 'qwen'
  | 'xai';

type LogoStarfieldItem = {
  name: string;
  glyph: LogoGlyph;
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
};

const LOGO_STARFIELD_ITEMS: LogoStarfieldItem[] = [
  { name: 'OpenAI', glyph: 'open-ai', x: -58, y: -34, size: 54, delay: -1.2, duration: 18 },
  { name: 'Claude', glyph: 'claude', x: 56, y: -36, size: 52, delay: -3.0, duration: 20 },
  { name: 'Gemini', glyph: 'gemini', x: -16, y: -58, size: 48, delay: -4.8, duration: 19 },
  { name: 'Hermes Agent', glyph: 'hermes-agent', x: 24, y: -60, size: 56, delay: -6.6, duration: 21 },
  { name: 'OpenClaw', glyph: 'open-claw', x: -64, y: -6, size: 58, delay: -8.4, duration: 20 },
  { name: 'DeepSeek', glyph: 'deep-seek', x: 64, y: -8, size: 54, delay: -10.2, duration: 21 },
  { name: 'Qwen', glyph: 'qwen', x: -56, y: 32, size: 52, delay: -12.0, duration: 20 },
  { name: 'Mistral', glyph: 'mistral', x: 56, y: 34, size: 54, delay: -13.8, duration: 19 },
  { name: 'Kimi', glyph: 'kimi', x: -24, y: 60, size: 50, delay: -15.6, duration: 22 },
  { name: 'Grok', glyph: 'grok', x: 20, y: 62, size: 50, delay: -17.4, duration: 18 },
  { name: 'Cohere', glyph: 'cohere', x: 66, y: 12, size: 48, delay: -19.2, duration: 23 },
  { name: 'Perplexity', glyph: 'perplexity', x: -66, y: 12, size: 48, delay: -21.0, duration: 21 },
  { name: 'Meta', glyph: 'meta', x: 8, y: -64, size: 52, delay: -22.8, duration: 20 },
  { name: 'Moonshot', glyph: 'moonshot', x: -42, y: -48, size: 46, delay: -24.6, duration: 24 },
  { name: 'OpenRouter', glyph: 'open-router', x: 42, y: -50, size: 46, delay: -26.4, duration: 24 },
  { name: 'XAI', glyph: 'xai', x: -4, y: 66, size: 48, delay: -28.2, duration: 22 },
  { name: 'OpenAI', glyph: 'open-ai', x: -68, y: -24, size: 44, delay: -30.0, duration: 23 },
  { name: 'Claude', glyph: 'claude', x: 68, y: -26, size: 46, delay: -31.8, duration: 24 },
  { name: 'Gemini', glyph: 'gemini', x: -48, y: -58, size: 44, delay: -33.6, duration: 22 },
  { name: 'OpenClaw', glyph: 'open-claw', x: 48, y: -58, size: 48, delay: -35.4, duration: 25 },
  { name: 'Hermes Agent', glyph: 'hermes-agent', x: -68, y: 36, size: 50, delay: -37.2, duration: 24 },
  { name: 'DeepSeek', glyph: 'deep-seek', x: 68, y: 38, size: 46, delay: -39.0, duration: 23 },
  { name: 'Qwen', glyph: 'qwen', x: -34, y: 68, size: 44, delay: -40.8, duration: 22 },
  { name: 'Mistral', glyph: 'mistral', x: 32, y: 68, size: 46, delay: -42.6, duration: 24 },
  { name: 'Kimi', glyph: 'kimi', x: -70, y: 2, size: 42, delay: -44.4, duration: 21 },
  { name: 'Grok', glyph: 'grok', x: 70, y: 2, size: 42, delay: -46.2, duration: 20 },
  { name: 'Cohere', glyph: 'cohere', x: -12, y: -70, size: 44, delay: -48.0, duration: 25 },
  { name: 'Perplexity', glyph: 'perplexity', x: 12, y: -70, size: 44, delay: -49.8, duration: 23 },
  { name: 'Meta', glyph: 'meta', x: -54, y: 56, size: 46, delay: -51.6, duration: 24 },
  { name: 'Moonshot', glyph: 'moonshot', x: 54, y: 56, size: 44, delay: -53.4, duration: 23 },
  { name: 'OpenRouter', glyph: 'open-router', x: -72, y: -44, size: 42, delay: -55.2, duration: 25 },
  { name: 'XAI', glyph: 'xai', x: 72, y: -44, size: 42, delay: -57.0, duration: 24 },
];

const LOGO_STARFIELD_STREAKS = [
  { angle: -154, delay: -0.8, duration: 8.8, length: 42 },
  { angle: -132, delay: -2.2, duration: 9.6, length: 48 },
  { angle: -110, delay: -4.0, duration: 8.2, length: 36 },
  { angle: -88, delay: -5.6, duration: 10.2, length: 52 },
  { angle: -66, delay: -7.4, duration: 9.0, length: 44 },
  { angle: -42, delay: -9.2, duration: 8.6, length: 50 },
  { angle: -18, delay: -11.0, duration: 9.8, length: 38 },
  { angle: 6, delay: -12.7, duration: 8.4, length: 46 },
  { angle: 28, delay: -14.4, duration: 10.4, length: 54 },
  { angle: 52, delay: -16.1, duration: 8.9, length: 40 },
  { angle: 76, delay: -17.8, duration: 9.4, length: 48 },
  { angle: 100, delay: -19.4, duration: 8.5, length: 42 },
  { angle: 124, delay: -21.2, duration: 10.0, length: 56 },
  { angle: 148, delay: -23.0, duration: 9.2, length: 44 },
] as const;

type LogoStarfieldStyle = CSSProperties & {
  '--star-x': string;
  '--star-y': string;
  '--star-static-x': string;
  '--star-static-y': string;
  '--star-size': string;
  '--star-delay': string;
  '--star-duration': string;
};

type LogoStarfieldStreakStyle = CSSProperties & {
  '--streak-angle': string;
  '--streak-delay': string;
  '--streak-duration': string;
  '--streak-length': string;
};

function getLogoStarfieldStyle(item: LogoStarfieldItem): LogoStarfieldStyle {
  return {
    '--star-x': `${item.x}vw`,
    '--star-y': `${item.y}vh`,
    '--star-static-x': `${(item.x * 0.42).toFixed(2)}vw`,
    '--star-static-y': `${(item.y * 0.42).toFixed(2)}vh`,
    '--star-size': `${item.size}px`,
    '--star-delay': `${item.delay}s`,
    '--star-duration': `${(item.duration / 1.5).toFixed(2)}s`,
  };
}

function getLogoStarfieldStreakStyle(streak: (typeof LOGO_STARFIELD_STREAKS)[number]): LogoStarfieldStreakStyle {
  return {
    '--streak-angle': `${streak.angle}deg`,
    '--streak-delay': `${streak.delay}s`,
    '--streak-duration': `${(streak.duration / 1.5).toFixed(2)}s`,
    '--streak-length': `${streak.length}vw`,
  };
}

function LogoStarfieldGlyph({ glyph }: { glyph: LogoGlyph }) {
  return (
    <svg
      className="logo-starfield__logo"
      aria-hidden="true"
      fill="currentColor"
      fillRule="evenodd"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <use href={`${LOGO_GLYPH_SPRITE}#logo-starfield-${glyph}`} />
    </svg>
  );
}

export function LogoStarfield() {
  return (
    <div className="logo-starfield" aria-hidden="true">
      <div className="logo-starfield__streaks">
        {LOGO_STARFIELD_STREAKS.map((streak, index) => (
          <span
            key={`${streak.angle}-${index}`}
            className="logo-starfield__streak"
            style={getLogoStarfieldStreakStyle(streak)}
          />
        ))}
      </div>
      {LOGO_STARFIELD_ITEMS.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          className="logo-starfield__item"
          style={getLogoStarfieldStyle(item)}
        >
          <span className="logo-starfield__tile">
            <LogoStarfieldGlyph glyph={item.glyph} />
          </span>
        </div>
      ))}
    </div>
  );
}
