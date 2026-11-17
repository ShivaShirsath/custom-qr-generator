import type { ComponentType } from 'react';

import { ClayIcon } from '@/components/illustrations';

import { CONTENT_TYPES, buildContent, type ContentType, type ContentValues } from '@/core/content';
import { Section } from '@/components/ui';
import { handleRadioKeys } from '@/components/ui/radio-keys';
import { useConfig } from '@/state';

import styles from './Content.module.css';
import * as Forms from './forms';
import type { FormProps } from './forms';

const LABELS: Record<ContentType, string> = {
  url: 'Link',
  text: 'Text',
  email: 'Email',
  phone: 'Call',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  wifi: 'Wi-Fi',
  vcard: 'Contact',
  event: 'Event',
  location: 'Location',
  upi: 'UPI',
  crypto: 'Crypto',
};

const FORMS: { [K in ContentType]: ComponentType<FormProps<K>> } = {
  url: Forms.UrlForm,
  text: Forms.TextForm,
  email: Forms.EmailForm,
  phone: Forms.PhoneForm,
  sms: Forms.SmsForm,
  whatsapp: Forms.WhatsappForm,
  wifi: Forms.WifiForm,
  vcard: Forms.VcardForm,
  event: Forms.EventForm,
  location: Forms.LocationForm,
  upi: Forms.UpiForm,
  crypto: Forms.CryptoForm,
};

export function ContentPanel() {
  const { config, dispatch } = useConfig();
  const { type, values } = config.content;
  const Form = FORMS[type] as ComponentType<FormProps<ContentType>>;
  const { payload } = buildContent(config.content);
  const setType = (contentType: ContentType) => dispatch({ type: 'content/type', contentType });

  return (
    <>
      <Section
        title="What should the code hold?"
        description="Everything is encoded directly. Codes never expire."
      >
        <div
          role="radiogroup"
          aria-label="Content type"
          className={styles.types}
          onKeyDown={(e) => handleRadioKeys(e, CONTENT_TYPES, type, setType)}
        >
          {CONTENT_TYPES.map((t) => {
            return (
              <button
                key={t}
                type="button"
                role="radio"
                data-value={t}
                aria-checked={t === type}
                tabIndex={t === type ? 0 : -1}
                className={styles.type}
                onClick={() => setType(t)}
              >
                <ClayIcon name={t} size={40} />
                {LABELS[t]}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={`${LABELS[type]} details`}>
        <div className={styles.form}>
          <Form
            values={values[type]}
            onChange={(patch: Partial<ContentValues[ContentType]>) =>
              dispatch({ type: 'content/update', contentType: type, patch })
            }
          />
        </div>
        {payload && (
          <details className={styles.payload}>
            <summary>Encoded data</summary>
            <pre>{payload}</pre>
          </details>
        )}
      </Section>
    </>
  );
}
