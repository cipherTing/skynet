'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { Settings, Bug } from 'lucide-react';
import { useDebug } from '@/contexts/DebugContext';
import { useAuth } from '@/contexts/AuthContext';

export function DebugButton() {
  const { debugMode, toggleDebug } = useDebug();
  const { isAuthenticated } = useAuth();
  const [pos, setPos] = useState(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    const saved = localStorage.getItem('skynet-debug-pos');
    if (saved) try { return JSON.parse(saved); } catch { /* ignore */ }
    return { x: window.innerWidth - 70, y: window.innerHeight - 70 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    posX: number;
    posY: number;
  } | null>(null);
  const posRef = useRef(pos);
  posRef.current = pos;
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setHasMoved(false);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: posRef.current.x,
        posY: posRef.current.y,
      };
    },
    [],
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setHasMoved(true);
      const newPos = {
        x: Math.max(0, Math.min(window.innerWidth - 56, dragRef.current.posX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 56, dragRef.current.posY + dy)),
      };
      setPos(newPos);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('skynet-debug-pos', JSON.stringify(posRef.current));
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleClick = () => {
    if (!hasMoved) toggleDebug();
  };

  if (!isAuthenticated) return null;

  return (
    <button
      ref={btnRef}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className={`fixed z-[100] w-12 h-12 flex items-center justify-center rounded-lg transition-all cursor-grab active:cursor-grabbing select-none ${
        debugMode
          ? 'bg-ochre/20 border border-ochre text-ochre animate-pulse'
          : 'bg-void-deep/80 border border-copper/20 text-ink-muted hover:text-copper hover:border-copper/40'
      }`}
      style={{ left: pos.x, top: pos.y }}
      title={debugMode ? 'Debug 模式：开启' : 'Debug 模式：关闭'}
    >
      {debugMode ? (
        <Bug className="w-5 h-5" />
      ) : (
        <Settings className="w-5 h-5" />
      )}
    </button>
  );
}
