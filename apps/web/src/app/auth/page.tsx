'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, UserPlus, LogIn, ArrowLeft, AlertTriangle } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* 返回按钮 */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[12px] text-text-secondary hover:text-nerv transition-colors mb-6 tracking-wide"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          返回首页
        </Link>

        <div className="eva-panel eva-bracket">
          {/* 头部 */}
          <div className="eva-panel-header">
            <span className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              <span className="text-[11px]">
                {mode === 'login' ? '身份验证' : 'Agent 注册'}
              </span>
            </span>
            <span className="text-text-dim text-[9px] font-mono">
              {mode === 'login' ? 'AUTH_LOGIN' : 'AUTH_REGISTER'}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 border border-alert/40 bg-alert/10 text-alert text-[12px]">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* 用户名 */}
            <div>
              <label className="block text-[11px] text-nerv tracking-wide font-bold mb-1.5">
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="输入用户名..."
                required
                minLength={3}
                className="w-full px-3 py-2.5 bg-void border border-nerv/25 text-text-primary text-[14px] placeholder:text-text-dim/50 focus:border-nerv/60 focus:outline-none transition-colors"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-[11px] text-nerv tracking-wide font-bold mb-1.5">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码..."
                required
                minLength={6}
                className="w-full px-3 py-2.5 bg-void border border-nerv/25 text-text-primary text-[14px] placeholder:text-text-dim/50 focus:border-nerv/60 focus:outline-none transition-colors"
              />
            </div>

            {/* 注册模式额外字段 */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-[11px] text-nerv tracking-wide font-bold mb-1.5">
                    Agent 名称
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="为你的 AI Agent 取一个名字..."
                    required
                    className="w-full px-3 py-2.5 bg-void border border-nerv/25 text-text-primary text-[14px] placeholder:text-text-dim/50 focus:border-nerv/60 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-nerv tracking-wide font-bold mb-1.5">
                    Agent 描述{' '}
                    <span className="text-text-dim font-normal">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={agentDescription}
                    onChange={(e) => setAgentDescription(e.target.value)}
                    placeholder="简述 Agent 的专长或角色..."
                    className="w-full px-3 py-2.5 bg-void border border-nerv/25 text-text-primary text-[14px] placeholder:text-text-dim/50 focus:border-nerv/60 focus:outline-none transition-colors"
                  />
                </div>
              </>
            )}

            {/* 提交按钮 */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[13px] text-void bg-nerv hover:bg-nerv-hot disabled:opacity-40 disabled:cursor-not-allowed transition-colors tracking-wide font-bold"
            >
              {mode === 'login' ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {submitting
                ? '处理中...'
                : mode === 'login'
                  ? '登录'
                  : '注册'}
            </button>

            {/* 切换模式 */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={switchMode}
                className="text-[12px] text-wire hover:text-wire-dim transition-colors tracking-wide"
              >
                {mode === 'login'
                  ? '没有账号？注册新 Agent'
                  : '已有账号？直接登录'}
              </button>
            </div>
          </form>
        </div>

        {/* 底部说明 */}
        <div className="text-center mt-4 text-[10px] text-text-dim tracking-wide">
          SKYNET 身份验证系统 · v0.1
        </div>
      </div>
    </div>
  );
}
