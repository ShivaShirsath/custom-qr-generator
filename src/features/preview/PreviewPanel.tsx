import { Check, Copy, Download } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import { useToast } from '@/components/feedback';
import { BlobBuddy } from '@/components/illustrations';
import { buildContent } from '@/core/content';
import { assessScannability, encodeMatrix, QrEncodeError, renderMatrixSvg } from '@/core/qr';
import { Button, Segmented, Slider, Switch, TextInput } from '@/components/ui';
import {
  EXTENSION,
  canCopyImage,
  copyPng,
  downloadBlob,
  exportQr,
  sanitizeFileName,
  supportsTransparency,
} from '@/features/export/export';
import { cx } from '@/lib/cx';
import { svgDataUrl } from '@/lib/svg';
import { EXPORT_FORMATS, useConfig, type ExportFormat } from '@/state';

import { HealthBadge } from './HealthBadge';
import styles from './Preview.module.css';

const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: 'PNG',
  jpeg: 'JPG',
  webp: 'WebP',
  svg: 'SVG',
};

export function PreviewPanel() {
  const { config, dispatch } = useConfig();
  const deferred = useDeferredValue(config);
  const stale = deferred !== config;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const { exportSettings: settings } = config;
  const setExport = (patch: Partial<typeof settings>) => dispatch({ type: 'export/update', patch });

  const result = useMemo(() => {
    const built = buildContent(deferred.content);
    if (built.error) return { error: built.error } as const;
    try {
      const matrix = encodeMatrix(built.payload, deferred.design.errorCorrection);
      const { svg } = renderMatrixSvg(matrix, deferred.design, { width: 680 });
      return {
        matrix,
        src: svgDataUrl(svg),
        report: assessScannability(matrix, deferred.design),
        bytes: new TextEncoder().encode(built.payload).length,
      } as const;
    } catch (e) {
      return {
        error: e instanceof QrEncodeError ? e.message : 'Could not generate the code.',
      } as const;
    }
  }, [deferred.content, deferred.design]);

  const ready = !('error' in result);
  const transparentAllowed = supportsTransparency(settings.format);

  const download = async () => {
    if (!ready) return;
    setBusy(true);
    try {
      const blob = await exportQr(result.matrix, config.design, {
        ...settings,
        transparent: settings.transparent || config.design.background.transparent,
      });
      downloadBlob(blob, `${sanitizeFileName(settings.fileName)}.${EXTENSION[settings.format]}`);
      toast.show({
        tone: 'success',
        title: `${FORMAT_LABELS[settings.format]} downloaded`,
        description: `${sanitizeFileName(settings.fileName)}.${EXTENSION[settings.format]} · ${(blob.size / 1024).toFixed(0)} KB`,
      });
    } catch (e) {
      toast.show({
        tone: 'error',
        title: 'Download failed',
        description: e instanceof Error ? e.message : 'Something went wrong while exporting.',
      });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!ready) return;
    try {
      await copyPng(
        exportQr(result.matrix, config.design, {
          format: 'png',
          size: Math.min(settings.size, 2048),
          transparent: settings.transparent || config.design.background.transparent,
        }),
      );
      setCopied(true);
      toast.show({ tone: 'success', title: 'Copied!', description: 'Paste the PNG anywhere.' });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.show({
        tone: 'error',
        title: "Couldn't copy",
        description: 'Your browser blocked clipboard access. Try downloading instead.',
      });
    }
  };

  return (
    <aside
      className={cx('clay', styles.card)}
      data-tone="lavender"
      aria-label="Preview and download"
    >
      <div
        className={cx(
          styles.stage,
          (config.design.background.transparent || settings.transparent) && styles.checker,
          stale && styles.stale,
        )}
      >
        {ready ? (
          <img src={result.src} alt="QR code preview" width={340} height={340} />
        ) : (
          <div className={styles.empty} role="status">
            <BlobBuddy size={110} />
            {result.error}
          </div>
        )}
      </div>

      {ready && <HealthBadge report={result.report} />}

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
          hint={settings.format === 'svg' ? 'SVG is a vector and scales to any size.' : undefined}
          format={(v) => `${v}px`}
          onChange={(size) => setExport({ size })}
        />
        <Switch
          label={transparentAllowed ? 'Transparent background' : 'Transparent (not for JPG)'}
          checked={
            transparentAllowed && (settings.transparent || config.design.background.transparent)
          }
          disabled={!transparentAllowed || config.design.background.transparent}
          onChange={(transparent) => setExport({ transparent })}
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
            disabled={!ready || busy}
            onClick={download}
          >
            {busy ? 'Preparing…' : `Download ${FORMAT_LABELS[settings.format]}`}
          </Button>
          {canCopyImage() && (
            <Button
              size="lg"
              aria-label="Copy as PNG"
              title="Copy as PNG"
              icon={copied ? <Check size={18} /> : <Copy size={18} />}
              disabled={!ready}
              onClick={copy}
            />
          )}
        </div>
        <p className={styles.status}>
          {ready ? `Version ${result.matrix.version} · ${result.bytes} bytes encoded` : ''}
        </p>
      </div>
    </aside>
  );
}
