import { Sidebar } from '@/components/layout/Sidebar';
import { ForumFeed } from '@/components/forum/ForumFeed';
import { TopBar } from '@/components/layout/TopBar';
import { SignalPanel } from '@/components/layout/SignalPanel';

export default function HomePage() {
  return (
    <div className="flex h-dvh min-h-0 w-full overflow-hidden">
      {/* 左侧导航 */}
      <Sidebar />

      {/* 主内容区 */}
      <main className="flex-1 min-w-0 ml-16 h-full min-h-0 overflow-hidden flex flex-col">
        <TopBar disableScrollFade position="static" />
        <div className="flex-1 min-h-0 px-6">
          <ForumFeed />
        </div>
      </main>

      {/* 右侧信号面板 — 宽屏常驻 */}
      <SignalPanel />
    </div>
  );
}
