import { useState } from 'react';
import { Field, inputClass } from './FormControls';

interface TagsInputProps {
  label: string;
  hint?: string;
  required?: boolean;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

/** Entrada tipo "chips" para las listas de texto que la API recibe como arreglos. */
export default function TagsInput({
  label,
  hint,
  required,
  values,
  onChange,
  placeholder = 'Escribe y presiona Enter',
  disabled,
}: TagsInputProps) {
  const [draft, setDraft] = useState('');

  const addTag = () => {
    const value = draft.trim();
    if (!value || values.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...values, value]);
    setDraft('');
  };

  const removeTag = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    } else if (event.key === 'Backspace' && !draft && values.length > 0) {
      removeTag(values.length - 1);
    }
  };

  return (
    <Field label={label} hint={hint} required={required}>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={addTag}
          disabled={disabled || !draft.trim()}
          className="shrink-0 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Agregar
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
            >
              {value}
              <button
                type="button"
                onClick={() => removeTag(index)}
                disabled={disabled}
                className="text-brand-400 transition hover:text-red-500"
                title="Quitar"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}
