import { useLayoutEffect, useRef, useState } from 'react';

import { cx } from '@/lib/cx';

import styles from './OverflowText.module.css';

interface OverflowTextProps {
  text: string;
  className?: string;
}

/** Pixels scrolled per second when a cut-off label marquees on hover. */
const SPEED = 40;

/**
 * Single-line text that, when cut off, scrolls to reveal itself while its parent is
 * hovered or focused, and exposes the full text as a tooltip on that parent.
 */
export function OverflowText({ text, className }: OverflowTextProps) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const measure = () => setShift(Math.max(0, Math.ceil(inner.scrollWidth - wrap.clientWidth)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, [text]);

  // The tooltip belongs to the whole tile/button, not just the label.
  useLayoutEffect(() => {
    const host = wrapRef.current?.parentElement;
    if (!host || shift === 0 || host.hasAttribute('data-tip')) return;
    host.setAttribute('data-tip', text);
    return () => host.removeAttribute('data-tip');
  }, [shift, text]);

  const overflowing = shift > 0;
  return (
    <span
      ref={wrapRef}
      className={cx(styles.wrap, overflowing && styles.overflowing, className)}
      style={
        overflowing
          ? ({
              '--shift': `-${shift}px`,
              '--duration': `${Math.max(1.2, shift / SPEED + 0.8)}s`,
            } as React.CSSProperties)
          : undefined
      }
    >
      <span ref={innerRef} className={styles.inner}>
        {text}
      </span>
    </span>
  );
}
