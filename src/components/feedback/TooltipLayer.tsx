import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import styles from './Tooltip.module.css';

interface TipState {
  text: string;
  x: number;
  y: number;
  below: boolean;
}

const SHOW_DELAY_MS = 350;
const EDGE = 12;

function tipTarget(node: EventTarget | null): HTMLElement | null {
  return node instanceof Element ? (node.closest('[data-tip]') as HTMLElement | null) : null;
}

/**
 * One themed tooltip for the whole app. Any element with `data-tip` gets it on hover or
 * keyboard focus. Rendered in a portal with fixed positioning, so scrolling panels can't clip it.
 */
export function TooltipLayer() {
  const [tip, setTip] = useState<TipState | null>(null);
  const timer = useRef<number>(0);
  const current = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const place = (el: HTMLElement) => {
      const text = el.getAttribute('data-tip');
      if (!text) return;
      const r = el.getBoundingClientRect();
      const below = r.top < 56;
      setTip({
        text,
        x: Math.min(window.innerWidth - EDGE, Math.max(EDGE, r.left + r.width / 2)),
        y: below ? r.bottom + 8 : r.top - 8,
        below,
      });
    };
    const show = (el: HTMLElement, delay: number) => {
      window.clearTimeout(timer.current);
      current.current = el;
      timer.current = window.setTimeout(() => place(el), delay);
    };
    const hide = () => {
      window.clearTimeout(timer.current);
      current.current = null;
      setTip(null);
    };

    const onOver = (e: PointerEvent) => {
      const el = tipTarget(e.target);
      if (el && el !== current.current) show(el, SHOW_DELAY_MS);
      if (!el && current.current) hide();
    };
    const onFocus = (e: FocusEvent) => {
      const el = tipTarget(e.target);
      if (el && el.matches(':focus-visible')) show(el, 0);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hide();

    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerdown', hide);
    document.addEventListener('focusin', onFocus);
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.clearTimeout(timer.current);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerdown', hide);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  if (!tip) return null;
  return createPortal(
    <div
      role="tooltip"
      className={styles.tip}
      data-below={tip.below || undefined}
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}
