'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useNotificationStore } from '../../store/notifications';

const icons = {
  success: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-rose-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
};

export function ToastContainer() {
  const { toasts, removeToast } = useNotificationStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-md flex-col gap-2 p-4 sm:bottom-6 sm:right-6">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg shadow-black/20 backdrop-blur-md"
            role="alert"
          >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="flex-1 text-sm font-medium text-foreground">
              <p>{toast.message}</p>
              {toast.description && (
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  {toast.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook helper to invoke toasts
export function useToast() {
  const addToast = useNotificationStore((state) => state.addToast);
  return {
    success: (msg: string, desc?: string) =>
      addToast({ type: 'success', message: msg, description: desc }),
    error: (msg: string, desc?: string) =>
      addToast({ type: 'error', message: msg, description: desc }),
    warning: (msg: string, desc?: string) =>
      addToast({ type: 'warning', message: msg, description: desc }),
    info: (msg: string, desc?: string) =>
      addToast({ type: 'info', message: msg, description: desc }),
  };
}
