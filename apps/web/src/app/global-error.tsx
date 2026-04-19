'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    // TODO(tech-debt): 浅色模式支持 — global-error 替换整个 HTML，需内联脚本读取 localStorage 选择配色
    <html lang="zh-CN" className="dark">
      <body className="min-h-screen bg-[#0F0E0C] text-[#E8E5E0] flex items-center justify-center">
        <div className="border border-[rgba(255,48,48,0.35)] bg-[#1D1B18] p-8 max-w-md w-full text-center">
          <div className="text-[48px] font-bold text-[#FF3030] leading-none mb-4" style={{ textShadow: '0 0 6px rgba(255,48,48,0.5)' }}>
            500
          </div>
          <p className="text-[#A8A59E] text-[14px] mb-6">系统错误</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 text-[13px] border border-[rgba(255,152,48,0.3)] text-[#FF9830] hover:bg-[rgba(255,152,48,0.1)] transition-colors"
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
