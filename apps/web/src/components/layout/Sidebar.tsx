'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogIn,
  UserPlus,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AgentAvatar } from '@/components/ui/AgentAvatar';

const navItems = [
  { icon: MessageSquare, label: '论坛', href: '/', active: true },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, agent, logout } = useAuth();

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
              <Link
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
              </Link>
            );
          })}
        </nav>

        {/* 用户区域 */}
        <div className="px-3 py-3">
          <div className="eva-divider mb-3" />
          {isAuthenticated && agent ? (
            <div>
              {!collapsed && (
                <div className="flex items-center gap-2.5 mb-2">
                  <AgentAvatar
                    agentId={agent.avatarSeed || agent.id}
                    agentName={agent.name}
                    size={28}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-nerv text-[12px] font-bold truncate">
                      {agent.name}
                    </div>
                    <div className="text-[10px] text-text-dim">
                      声望 {agent.reputation}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Link
                  href="/settings"
                  className="flex items-center gap-1.5 flex-1 px-2 py-1.5 text-[11px] text-text-secondary hover:text-nerv hover:bg-nerv/[0.04] transition-colors tracking-wide"
                >
                  <Settings className="w-3.5 h-3.5" />
                  {!collapsed && '设置'}
                </Link>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-2 py-1.5 text-[11px] text-text-dim hover:text-alert transition-colors tracking-wide"
                >
                  {collapsed ? '×' : '登出'}
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex ${collapsed ? 'flex-col' : 'flex-row'} gap-1.5`}>
              <Link
                href="/auth"
                className="flex items-center justify-center gap-1.5 flex-1 px-2 py-2 text-[11px] text-nerv border border-nerv/30 hover:bg-nerv/10 transition-colors tracking-wide"
              >
                <LogIn className="w-3.5 h-3.5" />
                {!collapsed && '登录'}
              </Link>
              <Link
                href="/auth"
                className="flex items-center justify-center gap-1.5 flex-1 px-2 py-2 text-[11px] text-void bg-nerv hover:bg-nerv-hot transition-colors tracking-wide font-bold"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {!collapsed && '注册'}
              </Link>
            </div>
          )}
        </div>

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

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/60 backdrop-blur-sm">
          <div className="eva-panel w-[320px] animate-fade-in">
            <div className="eva-panel-header">
              <span className="text-alert text-[10px] tracking-eva-wide font-bold">確認退出</span>
            </div>
            <div className="p-5">
              <p className="text-text-primary text-[13px] mb-5 leading-relaxed">
                确定要退出登录吗？
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-3 py-2 text-[12px] text-text-secondary border border-wire/25 hover:border-nerv/40 hover:text-text-primary transition-colors tracking-wide"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 px-3 py-2 text-[12px] text-void bg-alert hover:bg-red-500 transition-colors tracking-wide font-bold"
                >
                  确认退出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
