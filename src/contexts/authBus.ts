export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please log in again.';

type ForceLogoutListener = (message: string) => void;

let listener: ForceLogoutListener | null = null;

export const registerForceLogoutListener = (fn: ForceLogoutListener | null) => {
  listener = fn;
};

export const triggerForceLogout = (message: string) => {
  listener?.(message);
};
