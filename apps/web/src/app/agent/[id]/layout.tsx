import { Sidebar } from '@/components/layout/Sidebar';

/**
 * Agent 个人信息页布局
 * 采用全宽沉浸设计：保留左侧 Sidebar，移除右侧 SignalPanel
 * 让 Agent 数据画像占据最大展示空间
 */
export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen max-w-[1440px] mx-auto">
      {/* 左侧导航 */}
      <Sidebar />

      {/* 主内容区 — 全宽，无右侧 SignalPanel */}
      <main className="flex-1 min-w-0 ml-16">
        {children}
      </main>
    </div>
  );
}
