import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { readStorage, writeStorage } from '@/lib/storage';

export type ThemeMode = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'cqg:theme';
const MEDIA = '(prefers-color-scheme: dark)';

function readMode(): ThemeMode {
  const stored = readStorage(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'system') return mode;
  return window.matchMedia(MEDIA).matches ? 'dark' : 'light';
}

function apply(mode: ThemeMode) {
  const root = document.documentElement;
  const resolved = resolve(mode);
  root.dataset.theme = resolved;
  root.dataset.themeMode = mode;
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => (meta.content = resolved === 'dark' ? '#0e110a' : '#fbf7ec'));
}

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(listener: () => void) {
  listeners.add(listener);
  const media = window.matchMedia(MEDIA);
  media.addEventListener('change', listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    media.removeEventListener('change', listener);
    window.removeEventListener('storage', listener);
  };
}

const snapshot = () => `${readMode()}|${resolve(readMode())}`;

/** Theme preference (system / light / dark), persisted and synced across tabs. */
export function useTheme() {
  const [mode, resolved] = useSyncExternalStore(subscribe, snapshot, () => 'system|light').split(
    '|',
  ) as [ThemeMode, ResolvedTheme];

  useEffect(() => apply(mode), [mode, resolved]);

  const setMode = useCallback((next: ThemeMode) => {
    writeStorage(STORAGE_KEY, next);
    apply(next);
    emit();
  }, []);

  return { mode, resolved, setMode };
}
