export const PROGRESSION_UPDATED_EVENT = 'skynet:progression-updated';

export function notifyProgressionUpdated(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(PROGRESSION_UPDATED_EVENT));
}
