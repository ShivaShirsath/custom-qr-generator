import { createElement, useEffect, useMemo, useRef } from 'react';

import { useToast } from '@/components/feedback';
import { buildContent } from '@/core/content';
import { renderQrSvg } from '@/core/qr';
import { svgDataUrl } from '@/lib/svg';
import { useConfig } from '@/state';

import { buildLook } from './look';
import { suggestLook } from './suggest';

const SETTLE_MS = 700;

function thumbnail(src: string) {
  return createElement('img', {
    src,
    width: 64,
    height: 64,
    alt: '',
    style: { borderRadius: 12, background: '#fff', display: 'block' },
  });
}

/**
 * When valid content matches a known style (a WhatsApp link, Wi-Fi details, a UPI ID…),
 * recommends a matching logo and colours in a popup with a live preview. Nothing changes
 * until the user applies it, and an applied style can be undone from the follow-up toast.
 */
export function useSmartStyle(): void {
  const { config, dispatch } = useConfig();
  const toast = useToast();

  const built = useMemo(() => buildContent(config.content), [config.content]);
  const suggestion = useMemo(
    () => (built.error ? null : suggestLook(config.content)),
    [built.error, config.content],
  );
  const key = suggestion?.key ?? null;

  // Only react to changes after mount, never to the restored session.
  const seenKey = useRef(key);
  const latest = useRef(config);
  useEffect(() => {
    latest.current = config;
  }, [config]);

  useEffect(() => {
    if (key === seenKey.current) return;
    const timer = window.setTimeout(() => {
      seenKey.current = key;
      const current = latest.current;
      if (!current.autoStyle || !suggestion || built.error) return;
      if (current.logo.kind === 'upload') return;
      if (current.logo.kind === 'preset' && current.logo.id === suggestion.logoId) return;

      const preview = buildLook(current.design, suggestion, current.flatBrands);
      if (!preview) return;
      const previewSrc = svgDataUrl(renderQrSvg(built.payload, preview.design, { width: 128 }).svg);

      toast.show({
        key: 'smart-style',
        tone: 'info',
        icon: thumbnail(previewSrc),
        title: `Make it match ${suggestion.label}?`,
        description: `This looks like ${suggestion.label}. Apply a matching logo and colours?`,
        duration: 12000,
        actions: [
          { label: 'Not now', onClick: () => undefined },
          {
            label: 'Apply style',
            primary: true,
            onClick: () => {
              // Build from the latest design so edits made meanwhile are kept.
              const now = latest.current;
              const look = buildLook(now.design, suggestion, now.flatBrands);
              if (!look) return;
              const before = { design: now.design, logo: now.logo };
              dispatch({ type: 'look/replace', design: look.design, logo: look.logo });
              toast.show({
                key: 'smart-style',
                tone: 'success',
                title: `Styled for ${suggestion.label}`,
                description: 'Logo and colours updated.',
                actions: [
                  {
                    label: 'Undo',
                    onClick: () => dispatch({ type: 'look/replace', ...before }),
                  },
                ],
              });
            },
          },
        ],
      });
    }, SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [key, suggestion, built, dispatch, toast]);
}
