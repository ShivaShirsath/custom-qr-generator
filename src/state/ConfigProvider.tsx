import { useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { loadConfig, saveConfig } from './config';
import { ConfigContext, type ConfigContextValue } from './context';
import { historyReducer, initHistory } from './history';
import type { Action } from './types';

const SAVE_DELAY_MS = 400;

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [history, send] = useReducer(historyReducer, undefined, () => initHistory(loadConfig()));
  const config = history.present;

  useEffect(() => {
    const timer = window.setTimeout(() => saveConfig(config), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [config]);

  const dispatch = useCallback(
    (action: Action) => send({ type: 'history/apply', action, at: performance.now() }),
    [],
  );
  const undo = useCallback(() => send({ type: 'history/undo' }), []);
  const redo = useCallback(() => send({ type: 'history/redo' }), []);

  const value = useMemo<ConfigContextValue>(
    () => ({
      config,
      dispatch,
      undo,
      redo,
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    }),
    [config, dispatch, undo, redo, history.past.length, history.future.length],
  );
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
