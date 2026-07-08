import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { registerToastListener, type ToastType } from './toastBus';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  visible: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 4000;
const TRANSITION_MS = 200;

const typeStyles: Record<ToastType, string> = {
  success: 'border-green-500',
  error: 'border-red-500',
  info: 'border-primary',
};

const typeIcon: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ⓘ',
};

const typeIconColor: Record<ToastType, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  info: 'text-primary',
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TRANSITION_MS);
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, type, message, visible: false }]);
      requestAnimationFrame(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, visible: true } : t)));
      });
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss]
  );

  useEffect(() => {
    registerToastListener((type, message) => addToast(type, message));
    return () => registerToastListener(null);
  }, [addToast]);

  const value: ToastContextValue = {
    success: (message) => addToast('success', message),
    error: (message) => addToast('error', message),
    info: (message) => addToast('info', message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 pointer-events-none">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto bg-white rounded-lg shadow-lg p-4 border-l-4 flex items-start gap-3 transition-all duration-200 ease-out ${
                typeStyles[t.type]
              } ${t.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}
            >
              <span className={`text-lg leading-none mt-0.5 ${typeIconColor[t.type]}`}>{typeIcon[t.type]}</span>
              <p className="flex-1 text-sm text-gray-800">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors duration-150"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
