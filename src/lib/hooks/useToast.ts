import { toast } from "sonner";
import { useCallback } from "react";

export interface ToastOptions {
  title: string;
  message: string;
}

/**
 * Simple toast hook with 3 tiers: success, error, and info.
 * All toasts default to top-center position with Sonner's default settings.
 */
export function useToast() {
  const showSuccessToast = useCallback((options: ToastOptions): void => {
    toast.success(options.title, {
      description: options.message,
      position: "top-center",
    });
  }, []);

  const showErrorToast = useCallback((options: ToastOptions): void => {
    toast.error(options.title, {
      description: options.message,
      position: "top-center",
    });
  }, []);

  const showInfoToast = useCallback((options: ToastOptions): void => {
    toast.info(options.title, {
      description: options.message,
      position: "top-center",
    });
  }, []);

  return {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
  };
}
