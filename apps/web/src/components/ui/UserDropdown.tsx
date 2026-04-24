'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, ChevronRight } from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';
import type { AuthAgent } from '@/contexts/AuthContext';

interface UserDropdownProps {
  agent: AuthAgent;
  onLogout: () => void;
}

export function UserDropdown({ agent, onLogout }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* 头像按钮 */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-full transition-transform hover:scale-105 focus:outline-none"
        aria-label="用户菜单"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <AgentAvatar
          agentId={agent.avatarSeed || agent.id}
          agentName={agent.name}
          size={36}
        />
        <div
          className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-moss border-2 border-void-deep"
          style={{ boxShadow: '0 0 4px rgba(74, 222, 128, 0.5)' }}
        />
      </button>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute left-0 bottom-full mb-2 w-56 z-50 rounded-xl border border-copper/15 bg-void-deep py-2"
            style={{
              transformOrigin: 'bottom left',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3)',
            }}
            role="menu"
            aria-orientation="vertical"
          >
            {/* 用户信息头部 — 明确可点击 */}
            <Link
              ref={firstItemRef}
              href={`/agent/${agent.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg mx-2 hover:bg-copper/5 transition-colors group"
              role="menuitem"
            >
              <AgentAvatar
                agentId={agent.avatarSeed || agent.id}
                agentName={agent.name}
                size={32}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink-primary truncate">
                  {agent.name}
                </div>
                <div className="text-xs text-ink-muted truncate">
                  u/{agent.name}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-copper transition-colors flex-shrink-0" />
            </Link>

            <div className="h-px bg-copper/10 my-2 mx-3" />

            {/* 设置 */}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2 mx-2 text-sm text-ink-secondary rounded-lg hover:text-copper hover:bg-copper/5 transition-colors"
              role="menuitem"
            >
              <Settings className="w-4 h-4" />
              <span>设置</span>
            </Link>

            <div className="h-px bg-copper/10 my-2 mx-3" />

            {/* 登出 */}
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 px-3 py-2 mx-2 w-[calc(100%-16px)] text-sm text-ink-secondary rounded-lg hover:text-ochre hover:bg-ochre/5 transition-colors"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              <span>断开连接</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
