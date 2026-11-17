import type { ContentState, ContentValues } from './types';

/**
 * Demo content for every type, so each one shows a working code straight away.
 * Placeholders are deliberately unreachable: 555-01xx phone numbers are reserved for
 * fiction, example.com is a reserved domain, "@bank" is not a real UPI handle and the
 * crypto address is not a valid wallet.
 */
export const DEFAULT_VALUES: ContentValues = {
  url: { url: 'https://github.com/ShivaShirsath' },
  text: { text: 'Hi there! 👋 This QR code was made with Hi there, QR!' },
  email: {
    to: 'hello@example.com',
    subject: 'Hi there!',
    body: 'I scanned your QR code and wanted to say hello.',
  },
  phone: { number: '+1 555 0100' },
  sms: { number: '+1 555 0101', message: 'Hi there! I scanned your QR code.' },
  whatsapp: { number: '15550102', message: 'Hi there! I found you through your QR code 👋' },
  wifi: { ssid: 'HiThere-Guest', password: 'scan-me-2026', encryption: 'WPA', hidden: false },
  vcard: {
    firstName: 'Alex',
    lastName: 'Rivera',
    organization: 'Hi there, QR!',
    title: 'Product designer',
    phone: '+1 555 0103',
    mobile: '+1 555 0104',
    email: 'alex@example.com',
    website: 'https://example.com',
    street: '42 Example Street',
    city: 'Pune',
    region: 'Maharashtra',
    postcode: '411001',
    country: 'India',
    note: 'Made with Hi there, QR!',
  },
  event: {
    title: 'Hi there, QR! launch party',
    location: 'Online',
    start: '2026-12-12T18:00',
    end: '2026-12-12T20:00',
    allDay: false,
    description: 'Come say hi and design a QR code together.',
  },
  location: { latitude: '18.5204', longitude: '73.8567', label: 'Pune, India' },
  upi: { vpa: 'yourname@bank', name: 'Your Name', amount: '', note: 'Thanks!' },
  crypto: {
    coin: 'bitcoin',
    address: 'your-bitcoin-wallet-address',
    amount: '',
    label: 'Hi there, QR!',
    message: 'Thank you!',
  },
};

export const DEFAULT_CONTENT: ContentState = { type: 'url', values: DEFAULT_VALUES };
