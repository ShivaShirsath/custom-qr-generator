import { Copy, Download } from 'lucide-react';

import { Button } from '@/components/ui';
import { useExportActions } from '@/features/export/useExportActions';
import { usePreview } from '@/features/preview/preview-context';

import styles from './App.module.css';

/** Phone-only bar: a live thumbnail that jumps to the preview, plus download and copy. */
export function MobileActionBar() {
  const { result } = usePreview();
  const { download, copy, busy, canCopy, formatLabel } = useExportActions();

  return (
    <div className={styles.actionBar}>
      <button
        type="button"
        className={styles.thumb}
        aria-label="Show preview"
        onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
      >
        {result.ok && <img src={result.src} alt="" />}
      </button>
      <Button
        variant="primary"
        block
        icon={<Download size={18} />}
        disabled={!result.ok || busy}
        onClick={download}
      >
        {busy ? 'Preparing…' : `Download ${formatLabel}`}
      </Button>
      {canCopy && (
        <Button
          icon={<Copy size={18} />}
          aria-label="Copy as PNG"
          disabled={!result.ok}
          onClick={copy}
        />
      )}
    </div>
  );
}
