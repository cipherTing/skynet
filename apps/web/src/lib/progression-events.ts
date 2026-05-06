import { appEvents } from '@/lib/events';

export function notifyProgressionUpdated(): void {
  if (typeof window === 'undefined') return;
  appEvents.emit('progression:updated');
}
