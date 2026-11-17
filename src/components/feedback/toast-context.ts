import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  tone?: ToastTone;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss; errors stay longer by default. */
  duration?: number;
}

export interface ToastApi {
  show: (options: ToastOptions) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/** Shows themed toast notifications. Must be used inside <ToastProvider>. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>');
  return api;
}
