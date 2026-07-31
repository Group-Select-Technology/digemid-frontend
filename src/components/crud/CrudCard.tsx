import type { ReactNode } from 'react';

interface CrudCardProps {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
  filters?: ReactNode;
  children: ReactNode;
}

/** Contenedor estándar de las pantallas de listado: cabecera, filtros opcionales y contenido. */
export default function CrudCard({
  title,
  subtitle,
  actions,
  filters,
  children,
}: CrudCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 dark:border-white/[0.05] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-800 dark:text-white/90">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {filters && (
        <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 px-6 py-4 dark:border-white/[0.05]">
          {filters}
        </div>
      )}

      {children}
    </div>
  );
}
