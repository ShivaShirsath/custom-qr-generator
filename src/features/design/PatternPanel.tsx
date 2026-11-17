import { Dices } from 'lucide-react';
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
import { OverflowText } from '@/components/text';
import { Button, Columns, FieldRow, OptionGrid, Section, Segmented, Slider } from '@/components/ui';
import { svgDataUrl } from '@/lib/svg';
import { useConfig } from '@/state';

import { DOT_LABELS, ECL_LABELS, EYE_BALL_LABELS, EYE_FRAME_LABELS } from './labels';
import { DESIGN_PRESETS, applyPreset } from './presets';
import styles from './Presets.module.css';
import { DotPreview, EyeBallPreview, EyeFramePreview } from './ShapePreview';
import { surpriseDesign } from './surprise';

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
        action={
          <Button
            size="sm"
            tone="pink"
            icon={<Dices size={16} />}
            onClick={() =>
              dispatch({
                type: 'design/update',
                group: 'surprise',
                update: (d) => surpriseDesign(d),
              })
            }
          >
            Surprise me
          </Button>
        }
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
              <OverflowText text={preset.name} />
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
      </Section>

      <Columns>
        <Section title="Eye frames" description="Outer squares scanners look for first.">
          <OptionGrid
            label="Eye frame style"
            value={design.eyeFrame.style}
            minTileWidth={60}
            options={EYE_FRAME_STYLES.map((s) => ({
              value: s,
              label: EYE_FRAME_LABELS[s],
              preview: <EyeFramePreview style={s} />,
            }))}
            onChange={(style) => update((d) => ({ ...d, eyeFrame: { ...d.eyeFrame, style } }))}
          />
        </Section>
        <Section title="Eye centres" description="The dot inside each eye.">
          <OptionGrid
            label="Eye centre style"
            value={design.eyeBall.style}
            minTileWidth={60}
            options={EYE_BALL_STYLES.map((s) => ({
              value: s,
              label: EYE_BALL_LABELS[s],
              preview: <EyeBallPreview style={s} />,
            }))}
            onChange={(style) => update((d) => ({ ...d, eyeBall: { ...d.eyeBall, style } }))}
          />
        </Section>
      </Columns>

      <Columns>
        <Section title="Error correction" description={ECL_LABELS[design.errorCorrection].detail}>
          <Segmented
            label="Error correction"
            value={design.errorCorrection}
            options={ERROR_CORRECTION_LEVELS.map((l) => ({
              value: l,
              label: l,
              title: `${ECL_LABELS[l].label}: ${ECL_LABELS[l].detail}`,
            }))}
            onChange={(errorCorrection) => update((d) => ({ ...d, errorCorrection }))}
          />
        </Section>
        <Section title="Spacing" description="Quiet zone of 2–4 is ideal.">
          <FieldRow>
            <Slider
              label="Dot size"
              value={design.dots.scale}
              min={0.5}
              max={1}
              step={0.05}
              disabled={!scalable}
              format={(v) => (scalable ? `${Math.round(v * 100)}%` : 'Fixed')}
              onChange={(scale) => update((d) => ({ ...d, dots: { ...d.dots, scale } }))}
            />
            <Slider
              label="Quiet zone"
              value={design.margin}
              min={0}
              max={10}
              format={(v) => `${v} modules`}
              onChange={(margin) => update((d) => ({ ...d, margin }))}
            />
          </FieldRow>
        </Section>
      </Columns>
    </>
  );
}
