import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px]">
        <TopBar />
        <div className="px-6 py-6 max-w-[960px]">
          {children}
        </div>
      </main>
    </div>
  );
}
