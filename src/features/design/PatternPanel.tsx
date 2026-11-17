import { useMemo } from 'react';

import {
  DOT_STYLES,
  ERROR_CORRECTION_LEVELS,
  EYE_BALL_STYLES,
  EYE_FRAME_STYLES,
  SCALABLE_DOT_STYLES,
  renderQrSvg,
  type QrDesign,
} from '@/core/qr';
import { OptionGrid, Section, Segmented, Slider } from '@/components/ui';
import { svgDataUrl } from '@/lib/svg';
import { useConfig } from '@/state';

import { DOT_LABELS, ECL_LABELS, EYE_BALL_LABELS, EYE_FRAME_LABELS } from './labels';
import { DESIGN_PRESETS, applyPreset } from './presets';
import styles from './Presets.module.css';
import { DotPreview, EyeBallPreview, EyeFramePreview } from './ShapePreview';

export function PatternPanel() {
  const { config, dispatch } = useConfig();
  const { design } = config;
  const update = (fn: (d: QrDesign) => QrDesign) => dispatch({ type: 'design/update', update: fn });

  const thumbnails = useMemo(
    () =>
      DESIGN_PRESETS.map((preset) => ({
        preset,
        src: svgDataUrl(
          renderQrSvg(
            'QR',
            applyPreset(
              {
                ...design,
                margin: 2,
                logo: { ...design.logo, src: null },
                frame: { ...design.frame, style: 'none' },
              },
              preset,
            ),
            {
              width: 120,
            },
          ).svg,
        ),
      })),
    // Thumbnails only depend on the presets themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const scalable = SCALABLE_DOT_STYLES.has(design.dots.style);

  return (
    <>
      <Section
        title="Quick styles"
        description="Start from a preset, then fine-tune everything below."
      >
        <div className={styles.grid}>
          {thumbnails.map(({ preset, src }) => (
            <button
              key={preset.id}
              type="button"
              className={styles.preset}
              onClick={() => update((d) => applyPreset(d, preset))}
            >
              <img src={src} alt="" draggable={false} />
              {preset.name}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Dots" description="Shape of the data modules.">
        <OptionGrid
          label="Dot style"
          value={design.dots.style}
          options={DOT_STYLES.map((s) => ({
            value: s,
            label: DOT_LABELS[s],
            preview: <DotPreview style={s} />,
          }))}
          onChange={(style) => update((d) => ({ ...d, dots: { ...d.dots, style } }))}
        />
        <Slider
          label="Dot size"
          value={design.dots.scale}
          min={0.5}
          max={1}
          step={0.05}
          disabled={!scalable}
          hint={scalable ? undefined : 'Connected styles always use full-size modules.'}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(scale) => update((d) => ({ ...d, dots: { ...d.dots, scale } }))}
        />
      </Section>

      <Section title="Corner eyes" description="The three finder patterns scanners look for first.">
        <OptionGrid
          label="Eye frame style"
          value={design.eyeFrame.style}
          options={EYE_FRAME_STYLES.map((s) => ({
            value: s,
            label: EYE_FRAME_LABELS[s],
            preview: <EyeFramePreview style={s} />,
          }))}
          onChange={(style) => update((d) => ({ ...d, eyeFrame: { ...d.eyeFrame, style } }))}
        />
        <OptionGrid
          label="Eye centre style"
          value={design.eyeBall.style}
          options={EYE_BALL_STYLES.map((s) => ({
            value: s,
            label: EYE_BALL_LABELS[s],
            preview: <EyeBallPreview style={s} />,
          }))}
          onChange={(style) => update((d) => ({ ...d, eyeBall: { ...d.eyeBall, style } }))}
        />
      </Section>

      <Section title="Structure" description="Reliability and spacing.">
        <Segmented
          label="Error correction"
          value={design.errorCorrection}
          options={ERROR_CORRECTION_LEVELS.map((l) => ({
            value: l,
            label: `${l} · ${ECL_LABELS[l].label}`,
            title: ECL_LABELS[l].detail,
          }))}
          onChange={(errorCorrection) => update((d) => ({ ...d, errorCorrection }))}
        />
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
          {ECL_LABELS[design.errorCorrection].detail}
        </p>
        <Slider
          label="Quiet zone"
          value={design.margin}
          min={0}
          max={10}
          format={(v) => `${v} modules`}
          hint="Blank border around the code. 2–4 is ideal."
          onChange={(margin) => update((d) => ({ ...d, margin }))}
        />
      </Section>
    </>
  );
}
