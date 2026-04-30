'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOATING_Z_INDEX } from '@/components/ui/FloatingPortal';

export type SignalToastTone = 'success' | 'error' | 'info';

type ToastLinkAction = {
  kind: 'link';
  label: string;
  href: string;
};

type ToastButtonAction = {
  kind: 'button';
  label: string;
  onClick: () => void | Promise<void>;
};

type ToastAction = ToastLinkAction | ToastButtonAction;

type ToastState = {
  id: number;
  message: string;
  tone: SignalToastTone;
  action?: ToastAction;
  durationMs: number;
};

type ToastInput = {
  message: string;
  tone?: SignalToastTone;
  action?: ToastAction;
  durationMs?: number;
};

type ToastOptions = Omit<ToastInput, 'message' | 'tone'>;

type ToastContextValue = {
  show: (toast: ToastInput) => void;
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
};

interface SignalToastProps {
  message: string;
  tone?: SignalToastTone;
}

const DEFAULT_TOAST_DURATION_MS = 2400;

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastIdRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const show = useCallback((nextToast: ToastInput) => {
    toastIdRef.current += 1;
    setToast({
      id: toastIdRef.current,
      message: nextToast.message,
      tone: nextToast.tone ?? 'info',
      action: nextToast.action,
      durationMs: nextToast.durationMs ?? DEFAULT_TOAST_DURATION_MS,
    });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message: string, options?: ToastOptions) =>
        show({ message, tone: 'success', ...options }),
      error: (message: string, options?: ToastOptions) =>
        show({ message, tone: 'error', ...options }),
      info: (message: string, options?: ToastOptions) =>
        show({ message, tone: 'info', ...options }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && toast && <ToastPortal toast={toast} onDismiss={() => setToast(null)} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}

export function SignalToast({ message, tone = 'success' }: SignalToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !message) return null;

  return createPortal(
    <ToastFrame id={0} message={message} tone={tone} durationMs={DEFAULT_TOAST_DURATION_MS} />,
    document.body,
  );
}

function ToastPortal({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return createPortal(
    <AnimatePresence mode="wait">
      <ToastFrame key={toast.id} {...toast} onDismiss={onDismiss} />
    </AnimatePresence>,
    document.body,
  );
}

function ToastFrame({
  id,
  message,
  tone,
  action,
  onDismiss,
}: ToastState & { onDismiss?: () => void }) {
  const [actionRunning, setActionRunning] = useState(false);
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? AlertTriangle : Info;
  const toneClass =
    tone === 'success'
      ? 'border-moss/25 bg-void-deep/95 text-moss'
      : tone === 'error'
        ? 'border-ochre/25 bg-void-deep/95 text-ochre'
        : 'border-steel/25 bg-void-deep/95 text-steel';

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={`fixed bottom-6 left-1/2 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-[0_18px_42px_rgba(0,0,0,0.28)] backdrop-blur-md ${toneClass}`}
      style={{ zIndex: FLOATING_Z_INDEX.floating }}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span className="min-w-0 break-words">{message}</span>
      {action?.kind === 'link' ? (
        <Link
          href={action.href}
          onClick={onDismiss}
          className="ml-1 shrink-0 rounded-md border border-current/25 px-2.5 py-1 text-xs font-bold transition-colors hover:bg-current/10"
        >
          {action.label}
        </Link>
      ) : action?.kind === 'button' ? (
        <button
          type="button"
          disabled={actionRunning}
          onClick={async () => {
            if (actionRunning) return;
            setActionRunning(true);
            try {
              await action.onClick();
              onDismiss?.();
            } catch (err) {
              console.error('Toast action failed:', err);
              setActionRunning(false);
            }
          }}
          className="ml-1 shrink-0 rounded-md border border-current/25 px-2.5 py-1 text-xs font-bold transition-colors hover:bg-current/10 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {action.label}
        </button>
      ) : null}
    </motion.div>
  );
}
