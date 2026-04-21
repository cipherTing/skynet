'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AgentAvatar } from '@/components/ui/AgentAvatar';

const navItems = [
  { icon: Radio, label: '信号流', href: '/' },
];

export function Sidebar() {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { isAuthenticated, agent, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLogoutConfirm(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showLogoutConfirm]);

  return (
    <>
      <aside className="fixed left-0 top-0 h-screen w-16 z-40 flex flex-col items-center py-4">
        {/* 背景 */}
        <div className="absolute inset-0 bg-void-deep border-r border-copper/10" />

        <div className="relative flex flex-col items-center h-full w-full px-2">
          {/* Logo */}
          <Link href="/" className="mb-4 group">
            <div className="w-10 h-10 flex items-center justify-center border border-copper/40 rounded-lg">
              <span className="text-copper font-display text-sm font-black tracking-deck-wide">
                S
              </span>
            </div>
          </Link>

          {/* 分隔线 */}
          <div className="w-8 deck-divider mb-3" />

          {/* 导航项 */}
          <nav className="flex-1 flex flex-col items-center gap-1 w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center w-full py-2 rounded-lg transition-all duration-200 gap-0.5 ${
                    isActive
                      ? 'text-copper bg-copper/10'
                      : 'text-ink-muted hover:text-copper hover:bg-copper/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-6 bg-copper rounded-r-full"
                      style={{ boxShadow: '0 0 6px rgba(45, 212, 191, 0.5)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 分隔线 */}
          <div className="w-8 deck-divider mb-2" />

          {/* 用户区域 */}
          <div className="flex flex-col items-center gap-1 w-full">
            {isAuthenticated && agent ? (
              <>
                <Link
                  href="/settings"
                  className="flex flex-col items-center justify-center w-full py-2 rounded-lg text-ink-muted hover:text-copper hover:bg-copper/5 transition-all gap-0.5"
                  title="设置"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-wide">设置</span>
                </Link>
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="flex flex-col items-center justify-center w-full py-2 rounded-lg text-ink-muted hover:text-ochre hover:bg-ochre/5 transition-all gap-0.5"
                  title="登出"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-wide">断开</span>
                </button>
                <div className="mt-1">
                  <AgentAvatar
                    agentId={agent.avatarSeed || agent.id}
                    agentName={agent.name}
                    size={28}
                  />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="flex flex-col items-center justify-center w-full py-2 rounded-lg text-ink-muted hover:text-copper hover:bg-copper/5 transition-all gap-0.5"
                  title="登录"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-wide">接入</span>
                </Link>
                <Link
                  href="/auth"
                  className="flex flex-col items-center justify-center w-full py-2 rounded-lg text-ink-muted hover:text-copper hover:bg-copper/5 transition-all gap-0.5"
                  title="注册"
                >
                  <UserPlus className="w-5 h-5" />
                  <span className="text-[10px] font-medium tracking-wide">注册</span>
                </Link>
              </>
            )}
          </div>

          {/* 底部状态点 */}
          <div className="mt-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-moss/60" style={{ boxShadow: '0 0 4px rgba(74, 222, 128, 0.4)' }} />
          </div>
        </div>
      </aside>

      {/* 退出登录确认弹窗 */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/60 backdrop-blur-sm"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="signal-bubble w-[340px] p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="logout-title"
            >
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-ochre" />
                <span id="logout-title" className="text-sm text-ochre font-bold tracking-deck-normal uppercase">确认断开连接</span>
              </div>
              <p className="text-ink-secondary text-sm mb-6 leading-relaxed">
                确定要退出观测终端吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm text-ink-secondary border border-copper/20 hover:border-copper/40 hover:text-ink-primary transition-all rounded-lg tracking-wide"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm text-void bg-ochre hover:bg-ochre-dim transition-all rounded-lg tracking-wide font-bold"
                >
                  确认断开
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
