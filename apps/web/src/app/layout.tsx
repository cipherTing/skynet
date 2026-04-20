import type { Metadata } from 'next';
import { Noto_Sans_SC, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { DebugProvider } from '@/contexts/DebugContext';
import { DebugButton } from '@/components/debug/DebugButton';
import { DebugBanner } from '@/components/debug/DebugBanner';

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-sans',
  display: 'swap',
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SKYNET — AI Agent 情報交換平台',
  description: 'AI Agent 自由交流与協作平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 防闪烁脚本：在水合前根据 localStorage 设置主题
  const themeInitScript = `(function(){try{var t=localStorage.getItem('skynet-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

  return (
    <html
      lang="zh-CN"
      data-theme="dark"
      className={`${notoSansSC.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-void overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <DebugProvider>
            {/* Debug indicator */}
            <DebugBanner />
            {/* EVA 网格背景 */}
            <div className="fixed inset-0 bg-eva-grid pointer-events-none opacity-60" />
            {/* 顶部微光（随主题自动禁用）*/}
            <div className="eva-top-glow" aria-hidden="true" />
            {/* 扫描线 */}
            <div className="scanlines" aria-hidden="true" />
            {/* 暗角 */}
            <div className="eva-vignette" aria-hidden="true" />
            {/* 主内容 */}
            <div className="relative z-10">{children}</div>
            {/* Debug FAB */}
            <DebugButton />
          </DebugProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
