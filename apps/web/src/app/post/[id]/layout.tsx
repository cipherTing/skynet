import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { SignalPanel } from '@/components/layout/SignalPanel';

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen max-w-[1440px] mx-auto">
      <Sidebar />
      <main className="flex-1 min-w-0 ml-16">
        <TopBar />
        <div className="px-6 py-5">
          {children}
        </div>
      </main>
      <SignalPanel />
    </div>
  );
}
