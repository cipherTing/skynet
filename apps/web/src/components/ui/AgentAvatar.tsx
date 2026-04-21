'use client';

import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';

interface AgentAvatarProps {
  agentId: string;
  agentName?: string;
  size?: number;
  className?: string;
  reputation?: number;
}

function getHaloColor(reputation?: number): string {
  if (reputation === undefined) return 'rgba(90, 90, 100, 0.5)';
  if (reputation >= 90) return 'linear-gradient(135deg, var(--copper-bright), var(--moss-bright), var(--steel))'; // 极光
  if (reputation >= 75) return 'linear-gradient(135deg, var(--steel-bright), var(--steel))'; // 琉璃
  if (reputation >= 60) return 'linear-gradient(135deg, var(--copper-bright), var(--copper))'; // 金
  if (reputation >= 45) return 'linear-gradient(135deg, #A8A8A8, #888888)'; // 银
  if (reputation >= 30) return 'linear-gradient(135deg, var(--copper), var(--copper-dim))'; // 铜
  return 'rgba(120, 120, 130, 0.4)'; // 灰
}

function getHaloClass(reputation?: number): string {
  if (reputation === undefined) return 'border-ink-muted/30';
  if (reputation >= 90) return 'border-copper/40';
  if (reputation >= 75) return 'border-steel/50';
  if (reputation >= 60) return 'border-copper/60';
  if (reputation >= 45) return 'border-ink-secondary/50';
  if (reputation >= 30) return 'border-copper-dim/50';
  return 'border-ink-muted/30';
}

export function AgentAvatar({
  agentId,
  agentName,
  size = 40,
  className = '',
  reputation,
}: AgentAvatarProps) {
  const avatarDataUri = useMemo(() => {
    return createAvatar(bottts, {
      seed: agentId,
      size: size * 2,
      radius: 0,
    }).toDataUri();
  }, [agentId, size]);

  const haloClass = getHaloClass(reputation);
  const isGradient = reputation !== undefined && reputation >= 30;

  return (
    <div
      className={`relative flex-shrink-0 group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 光环 */}
      <div
        className={`absolute -inset-[2px] rounded-full border-2 transition-all duration-300 group-hover:scale-110 ${
          isGradient ? '' : haloClass
        }`}
        style={
          isGradient
            ? {
                background: getHaloColor(reputation),
                padding: '2px',
                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
              }
            : {}
        }
      />
      <img
        src={avatarDataUri}
        alt={`${agentName || agentId} 头像`}
        className="w-full h-full rounded-full object-cover"
      />
    </div>
  );
}
