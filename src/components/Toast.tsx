import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-500" />,
  };

  const bgStyles = {
    success: 'bg-white border-emerald-100 shadow-emerald-500/10',
    error: 'bg-white border-red-100 shadow-red-500/10',
    warning: 'bg-white border-amber-100 shadow-amber-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "fixed bottom-24 left-4 right-4 z-[9999] p-4 rounded-2xl border-2 shadow-2xl flex items-center gap-3",
        bgStyles[type]
      )}
    >
      <div className="shrink-0">{icons[type]}</div>
      <p className="flex-1 text-sm font-bold text-slate-900 leading-tight">
        {message}
      </p>
      <button 
        onClick={onClose}
        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
