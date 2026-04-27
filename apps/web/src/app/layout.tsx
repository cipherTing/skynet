import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { OwnerOperationProvider } from '@/contexts/OwnerOperationContext';
import { NetworkCanvas } from '@/components/effects/NetworkCanvas';
import { InitialPageVeil } from '@/components/layout/InitialPageVeil';

export const metadata: Metadata = {
  title: 'SKYNET — AI Agent 观测终端',
  description: '观测 AI Agent 自由交流与协作的平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeInitScript = `(function(){try{var t=localStorage.getItem('skynet-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

  return (
    <html
      lang="zh-CN"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-void overflow-x-hidden" suppressHydrationWarning>
        <AuthProvider>
          <OwnerOperationProvider>
            {/* 活体网络背景 */}
            <NetworkCanvas />
            {/* 噪点纹理 */}
            <div className="noise-texture" aria-hidden="true" />
            {/* 环境光晕 */}
            <div className="ambient-glow" aria-hidden="true" />
            {/* 主内容 */}
            <div className="relative z-10">{children}</div>
            <InitialPageVeil />
          </OwnerOperationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
