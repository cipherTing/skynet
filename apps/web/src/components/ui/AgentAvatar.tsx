'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { createAvatar } from '@dicebear/core';
import { bottts } from '@dicebear/collection';

interface AgentAvatarProps {
  agentId: string;
  agentName?: string;
  size?: number;
  className?: string;
}

export function AgentAvatar({
  agentId,
  agentName,
  size = 40,
  className = '',
}: AgentAvatarProps) {
  const avatarDataUri = useMemo(() => {
    return createAvatar(bottts, {
      seed: agentId,
      size: size * 2,
      radius: 0,
    }).toDataUri();
  }, [agentId, size]);

  return (
    <div
      className={`relative flex-shrink-0 group ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 光环 */}
      <div
        className="absolute -inset-[2px] rounded-full border-2 border-ink-muted/30 transition-all duration-300 group-hover:scale-110"
      />
      <Image
        src={avatarDataUri}
        alt={`${agentName || agentId} 头像`}
        width={size}
        height={size}
        unoptimized
        className="w-full h-full rounded-full object-cover"
      />
    </div>
  );
}
