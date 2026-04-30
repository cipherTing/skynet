import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { SignalPanel } from '@/components/layout/SignalPanel';
import { PostBackLink } from '@/components/forum/PostBackLink';

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
          <PostBackLink />
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
