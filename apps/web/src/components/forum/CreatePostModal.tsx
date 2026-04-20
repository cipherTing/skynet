'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { X, Eye, Send } from 'lucide-react';
import { forumApi, ApiError } from '@/lib/api';

interface CreatePostModalProps {
  onClose: () => void;
  onCreated: () => void;
}

export function CreatePostModal({ onClose, onCreated }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || !content.trim()) {
      setError('标题和内容不能为空');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await forumApi.createPost({ title: title.trim(), content: content.trim() });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('创建失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  }, [title, content, onCreated]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-void/80 backdrop-blur-sm" onClick={onClose} />

      {/* 模态框 */}
      <div className="relative w-full max-w-2xl mx-4 eva-panel eva-bracket">
        {/* 头部 */}
        <div className="eva-panel-header">
          <span className="flex items-center gap-2">
            <span className="text-data font-mono text-[10px] text-glow-green">新建文档</span>
            <span className="text-text-dim text-[9px] font-mono">CREATE_POST</span>
          </span>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-alert transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 错误提示 */}
          {error && (
            <div className="px-3 py-2 border border-alert/40 bg-alert/10 text-alert text-[12px]">
              ⚠ {error}
            </div>
          )}

          {/* 标题 */}
          <div>
            <label className="block text-[11px] text-nerv tracking-wide font-bold mb-1.5">
              标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入帖子标题..."
              className="w-full px-3 py-2.5 bg-void border border-nerv/25 text-text-primary text-[14px] placeholder:text-text-dim/50 focus:border-nerv/60 focus:outline-none transition-colors"
            />
          </div>

          {/* 内容 / 预览 切换 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-nerv tracking-wide font-bold">
                内容 (Markdown)
              </label>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className={`flex items-center gap-1 text-[11px] tracking-wide transition-colors ${
                  showPreview ? 'text-wire' : 'text-text-dim hover:text-wire'
                }`}
              >
                <Eye className="w-3 h-3" />
                {showPreview ? '编辑' : '预览'}
              </button>
            </div>

            {showPreview ? (
              <div className="min-h-[200px] px-3 py-2.5 bg-void border border-wire/25">
                <div className="prose-eva text-[14px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {content || '*暂无内容*'}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="支持 Markdown 格式..."
                rows={8}
                className="w-full px-3 py-2.5 bg-void border border-nerv/25 text-text-primary text-[14px] placeholder:text-text-dim/50 focus:border-nerv/60 focus:outline-none transition-colors resize-y font-mono"
              />
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[12px] text-text-secondary hover:text-text-primary border border-nerv/20 hover:border-nerv/40 transition-colors tracking-wide"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-void bg-nerv hover:bg-nerv-hot disabled:opacity-40 disabled:cursor-not-allowed transition-colors tracking-wide font-bold"
            >
              <Send className="w-3 h-3" />
              {submitting ? '提交中...' : '发布'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
