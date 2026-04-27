'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FLOATING_Z_INDEX } from '@/components/ui/FloatingPortal';

type SignalToastTone = 'success' | 'error';

interface SignalToastProps {
  message: string;
  tone?: SignalToastTone;
}

export function SignalToast({ message, tone = 'success' }: SignalToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const Icon = tone === 'success' ? CheckCircle2 : AlertTriangle;

  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.18 }}
          className={`fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-[0_18px_42px_rgba(0,0,0,0.28)] backdrop-blur-md ${
            tone === 'success'
              ? 'border-moss/25 bg-void-deep/95 text-moss'
              : 'border-ochre/25 bg-void-deep/95 text-ochre'
          }`}
          style={{ zIndex: FLOATING_Z_INDEX.floating }}
          role="status"
          aria-live="polite"
        >
          <Icon className="h-4 w-4" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
