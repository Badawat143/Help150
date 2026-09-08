import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Sparkles,
  HeartHandshake,
  CheckCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'payment';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  showConfetti?: boolean;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  success: (message: string, title?: string, options?: { showConfetti?: boolean; duration?: number }) => string;
  error: (message: string, title?: string, duration?: number) => string;
  info: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  paymentSuccess: (message: string, title?: string) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Synthesized subtle sound feedback using Web Audio API
const playToastSound = (type: ToastType) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success' || type === 'payment') {
      // Pleasant upward two-tone chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'error') {
      // Subtle double soft low tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  } catch {
    // Ignore audio permission or browser policy errors
  }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = 'toast-' + Math.random().toString(36).substring(2, 9);
      const duration = toast.duration ?? (toast.type === 'payment' ? 6000 : 4500);

      const newToast: ToastItem = { ...toast, id, duration };

      setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Keep max 5 toasts

      playToastSound(toast.type);

      if (toast.showConfetti || toast.type === 'payment') {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.15, x: 0.85 },
            colors: ['#00C07F', '#2563EB', '#F59E0B', '#10B981'],
          });
        } catch {
          // ignore
        }
      }

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, options?: { showConfetti?: boolean; duration?: number }) => {
      return showToast({
        type: 'success',
        title: title || 'Success',
        message,
        duration: options?.duration,
        showConfetti: options?.showConfetti,
      });
    },
    [showToast]
  );

  const paymentSuccess = useCallback(
    (message: string, title?: string) => {
      return showToast({
        type: 'payment',
        title: title || 'Payment Received',
        message,
        showConfetti: true,
        duration: 6000,
      });
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast({
        type: 'error',
        title: title || 'Error',
        message,
        duration,
      });
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast({
        type: 'info',
        title: title || 'Information',
        message,
        duration,
      });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => {
      return showToast({
        type: 'warning',
        title: title || 'Attention',
        message,
        duration,
      });
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        info,
        warning,
        paymentSuccess,
        removeToast,
      }}
    >
      {children}

      {/* Floating Toast Notification Container */}
      <div
        id="toast-notification-container"
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItemComponent key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

const ToastItemComponent: React.FC<{ toast: ToastItem; onDismiss: () => void }> = ({
  toast,
  onDismiss,
}) => {
  const getTheme = () => {
    switch (toast.type) {
      case 'payment':
        return {
          bg: 'bg-gradient-to-r from-[#0C1E4A] via-[#102D6B] to-emerald-950',
          border: 'border-emerald-500/60 shadow-2xl shadow-emerald-950/40',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCheck className="h-5 w-5 text-emerald-400 shrink-0" />,
          titleColor: 'text-white',
          descColor: 'text-emerald-100/90',
          barColor: 'bg-gradient-to-r from-emerald-400 to-teal-300',
        };
      case 'success':
        return {
          bg: 'bg-slate-900/95 backdrop-blur-md',
          border: 'border-emerald-500/50 shadow-xl shadow-emerald-950/30',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />,
          titleColor: 'text-white',
          descColor: 'text-slate-300',
          barColor: 'bg-emerald-500',
        };
      case 'error':
        return {
          bg: 'bg-slate-900/95 backdrop-blur-md',
          border: 'border-rose-500/50 shadow-xl shadow-rose-950/30',
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: <XCircle className="h-5 w-5 text-rose-400 shrink-0" />,
          titleColor: 'text-white',
          descColor: 'text-slate-300',
          barColor: 'bg-rose-500',
        };
      case 'warning':
        return {
          bg: 'bg-slate-900/95 backdrop-blur-md',
          border: 'border-amber-500/50 shadow-xl shadow-amber-950/30',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />,
          titleColor: 'text-white',
          descColor: 'text-slate-300',
          barColor: 'bg-amber-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/95 backdrop-blur-md',
          border: 'border-blue-500/50 shadow-xl shadow-blue-950/30',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <Info className="h-5 w-5 text-blue-400 shrink-0" />,
          titleColor: 'text-white',
          descColor: 'text-slate-300',
          barColor: 'bg-blue-500',
        };
    }
  };

  const theme = getTheme();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ duration: 0.24, ease: 'easeOut' }}
      className={`pointer-events-auto relative rounded-2xl border ${theme.bg} ${theme.border} p-4 overflow-hidden text-left`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{theme.icon}</div>
        <div className="flex-1 min-w-0 pr-1">
          {toast.title && (
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className={`text-xs font-bold font-heading ${theme.titleColor}`}>
                {toast.title}
              </h4>
              {toast.type === 'payment' && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5" /> ₹ Verified
                </span>
              )}
            </div>
          )}
          <p className={`text-xs ${theme.descColor} leading-relaxed font-medium`}>
            {toast.message}
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0 cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={`absolute bottom-0 left-0 h-1 ${theme.barColor}`}
        />
      )}
    </motion.div>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
