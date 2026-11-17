import { describe, expect, it } from 'vitest';

import { buildPayload } from './builders';
import { DEFAULT_VALUES } from './defaults';
import { CONTENT_TYPES } from './types';

describe('demo content', () => {
  it.each(CONTENT_TYPES)('%s demo data builds a valid payload', (type) => {
    const result = buildPayload(type, DEFAULT_VALUES[type]);
    expect(result.error).toBeNull();
    expect(result.payload.length).toBeGreaterThan(0);
  });

  it('starts the link on the GitHub profile', () => {
    expect(buildPayload('url', DEFAULT_VALUES.url).payload).toBe(
      'https://github.com/ShivaShirsath',
    );
  });
});
