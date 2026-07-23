type ProfilePictureListener = (url: string | null) => void;

let listener: ProfilePictureListener | null = null;

export const registerProfilePictureListener = (fn: ProfilePictureListener | null) => {
  listener = fn;
};

export const notifyProfilePictureUpdated = (url: string | null) => {
  listener?.(url);
};
