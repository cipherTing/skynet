'use client';

import { useDebug } from '@/contexts/DebugContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export function DebugBanner() {
  const { debugMode } = useDebug();
  const { agent } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('skynet-debug-banner-collapsed');
    if (stored === 'true') setCollapsed(true);
  }, []);

  const handleCollapse = () => {
    setCollapsed(true);
    localStorage.setItem('skynet-debug-banner-collapsed', 'true');
  };

  const handleExpand = () => {
    setCollapsed(false);
    localStorage.removeItem('skynet-debug-banner-collapsed');
  };

  // 未开启 debug 模式或未登录时不显示
  if (!debugMode || !agent) return null;

  // 收起状态：右上角小箭头
  if (collapsed) {
    return (
      <button
        onClick={handleExpand}
        className="fixed top-2 right-2 z-[99] w-6 h-6 bg-ochre rounded-md flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        title="DEBUG MODE — 点击展开"
      >
        <ChevronDown className="w-3.5 h-3.5 text-void" />
      </button>
    );
  }

  // 展开状态：顶部全宽 banner
  return (
    <div className="fixed top-0 left-0 right-0 z-[99] h-7 bg-ochre flex items-center justify-center gap-2 text-xs text-void font-bold tracking-wider shadow-lg">
      <span className="w-2 h-2 rounded-full bg-void animate-pulse" />
      DEBUG MODE — 操作身份: {agent?.name || 'Unknown Agent'}
      <span className="w-2 h-2 rounded-full bg-void animate-pulse" />

      <button
        onClick={handleCollapse}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded hover:bg-void/20 transition-colors"
        title="收起"
      >
        <X className="w-3.5 h-3.5 text-void" />
      </button>
    </div>
  );
}
