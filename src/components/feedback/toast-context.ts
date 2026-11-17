import { createContext, useContext, type ReactNode } from 'react';

export type ToastTone = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
  /** The primary action is drawn as a filled clay button. */
  primary?: boolean;
}

export interface ToastOptions {
  tone?: ToastTone;
  title: string;
  description?: string;
  /** Milliseconds before auto-dismiss; errors stay longer by default. */
  duration?: number;
  /** Buttons shown in the toast; clicking one runs it and dismisses the toast. */
  actions?: ToastAction[];
  /** Runs when the toast times out without an action being chosen. */
  onTimeout?: () => void;
  /** Replaces any visible toast with the same key instead of stacking. */
  key?: string;
  /** Custom icon in place of the tone's mascot. */
  icon?: ReactNode;
}

export interface ToastApi {
  show: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

/** Shows themed toast notifications. Must be used inside <ToastProvider>. */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);
  if (!api) throw new Error('useToast must be used inside <ToastProvider>');
  return api;
}
