import { LocateFixed } from 'lucide-react';

import {
  CRYPTO_COINS,
  DEFAULT_VALUES,
  WIFI_ENCRYPTIONS,
  type ContentType,
  type ContentValues,
  type CryptoCoin,
  type WifiEncryption,
} from '@/core/content';
import { Button, FieldRow, Segmented, Select, Switch, TextArea, TextInput } from '@/components/ui';

import { useLocationOffer } from './useLocationOffer';

export interface FormProps<T extends ContentType> {
  values: ContentValues[T];
  onChange: (patch: Partial<ContentValues[T]>) => void;
}

export function UrlForm({ values, onChange }: FormProps<'url'>) {
  return (
    <TextInput
      label="Website or link"
      type="url"
      inputMode="url"
      autoComplete="url"
      placeholder="https://example.com"
      hint="No redirects or tracking: the link is stored directly in the code."
      value={values.url}
      onValueChange={(url) => onChange({ url })}
    />
  );
}

export function TextForm({ values, onChange }: FormProps<'text'>) {
  return (
    <TextArea
      label="Text"
      placeholder="Any text, notes, codes or data…"
      rows={6}
      value={values.text}
      hint={`${new TextEncoder().encode(values.text).length} bytes`}
      onValueChange={(text) => onChange({ text })}
    />
  );
}

export function EmailForm({ values, onChange }: FormProps<'email'>) {
  return (
    <>
      <TextInput
        label="To"
        type="email"
        autoComplete="email"
        placeholder="hello@example.com"
        value={values.to}
        onValueChange={(to) => onChange({ to })}
      />
      <TextInput
        label="Subject"
        value={values.subject}
        onValueChange={(subject) => onChange({ subject })}
      />
      <TextArea
        label="Message"
        rows={4}
        value={values.body}
        onValueChange={(body) => onChange({ body })}
      />
    </>
  );
}

export function PhoneForm({ values, onChange }: FormProps<'phone'>) {
  return (
    <TextInput
      label="Phone number"
      type="tel"
      autoComplete="tel"
      placeholder="+91 98765 43210"
      value={values.number}
      onValueChange={(number) => onChange({ number })}
    />
  );
}

export function SmsForm({ values, onChange }: FormProps<'sms'>) {
  return (
    <>
      <TextInput
        label="Phone number"
        type="tel"
        placeholder="+91 98765 43210"
        value={values.number}
        onValueChange={(number) => onChange({ number })}
      />
      <TextArea
        label="Message"
        rows={4}
        value={values.message}
        onValueChange={(message) => onChange({ message })}
      />
    </>
  );
}

export function WhatsappForm({ values, onChange }: FormProps<'whatsapp'>) {
  return (
    <>
      <TextInput
        label="WhatsApp number"
        type="tel"
        placeholder="919876543210"
        hint="Include the country code, without + or spaces."
        value={values.number}
        onValueChange={(number) => onChange({ number })}
      />
      <TextArea
        label="Pre-filled message"
        rows={4}
        value={values.message}
        onValueChange={(message) => onChange({ message })}
      />
    </>
  );
}

const ENCRYPTION_LABELS: Record<WifiEncryption, string> = {
  WPA: 'WPA/WPA2/WPA3',
  WEP: 'WEP',
  nopass: 'Open',
};

export function WifiForm({ values, onChange }: FormProps<'wifi'>) {
  return (
    <>
      <TextInput
        label="Network name (SSID)"
        autoComplete="off"
        value={values.ssid}
        onValueChange={(ssid) => onChange({ ssid })}
      />
      <Segmented
        label="Security"
        value={values.encryption}
        options={WIFI_ENCRYPTIONS.map((e) => ({ value: e, label: ENCRYPTION_LABELS[e] }))}
        onChange={(encryption) => onChange({ encryption })}
      />
      {values.encryption !== 'nopass' && (
        <TextInput
          label="Password"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={values.password}
          onValueChange={(password) => onChange({ password })}
        />
      )}
      <Switch
        label="Hidden network"
        checked={values.hidden}
        onChange={(hidden) => onChange({ hidden })}
      />
    </>
  );
}

export function VcardForm({ values, onChange }: FormProps<'vcard'>) {
  const field = (
    key: keyof ContentValues['vcard'],
    label: string,
    extra: Record<string, string> = {},
  ) => (
    <TextInput
      label={label}
      value={String(values[key])}
      onValueChange={(v) => onChange({ [key]: v })}
      {...extra}
    />
  );
  return (
    <>
      <FieldRow>
        {field('firstName', 'First name', { autoComplete: 'given-name' })}
        {field('lastName', 'Last name', { autoComplete: 'family-name' })}
      </FieldRow>
      <FieldRow>
        {field('organization', 'Organisation', { autoComplete: 'organization' })}
        {field('title', 'Job title', { autoComplete: 'organization-title' })}
      </FieldRow>
      <FieldRow>
        {field('mobile', 'Mobile', { type: 'tel' })}
        {field('phone', 'Work phone', { type: 'tel' })}
      </FieldRow>
      <FieldRow>
        {field('email', 'Email', { type: 'email' })}
        {field('website', 'Website', { type: 'url' })}
      </FieldRow>
      {field('street', 'Street')}
      <FieldRow>
        {field('city', 'City')}
        {field('region', 'State / region')}
      </FieldRow>
      <FieldRow>
        {field('postcode', 'Postcode')}
        {field('country', 'Country')}
      </FieldRow>
      <TextArea
        label="Note"
        rows={3}
        value={values.note}
        onValueChange={(note) => onChange({ note })}
      />
    </>
  );
}

export function EventForm({ values, onChange }: FormProps<'event'>) {
  const type = values.allDay ? 'date' : 'datetime-local';
  const toDate = (v: string) => v.split('T')[0] ?? '';
  return (
    <>
      <TextInput
        label="Event title"
        value={values.title}
        onValueChange={(title) => onChange({ title })}
      />
      <Switch
        label="All-day event"
        checked={values.allDay}
        onChange={(allDay) =>
          onChange(
            allDay
              ? { allDay, start: toDate(values.start), end: toDate(values.end) }
              : { allDay, start: '', end: '' },
          )
        }
      />
      <FieldRow>
        <TextInput
          label="Starts"
          type={type}
          value={values.start}
          onValueChange={(start) => onChange({ start })}
        />
        <TextInput
          label="Ends"
          type={type}
          value={values.end}
          onValueChange={(end) => onChange({ end })}
        />
      </FieldRow>
      <TextInput
        label="Location"
        value={values.location}
        onValueChange={(location) => onChange({ location })}
      />
      <TextArea
        label="Description"
        rows={3}
        value={values.description}
        onValueChange={(description) => onChange({ description })}
      />
    </>
  );
}

export function LocationForm({ values, onChange }: FormProps<'location'>) {
  // Offer the device location while the fields are empty or still show the demo place.
  const replaceable =
    (!values.latitude.trim() && !values.longitude.trim()) ||
    (values.latitude === DEFAULT_VALUES.location.latitude &&
      values.longitude === DEFAULT_VALUES.location.longitude);
  const { supported, requestCurrent } = useLocationOffer(replaceable, (coords) => onChange(coords));
  return (
    <>
      {supported && (
        <Button
          size="sm"
          icon={<LocateFixed size={16} />}
          style={{ justifySelf: 'start' }}
          onClick={() => void requestCurrent()}
        >
          Use my current location
        </Button>
      )}
      <FieldRow>
        <TextInput
          label="Latitude"
          inputMode="decimal"
          placeholder="18.5204"
          value={values.latitude}
          onValueChange={(latitude) => onChange({ latitude })}
        />
        <TextInput
          label="Longitude"
          inputMode="decimal"
          placeholder="73.8567"
          value={values.longitude}
          onValueChange={(longitude) => onChange({ longitude })}
        />
      </FieldRow>
      <TextInput
        label="Place name (optional)"
        value={values.label}
        onValueChange={(label) => onChange({ label })}
      />
    </>
  );
}

export function UpiForm({ values, onChange }: FormProps<'upi'>) {
  return (
    <>
      <TextInput
        label="UPI ID"
        placeholder="name@bank"
        autoComplete="off"
        value={values.vpa}
        onValueChange={(vpa) => onChange({ vpa })}
      />
      <TextInput
        label="Payee name"
        value={values.name}
        onValueChange={(name) => onChange({ name })}
      />
      <FieldRow>
        <TextInput
          label="Amount (₹, optional)"
          inputMode="decimal"
          value={values.amount}
          onValueChange={(amount) => onChange({ amount })}
        />
        <TextInput
          label="Note (optional)"
          value={values.note}
          onValueChange={(note) => onChange({ note })}
        />
      </FieldRow>
    </>
  );
}

const COIN_LABELS: Record<CryptoCoin, string> = {
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  litecoin: 'Litecoin',
  dogecoin: 'Dogecoin',
};

export function CryptoForm({ values, onChange }: FormProps<'crypto'>) {
  const eth = values.coin === 'ethereum';
  return (
    <>
      <Select
        label="Currency"
        value={values.coin}
        options={CRYPTO_COINS.map((c) => ({ value: c, label: COIN_LABELS[c] }))}
        onValueChange={(coin) => onChange({ coin })}
      />
      <TextInput
        label="Wallet address"
        spellCheck={false}
        autoComplete="off"
        value={values.address}
        onValueChange={(address) => onChange({ address })}
      />
      {!eth && (
        <>
          <TextInput
            label="Amount (optional)"
            inputMode="decimal"
            value={values.amount}
            onValueChange={(amount) => onChange({ amount })}
          />
          <FieldRow>
            <TextInput
              label="Label (optional)"
              value={values.label}
              onValueChange={(label) => onChange({ label })}
            />
            <TextInput
              label="Message (optional)"
              value={values.message}
              onValueChange={(message) => onChange({ message })}
            />
          </FieldRow>
        </>
      )}
    </>
  );
}
