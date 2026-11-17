import { describe, expect, it } from 'vitest';

import { buildPayload, escapeWifi, normalizeUrl, toICalDate } from './builders';
import { DEFAULT_VALUES } from './defaults';

describe('content builders', () => {
  it('normalises links without a scheme', () => {
    expect(normalizeUrl('example.com/a')).toBe('https://example.com/a');
    expect(normalizeUrl('ftp://files.example.com')).toBe('ftp://files.example.com');
    expect(buildPayload('url', { url: 'example.com' }).payload).toBe('https://example.com');
    expect(buildPayload('url', { url: '' }).error).not.toBeNull();
  });

  it('keeps text verbatim', () => {
    expect(buildPayload('text', { text: '  hi\nthere ' }).payload).toBe('  hi\nthere ');
  });

  it('builds mailto links with encoded params', () => {
    const r = buildPayload('email', { to: 'a@b.co', subject: 'Hi there', body: 'x&y' });
    expect(r.payload).toBe('mailto:a@b.co?subject=Hi%20there&body=x%26y');
    expect(buildPayload('email', { to: 'nope', subject: '', body: '' }).error).toBeTruthy();
  });

  it('builds phone, sms and whatsapp payloads', () => {
    expect(buildPayload('phone', { number: '+91 98765-43210' }).payload).toBe('tel:+919876543210');
    expect(buildPayload('sms', { number: '123456', message: 'hey' }).payload).toBe(
      'SMSTO:123456:hey',
    );
    expect(buildPayload('whatsapp', { number: '+91 98765 43210', message: 'hi you' }).payload).toBe(
      'https://wa.me/919876543210?text=hi%20you',
    );
  });

  it('builds escaped wifi payloads', () => {
    expect(escapeWifi('a;b,c"d:e\\f')).toBe('a\\;b\\,c\\"d\\:e\\\\f');
    expect(
      buildPayload('wifi', { ssid: 'Home;Net', password: 'p:w', encryption: 'WPA', hidden: true })
        .payload,
    ).toBe('WIFI:T:WPA;S:Home\\;Net;P:p\\:w;H:true;;');
    expect(
      buildPayload('wifi', {
        ssid: 'Cafe',
        password: 'ignored',
        encryption: 'nopass',
        hidden: false,
      }).payload,
    ).toBe('WIFI:T:nopass;S:Cafe;;');
  });

  it('builds a vCard 3.0', () => {
    const r = buildPayload('vcard', {
      ...DEFAULT_VALUES.vcard,
      firstName: 'Asha',
      lastName: 'Rao',
      organization: 'Acme, Inc.',
      mobile: '+1 555 0100',
      website: 'acme.dev',
    });
    expect(r.error).toBeNull();
    expect(r.payload.split('\r\n')).toEqual([
      'BEGIN:VCARD',
      'VERSION:3.0',
      'N:Rao;Asha;;;',
      'FN:Asha Rao',
      'ORG:Acme\\, Inc.',
      'TEL;TYPE=CELL:+15550100',
      'URL:https://acme.dev',
      'END:VCARD',
    ]);
  });

  it('builds calendar events', () => {
    expect(toICalDate('2026-11-17T09:30', false)).toBe('20261117T093000');
    expect(toICalDate('2026-11-17', true)).toBe('20261117');
    const r = buildPayload('event', {
      title: 'Launch',
      location: 'Pune',
      start: '2026-11-17T09:30',
      end: '2026-11-17T11:00',
      allDay: false,
      description: '',
    });
    expect(r.payload).toContain('DTSTART:20261117T093000');
    expect(r.payload).toContain('DTEND:20261117T110000');
    expect(
      buildPayload('event', {
        ...DEFAULT_VALUES.event,
        title: 'x',
        start: '2026-02-02T10:00',
        end: '2026-01-01T10:00',
      }).error,
    ).toBeTruthy();
  });

  it('validates locations', () => {
    expect(
      buildPayload('location', { latitude: '18.52', longitude: '73.85', label: '' }).payload,
    ).toBe('geo:18.52,73.85');
    expect(
      buildPayload('location', { latitude: '100', longitude: '0', label: '' }).error,
    ).toBeTruthy();
  });

  it('builds UPI payment links', () => {
    const r = buildPayload('upi', { vpa: 'shop@okbank', name: 'My Shop', amount: '250', note: '' });
    expect(r.payload).toBe('upi://pay?pa=shop%40okbank&pn=My%20Shop&am=250.00&cu=INR');
    expect(buildPayload('upi', { vpa: 'bad', name: '', amount: '', note: '' }).error).toBeTruthy();
  });

  it('builds crypto URIs', () => {
    const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
    expect(
      buildPayload('crypto', { coin: 'bitcoin', address, amount: '0.01', label: '', message: '' })
        .payload,
    ).toBe(`bitcoin:${address}?amount=0.01`);
  });
});
