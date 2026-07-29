import type { ReactNode } from 'react';

export const inputClass =
  'w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60';

export const labelClass =
  'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, required, className, children }: FieldProps) {
  return (
    <div className={className}>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
    </div>
  );
}

interface TextFieldProps extends Omit<FieldProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number' | 'email';
  min?: number;
  step?: string;
  disabled?: boolean;
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = 'text',
  min,
  step,
  disabled,
  ...field
}: TextFieldProps) {
  return (
    <Field {...field}>
      <input
        type={type}
        value={value}
        min={min}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </Field>
  );
}

interface TextAreaFieldProps extends Omit<FieldProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

export function TextAreaField({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
  ...field
}: TextAreaFieldProps) {
  return (
    <Field {...field}>
      <textarea
        value={value}
        rows={rows}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} resize-y`}
      />
    </Field>
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<FieldProps, 'children'> {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ...field
}: SelectFieldProps) {
  return (
    <Field {...field}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

interface ToggleFieldProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleFieldProps) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 ${
        disabled ? 'opacity-60' : 'cursor-pointer hover:border-brand-300 dark:hover:border-brand-700'
      } transition`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {description && (
          <span className="block text-xs text-gray-400 dark:text-gray-500">{description}</span>
        )}
      </span>
    </label>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
      {message}
    </div>
  );
}

export function FormSectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
      {children}
    </p>
  );
}
