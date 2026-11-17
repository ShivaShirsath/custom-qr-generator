import { ImagePlus, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState, type DragEvent } from 'react';

import { useToast } from '@/components/feedback';
import { badgeGlyphColor } from '@/components/illustrations';
import { LOGO_SHAPES, type QrDesign } from '@/core/qr';
import {
  Button,
  ColorField,
  Columns,
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
import {
  LOGO_PRESETS,
  findLogoPreset,
  presetDataUrl,
  type LogoPreset,
  type PresetColors,
} from './presets';
import { ACCEPT_ATTR, prepareLogo } from './upload';

function presetOptions(group: LogoPreset['group'], flat = false) {
  return LOGO_PRESETS.filter((p) => p.group === group).map((p) => ({
    value: p.id,
    label: p.label,
    preview: (
      <img className={styles.logoTile} src={presetDataUrl(p, {}, flat)} alt="" draggable={false} />
    ),
  }));
}

export function LogoPanel() {
  const { config, dispatch } = useConfig();
  const { logo } = config.design;
  const selection = config.logo;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [library, setLibrary] = useState<'icon' | 'brand'>(() =>
    config.logo.kind === 'preset' && config.logo.id.startsWith('brand:') ? 'brand' : 'icon',
  );
  const toast = useToast();

  const icons = useMemo(() => presetOptions('icon'), []);
  const { flatBrands } = config;
  const brands = useMemo(() => presetOptions('brand', flatBrands), [flatBrands]);

  const update = (patch: Partial<QrDesign['logo']>) =>
    dispatch({ type: 'design/update', update: (d) => ({ ...d, logo: { ...d.logo, ...patch } }) });

  const pickPreset = (id: string, colors: PresetColors = {}) => {
    const preset = findLogoPreset(id);
    if (!preset) return;
    const color = colors.color ?? null;
    const badgeColor = colors.badgeColor ?? null;
    dispatch({
      type: 'logo/set',
      selection: { kind: 'preset', id, color, badgeColor },
      src: presetDataUrl(preset, { color, badgeColor }, preset.group === 'brand' && flatBrands),
    });
  };

  const setFlatBrands = (flat: boolean) => {
    const current = selection.kind === 'preset' ? findLogoPreset(selection.id) : undefined;
    dispatch({
      type: 'logo/flatBrands',
      flat,
      src:
        current?.group === 'brand' && selection.kind === 'preset'
          ? presetDataUrl(current, selection, flat)
          : undefined,
    });
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const src = await prepareLogo(file);
      dispatch({ type: 'logo/set', selection: { kind: 'upload', name: file.name }, src });
    } catch (e) {
      toast.show({
        tone: 'error',
        title: "Couldn't use that image",
        description: e instanceof Error ? e.message : 'Upload failed.',
      });
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
      <Columns>
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
            <ImagePlus size={22} aria-hidden="true" />
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
                onClick={() =>
                  dispatch({ type: 'logo/set', selection: { kind: 'none' }, src: null })
                }
              >
                Remove
              </Button>
            </div>
          )}
        </Section>
        {logo.src && (
          <Section title="Placement">
            <FieldRow>
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
            </FieldRow>
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
      </Columns>

      <Section
        title="Library"
        description={library === 'brand' ? 'Brand marks' : '3D icons'}
        action={
          <Segmented
            label="Logo library"
            value={library}
            options={[
              { value: 'icon', label: 'Icons' },
              { value: 'brand', label: 'Brands' },
            ]}
            onChange={setLibrary}
          />
        }
      >
        <OptionGrid
          label={library === 'brand' ? 'Brand logos' : 'Icon logos'}
          value={selectedId}
          options={library === 'brand' ? brands : icons}
          onChange={(id) => pickPreset(id)}
          minTileWidth={58}
        />
        {library === 'brand' && (
          <div className={styles.brandOptions}>
            <Switch
              label="Flat brand logos"
              description="Bare marks instead of clay badges."
              checked={flatBrands}
              onChange={setFlatBrands}
            />
            {preset?.group === 'brand' && selection.kind === 'preset' && (
              <>
                {!flatBrands && (
                  <ColorField
                    label="Badge colour"
                    value={selection.badgeColor ?? preset.defaultColor}
                    onChange={(badgeColor) => pickPreset(preset.id, { ...selection, badgeColor })}
                  />
                )}
                <ColorField
                  label="Logo colour"
                  value={
                    selection.color ??
                    (flatBrands
                      ? preset.defaultColor
                      : badgeGlyphColor(selection.badgeColor ?? preset.defaultColor))
                  }
                  onChange={(color) => pickPreset(preset.id, { ...selection, color })}
                />
              </>
            )}
          </div>
        )}
      </Section>
    </>
  );
}
