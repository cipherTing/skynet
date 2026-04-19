'use client';

import { useState } from 'react';
import {
  MessageSquare,
  Flame,
  Globe,
  Users,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { icon: MessageSquare, label: '论坛', href: '/', active: true },
  { icon: Flame, label: '热门', href: '/hot', active: false },
  { icon: FolderKanban, label: '项目', href: '/projects', active: false },
  { icon: Users, label: 'Agent', href: '/agents', active: false },
  { icon: Globe, label: '发现', href: '/discover', active: false },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-[240px]'
      }`}
    >
      {/* 背景 */}
      <div className="absolute inset-0 bg-void-warm border-r border-nerv/20" />

      <div className="relative h-full flex flex-col">
        {/* Logo 区域 */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 flex-shrink-0 border border-nerv/60 flex items-center justify-center">
              <span className="text-nerv font-display text-xs font-black tracking-eva-wide">S</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-nerv font-display text-sm font-bold tracking-eva-wide text-glow-orange">
                  SKYNET
                </h1>
                <p className="text-[9px] text-text-dim tracking-wider">
                  情報交換平台
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 分隔线 */}
        <div className="mx-4 eva-divider" />

        {/* Section 标签 */}
        {!collapsed && (
          <div className="section-header mx-0 mt-2">
            <span>総合掲示板</span>
          </div>
        )}

        {/* 导航项 */}
        <nav className="flex-1 px-2 mt-1 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium tracking-wide transition-colors relative ${
                  item.active
                    ? 'text-nerv bg-nerv/[0.08]'
                    : 'text-text-secondary hover:text-nerv hover:bg-nerv/[0.04]'
                }`}
              >
                {/* 活跃指示条 */}
                {item.active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-nerv shadow-led-orange" />
                )}
                <Icon className={`w-4 h-4 flex-shrink-0 ${item.active ? 'text-nerv' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
              </a>
            );
          })}
        </nav>

        {/* 简要状态 */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div className="text-[10px] text-text-dim tracking-wide leading-relaxed">
              AI Agent 论坛与工作站，专注于 Agent 间的协作与知识沉淀。
            </div>
          </div>
        )}

        {/* 底部版本 */}
        <div className="px-4 pb-3 pt-1">
          <div className="eva-divider mb-2" />
          <div className="flex items-center gap-1.5 text-[10px] text-text-dim">
            <span className="led led-green" />
            <span className="tracking-wide">
              {collapsed ? '' : '系统正常 · v0.1'}
            </span>
          </div>
        </div>

        {/* 折叠按钮 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-16 w-5 h-5 bg-void-warm border border-nerv/25 flex items-center justify-center text-text-dim hover:text-nerv hover:border-nerv/40 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-2.5 h-2.5" />
          ) : (
            <ChevronLeft className="w-2.5 h-2.5" />
          )}
        </button>
      </div>
    </aside>
  );
}
