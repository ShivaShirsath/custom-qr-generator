import { Copy, Download } from 'lucide-react';

import { BlobBuddy } from '@/components/illustrations';
import { Button, Segmented, Slider, Switch, TextInput } from '@/components/ui';
import { supportsTransparency } from '@/features/export/export';
import { FORMAT_LABELS, useExportActions } from '@/features/export/useExportActions';
import { cx } from '@/lib/cx';
import { shortcutLabel } from '@/lib/shortcuts';
import { EXPORT_FORMATS, useConfig, type ExportSettings } from '@/state';

import { HealthBadge } from './HealthBadge';
import { usePreview } from './preview-context';
import styles from './Preview.module.css';

export function PreviewPanel() {
  const { config, dispatch } = useConfig();
  const { result, stale } = usePreview();
  const { download, copy, busy, canCopy } = useExportActions();

  const { exportSettings: settings, design } = config;
  const setExport = (patch: Partial<ExportSettings>) => dispatch({ type: 'export/update', patch });
  const transparentAllowed = supportsTransparency(settings.format);

  return (
    <aside
      id="preview"
      className={cx('clay', styles.card)}
      data-tone="lavender"
      aria-label="Preview and download"
    >
      <div
        className={cx(
          styles.stage,
          design.background.transparent && styles.checker,
          stale && styles.stale,
        )}
      >
        {result.ok ? (
          <img
            key={result.payload}
            className={styles.code}
            src={result.src}
            alt={`QR code for ${result.payload.slice(0, 80)}`}
            width={340}
            height={340}
          />
        ) : (
          <div className={styles.empty} role="status">
            <BlobBuddy size={110} />
            {result.error}
          </div>
        )}
      </div>

      {result.ok && <HealthBadge report={result.report} />}

      <div className={styles.export}>
        <Segmented
          label="Download format"
          value={settings.format}
          options={EXPORT_FORMATS.map((f) => ({ value: f, label: FORMAT_LABELS[f] }))}
          onChange={(format) => setExport({ format })}
        />
        <Slider
          label="Size"
          value={settings.size}
          min={256}
          max={4096}
          step={64}
          disabled={settings.format === 'svg'}
          format={(v) => (settings.format === 'svg' ? 'Vector' : `${v}px`)}
          onChange={(size) => setExport({ size })}
        />
        <Switch
          label={transparentAllowed ? 'Transparent background' : 'Transparent (not for JPG)'}
          checked={transparentAllowed && design.background.transparent}
          disabled={!transparentAllowed}
          onChange={(transparent) =>
            dispatch({
              type: 'design/update',
              group: 'background',
              update: (d) => ({ ...d, background: { ...d.background, transparent } }),
            })
          }
        />
        <TextInput
          label="File name"
          hideLabel
          placeholder="File name"
          value={settings.fileName}
          spellCheck={false}
          maxLength={80}
          onValueChange={(fileName) => setExport({ fileName })}
        />
        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            icon={<Download size={18} />}
            disabled={!result.ok || busy}
            title={`Download (${shortcutLabel('S')})`}
            onClick={download}
          >
            {busy ? 'Preparing…' : `Download ${FORMAT_LABELS[settings.format]}`}
          </Button>
          {canCopy && (
            <Button
              size="lg"
              aria-label="Copy as PNG"
              title={`Copy as PNG (${shortcutLabel('C', true)})`}
              icon={<Copy size={18} />}
              disabled={!result.ok}
              onClick={copy}
            />
          )}
        </div>
        <p className={styles.status}>
          {result.ok ? `Version ${result.matrix.version} · ${result.bytes} bytes encoded` : ''}
        </p>
      </div>
    </aside>
  );
}
