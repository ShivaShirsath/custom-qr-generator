import type { BuildResult, ContentState, ContentType, ContentValues } from './types';

type Builder<T extends ContentType> = (v: ContentValues[T]) => BuildResult;

const ok = (payload: string): BuildResult => ({ payload, error: null });
const fail = (error: string, payload = ''): BuildResult => ({ payload, error });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

/** Keeps digits plus the dial characters a phone keypad understands. */
export const cleanPhone = (value: string) => value.replace(/[^\d+*#]/g, '');

/** Escapes `\ ; , " :` as required by the MECARD-style Wi-Fi format. */
export const escapeWifi = (value: string) => value.replace(/([\\;,":])/g, '\\$1');

/** Escapes text values for vCard 3.0 and iCalendar. */
export const escapeVText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/([;,])/g, '\\$1');

export function normalizeUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  return SCHEME_RE.test(value) ? value : `https://${value}`;
}

function query(params: Record<string, string>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v.trim() !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v.trim())}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

/** `2026-11-17T09:30` → `20261117T093000`; date-only input gives `20261117`. */
export function toICalDate(value: string, allDay: boolean): string {
  const [date = '', time = '00:00'] = value.split('T');
  const d = date.replace(/-/g, '');
  if (allDay) return d;
  const t = time.replace(/:/g, '').padEnd(6, '0').slice(0, 6);
  return `${d}T${t}`;
}

const CRLF = '\r\n';

const builders: { [K in ContentType]: Builder<K> } = {
  url: ({ url }) => {
    const value = normalizeUrl(url);
    if (!value) return fail('Enter a link.');
    try {
      new URL(value);
    } catch {
      return fail('This does not look like a valid link.', value);
    }
    return ok(value);
  },

  text: ({ text }) => (text.length ? ok(text) : fail('Enter some text.')),

  email: ({ to, subject, body }) => {
    const address = to.trim();
    if (!EMAIL_RE.test(address)) return fail('Enter a valid email address.');
    return ok(`mailto:${address}${query({ subject, body })}`);
  },

  phone: ({ number }) => {
    const n = cleanPhone(number);
    return n ? ok(`tel:${n}`) : fail('Enter a phone number.');
  },

  sms: ({ number, message }) => {
    const n = cleanPhone(number);
    if (!n) return fail('Enter a phone number.');
    return ok(message ? `SMSTO:${n}:${message}` : `SMSTO:${n}`);
  },

  whatsapp: ({ number, message }) => {
    const digits = number.replace(/\D/g, '');
    if (digits.length < 6) return fail('Enter the number with country code, e.g. 919876543210.');
    return ok(`https://wa.me/${digits}${query({ text: message })}`);
  },

  wifi: ({ ssid, password, encryption, hidden }) => {
    if (!ssid) return fail('Enter the network name (SSID).');
    if (encryption !== 'nopass' && !password) return fail('Enter the Wi-Fi password.');
    const parts = [`T:${encryption}`, `S:${escapeWifi(ssid)}`];
    if (encryption !== 'nopass') parts.push(`P:${escapeWifi(password)}`);
    if (hidden) parts.push('H:true');
    return ok(`WIFI:${parts.join(';')};;`);
  },

  vcard: (v) => {
    const first = v.firstName.trim();
    const last = v.lastName.trim();
    const full = [first, last].filter(Boolean).join(' ') || v.organization.trim();
    if (!full) return fail('Enter a name or organisation.');
    const e = escapeVText;
    const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${e(last)};${e(first)};;;`, `FN:${e(full)}`];
    if (v.organization) lines.push(`ORG:${e(v.organization)}`);
    if (v.title) lines.push(`TITLE:${e(v.title)}`);
    if (v.phone) lines.push(`TEL;TYPE=WORK,VOICE:${cleanPhone(v.phone)}`);
    if (v.mobile) lines.push(`TEL;TYPE=CELL:${cleanPhone(v.mobile)}`);
    if (v.email) lines.push(`EMAIL;TYPE=INTERNET:${v.email.trim()}`);
    if (v.website) lines.push(`URL:${normalizeUrl(v.website)}`);
    if (v.street || v.city || v.region || v.postcode || v.country) {
      lines.push(
        `ADR;TYPE=WORK:;;${[v.street, v.city, v.region, v.postcode, v.country].map(e).join(';')}`,
      );
    }
    if (v.note) lines.push(`NOTE:${e(v.note)}`);
    lines.push('END:VCARD');
    return ok(lines.join(CRLF));
  },

  event: (v) => {
    if (!v.title.trim()) return fail('Enter an event title.');
    if (!v.start) return fail('Choose a start date.');
    if (v.end && v.end < v.start) return fail('The event ends before it starts.');
    const e = escapeVText;
    const prop = v.allDay ? ';VALUE=DATE' : '';
    const lines = ['BEGIN:VEVENT', `SUMMARY:${e(v.title.trim())}`];
    lines.push(`DTSTART${prop}:${toICalDate(v.start, v.allDay)}`);
    if (v.end) lines.push(`DTEND${prop}:${toICalDate(v.end, v.allDay)}`);
    if (v.location) lines.push(`LOCATION:${e(v.location)}`);
    if (v.description) lines.push(`DESCRIPTION:${e(v.description)}`);
    lines.push('END:VEVENT');
    return ok(lines.join(CRLF));
  },

  location: ({ latitude, longitude, label }) => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (latitude.trim() === '' || !Number.isFinite(lat) || Math.abs(lat) > 90)
      return fail('Latitude must be between -90 and 90.');
    if (longitude.trim() === '' || !Number.isFinite(lng) || Math.abs(lng) > 180)
      return fail('Longitude must be between -180 and 180.');
    const q = label.trim() ? `?q=${lat},${lng}(${encodeURIComponent(label.trim())})` : '';
    return ok(`geo:${lat},${lng}${q}`);
  },

  upi: ({ vpa, name, amount, note }) => {
    const id = vpa.trim();
    if (!/^[\w.-]{2,256}@[a-zA-Z][\w.-]{1,64}$/.test(id))
      return fail('Enter a valid UPI ID, e.g. name@bank.');
    if (amount && !(Number(amount) > 0)) return fail('Amount must be a positive number.');
    const params: Record<string, string> = { pa: id, pn: name };
    if (amount) params.am = Number(amount).toFixed(2);
    params.cu = 'INR';
    params.tn = note;
    return ok(`upi://pay${query(params)}`);
  },

  crypto: ({ coin, address, amount, label, message }) => {
    const addr = address.trim();
    if (addr.length < 20) return fail('Enter a wallet address.');
    if (amount && !(Number(amount) > 0)) return fail('Amount must be a positive number.');
    // Ethereum URIs (EIP-681) express amounts in wei, so only the address is encoded.
    if (coin === 'ethereum') return ok(`ethereum:${addr}`);
    return ok(`${coin}:${addr}${query({ amount, label, message })}`);
  },
};

export function buildPayload<T extends ContentType>(
  type: T,
  values: ContentValues[T],
): BuildResult {
  return (builders[type] as Builder<T>)(values);
}

export function buildContent(content: ContentState): BuildResult {
  return buildPayload(content.type, content.values[content.type]);
}
