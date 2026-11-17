export const CONTENT_TYPES = [
  'url',
  'text',
  'email',
  'phone',
  'sms',
  'whatsapp',
  'wifi',
  'vcard',
  'event',
  'location',
  'upi',
  'crypto',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export const WIFI_ENCRYPTIONS = ['WPA', 'WEP', 'nopass'] as const;
export type WifiEncryption = (typeof WIFI_ENCRYPTIONS)[number];

export const CRYPTO_COINS = ['bitcoin', 'ethereum', 'litecoin', 'dogecoin'] as const;
export type CryptoCoin = (typeof CRYPTO_COINS)[number];

export interface ContentValues {
  url: { url: string };
  text: { text: string };
  email: { to: string; subject: string; body: string };
  phone: { number: string };
  sms: { number: string; message: string };
  whatsapp: { number: string; message: string };
  wifi: { ssid: string; password: string; encryption: WifiEncryption; hidden: boolean };
  vcard: {
    firstName: string;
    lastName: string;
    organization: string;
    title: string;
    phone: string;
    mobile: string;
    email: string;
    website: string;
    street: string;
    city: string;
    region: string;
    postcode: string;
    country: string;
    note: string;
  };
  event: {
    title: string;
    location: string;
    start: string;
    end: string;
    allDay: boolean;
    description: string;
  };
  location: { latitude: string; longitude: string; label: string };
  upi: { vpa: string; name: string; amount: string; note: string };
  crypto: { coin: CryptoCoin; address: string; amount: string; label: string; message: string };
}

export interface ContentState {
  type: ContentType;
  values: ContentValues;
}

export interface BuildResult {
  payload: string;
  /** First validation problem, or null when the content is complete. */
  error: string | null;
}
