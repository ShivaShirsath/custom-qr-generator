import { useEffect, useMemo, useReducer, type ReactNode } from 'react';

import { configReducer, loadConfig, saveConfig } from './config';
import { ConfigContext } from './context';

const SAVE_DELAY_MS = 400;

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, dispatch] = useReducer(configReducer, undefined, loadConfig);

  useEffect(() => {
    const timer = window.setTimeout(() => saveConfig(config), SAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [config]);

  const value = useMemo(() => ({ config, dispatch }), [config]);
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}
