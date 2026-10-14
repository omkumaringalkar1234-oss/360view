import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils/helpers';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    
    if (toast.duration !== 0) {
      setTimeout(() => removeToast(id), toast.duration || 5000);
    }
    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'border-green-500/50 bg-green-500/10 text-green-300',
    error: 'border-red-500/50 bg-red-500/10 text-red-300',
    warning: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
    info: 'border-blue-500/50 bg-blue-500/10 text-blue-300',
  };

  const iconColors = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400',
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto glass-panel border rounded-xl p-4 min-w-[300px] max-w-md animate-slide-up shadow-2xl',
              colors[t.type]
            )}
            role="alert"
            aria-live="polite"
          >
            <div className="flex gap-3">
              <div className={cn('flex-shrink-0 mt-0.5', iconColors[t.type])}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white">{t.title}</p>
                {t.message && (
                  <p className="mt-0.5 text-sm opacity-90">{t.message}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {t.action && (
                  <button
                    onClick={() => {
                      t.action!.onClick();
                      onRemove(t.id);
                    }}
                    className="text-sm font-medium text-primary-400 hover:text-primary-300 underline"
                  >
                    {t.action.label}
                  </button>
                )}
                <button
                  onClick={() => onRemove(t.id)}
                  className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4 opacity-60 hover:opacity-100" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function toast(type: ToastType, title: string, message?: string, options?: { duration?: number; action?: Toast['action'] }) {
  // This will be replaced by the context version
  console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
}