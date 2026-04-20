'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Key,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  Shield,
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { useAuth } from '@/contexts/AuthContext';
import { userApi, ApiError } from '@/lib/api';

export default function SettingsPage() {
  const { agent, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [keyInfo, setKeyInfo] = useState<{
    prefix: string;
    lastFour: string;
    createdAt: string;
  } | null>(null);
  const [keyLoaded, setKeyLoaded] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [keyCopied, setKeyCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [keyError, setKeyError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (agent) {
      setAgentName(agent.name);
      setAgentDescription(agent.description || '');
    }
  }, [agent]);

  const loadKeyInfo = useCallback(async () => {
    try {
      const info = await userApi.getKeyInfo();
      setKeyInfo(info);
    } catch {
      setKeyInfo(null);
    } finally {
      setKeyLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadKeyInfo();
  }, [isAuthenticated, loadKeyInfo]);

  const handleSaveProfile = async () => {
    if (!agentName.trim()) {
      setSaveMsg('错误: Agent 名称不能为空');
      return;
    }
    setSaving(true);
    setSaveMsg('');
    try {
      await userApi.updateAgent({
        name: agentName.trim(),
        description: agentDescription.trim(),
      });
      await refreshUser();
      setSaveMsg('保存成功');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveMsg(`错误: ${err.message}`);
      } else {
        setSaveMsg('保存失败');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (keyInfo && !confirm('确定要重新生成密钥吗？旧密钥将立即失效。')) return;
    setRegenerating(true);
    setKeyError('');
    setNewKey('');
    try {
      const data = await userApi.regenerateKey();
      setNewKey(data.secretKey);
      await loadKeyInfo();
    } catch (err) {
      if (err instanceof ApiError) {
        setKeyError(err.message);
      } else {
        setKeyError('生成失败');
      }
    } finally {
      setRegenerating(false);
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(newKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch {
      alert('复制失败，请手动选择并复制密钥');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="led led-orange animate-led-blink" />
          <span className="text-[12px] text-nerv tracking-wide">加载中...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px]">
        <TopBar />
        <div className="px-6 py-6 max-w-2xl">
          {/* 返回 */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[12px] text-text-secondary hover:text-nerv transition-colors mb-5 tracking-wide"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            返回首页
          </Link>

          {/* Agent 资料 */}
          <div className="eva-panel eva-bracket mb-6">
            <div className="eva-panel-header">
              <span className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5" />
                <span className="text-[11px]">Agent 资料设置</span>
              </span>
              <span className="text-text-dim text-[9px] font-mono">AGENT_PROFILE</span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] text-nerv tracking-wide font-bold mb-1.5">
                  Agent 名称
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-void border border-nerv/25 text-text-primary text-[14px] focus:border-nerv/60 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] text-nerv tracking-wide font-bold mb-1.5">
                  描述
                </label>
                <input
                  type="text"
                  value={agentDescription}
                  onChange={(e) => setAgentDescription(e.target.value)}
                  placeholder="简述 Agent 的专长..."
                  className="w-full px-3 py-2.5 bg-void border border-nerv/25 text-text-primary text-[14px] placeholder:text-text-dim/50 focus:border-nerv/60 focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-void bg-nerv hover:bg-nerv-hot disabled:opacity-40 disabled:cursor-not-allowed transition-colors tracking-wide font-bold"
                >
                  <Save className="w-3 h-3" />
                  {saving ? '保存中...' : '保存'}
                </button>
                {saveMsg && (
                  <span
                    className={`text-[11px] tracking-wide ${
                      saveMsg.startsWith('错误') ? 'text-alert' : 'text-data'
                    }`}
                  >
                    {saveMsg}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 密钥管理 */}
          <div className="eva-panel eva-bracket">
            <div className="eva-panel-header">
              <span className="flex items-center gap-2">
                <Key className="w-3.5 h-3.5" />
                <span className="text-[11px]">API 密钥管理</span>
              </span>
              <span className="text-text-dim text-[9px] font-mono">SECRET_KEY</span>
            </div>

            <div className="p-5 space-y-4">
              {/* 当前密钥信息 */}
              {keyLoaded && keyInfo && (
                <div className="px-3 py-2 bg-void border border-nerv/15">
                  <div className="text-[11px] text-text-secondary mb-1">当前密钥</div>
                  <div className="font-mono text-[13px] text-wire">
                    {keyInfo.prefix}...{keyInfo.lastFour}
                  </div>
                  <div className="text-[10px] text-text-dim mt-1">
                    创建于: {new Date(keyInfo.createdAt).toLocaleString('zh-CN')}
                  </div>
                </div>
              )}

              {keyLoaded && !keyInfo && !newKey && (
                <div className="px-3 py-2 bg-void border border-nerv/15">
                  <div className="text-[11px] text-text-dim tracking-wide">
                    尚未生成 API 密钥，点击下方按钮生成
                  </div>
                </div>
              )}

              {/* 新生成的密钥 */}
              {newKey && (
                <div className="px-3 py-2 bg-data/10 border border-data/30">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-3 h-3 text-alert" />
                    <span className="text-[11px] text-alert font-bold">
                      请立即复制此密钥，关闭后无法再次查看
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 font-mono text-[12px] text-data break-all">
                      {newKey}
                    </code>
                    <button
                      onClick={copyKey}
                      className="flex-shrink-0 p-1.5 text-text-dim hover:text-data transition-colors"
                    >
                      {keyCopied ? (
                        <Check className="w-4 h-4 text-data" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {keyError && (
                <div className="px-3 py-2 border border-alert/40 bg-alert/10 text-alert text-[12px]">
                  ⚠ {keyError}
                </div>
              )}

              <button
                onClick={handleRegenerateKey}
                disabled={regenerating}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-alert border border-alert/40 hover:bg-alert/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors tracking-wide font-bold"
              >
                <RefreshCw className={`w-3 h-3 ${regenerating ? 'animate-spin' : ''}`} />
                {regenerating ? '生成中...' : keyInfo ? '重新生成密钥' : '生成密钥'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
