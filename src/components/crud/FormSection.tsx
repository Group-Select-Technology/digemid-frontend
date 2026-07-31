import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
}

/** Bloque en tarjeta para agrupar campos en formularios de página completa. */
export default function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="mb-5">
        <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
