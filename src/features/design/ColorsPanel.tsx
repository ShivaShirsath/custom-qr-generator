import { ArrowLeftRight } from 'lucide-react';

import { solid, type Paint, type QrDesign } from '@/core/qr';
import { Button, Section, Slider, Switch } from '@/components/ui';
import { useConfig } from '@/state';

import { PaintEditor } from './PaintEditor';
import styles from './Presets.module.css';

const PALETTES: ReadonlyArray<readonly [fg: string, bg: string]> = [
  ['#000000', '#ffffff'],
  ['#1e1b4b', '#f4f1ff'],
  ['#0f766e', '#f0fdfa'],
  ['#1d4ed8', '#eff6ff'],
  ['#9f1239', '#fff1f2'],
  ['#7c2d12', '#fff7ed'],
  ['#14532d', '#f7fee7'],
  ['#4a044e', '#fdf4ff'],
  ['#e0e7ff', '#111827'],
];

export function ColorsPanel() {
  const { config, dispatch } = useConfig();
  const { design } = config;
  const update = (fn: (d: QrDesign) => QrDesign) => dispatch({ type: 'design/update', update: fn });

  const setDots = (paint: Paint) => update((d) => ({ ...d, dots: { ...d.dots, paint } }));

  const swap = () =>
    update((d) => ({
      ...d,
      dots: { ...d.dots, paint: d.background.paint },
      background: { ...d.background, paint: d.dots.paint },
    }));

  return (
    <>
      <Section
        title="Quick palettes"
        description="One click sets the code and background colours."
        action={
          <Button size="sm" icon={<ArrowLeftRight size={14} />} onClick={swap}>
            Swap
          </Button>
        }
      >
        <div className={styles.palettes}>
          {PALETTES.map(([fg, bg]) => (
            <button
              key={fg + bg}
              type="button"
              className={styles.palette}
              aria-label={`Code ${fg} on ${bg}`}
              title={`${fg} on ${bg}`}
              onClick={() =>
                update((d) => ({
                  ...d,
                  dots: { ...d.dots, paint: solid(fg) },
                  eyeFrame: { ...d.eyeFrame, inherit: true },
                  eyeBall: { ...d.eyeBall, inherit: true },
                  background: { ...d.background, transparent: false, paint: solid(bg) },
                }))
              }
            >
              <span style={{ background: fg }} />
              <span style={{ background: bg }} />
            </button>
          ))}
        </div>
      </Section>

      <Section title="Code colour">
        <PaintEditor label="Code" paint={design.dots.paint} onChange={setDots} />
      </Section>

      <Section title="Eye frames">
        <Switch
          label="Match code colour"
          checked={design.eyeFrame.inherit}
          onChange={(inherit) =>
            update((d) => ({
              ...d,
              eyeFrame: {
                ...d.eyeFrame,
                inherit,
                paint: inherit ? d.eyeFrame.paint : d.dots.paint,
              },
            }))
          }
        />
        {!design.eyeFrame.inherit && (
          <PaintEditor
            label="Eye frame"
            paint={design.eyeFrame.paint}
            onChange={(paint) => update((d) => ({ ...d, eyeFrame: { ...d.eyeFrame, paint } }))}
          />
        )}
      </Section>

      <Section title="Eye centres">
        <Switch
          label="Match code colour"
          checked={design.eyeBall.inherit}
          onChange={(inherit) =>
            update((d) => ({
              ...d,
              eyeBall: { ...d.eyeBall, inherit, paint: inherit ? d.eyeBall.paint : d.dots.paint },
            }))
          }
        />
        {!design.eyeBall.inherit && (
          <PaintEditor
            label="Eye centre"
            paint={design.eyeBall.paint}
            onChange={(paint) => update((d) => ({ ...d, eyeBall: { ...d.eyeBall, paint } }))}
          />
        )}
      </Section>

      <Section title="Background">
        <Switch
          label="Transparent background"
          description="Exports keep transparency in PNG, WebP and SVG."
          checked={design.background.transparent}
          onChange={(transparent) =>
            update((d) => ({ ...d, background: { ...d.background, transparent } }))
          }
        />
        {!design.background.transparent && (
          <>
            <PaintEditor
              label="Background"
              paint={design.background.paint}
              onChange={(paint) =>
                update((d) => ({ ...d, background: { ...d.background, paint } }))
              }
            />
            <Slider
              label="Corner radius"
              value={design.background.radius}
              min={0}
              max={50}
              format={(v) => `${v}%`}
              onChange={(radius) =>
                update((d) => ({ ...d, background: { ...d.background, radius } }))
              }
            />
          </>
        )}
      </Section>
    </>
  );
}
