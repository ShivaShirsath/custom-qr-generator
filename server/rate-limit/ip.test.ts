import { describe, expect, it } from 'vitest';

import { clientKey, normalizeIp, UNKNOWN_CLIENT } from './ip';

describe('normalizeIp', () => {
  it('keeps IPv4 addresses in canonical form', () => {
    expect(normalizeIp('203.0.113.7')).toBe('203.0.113.7');
    expect(normalizeIp(' 010.000.0.1 ')).toBe('10.0.0.1');
    expect(normalizeIp('256.1.1.1')).toBeNull();
  });

  it('reduces IPv6 to its /64 prefix', () => {
    expect(normalizeIp('2001:0db8:85a3:0000:0000:8a2e:0370:7334')).toBe('2001:db8:85a3:0::/64');
    expect(normalizeIp('2001:db8:85a3::8a2e:370:7334')).toBe('2001:db8:85a3:0::/64');
    expect(normalizeIp('2001:DB8:85A3:0:ffff::1')).toBe('2001:db8:85a3:0::/64');
  });

  it('treats addresses in the same /64 as one client', () => {
    expect(normalizeIp('2001:db8:1:2::1')).toBe(normalizeIp('2001:db8:1:2:ffff:ffff:ffff:ffff'));
    expect(normalizeIp('2001:db8:1:2::1')).not.toBe(normalizeIp('2001:db8:1:3::1'));
  });

  it('handles :: compression at either end', () => {
    expect(normalizeIp('::1')).toBe('0:0:0:0::/64');
    expect(normalizeIp('::')).toBe('0:0:0:0::/64');
    expect(normalizeIp('fe80::')).toBe('fe80:0:0:0::/64');
    expect(normalizeIp('fe80::1%eth0')).toBe('fe80:0:0:0::/64');
    expect(normalizeIp('[2001:db8::1]')).toBe('2001:db8:0:0::/64');
  });

  it('collapses IPv4-mapped IPv6 to IPv4', () => {
    expect(normalizeIp('::ffff:203.0.113.7')).toBe('203.0.113.7');
    expect(normalizeIp('::ffff:cb00:7107')).toBe('203.0.113.7');
  });

  it('rejects malformed input', () => {
    for (const bad of ['', 'abc', '1::2::3', '2001:db8', '1:2:3:4:5:6:7:8:9', 'g::1', ':::']) {
      expect(normalizeIp(bad), bad).toBeNull();
    }
    expect(normalizeIp(undefined)).toBeNull();
  });
});

describe('clientKey', () => {
  it('falls back to "unknown"', () => {
    expect(clientKey(undefined)).toBe(UNKNOWN_CLIENT);
    expect(clientKey('not-an-ip')).toBe('unknown');
    expect(clientKey('198.51.100.1')).toBe('198.51.100.1');
  });
});
