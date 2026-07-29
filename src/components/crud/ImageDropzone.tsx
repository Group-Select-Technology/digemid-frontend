import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Field } from './FormControls';

interface ImageDropzoneProps {
  label: string;
  files: File[];
  onChange: (files: File[]) => void;
  /** Máximo de archivos aceptados. Con 1 el archivo nuevo reemplaza al anterior. */
  maxFiles?: number;
  maxSizeMb?: number;
  /** Imagen ya guardada, se muestra como referencia mientras no se suba una nueva. */
  currentImageUrl?: string | null;
  /** Permite mover las imágenes: el orden de la lista define el campo `order` en la API. */
  reorderable?: boolean;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
};

export default function ImageDropzone({
  label,
  files,
  onChange,
  maxFiles = 1,
  maxSizeMb = 5,
  currentImageUrl,
  reorderable = false,
  hint,
  required,
  disabled,
}: ImageDropzoneProps) {
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files]
  );

  useEffect(() => {
    return () => previews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [previews]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length === 0) return;
      setError(null);
      const next = maxFiles === 1 ? accepted.slice(0, 1) : [...files, ...accepted];
      if (next.length > maxFiles) {
        setError(`Solo se permiten ${maxFiles} imágenes como máximo.`);
      }
      onChange(next.slice(0, maxFiles));
    },
    [files, maxFiles, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: maxSizeMb * 1024 * 1024,
    multiple: maxFiles > 1,
    disabled: disabled || files.length >= maxFiles,
    onDropRejected: (rejections) => {
      const code = rejections[0]?.errors[0]?.code;
      if (code === 'file-too-large') {
        setError(`Cada imagen debe pesar menos de ${maxSizeMb} MB.`);
      } else if (code === 'file-invalid-type') {
        setError('Solo se permiten imágenes JPG, PNG o WebP.');
      } else {
        setError('No se pudo agregar la imagen.');
      }
    },
  });

  const removeAt = (index: number) => {
    setError(null);
    onChange(files.filter((_, i) => i !== index));
  };

  const moveTo = (from: number, to: number) => {
    if (to < 0 || to >= files.length) return;
    const next = [...files];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const isFull = files.length >= maxFiles;

  return (
    <Field
      label={label}
      required={required}
      hint={hint ?? `Formatos JPG, PNG o WebP · Máx. ${maxSizeMb} MB por imagen`}
    >
      {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

      <div
        {...getRootProps()}
        className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${
          isFull || disabled
            ? 'cursor-not-allowed border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'
            : isDragActive
              ? 'cursor-pointer border-brand-500 bg-brand-50 dark:bg-brand-500/10'
              : 'cursor-pointer border-gray-300 bg-gray-50 hover:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500'
        }`}
      >
        <input {...getInputProps()} />
        {isFull ? (
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {maxFiles === 1
              ? 'Imagen seleccionada. Quítala para elegir otra.'
              : `Alcanzaste el máximo de ${maxFiles} imágenes.`}
          </p>
        ) : isDragActive ? (
          <p className="text-sm font-medium text-brand-500">Suelta la imagen aquí...</p>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Arrastra {maxFiles === 1 ? 'una imagen' : 'las imágenes'} o{' '}
            <span className="font-medium text-brand-500">haz clic para seleccionar</span>
          </p>
        )}
      </div>

      {currentImageUrl && files.length === 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-200 p-2 dark:border-gray-700">
          <img
            src={currentImageUrl}
            alt="Imagen actual"
            className="h-14 w-14 rounded-md object-cover"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Imagen actual. Se conservará si no subes una nueva.
          </p>
        </div>
      )}

      {previews.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((preview, index) => (
            <li
              key={preview.url}
              className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <img src={preview.url} alt={preview.file.name} className="h-24 w-full object-cover" />
              {reorderable && index === 0 && (
                <span className="absolute left-1 top-1 rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={disabled}
                title="Quitar imagen"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white transition hover:bg-red-500"
              >
                ✕
              </button>
              <div className="flex items-center justify-between gap-1 bg-white px-2 py-1 dark:bg-gray-900">
                <span className="truncate text-[10px] text-gray-500 dark:text-gray-400">
                  {preview.file.name}
                </span>
                {reorderable && (
                  <span className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveTo(index, index - 1)}
                      disabled={disabled || index === 0}
                      title="Mover antes"
                      className="rounded px-1 text-xs text-gray-500 transition hover:text-brand-500 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      onClick={() => moveTo(index, index + 1)}
                      disabled={disabled || index === files.length - 1}
                      title="Mover después"
                      className="rounded px-1 text-xs text-gray-500 transition hover:text-brand-500 disabled:opacity-30"
                    >
                      →
                    </button>
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}
