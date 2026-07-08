export type ToastType = 'success' | 'error' | 'info';

type ToastListener = (type: ToastType, message: string) => void;

let listener: ToastListener | null = null;

export const registerToastListener = (fn: ToastListener | null) => {
  listener = fn;
};

export const emitToast = (type: ToastType, message: string) => {
  listener?.(type, message);
};
