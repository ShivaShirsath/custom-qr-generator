import type { ContentState, ContentValues } from './types';

export const DEFAULT_VALUES: ContentValues = {
  url: { url: 'https://github.com' },
  text: { text: '' },
  email: { to: '', subject: '', body: '' },
  phone: { number: '' },
  sms: { number: '', message: '' },
  whatsapp: { number: '', message: '' },
  wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
  vcard: {
    firstName: '',
    lastName: '',
    organization: '',
    title: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    street: '',
    city: '',
    region: '',
    postcode: '',
    country: '',
    note: '',
  },
  event: { title: '', location: '', start: '', end: '', allDay: false, description: '' },
  location: { latitude: '', longitude: '', label: '' },
  upi: { vpa: '', name: '', amount: '', note: '' },
  crypto: { coin: 'bitcoin', address: '', amount: '', label: '', message: '' },
};

export const DEFAULT_CONTENT: ContentState = { type: 'url', values: DEFAULT_VALUES };
