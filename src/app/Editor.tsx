import { Frame, ImageIcon, Palette, RotateCcw, Shapes, Type } from 'lucide-react';
import { useState } from 'react';

import { Button, Tabs, panelId, tabId, type TabItem } from '@/components/ui';
import { ContentPanel } from '@/features/content/ContentPanel';
import { ColorsPanel } from '@/features/design/ColorsPanel';
import { PatternPanel } from '@/features/design/PatternPanel';
import { FramePanel } from '@/features/frame/FramePanel';
import { LogoPanel } from '@/features/logo/LogoPanel';
import { cx } from '@/lib/cx';
import { useConfig } from '@/state';

import styles from './App.module.css';

type TabId = 'content' | 'style' | 'colors' | 'logo' | 'frame';

const TABS: ReadonlyArray<TabItem<TabId>> = [
  { id: 'content', label: 'Content', icon: <Type size={16} aria-hidden="true" /> },
  { id: 'style', label: 'Style', icon: <Shapes size={16} aria-hidden="true" /> },
  { id: 'colors', label: 'Colours', icon: <Palette size={16} aria-hidden="true" /> },
  { id: 'logo', label: 'Logo', icon: <ImageIcon size={16} aria-hidden="true" /> },
  { id: 'frame', label: 'Frame', icon: <Frame size={16} aria-hidden="true" /> },
];

const PANELS: Record<TabId, () => React.JSX.Element> = {
  content: ContentPanel,
  style: PatternPanel,
  colors: ColorsPanel,
  logo: LogoPanel,
  frame: FramePanel,
};

const PREFIX = 'editor';

function initialTab(): TabId {
  const hash = window.location.hash.slice(1);
  return TABS.some((t) => t.id === hash) ? (hash as TabId) : 'content';
}

export function Editor() {
  const [active, setActiveState] = useState<TabId>(initialTab);
  const setActive = (id: TabId) => {
    setActiveState(id);
    // Deep-linkable tabs without adding history entries.
    window.history.replaceState(null, '', id === 'content' ? window.location.pathname : `#${id}`);
  };
  const { dispatch } = useConfig();
  const Panel = PANELS[active];

  return (
    <section className={cx('glass', styles.editor)} aria-label="QR code editor">
      <Tabs
        label="Editor sections"
        idPrefix={PREFIX}
        tabs={TABS}
        active={active}
        onChange={setActive}
      />
      <div
        role="tabpanel"
        id={panelId(PREFIX, active)}
        aria-labelledby={tabId(PREFIX, active)}
        className={styles.panel}
      >
        <Panel />
      </div>
      <Button
        variant="ghost"
        size="sm"
        icon={<RotateCcw size={14} />}
        style={{ justifySelf: 'end' }}
        onClick={() => {
          if (window.confirm('Reset content and design to the defaults?'))
            dispatch({ type: 'reset' });
        }}
      >
        Reset everything
      </Button>
    </section>
  );
}
