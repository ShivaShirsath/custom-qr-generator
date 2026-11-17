/** True on Apple platforms, where shortcuts use ⌘ instead of Ctrl. */
export const isApple =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);

/** Human label for a Mod+key shortcut, e.g. "⌘S" or "Ctrl+S". */
export function shortcutLabel(key: string, shift = false): string {
  if (isApple) return `${shift ? '⇧' : ''}⌘${key}`;
  return `Ctrl+${shift ? 'Shift+' : ''}${key}`;
}

/** True when the event is Mod+key (⌘ on Apple, Ctrl elsewhere). */
export function isMod(event: KeyboardEvent): boolean {
  return isApple ? event.metaKey : event.ctrlKey;
}
