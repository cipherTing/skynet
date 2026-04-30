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
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOATING_Z_INDEX } from '@/components/ui/FloatingPortal';

export type SignalToastTone = 'success' | 'error' | 'info';

type ToastState = {
  id: number;
  message: string;
  tone: SignalToastTone;
};

type ToastInput = {
  message: string;
  tone?: SignalToastTone;
};

type ToastContextValue = {
  show: (toast: ToastInput) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
};

interface SignalToastProps {
  message: string;
  tone?: SignalToastTone;
}

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
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const show = useCallback((nextToast: ToastInput) => {
    toastIdRef.current += 1;
    setToast({
      id: toastIdRef.current,
      message: nextToast.message,
      tone: nextToast.tone ?? 'info',
    });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message: string) => show({ message, tone: 'success' }),
      error: (message: string) => show({ message, tone: 'error' }),
      info: (message: string) => show({ message, tone: 'info' }),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted && toast && <ToastPortal toast={toast} />}
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

  return createPortal(<ToastFrame id={0} message={message} tone={tone} />, document.body);
}

function ToastPortal({ toast }: { toast: ToastState }) {
  return createPortal(
    <AnimatePresence mode="wait">
      <ToastFrame key={toast.id} id={toast.id} message={toast.message} tone={toast.tone} />
    </AnimatePresence>,
    document.body,
  );
}

function ToastFrame({ id, message, tone }: ToastState) {
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
    </motion.div>
  );
}
