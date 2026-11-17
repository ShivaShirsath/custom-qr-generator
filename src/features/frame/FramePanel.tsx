import { useMemo } from 'react';

import { FRAME_STYLES, readableTextColor, renderQrSvg, type QrDesign } from '@/core/qr';
import { ColorField, FieldRow, OptionGrid, Section, TextInput } from '@/components/ui';
import { FRAME_LABELS } from '@/features/design/labels';
import { svgDataUrl } from '@/lib/svg';
import { useConfig } from '@/state';

export function FramePanel() {
  const { config, dispatch } = useConfig();
  const { frame } = config.design;
  const update = (patch: Partial<QrDesign['frame']>) =>
    dispatch({ type: 'design/update', update: (d) => ({ ...d, frame: { ...d.frame, ...patch } }) });

  const previews = useMemo(
    () =>
      FRAME_STYLES.map((style) => ({
        value: style,
        label: FRAME_LABELS[style],
        preview: svgDataUrl(
          renderQrSvg('FRAME', {
            ...config.design,
            margin: 2,
            logo: { ...config.design.logo, src: null },
            frame: { ...frame, style, text: 'SCAN' },
          }).svg,
        ),
      })),
    // Previews follow colours but not every keystroke of the caption.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame.color, frame.textColor, config.design.dots, config.design.background],
  );

  return (
    <>
      <Section title="Frame" description="Add a call to action around the code.">
        <OptionGrid
          label="Frame style"
          value={frame.style}
          options={previews}
          onChange={(style) => update({ style })}
          minTileWidth={86}
        />
      </Section>
      {frame.style !== 'none' && (
        <Section title="Label">
          <TextInput
            label="Text"
            value={frame.text}
            maxLength={40}
            placeholder="SCAN ME"
            hint={`${frame.text.length}/40 characters`}
            onValueChange={(text) => update({ text })}
          />
          <FieldRow>
            <ColorField
              label="Frame colour"
              value={frame.color}
              onChange={(color) => update({ color, textColor: readableTextColor(color) })}
            />
            {frame.style !== 'caption' && (
              <ColorField
                label="Text colour"
                value={frame.textColor}
                onChange={(textColor) => update({ textColor })}
              />
            )}
          </FieldRow>
        </Section>
      )}
    </>
  );
}
