'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Check, AlertCircle, Info } from '@/app/components/ui/icons';
import { cn } from '@/app/lib/utils';

// ============================================================================
// Types
// ============================================================================

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null);

// ============================================================================
// Provider Component
// ============================================================================

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (
    message: string,
    type: ToastType = 'info',
    duration: number = 5000
  ) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    // Announce to screen readers
    announceToScreenReader(message, type === 'error' ? 'assertive' : 'polite');

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// ============================================================================
// Toast Container Component
// ============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 max-w-[90vw] sm:max-w-md"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Toast Item Component
// ============================================================================

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const config = getToastConfig(toast.type);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      role="status"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg shadow-lg border backdrop-blur-sm',
        'min-w-[300px] max-w-full',
        config.bgClass,
        config.borderClass,
        config.textClass
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon className={cn('w-5 h-5', config.iconClass)} aria-hidden="true" />
      </div>

      {/* Message */}
      <p className="flex-1 text-sm font-medium pr-2">{toast.message}</p>

      {/* Close Button */}
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className={cn(
          'flex-shrink-0 p-1 rounded hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition-colors touch-target',
          'ml-auto'
        )}
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

// ============================================================================
// Configuration
// ============================================================================

function getToastConfig(type: ToastType) {
  const configs = {
    success: {
      icon: Check,
      bgClass: 'bg-green-500/90',
      borderClass: 'border-green-400/50',
      textClass: 'text-white',
      iconClass: 'text-white',
    },
    error: {
      icon: AlertCircle,
      bgClass: 'bg-destructive/90',
      borderClass: 'border-destructive/50',
      textClass: 'text-white',
      iconClass: 'text-white',
    },
    warning: {
      icon: AlertCircle,
      bgClass: 'bg-yellow-500/90',
      borderClass: 'border-yellow-400/50',
      textClass: 'text-white',
      iconClass: 'text-white',
    },
    info: {
      icon: Info,
      bgClass: 'bg-primary/90',
      borderClass: 'border-primary/50',
      textClass: 'text-white',
      iconClass: 'text-white',
    },
  };

  return configs[type];
}

// ============================================================================
// Screen Reader Announcement Helper
// ============================================================================

function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Show a success toast
 * @example
 * const { showToast } = useToast();
 * showToast.success('Campaign created successfully!');
 */
export function createToastHelpers(showToast: ToastContextValue['showToast']) {
  return {
    success: (message: string, duration?: number) =>
      showToast(message, 'success', duration),
    error: (message: string, duration?: number) =>
      showToast(message, 'error', duration),
    info: (message: string, duration?: number) =>
      showToast(message, 'info', duration),
    warning: (message: string, duration?: number) =>
      showToast(message, 'warning', duration),
  };
}

/**
 * Enhanced useToast hook with convenience methods
 * @example
 * const toast = useToast();
 * toast.success('Action completed!');
 * toast.error('Something went wrong');
 */
export function useToastWithHelpers() {
  const { showToast, hideToast } = useToast();

  return {
    showToast,
    hideToast,
    success: (message: string, duration?: number) =>
      showToast(message, 'success', duration),
    error: (message: string, duration?: number) =>
      showToast(message, 'error', duration),
    info: (message: string, duration?: number) =>
      showToast(message, 'info', duration),
    warning: (message: string, duration?: number) =>
      showToast(message, 'warning', duration),
  };
}
