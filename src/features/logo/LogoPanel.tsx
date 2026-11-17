import { ImagePlus, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';

import { LOGO_SHAPES, type QrDesign } from '@/core/qr';
import {
  Button,
  ColorField,
  FieldRow,
  OptionGrid,
  Section,
  Segmented,
  Slider,
  Switch,
} from '@/components/ui';
import { LOGO_SHAPE_LABELS } from '@/features/design/labels';
import { cx } from '@/lib/cx';
import { useConfig } from '@/state';

import styles from './Logo.module.css';
import { LOGO_PRESETS, findLogoPreset, presetDataUrl, type LogoPreset } from './presets';
import { ACCEPT_ATTR, prepareLogo } from './upload';

function presetOptions(group: LogoPreset['group']) {
  return LOGO_PRESETS.filter((p) => p.group === group).map((p) => ({
    value: p.id,
    label: p.label,
    preview: (
      <img className={styles.logoTile} src={presetDataUrl(p, null)} alt="" draggable={false} />
    ),
  }));
}

export function LogoPanel() {
  const { config, dispatch } = useConfig();
  const { logo } = config.design;
  const selection = config.logo;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const icons = useMemo(() => presetOptions('icon'), []);
  const brands = useMemo(() => presetOptions('brand'), []);

  const update = (patch: Partial<QrDesign['logo']>) =>
    dispatch({ type: 'design/update', update: (d) => ({ ...d, logo: { ...d.logo, ...patch } }) });

  const pickPreset = (id: string, color: string | null = null) => {
    const preset = findLogoPreset(id);
    if (!preset) return;
    setError(null);
    dispatch({
      type: 'logo/set',
      selection: { kind: 'preset', id, color },
      src: presetDataUrl(preset, color),
    });
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const src = await prepareLogo(file);
      setError(null);
      dispatch({ type: 'logo/set', selection: { kind: 'upload', name: file.name }, src });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed.');
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    void upload(e.dataTransfer.files[0]);
  };

  const preset = selection.kind === 'preset' ? findLogoPreset(selection.id) : undefined;
  const selectedId = selection.kind === 'preset' ? selection.id : null;

  return (
    <>
      <Section
        title="Your logo"
        description="PNG, JPEG, WebP, GIF, AVIF or SVG up to 5 MB. It never leaves your device."
      >
        <label
          className={cx(styles.drop, dragging && styles.dragging)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <ImagePlus size={28} aria-hidden="true" />
          <span>
            <strong>Click to upload</strong> or drag an image here
          </span>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_ATTR}
            className="visually-hidden"
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {logo.src && (
          <div className={styles.current}>
            <img src={logo.src} alt="Current logo" />
            <span className={styles.currentText}>
              {selection.kind === 'upload' ? selection.name : (preset?.label ?? 'Logo')}
            </span>
            <Button
              size="sm"
              variant="ghost"
              icon={<Trash2 size={15} />}
              onClick={() => dispatch({ type: 'logo/set', selection: { kind: 'none' }, src: null })}
            >
              Remove
            </Button>
          </div>
        )}
      </Section>

      <Section title="Icons">
        <OptionGrid
          label="Icon logos"
          value={selectedId}
          options={icons}
          onChange={(id) => pickPreset(id)}
          minTileWidth={64}
        />
      </Section>

      <Section title="Brands">
        <OptionGrid
          label="Brand logos"
          value={selectedId}
          options={brands}
          onChange={(id) => pickPreset(id)}
          minTileWidth={64}
        />
        {preset && selection.kind === 'preset' && (
          <FieldRow>
            <ColorField
              label="Logo colour"
              value={selection.color ?? preset.defaultColor}
              onChange={(color) => pickPreset(preset.id, color)}
            />
          </FieldRow>
        )}
      </Section>

      {logo.src && (
        <Section title="Placement">
          <Slider
            label="Size"
            value={logo.size}
            min={0.1}
            max={0.35}
            step={0.01}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={(size) => update({ size })}
          />
          <Slider
            label="Padding"
            value={logo.padding}
            min={0}
            max={4}
            step={0.25}
            format={(v) => `${v} modules`}
            onChange={(padding) => update({ padding })}
          />
          <Segmented
            label="Logo backdrop"
            value={logo.shape}
            options={LOGO_SHAPES.map((s) => ({ value: s, label: LOGO_SHAPE_LABELS[s] }))}
            onChange={(shape) => update({ shape })}
          />
          {logo.shape !== 'none' && (
            <ColorField
              label="Backdrop colour"
              value={logo.background}
              onChange={(background) => update({ background })}
            />
          )}
          <Switch
            label="Clear dots behind logo"
            description="Removes modules under the logo for a cleaner look."
            checked={logo.excavate}
            onChange={(excavate) => update({ excavate })}
          />
        </Section>
      )}
    </>
  );
}
