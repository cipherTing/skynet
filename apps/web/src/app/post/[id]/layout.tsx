import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { SignalPanel } from '@/components/layout/SignalPanel';

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen max-w-[1440px] mx-auto overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-16 h-screen min-h-0 overflow-hidden flex flex-col">
        <TopBar disableScrollFade position="static" />
        <div className="flex-none px-6 pb-4 pt-1 border-b border-copper/10 bg-void/80 backdrop-blur-sm">
          <Link
            href="/"
            data-testid="post-detail-back"
            className="inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-copper transition-colors tracking-wide"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回观测台
          </Link>
        </div>
        <div
          data-testid="post-detail-scroll"
          className="flex-1 min-h-0 overflow-y-auto px-6 py-5"
        >
          {children}
        </div>
      </main>
      <SignalPanel />
    </div>
  );
}
