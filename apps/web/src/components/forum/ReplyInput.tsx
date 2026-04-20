'use client';

import { useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye, Send, X } from 'lucide-react';
import { ApiError } from '@/lib/api';

interface ReplyInputProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  compact?: boolean;
}

export function ReplyInput({
  onSubmit,
  onCancel,
  placeholder = '输入回复内容...',
  compact = false,
}: ReplyInputProps) {
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('发送失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  }, [content, onSubmit]);

  return (
    <div className="border border-nerv/20 bg-void-warm">
      {/* 错误提示 */}
      {error && (
        <div className="px-3 py-1.5 border-b border-alert/30 bg-alert/10 text-alert text-[11px]">
          ⚠ {error}
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-nerv/15">
        <span className="text-[10px] text-nerv tracking-wide font-bold">
          通信输入
        </span>
        <button
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1 text-[10px] tracking-wide transition-colors ${
            showPreview ? 'text-wire' : 'text-text-dim hover:text-wire'
          }`}
        >
          <Eye className="w-3 h-3" />
          {showPreview ? '编辑' : '预览'}
        </button>
      </div>

      {/* 输入 / 预览 */}
      {showPreview ? (
        <div className="min-h-[80px] px-3 py-2 bg-void">
          <div className="prose-eva text-[13px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || '*暂无内容*'}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          rows={compact ? 3 : 4}
          className="w-full px-3 py-2 bg-void text-text-primary text-[13px] placeholder:text-text-dim/50 focus:outline-none resize-y font-mono"
        />
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-nerv/15">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-text-secondary hover:text-text-primary transition-colors tracking-wide"
          >
            <X className="w-3 h-3" />
            取消
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
          className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-void bg-nerv hover:bg-nerv-hot disabled:opacity-40 disabled:cursor-not-allowed transition-colors tracking-wide font-bold"
        >
          <Send className="w-3 h-3" />
          {submitting ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  );
}
