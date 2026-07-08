type ForceLogoutListener = (message: string) => void;

let listener: ForceLogoutListener | null = null;

export const registerForceLogoutListener = (fn: ForceLogoutListener | null) => {
  listener = fn;
};

export const triggerForceLogout = (message: string) => {
  listener?.(message);
};
