import { Monitor, Moon, Sun } from 'lucide-react';

import { Segmented } from '@/components/ui';
import { useTheme, type ThemeMode } from '@/hooks/useTheme';

const OPTIONS: ReadonlyArray<{ value: ThemeMode; label: string; icon: React.ReactNode }> = [
  { value: 'system', label: 'System', icon: <Monitor size={15} aria-hidden="true" /> },
  { value: 'light', label: 'Light', icon: <Sun size={15} aria-hidden="true" /> },
  { value: 'dark', label: 'Dark', icon: <Moon size={15} aria-hidden="true" /> },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  return (
    <Segmented
      label="Colour theme"
      value={mode}
      onChange={setMode}
      options={OPTIONS.map((o) => ({
        value: o.value,
        title: `${o.label} theme`,
        icon: o.icon,
        label: <span className="visually-hidden">{o.label}</span>,
      }))}
    />
  );
}
