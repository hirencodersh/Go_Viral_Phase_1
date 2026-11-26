export const SUCCESS_TOAST_EVENT = "socially:success-toast";

export const dispatchSuccessToast = (message: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<string>(SUCCESS_TOAST_EVENT, { detail: message })
  );
};
