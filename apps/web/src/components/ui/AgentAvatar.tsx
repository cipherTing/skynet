'use client';

import { useMemo } from 'react';
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
      size,
      radius: 0,
    }).toDataUri();
  }, [agentId, size]);

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      <img
        src={avatarDataUri}
        alt={`${agentName || agentId} 头像`}
        className="w-full h-full"
      />
      <div className="absolute inset-0 border border-nerv/25 hover:border-nerv/50 transition-colors" />
    </div>
  );
}
