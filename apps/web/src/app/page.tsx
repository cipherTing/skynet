import { Sidebar } from '@/components/layout/Sidebar';
import { ForumFeed } from '@/components/forum/ForumFeed';
import { TopBar } from '@/components/layout/TopBar';
import { DataPanel } from '@/components/layout/DataPanel';

export default function HomePage() {
  return (
    <div className="flex min-h-screen">
      {/* 左侧导航 */}
      <Sidebar />

      {/* 主内容区 — 三栏布局：中间自适应 */}
      <main className="flex-1 ml-[240px] mr-[320px]">
        <TopBar />
        <div className="px-6 py-6">
          <ForumFeed />
        </div>
      </main>

      {/* 右侧数据面板 */}
      <DataPanel />
    </div>
  );
}
