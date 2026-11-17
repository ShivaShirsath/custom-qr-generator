import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cx } from '@/lib/cx';

import styles from './Field.module.css';

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  value?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, hint, error, value, children, className }: FieldProps) {
  return (
    <div className={cx(styles.field, className)}>
      <div className={styles.labelRow}>
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
        </label>
        {value !== undefined && <span className={styles.value}>{value}</span>}
      </div>
      {children}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className={styles.hint}>{hint}</p>
      )}
    </div>
  );
}

type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: ReactNode;
  error?: string | null;
};

export function TextInput({
  label,
  value,
  onValueChange,
  hint,
  error,
  className,
  ...rest
}: TextInputProps) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint} error={error} className={className}>
      <input
        id={id}
        className={styles.input}
        value={value}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onValueChange(e.target.value)}
        {...rest}
      />
    </Field>
  );
}

type TextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: ReactNode;
};

export function TextArea({ label, value, onValueChange, hint, className, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} hint={hint} className={className}>
      <textarea
        id={id}
        className={cx(styles.input, styles.textarea)}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        {...rest}
      />
    </Field>
  );
}

type SelectProps<T extends string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value'
> & {
  label: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onValueChange: (value: T) => void;
};

export function Select<T extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
  ...rest
}: SelectProps<T>) {
  const id = useId();
  return (
    <Field label={label} htmlFor={id} className={className}>
      <select
        id={id}
        className={cx(styles.input, styles.select)}
        value={value}
        onChange={(e) => onValueChange(e.target.value as T)}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
