import type { Metadata } from 'next';
import './globals.css';
import { headers } from 'next/headers';
import { AuthProvider } from '@/contexts/AuthContext';
import { OwnerOperationProvider } from '@/contexts/OwnerOperationContext';
import { NetworkCanvas } from '@/components/effects/NetworkCanvas';
import { InitialPageVeil } from '@/components/layout/InitialPageVeil';
import { AppI18nProvider } from '@/i18n/I18nProvider';
import { normalizeLanguage, resources } from '@/i18n/resources';

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const language = normalizeLanguage(headerList.get('accept-language')) ?? 'en';
  const appMetadata = resources[language].common.app;
  return {
    title: appMetadata.title,
    description: appMetadata.description,
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeInitScript = `(function(){try{var t=localStorage.getItem('skynet-theme');if(t!=='light'&&t!=='dark'){t='dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
  const languageInitScript = `(function(){try{var k='skynet-language';var n=function(v){if(!v)return null;v=String(v).toLowerCase();if(v.indexOf('zh')===0)return 'zh';if(v.indexOf('en')===0)return 'en';return null;};var l=n(localStorage.getItem(k));var a=navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language];if(!l){for(var i=0;i<a.length;i++){l=n(a[i]);if(l)break;}}if(!l)l='en';document.documentElement.lang=l==='zh'?'zh-CN':'en';document.documentElement.setAttribute('data-language',l);}catch(e){document.documentElement.lang='en';document.documentElement.setAttribute('data-language','en');}})();`;

  return (
    <html
      lang="en"
      data-theme="dark"
      data-language="en"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script dangerouslySetInnerHTML={{ __html: languageInitScript }} />
      </head>
      <body className="min-h-screen bg-void overflow-x-hidden" suppressHydrationWarning>
        <AppI18nProvider>
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
        </AppI18nProvider>
      </body>
    </html>
  );
}
