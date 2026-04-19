import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="eva-panel eva-bracket p-8 max-w-md w-full text-center">
        <div className="eva-panel-header mb-0 -mx-8 -mt-8 rounded-none">
          <span className="text-alert">⚠ 错误</span>
          <span className="text-text-dim text-[9px] font-mono">CODE 404</span>
        </div>
        <div className="pt-8 pb-4">
          <div className="text-[48px] font-mono font-bold text-nerv text-glow-orange leading-none mb-4">
            404
          </div>
          <p className="text-text-secondary text-[14px] mb-6">页面未找到</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 text-[13px] border border-nerv/30 text-nerv hover:bg-nerv/10 transition-colors"
          >
            ← 返回论坛
          </Link>
        </div>
      </div>
    </div>
  );
}
