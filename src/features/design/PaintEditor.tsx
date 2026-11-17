import { PAINT_TYPES, type Paint, type PaintType } from '@/core/qr';
import { ColorField, FieldRow, Segmented, Slider } from '@/components/ui';

const TYPE_LABELS: Record<PaintType, string> = {
  solid: 'Solid',
  linear: 'Linear',
  radial: 'Radial',
};

interface PaintEditorProps {
  label: string;
  paint: Paint;
  onChange: (paint: Paint) => void;
}

/** Edits a solid colour or a two-stop linear/radial gradient. */
export function PaintEditor({ label, paint, onChange }: PaintEditorProps) {
  const update = (patch: Partial<Paint>) => onChange({ ...paint, ...patch });
  const gradient = paint.type !== 'solid';
  return (
    <>
      <Segmented
        label={`${label} fill type`}
        value={paint.type}
        options={PAINT_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
        onChange={(type) => update({ type })}
      />
      <FieldRow>
        <ColorField
          label={gradient ? 'Start colour' : 'Colour'}
          value={paint.color}
          onChange={(color) => update({ color })}
        />
        {gradient && (
          <ColorField
            label="End colour"
            value={paint.color2}
            onChange={(color2) => update({ color2 })}
          />
        )}
      </FieldRow>
      {paint.type === 'linear' && (
        <Slider
          label="Angle"
          value={paint.rotation}
          min={0}
          max={360}
          step={5}
          format={(v) => `${v}°`}
          onChange={(rotation) => update({ rotation })}
        />
      )}
    </>
  );
}
