import { describe, expect, it } from 'vitest';

import { DEFAULT_CONFIG } from './config';
import { historyReducer, initHistory } from './history';

const setUrl = (url: string, at: number) =>
  ({
    type: 'history/apply',
    action: { type: 'content/update', contentType: 'url', patch: { url } },
    at,
  }) as const;

describe('historyReducer', () => {
  it('undoes and redoes changes', () => {
    let h = initHistory(DEFAULT_CONFIG);
    h = historyReducer(h, setUrl('a.com', 0));
    h = historyReducer(h, setUrl('b.com', 5000));
    expect(h.present.content.values.url.url).toBe('b.com');
    h = historyReducer(h, { type: 'history/undo' });
    expect(h.present.content.values.url.url).toBe('a.com');
    h = historyReducer(h, { type: 'history/redo' });
    expect(h.present.content.values.url.url).toBe('b.com');
  });

  it('collapses rapid edits of the same field into one step', () => {
    let h = initHistory(DEFAULT_CONFIG);
    h = historyReducer(h, setUrl('a', 0));
    h = historyReducer(h, setUrl('ab', 200));
    h = historyReducer(h, setUrl('abc', 400));
    expect(h.past).toHaveLength(1);
    h = historyReducer(h, { type: 'history/undo' });
    expect(h.present).toBe(DEFAULT_CONFIG);
  });

  it('does not record export preference changes', () => {
    let h = initHistory(DEFAULT_CONFIG);
    h = historyReducer(h, {
      type: 'history/apply',
      action: { type: 'export/update', patch: { size: 2048 } },
      at: 0,
    });
    expect(h.past).toHaveLength(0);
    expect(h.present.exportSettings.size).toBe(2048);
  });

  it('clears redo after a new change', () => {
    let h = initHistory(DEFAULT_CONFIG);
    h = historyReducer(h, setUrl('a', 0));
    h = historyReducer(h, { type: 'history/undo' });
    h = historyReducer(h, setUrl('b', 5000));
    expect(h.future).toHaveLength(0);
  });
});
