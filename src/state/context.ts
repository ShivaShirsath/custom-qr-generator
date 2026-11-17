import { createContext, useContext, type Dispatch } from 'react';

import type { Action, AppConfig } from './types';

export interface ConfigContextValue {
  config: AppConfig;
  dispatch: Dispatch<Action>;
}

export const ConfigContext = createContext<ConfigContextValue | null>(null);

export function useConfig(): ConfigContextValue {
  const value = useContext(ConfigContext);
  if (!value) throw new Error('useConfig must be used inside <ConfigProvider>');
  return value;
}
