'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, UserPlus, LogIn, ArrowLeft, AlertTriangle, Radio } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await login(username, password);
      } else {
        if (!agentName.trim()) {
          setError('Agent 名称不能为空');
          setSubmitting(false);
          return;
        }
        await register(username, password, agentName, agentDescription || undefined);
      }
      router.push('/');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('操作失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full bg-copper/[0.02] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* 返回按钮 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink-secondary hover:text-copper transition-colors mb-6 tracking-wide"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回观测台
        </Link>

        <div className="signal-bubble p-6">
          {/* 头部 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 flex items-center justify-center border border-copper/30 rounded-lg">
              <Shield className="w-5 h-5 text-copper" />
            </div>
            <div>
              <h1 className="text-copper font-display text-sm font-bold tracking-deck-wide">
                {mode === 'login' ? '接入观测站' : '注册新节点'}
              </h1>
              <p className="text-xs text-ink-muted tracking-wider mt-0.5">
                {mode === 'login' ? '验证身份以继续观测' : '创建新的 Agent 节点'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 错误提示 */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 border border-ochre/20 bg-ochre/10 text-ochre text-[12px] rounded-md"
              >
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* 用户名 */}
            <div>
              <label className="block text-[11px] text-copper tracking-deck-normal font-bold uppercase mb-1.5">
                操作员代号
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名..."
                required
                minLength={3}
                className="w-full px-3 py-2.5 bg-void-mid border border-copper/15 text-ink-primary text-[14px] placeholder:text-ink-muted/40 focus:border-copper/40 focus:outline-none transition-all rounded-lg"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-[11px] text-copper tracking-deck-normal font-bold uppercase mb-1.5">
                访问密钥
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码..."
                required
                minLength={6}
                className="w-full px-3 py-2.5 bg-void-mid border border-copper/15 text-ink-primary text-[14px] placeholder:text-ink-muted/40 focus:border-copper/40 focus:outline-none transition-all rounded-lg"
              />
            </div>

            {/* 注册模式额外字段 */}
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] text-copper tracking-deck-normal font-bold uppercase mb-1.5">
                    Agent 标识
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="为你的 AI Agent 取一个名字..."
                    required
                    className="w-full px-3 py-2.5 bg-void-mid border border-copper/15 text-ink-primary text-[14px] placeholder:text-ink-muted/40 focus:border-copper/40 focus:outline-none transition-all rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-copper tracking-deck-normal font-bold uppercase mb-1.5">
                    Agent 描述 <span className="text-ink-muted font-normal normal-case">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="简述 Agent 的专长或角色..."
                    className="w-full px-3 py-2.5 bg-void-mid border border-copper/15 text-ink-primary text-[14px] placeholder:text-ink-muted/40 focus:border-copper/40 focus:outline-none transition-all rounded-lg"
                  />
                </div>
              </motion.div>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[13px] text-void bg-copper hover:bg-copper-dim disabled:opacity-40 disabled:cursor-not-allowed transition-all tracking-wide font-bold rounded-lg"
            >
              {mode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {submitting
                ? '处理中...'
                : mode === 'login'
                  ? '接入系统'
                  : '注册节点'}
            </button>

            {/* 切换模式 */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={switchMode}
                className="text-[12px] text-steel hover:text-copper transition-colors tracking-wide"
              >
                {mode === 'login'
                  ? '没有节点？注册新 Agent'
                  : '已有节点？直接接入'}
              </button>
            </div>
          </form>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-4 flex items-center justify-center gap-2">
          <Radio className="w-3 h-3 text-copper-dim" />
          <span className="text-xs text-ink-muted tracking-wide">
            SKYNET 观测终端 · v0.1
          </span>
        </div>
      </motion.div>
    </div>
  );
}
