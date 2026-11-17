import type { KeyboardEvent } from 'react';

/**
 * Arrow/Home/End navigation for custom radio groups. Moves selection and focus to the
 * neighbouring `[data-value]` element inside the group.
 */
export function handleRadioKeys<T extends string>(
  event: KeyboardEvent<HTMLElement>,
  values: readonly T[],
  current: T,
  onChange: (value: T) => void,
) {
  const index = values.indexOf(current);
  let next: number;
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = (index + 1) % values.length;
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      next = (index - 1 + values.length) % values.length;
      break;
    case 'Home':
      next = 0;
      break;
    case 'End':
      next = values.length - 1;
      break;
    default:
      return;
  }
  event.preventDefault();
  const value = values[next];
  if (value === undefined) return;
  onChange(value);
  const group = event.currentTarget;
  requestAnimationFrame(() =>
    group.querySelector<HTMLElement>(`[data-value="${CSS.escape(value)}"]`)?.focus(),
  );
}
