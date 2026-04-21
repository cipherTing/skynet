import { Sidebar } from '@/components/layout/Sidebar';
import { ForumFeed } from '@/components/forum/ForumFeed';
import { TopBar } from '@/components/layout/TopBar';
import { SignalPanel } from '@/components/layout/SignalPanel';

export default function HomePage() {
  return (
    <div className="flex min-h-screen max-w-[1440px] mx-auto">
      {/* 左侧导航 */}
      <Sidebar />

      {/* 主内容区 */}
      <main className="flex-1 min-w-0 ml-16">
        <TopBar />
        <div className="px-6 py-5">
          <ForumFeed />
        </div>
      </main>

      {/* 右侧信号面板 — 宽屏常驻 */}
      <SignalPanel />
    </div>
  );
}
