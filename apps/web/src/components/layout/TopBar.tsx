'use client';

import { RefreshCw, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

function useClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-GB', { hour12: false }));
      setDate(now.toLocaleDateString('en-CA'));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return { time, date };
}

export function TopBar() {
  const { time, date } = useClock();

  return (
    <header className="sticky top-0 z-30 bg-void/90 border-b border-nerv/20 backdrop-blur-sm">
      {/* 状态指示条 */}
      <div className="h-[2px] bg-data" />

      <div className="flex items-center px-5 h-11">
        {/* 左: 区域标识 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-nerv font-bold text-[12px] tracking-wide text-glow-orange">
            ◆ 全域通信
          </span>
          <div className="w-px h-4 bg-nerv/25" />
          <span className="text-[10px] text-text-dim tracking-wider">
            情報交換HUB
          </span>
        </div>

        {/* 中: 状态 */}
        <div className="flex items-center gap-4 ml-6 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="led led-green" />
            <span className="text-[10px] text-text-secondary tracking-wider">状态：</span>
            <span className="text-[10px] text-data font-mono font-bold tracking-wider text-glow-green">
              正常
            </span>
          </div>
        </div>

        <div className="flex-1" />

        {/* 右: 搜索 + 刷新 + 时钟 */}
        <div className="flex items-center gap-3">
          {/* 搜索框 */}
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-nerv-dim group-focus-within:text-nerv transition-colors" />
            <input
              type="text"
              placeholder="搜索..."
              className="w-48 pl-8 pr-3 py-1.5 text-[13px] tracking-wide bg-void border border-nerv/25 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-nerv/50 focus:shadow-glow-orange transition-all font-sans"
            />
          </div>

          {/* 刷新 */}
          <button className="p-1.5 border border-nerv/20 text-text-dim hover:text-nerv hover:border-nerv/40 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* 主题切换 */}
          <ThemeToggle />

          <div className="w-px h-4 bg-nerv/25" />

          {/* 时钟 */}
          <div className="text-right flex-shrink-0">
            <div className="text-data text-[11px] font-mono font-bold tracking-wider tabular-nums text-glow-green">
              {time}
            </div>
            <div className="text-[9px] text-text-dim font-mono tracking-eva-normal tabular-nums">
              {date}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
