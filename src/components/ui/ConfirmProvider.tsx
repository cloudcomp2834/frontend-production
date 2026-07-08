import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const TRANSITION_MS = 200;

export const ConfirmProvider = ({ children }: { children: ReactNode }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [visible, setVisible] = useState(false);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    setVisible(false);
    setTimeout(() => {
      setOptions(null);
      resolveRef.current?.(result);
      resolveRef.current = null;
    }, TRANSITION_MS);
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(opts);
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  useEffect(() => {
    if (!options) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options &&
        createPortal(
          <div
            className={`fixed inset-0 bg-gray-600 overflow-y-auto h-full w-full z-[9999] flex items-center justify-center transition-opacity duration-200 ease-out ${
              visible ? 'bg-opacity-50' : 'bg-opacity-0'
            }`}
            onClick={() => settle(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 transition-all duration-200 ease-out ${
                visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'
              }`}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">{options.title || 'Confirm'}</h3>
              <p className="text-gray-600 mb-6 whitespace-pre-wrap">{options.message}</p>
              <div className="flex justify-end gap-3">
                <button className="btn-secondary" onClick={() => settle(false)}>
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  className={options.danger ? 'btn-danger' : 'btn-primary'}
                  onClick={() => settle(true)}
                >
                  {options.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
};
